/**
 * Wet3Camp Multi-Source Kenyan Escort Scraper
 *
 * Sources (in order):
 *   1. nairobiraha.com  — ~47 unique, phone + services + rates + languages
 *   2. skokka.co.ke     — 200+ listings, phone + description + location
 *   3. locanto.co.ke    — 100+ listings, phone + description
 *
 * Usage (run from artifacts/api-server/):
 *   node scrape-escorts.mjs                  — full scrape all sources
 *   node scrape-escorts.mjs --fast           — skip image downloads
 *   node scrape-escorts.mjs --dry-run        — parse only, no DB writes
 *   node scrape-escorts.mjs --limit=20       — stop after N imports
 *   node scrape-escorts.mjs --source=nairobiraha  — one source only
 *   node scrape-escorts.mjs --source=skokka
 *   node scrape-escorts.mjs --source=locanto
 *
 * Live server:
 *   cd /home/admin/wet3camp-build/artifacts/api-server
 *   node scrape-escorts.mjs --fast
 */

import { mkdirSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DATABASE_URL = process.env.DATABASE_URL
const UPLOADS_DIR  = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads')
const USER_AGENT   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const args       = process.argv.slice(2)
const DRY_RUN    = args.includes('--dry-run')
const FAST_MODE  = args.includes('--fast')
const LIMIT      = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '9999', 10)
const SRC_FILTER = args.find(a => a.startsWith('--source='))?.split('=')[1]?.toLowerCase() || null
const IS_MYSQL   = DATABASE_URL?.startsWith('mysql://')
const DELAY_MS   = FAST_MODE ? 600 : 1200

// ── Dual-DB adapter ──────────────────────────────────────────────────────────
class DbAdapter {
  constructor(pool, isMysql) { this.pool = pool; this.isMysql = isMysql }

  #toMysql(sql) { return sql.replace(/\$\d+/g, '?').replace(/\s+RETURNING\s+id\s*;?\s*$/i, '') }

  async query(sql, params = []) {
    if (this.isMysql) {
      const [rows] = await this.pool.query(this.#toMysql(sql), params)
      return { rows: Array.isArray(rows) ? rows : [rows] }
    }
    return this.pool.query(sql, params)
  }

  async insert(sql, params = []) {
    if (this.isMysql) {
      const [result] = await this.pool.query(this.#toMysql(sql), params)
      return result.insertId
    }
    const pgSql = /RETURNING\s+id/i.test(sql) ? sql : sql.trimEnd() + ' RETURNING id'
    return (await this.pool.query(pgSql, params)).rows[0].id
  }

  async run(sql, params = []) {
    if (this.isMysql) await this.pool.query(this.#toMysql(sql), params)
    else              await this.pool.query(sql, params)
  }

  async end() { await this.pool.end() }
}

async function createDb() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is not set')
  if (IS_MYSQL) {
    const mysql = (await import('mysql2/promise')).default
    return new DbAdapter(mysql.createPool(DATABASE_URL), true)
  }
  const { default: pg } = await import('pg')
  return new DbAdapter(new pg.Pool({ connectionString: DATABASE_URL, max: 3 }), false)
}

// ── Ensure optional columns ──────────────────────────────────────────────────
async function ensureColumns(db) {
  const cols = db.isMysql
    ? [
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall         TINYINT      NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall        TINYINT      NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site    VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_incall   INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_outcall  INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_overnight INT DEFAULT 0',
      ]
    : [
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall          SMALLINT NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall         SMALLINT NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site     VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_incall    INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_outcall   INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_overnight  INT DEFAULT 0',
      ]
  for (const sql of cols) {
    try { await db.run(sql) } catch { /* already exists */ }
  }
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchPage(url, referer) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': referer || url,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  } catch (err) {
    console.warn(`  [WARN] fetch failed for ${url}: ${err.message}`)
    return null
  }
}

async function downloadImage(imageUrl, localFilename, referer) {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
  const destPath = path.join(UPLOADS_DIR, localFilename)
  if (existsSync(destPath)) return `/api/uploads/${localFilename}`
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': USER_AGENT, Referer: referer || imageUrl },
      redirect: 'follow', signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await writeFile(destPath, Buffer.from(await res.arrayBuffer()))
    return `/api/uploads/${localFilename}`
  } catch { return null }
}

// ── Shared helpers ───────────────────────────────────────────────────────────
function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&ndash;/g, '–').replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizePhone(raw) {
  if (!raw) return null
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('254') && d.length === 12) return `+${d}`
  if (d.startsWith('0')   && d.length === 10) return `+254${d.slice(1)}`
  if (d.length === 9)                          return `+254${d}`
  if (d.length >= 10)                          return `+${d}`
  return null
}

function normalizeCity(raw) {
  if (!raw) return { city: 'Nairobi', area: 'Nairobi' }
  const r = raw.toLowerCase()
  if (r.includes('mombasa'))  return { city: 'Mombasa',  area: raw.trim() }
  if (r.includes('kisumu'))   return { city: 'Kisumu',   area: raw.trim() }
  if (r.includes('nakuru'))   return { city: 'Nakuru',   area: raw.trim() }
  if (r.includes('eldoret'))  return { city: 'Eldoret',  area: raw.trim() }
  if (r.includes('thika'))    return { city: 'Nairobi',  area: raw.trim() }
  if (r.includes('nairobi') || r.includes('kilimani') || r.includes('westlands') ||
      r.includes('karen') || r.includes('lavington') || r.includes('langata') ||
      r.includes('ruaka') || r.includes('parklands') || r.includes('upperhill')) {
    return { city: 'Nairobi', area: raw.trim() }
  }
  return { city: raw.trim(), area: raw.trim() }
}

// Parse KES price from text: "3,000", "3000", "3k", "KES 3000", "Ksh 5,000"
function parseKES(text) {
  if (!text) return 0
  const t = text.replace(/,/g, '').toLowerCase()
  const kM = t.match(/(\d+(?:\.\d+)?)\s*k\b/)
  if (kM) return Math.round(parseFloat(kM[1]) * 1000)
  const mM = t.match(/(?:kes|ksh?|sh)\s*(\d{3,6})/i)
  if (mM) return parseInt(mM[1], 10)
  const nM = t.match(/\b(\d{3,6})\b/)
  if (nM) return parseInt(nM[1], 10)
  return 0
}

// ══════════════════════════════════════════════════════════════════════════════
// SOURCE 1 — nairobiraha.com
// ══════════════════════════════════════════════════════════════════════════════
function parseNairobirahaListing(html) {
  const profiles = []
  const blockRe  = /<a\s+href="(https:\/\/nairobiraha\.com\/escort\/[^"]+)"\s+class="girlimg"[^>]*>([\s\S]*?)<\/a>/g
  let m
  while ((m = blockRe.exec(html)) !== null) {
    const url   = m[1]
    const block = m[2]
    const nameM = block.match(/<span[^>]*class="modelname"[^>]*>([\s\S]*?)<\/span>/i)
    const locM  = block.match(/<span[^>]*class="modelinfo-location"[^>]*>([\s\S]*?)<\/span>/i)
    const imgM  = block.match(/data-responsive-img-url="([^"]+)"/)
    const rawName = nameM ? nameM[1].replace(/<[^>]+>/g, '').trim() : null
    const location = locM ? locM[1].replace(/<[^>]+>/g, '').trim() : null
    const thumbnailUrl = imgM ? imgM[1].trim() : null
    if (!rawName || profiles.find(p => p.url === url)) continue
    profiles.push({ url, rawName, location, thumbnailUrl, site: 'nairobiraha' })
  }
  return profiles
}

function parseNairobirahaProfile(html) {
  // Name
  const titleM = html.match(/<h3[^>]*class="profile-title"[^>]*title="([^"]+)"/)
  let rawName  = titleM ? titleM[1].trim() : null
  if (!rawName) return null

  // Phone
  const phoneM = html.match(/href="tel:(\+?[\d\s-]+)"/)
  const phone  = normalizePhone(phoneM ? phoneM[1] : null)

  let name = rawName.replace(/\s*\+?2540?\d{8,9}\s*$/, '').replace(/\s*0\d{9}\s*$/, '').trim()
  if (!name) return null

  // Age / height / weight
  const ageM   = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>years<\/b>/)
  const htM    = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>cm<\/b>/)
  const age    = ageM ? parseInt(ageM[1], 10) : 0
  const height = htM  ? `${htM[1]}cm` : null

  // Bio
  const bioM = html.match(/<div class="aboutme">([\s\S]*?)<\/div>\s*<div class="clear/)
  let bio = null
  if (bioM) {
    const raw = bioM[1].replace(/<h4>[^<]*<\/h4>/gi, '').replace(/<b>[^<]*<\/b>/gi, '')
    const txt = decodeHtml(raw)
    if (txt.length > 10) bio = txt
  }

  // Location
  let city = 'Nairobi', area = 'Nairobi'
  const cityM = html.match(/escorts-from\/kenya\/([^/"]+)\/?" title="([^"]+)"/)
  if (cityM) {
    const loc = normalizeCity(cityM[2].trim())
    city = loc.city; area = loc.area
  }

  // Section-box fields
  const boxes = {}
  const boxRe = /<div class="section-box"><b[^>]*>([^<]+)<\/b><span[^>]*>([^<]*)<\/span><\/div>/g
  let bm
  while ((bm = boxRe.exec(html)) !== null) boxes[bm[1].trim()] = bm[2].trim()

  const availability = boxes['Availability'] || ''
  const ethnicity    = boxes['Ethnicity'] || null
  const bodyType     = boxes['Build'] || null
  const incall       = availability.toLowerCase().includes('incall')  ? 1 : 0
  const outcall      = availability.toLowerCase().includes('outcall') ? 1 : 0

  // Languages — look for language block with spoken language listed
  const languages = []
  const langBlockM = html.match(/(?:LANGUAGE|Spoken)[^\w][\s\S]{0,500}?(<(?:ul|div|table)[^>]*>[\s\S]{0,2000}?<\/(?:ul|div|table)>)/i)
  if (langBlockM) {
    const langWords = ['English', 'Swahili', 'French', 'Arabic', 'Spanish', 'German', 'Chinese', 'Portuguese', 'Somali', 'Kikuyu', 'Luo', 'Luhya', 'Italian']
    for (const lw of langWords) {
      if (langBlockM[1].toLowerCase().includes(lw.toLowerCase())) languages.push(lw)
    }
  }
  // Fallback: section-box style "ENGLISH: fluent"
  const langBoxRe = /<b[^>]*>([A-Z][A-Z]+):<\/b>\s*<span[^>]*>([^<]+)<\/span>/g
  const knownLangs = ['ENGLISH','SWAHILI','FRENCH','ARABIC','SPANISH','GERMAN','CHINESE','PORTUGUESE','SOMALI','KIKUYU','LUO']
  let lbm
  while ((lbm = langBoxRe.exec(html)) !== null) {
    const lang = lbm[1].trim().toUpperCase()
    const lvl  = lbm[2].trim().toLowerCase()
    if (knownLangs.includes(lang) && lvl !== 'no' && !languages.includes(lang.charAt(0) + lang.slice(1).toLowerCase())) {
      languages.push(lang.charAt(0) + lang.slice(1).toLowerCase())
    }
  }
  // Always ensure English + Swahili for Kenya
  if (languages.length === 0) { languages.push('English', 'Swahili') }
  else {
    if (!languages.some(l => l.toLowerCase() === 'english')) languages.unshift('English')
    if (!languages.some(l => l.toLowerCase() === 'swahili')) languages.push('Swahili')
  }

  // Services — nairobiraha shows services with ✓/✗ marks
  const services = []
  // Find the SERVICES block
  const svcBlockM = html.match(/(?:SERVICES?|OFFERED SERVICES?)\s*:?\s*([\s\S]{0,5000}?)(?:<div class="section-box|<h[23]|RATES?\s*:|CONTACT|<footer)/i)
  const svcBlock  = svcBlockM ? svcBlockM[1] : html

  // Nairobiraha typically uses icon-yes / icon-no classes, or ✓ / ✗ text
  // Pattern A: class="yes|icon-yes" adjacent to service name
  const yesRe = /class="(?:yes|icon-yes|available)[^"]*"[^>]*>[\s\S]{0,200}?<\/[^>]+>[\s\S]{0,50}?([A-Z][A-Za-z0-9 (),/-]{2,50})/g
  let ym
  while ((ym = yesRe.exec(svcBlock)) !== null) {
    const s = decodeHtml(ym[1]).trim()
    if (s && s.length > 1 && s.length < 60 && !services.includes(s)) services.push(s)
  }
  // Pattern B: ✓ character before service name
  const tickRe = /[✓✔]\s*(?:<[^>]+>)*\s*([A-Za-z][^<✗✘×✓✔\n]{2,60}?)(?:\s*<|\s*[✗✘×✓✔])/g
  let tk
  while ((tk = tickRe.exec(svcBlock)) !== null) {
    const s = decodeHtml(tk[1]).replace(/[✓✔✗✘×]/g, '').trim()
    if (s && s.length > 1 && s.length < 60 && !services.includes(s)) services.push(s)
  }
  // Pattern C: <li> items in service list
  if (services.length === 0) {
    const liRe = /<li[^>]*>\s*(?:<[a-z]+[^>]*>\s*)*([A-Z][A-Za-z0-9 (),/()-]{2,50}?)(?:\s*<\/|\s*<)/g
    let lm
    while ((lm = liRe.exec(svcBlock)) !== null) {
      const s = decodeHtml(lm[1]).trim()
      if (s && s.length > 2 && s.length < 60 && !services.includes(s)) services.push(s)
    }
  }

  // Rates — nairobiraha uses KES or EUR
  let price_incall = 0, price_outcall = 0, price_overnight = 0
  const ratesM = html.match(/RATES?\s*:?\s*([\s\S]{0,3000}?)(?:SERVICES?\s*:|CONTACT|<footer|<div class="clear)/i)
  if (ratesM) {
    const rb = ratesM[1]
    // Try to find a table row: "1 hour | incall | outcall"
    // Look for KES/Ksh values first
    const rows = rb.split(/<tr[^>]*>/)
    for (const row of rows) {
      const text = decodeHtml(row)
      if (/\b1\s*h(?:our|r)?\b|short/i.test(text)) {
        const nums = [...text.matchAll(/\b(\d{3,6})\b/g)].map(m => parseInt(m[1], 10)).filter(n => n >= 500 && n <= 200000)
        if (nums.length >= 2) { price_incall = nums[0]; price_outcall = nums[1] }
        else if (nums.length === 1) { price_incall = nums[0]; price_outcall = Math.round(nums[0] * 1.3 / 100) * 100 }
      }
      if (/overnight|12\s*h/i.test(text)) {
        const nums = [...text.matchAll(/\b(\d{4,6})\b/g)].map(m => parseInt(m[1], 10)).filter(n => n >= 1000)
        if (nums.length) price_overnight = nums[0]
      }
    }
    // EUR fallback
    if (!price_incall) {
      const hrM = rb.match(/(?:1\s*hour|short)[^<]*?(\d+)\s*EUR[^<]*?(\d+)\s*EUR/i)
      if (hrM) {
        price_incall  = Math.round(parseInt(hrM[1], 10) * 145 / 100) * 100
        price_outcall = Math.round(parseInt(hrM[2], 10) * 145 / 100) * 100
      }
    }
    // KES inline fallback: "1 hour KES 3000 / KES 4000"
    if (!price_incall) {
      const kesM = rb.match(/(?:1\s*hour|short)[^<]*?KES?\s*(\d{3,6})[^<]*?(\d{3,6})?/i)
      if (kesM) {
        price_incall  = parseInt(kesM[1], 10)
        price_outcall = kesM[2] ? parseInt(kesM[2], 10) : Math.round(price_incall * 1.3 / 100) * 100
      }
    }
  }

  // Gallery
  const galleryImgs = []
  const fullRe = /href="(https:\/\/nairobiraha\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))" data-fancybox="profile-photo"/gi
  let fm
  while ((fm = fullRe.exec(html)) !== null) {
    const u = fm[1].trim()
    if (!galleryImgs.includes(u)) galleryImgs.push(u)
  }
  const thumbRe = /data-fancybox="profile-photo"[^>]*>\s*<img[^>]+data-responsive-img-url="([^"]+)"/g
  let tm
  while ((tm = thumbRe.exec(html)) !== null) {
    const u = tm[1].trim().split('?')[0]
    if (!galleryImgs.includes(u)) galleryImgs.push(u)
  }

  return {
    name, phone, age, city, area, bio, height, ethnicity, bodyType,
    incall, outcall, price_incall, price_outcall, price_overnight,
    services, languages, galleryImgs,
    source: 'nairobiraha',
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SOURCE 2 — skokka.co.ke
// ══════════════════════════════════════════════════════════════════════════════
const SKOKKA_BASE = 'https://www.skokka.co.ke'

function parseSkokkaListing(html) {
  const profiles = []
  // Skokka listing cards: <article> or <div class="item"> with a link and title
  const cardRe = /<article[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>[\s\S]*?<\/article>/g
  let m
  while ((m = cardRe.exec(html)) !== null) {
    const card = m[0]
    const href = m[1]
    if (!href || !href.includes('/escort')) continue
    const url = href.startsWith('http') ? href : `${SKOKKA_BASE}${href}`
    const titleM = card.match(/<h2[^>]*>([^<]+)<\/h2>|<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>|<a[^>]*title="([^"]+)"/)
    const rawName = titleM ? (titleM[1] || titleM[2] || titleM[3] || '').replace(/<[^>]+>/g, '').trim() : null
    const imgM = card.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp))"/) || card.match(/src="([^"]+\.(?:jpg|jpeg|png|webp))"/)
    const thumbnailUrl = imgM ? imgM[1] : null
    const locM = card.match(/<span[^>]*(?:location|city)[^>]*>([^<]+)<\/span>|<i[^>]*location[^>]*><\/i>\s*([^<]+)/)
    const location = locM ? (locM[1] || locM[2] || '').trim() : null
    if (!rawName || !url || profiles.find(p => p.url === url)) continue
    profiles.push({ url, rawName, location, thumbnailUrl, site: 'skokka' })
  }
  // Fallback: simpler link pattern
  if (profiles.length === 0) {
    const linkRe = /href="(\/escorts?\/[^"]+\.htm)"[^>]*>([^<]{3,60})<\/a>/gi
    let lm
    while ((lm = linkRe.exec(html)) !== null) {
      const url = `${SKOKKA_BASE}${lm[1]}`
      const rawName = lm[2].trim()
      if (!rawName || profiles.find(p => p.url === url)) continue
      profiles.push({ url, rawName, location: null, thumbnailUrl: null, site: 'skokka' })
    }
  }
  return profiles
}

function parseSkokkaProfile(html, profileUrl) {
  // Name — h1 title
  const nameM = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    || html.match(/<meta property="og:title" content="([^"]+)"/)
  let name = nameM ? decodeHtml(nameM[1]).split(/[,|]/)[0].trim() : null
  if (!name) return null
  // Strip phone-like suffixes
  name = name.replace(/\s*\+?2540?\d{8,9}\s*$/, '').replace(/\s*0\d{9}\s*$/, '').trim()
  if (name.length < 2) return null

  // Phone — <a href="tel:"> or data-phone or data-tel attribute
  let phone = null
  const telM = html.match(/href="tel:(\+?[\d\s()-]+)"/)
    || html.match(/data-(?:phone|tel|number)="(\+?[\d\s()-]+)"/)
    || html.match(/(?:phone|mobile|whatsapp)[^>]*>[\s:]*(\+?0?[\d\s()-]{9,15})</)
  if (telM) phone = normalizePhone(telM[1])

  // If no phone found, try to extract from description text
  if (!phone) {
    const descText = decodeHtml(html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]{0,1000})<\/div>/i)?.[1] || '')
    const numM = descText.match(/(?:\+?254|07|01)[\d\s-]{7,11}/)
    if (numM) phone = normalizePhone(numM[0].replace(/\s/g, ''))
  }

  // Age — look for "22 years", "Age: 24"
  const ageM = html.match(/(?:age\s*:?\s*|years\s*old\s*:?\s*)(\d{2})\b/i)
    || html.match(/\b(1[89]|2\d|3[05])\s*(?:years?|yrs?)/i)
  const age = ageM ? parseInt(ageM[1], 10) : 0

  // Location
  const locM = html.match(/<span[^>]*(?:class|itemprop)="[^"]*(?:location|city|area|region)[^"]*"[^>]*>([^<]+)<\/span>/i)
    || html.match(/(?:Location|City|Area)\s*:?\s*<\/?\w+[^>]*>\s*([A-Za-z][^<,]{2,40})/i)
    || html.match(/<meta[^>]*property="og:locality"[^>]*content="([^"]+)"/)
  const rawLoc = locM ? decodeHtml(locM[1]).trim() : ''
  const { city, area } = normalizeCity(rawLoc || 'Nairobi')

  // Bio / description
  const descM = html.match(/<div[^>]*class="[^"]*(?:description|about|text|bio)[^"]*"[^>]*>([\s\S]{0,2000}?)<\/div>/i)
    || html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)
  const bio = descM ? decodeHtml(descM[1]).slice(0, 1000).trim() || null : null

  // Height
  const htM = html.match(/(\d{2,3})\s*cm/)
  const height = htM ? `${htM[1]}cm` : null

  // Body type / ethnicity
  const ethnicityM = html.match(/(?:ethnicity|nationality|race)\s*:?\s*<?\/?\w*>?\s*([A-Za-z][^<,\n]{2,30})/i)
  const ethnicity = ethnicityM ? decodeHtml(ethnicityM[1]).trim() : 'African'

  // Incall / outcall
  const incall  = /\bincall\b/i.test(html) ? 1 : 0
  const outcall = /\boutcall\b/i.test(html) ? 1 : 0

  // Languages
  const languages = ['English', 'Swahili']
  const langWords = ['French', 'Arabic', 'Spanish', 'German', 'Somali', 'Kikuyu', 'Luo']
  for (const lw of langWords) {
    if (new RegExp(`\\b${lw}\\b`, 'i').test(html)) languages.push(lw)
  }

  // Services — Skokka uses tags/pills or list items
  const services = []
  const tagRe = /<(?:span|div|a)[^>]*class="[^"]*(?:tag|label|badge|service|category)[^"]*"[^>]*>([^<]{2,50})<\/(?:span|div|a)>/gi
  let tm
  while ((tm = tagRe.exec(html)) !== null) {
    const s = decodeHtml(tm[1]).trim()
    if (s && s.length > 1 && s.length < 60 && !/\d{4}/.test(s)) services.push(s)
  }
  // Also look for services listed in <li> near a "Services" heading
  const svcHeadM = html.match(/(?:services|offers?)\s*:?([\s\S]{0,2000}?)(?:<h[23]|<div class="(?:price|contact|phone)|<footer)/i)
  if (svcHeadM) {
    const liRe = /<li[^>]*>(?:<[^>]+>)*([A-Za-z][^<]{2,50})(?:<\/|<)/g
    let lm
    while ((lm = liRe.exec(svcHeadM[1])) !== null) {
      const s = decodeHtml(lm[1]).trim()
      if (s && !services.includes(s) && s.length < 60) services.push(s)
    }
  }

  // Rates
  let price_incall = 0, price_outcall = 0, price_overnight = 0
  const priceM = html.match(/<[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]{0,300}?)<\//)
  if (priceM) {
    const p = decodeHtml(priceM[1])
    price_incall = parseKES(p)
  }
  // Fallback: scan description for KES amounts
  if (!price_incall && bio) {
    const kesM = bio.match(/(?:incall|in-call)\s*(?:KES|Ksh?)?\s*(\d{3,6})/i)
    if (kesM) price_incall = parseInt(kesM[1], 10)
    const outM = bio.match(/(?:outcall|out-call)\s*(?:KES|Ksh?)?\s*(\d{3,6})/i)
    if (outM) price_outcall = parseInt(outM[1], 10)
    if (!price_outcall && price_incall) price_outcall = Math.round(price_incall * 1.3 / 100) * 100
  }

  // Gallery
  const galleryImgs = []
  const imgRe = /(?:data-src|data-lazy|src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))(?:\?[^"]*)?"[^>]*(?:class="[^"]*(?:gallery|photo|image|slide|swiper)[^"]*"|data-fancybox)/gi
  let gm
  while ((gm = imgRe.exec(html)) !== null) {
    const u = gm[1].trim()
    if (!galleryImgs.includes(u) && !u.includes('placeholder') && !u.includes('logo')) galleryImgs.push(u)
  }
  // Fallback: og:image
  const ogM = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)
  if (ogM && !galleryImgs.includes(ogM[1])) galleryImgs.push(ogM[1])

  return {
    name, phone, age, city, area, bio, height, ethnicity, bodyType: null,
    incall, outcall, price_incall, price_outcall, price_overnight,
    services, languages, galleryImgs,
    source: 'skokka',
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SOURCE 3 — locanto.co.ke
// ══════════════════════════════════════════════════════════════════════════════
const LOCANTO_BASE = 'https://www.locanto.co.ke'

function parseLocantoListing(html) {
  const profiles = []
  const linkRe = /href="(\/[A-Z][^"]*\/ID_\d+[^"]*\.html?)"[^>]*>([^<]{3,60})<\/a>/gi
  let m
  while ((m = linkRe.exec(html)) !== null) {
    const url     = `${LOCANTO_BASE}${m[1]}`
    const rawName = m[2].trim()
    if (!rawName || profiles.find(p => p.url === url)) continue
    profiles.push({ url, rawName, location: null, thumbnailUrl: null, site: 'locanto' })
  }
  return profiles
}

function parseLocantoProfile(html) {
  const nameM = html.match(/<h1[^>]*itemprop="name"[^>]*>([^<]+)<\/h1>/)
    || html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/)
  let name = nameM ? decodeHtml(nameM[1]).split(/[|–-]/)[0].trim() : null
  if (!name) return null
  name = name.replace(/\s*\+?254\d{9}\s*$/, '').replace(/\s*0\d{9}\s*$/, '').trim()
  if (name.length < 2) return null

  const telM = html.match(/href="tel:(\+?[\d\s()-]+)"/)
    || html.match(/data-phone="(\+?[\d\s()-]+)"/)
  const phone = telM ? normalizePhone(telM[1]) : null

  const ageM = html.match(/\b(1[89]|2\d|3[05])\s*(?:years?|yrs?)/i)
  const age  = ageM ? parseInt(ageM[1], 10) : 0

  const locM = html.match(/(?:Location|City|Area)\s*:?\s*<[^>]+>([^<]{2,30})</)
    || html.match(/<span[^>]*itemprop="addressLocality"[^>]*>([^<]+)<\/span>/)
  const rawLoc = locM ? decodeHtml(locM[1]).trim() : 'Nairobi'
  const { city, area } = normalizeCity(rawLoc)

  const descM = html.match(/<div[^>]*itemprop="description"[^>]*>([\s\S]{0,2000}?)<\/div>/i)
    || html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)
  const bio = descM ? decodeHtml(descM[1]).slice(0, 1000).trim() || null : null

  const htM    = html.match(/(\d{2,3})\s*cm/)
  const height = htM ? `${htM[1]}cm` : null

  const incall  = /\bincall\b/i.test(html) ? 1 : 0
  const outcall = /\boutcall\b/i.test(html) ? 1 : 0
  const languages = ['English', 'Swahili']

  const services = []
  const svcRe = /<li[^>]*>(?:<[^>]+>)*([A-Za-z][^<]{2,50})(?:<\/|<)/g
  let sm
  while ((sm = svcRe.exec(html)) !== null) {
    const s = decodeHtml(sm[1]).trim()
    if (s && s.length < 60 && !services.includes(s)) services.push(s)
  }

  let price_incall = 0, price_outcall = 0, price_overnight = 0
  if (bio) {
    const kesM = bio.match(/(?:KES|Ksh?|sh)\s*(\d{3,6})/gi)
    if (kesM && kesM.length >= 1) price_incall  = parseKES(kesM[0])
    if (kesM && kesM.length >= 2) price_outcall = parseKES(kesM[1])
  }

  const galleryImgs = []
  const imgRe = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/
  const ogM   = html.match(imgRe)
  if (ogM) galleryImgs.push(ogM[1])

  return {
    name, phone, age, city, area, bio, height, ethnicity: 'African', bodyType: null,
    incall, outcall, price_incall, price_outcall, price_overnight,
    services, languages, galleryImgs,
    source: 'locanto',
  }
}

// ── Unified listing/profile dispatcher ───────────────────────────────────────
function parseListing(html, site) {
  if (site === 'nairobiraha') return parseNairobirahaListing(html)
  if (site === 'skokka')      return parseSkokkaListing(html)
  if (site === 'locanto')     return parseLocantoListing(html)
  return []
}

function parseProfile(html, site, url) {
  if (site === 'nairobiraha') return parseNairobirahaProfile(html)
  if (site === 'skokka')      return parseSkokkaProfile(html, url)
  if (site === 'locanto')     return parseLocantoProfile(html)
  return null
}

// ── DB operations ────────────────────────────────────────────────────────────
async function escortExists(db, phone, name) {
  if (phone) {
    const { rows } = await db.query('SELECT id FROM escorts WHERE phone = $1', [phone])
    if (rows.length > 0) return true
  }
  if (name) {
    const { rows } = await db.query('SELECT id FROM escorts WHERE LOWER(name) = LOWER($1)', [name])
    if (rows.length > 0) return true
  }
  return false
}

async function insertEscort(db, profile, avatarPath) {
  const {
    name, phone, age, city, area, bio, height, ethnicity, bodyType,
    incall, outcall, price_incall, price_outcall, price_overnight, source,
  } = profile
  return db.insert(
    `INSERT INTO escorts (
       name, phone, whatsapp, age, city, area, bio,
       height, ethnicity, body_type,
       image, tier, is_active, verified, gender,
       incall, outcall, source_site,
       price_incall, price_outcall, price_overnight
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,
       $8,$9,$10,
       $11,$12,$13,$14,$15,
       $16,$17,$18,
       $19,$20,$21
     )`,
    [
      name, phone || null, phone || null, age || 0,
      city || 'Nairobi', area || city || 'Nairobi', bio || null,
      height || null, ethnicity || 'African', bodyType || null,
      avatarPath || null, 'standard', 1, 0, 'Female',
      incall || 0, outcall || 0, source || null,
      price_incall || 0, price_outcall || 0, price_overnight || 0,
    ]
  )
}

async function insertGallery(db, escortId, imageUrls) {
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      await db.run(
        'INSERT INTO escort_gallery (escort_id, image_url, sort_order) VALUES ($1, $2, $3)',
        [escortId, imageUrls[i], i]
      )
    } catch { /* ignore duplicate */ }
  }
}

async function insertServices(db, escortId, services) {
  for (const svcName of services) {
    try {
      await db.run(
        `INSERT INTO escort_services (escort_id, name, available)
         VALUES ($1, $2, 1)
         ON CONFLICT (escort_id, name) DO NOTHING`,
        [escortId, svcName]
      )
    } catch { /* ignore */ }
  }
}

async function insertLanguages(db, escortId, languages) {
  for (const lang of languages) {
    try {
      await db.run(
        `INSERT INTO escort_languages (escort_id, language)
         VALUES ($1, $2)
         ON CONFLICT (escort_id, language) DO NOTHING`,
        [escortId, lang]
      )
    } catch { /* ignore */ }
  }
}

// ── Source definitions ───────────────────────────────────────────────────────
function buildSources() {
  const sources = []

  // Nairobiraha — all pages + category pages
  if (!SRC_FILTER || SRC_FILTER === 'nairobiraha') {
    for (let p = 1; p <= 20; p++) {
      sources.push({ site: 'nairobiraha', listingUrl: `https://nairobiraha.com/escorts/page/${p}/` })
    }
    for (const cat of ['african-escorts','call-girls','nairobi-escorts','mombasa-escorts','vip-escorts','massage','indian-escorts','kisumu-escorts','nakuru-escorts','westlands-escorts','karen-escorts','kilimani-escorts','nairobi-cbd-escorts','eldoret-escorts','cbd-escorts']) {
      sources.push({ site: 'nairobiraha', listingUrl: `https://nairobiraha.com/${cat}/` })
    }
  }

  // Skokka Kenya — multiple city/category pages
  if (!SRC_FILTER || SRC_FILTER === 'skokka') {
    for (let p = 1; p <= 15; p++) {
      sources.push({ site: 'skokka', listingUrl: `https://www.skokka.co.ke/escorts/?page=${p}` })
    }
    for (const area of ['nairobi','mombasa','kisumu','nakuru','eldoret','kilimani','westlands','karen']) {
      for (let p = 1; p <= 5; p++) {
        sources.push({ site: 'skokka', listingUrl: `https://www.skokka.co.ke/escorts/${area}/?page=${p}` })
      }
    }
  }

  // Locanto Kenya
  if (!SRC_FILTER || SRC_FILTER === 'locanto') {
    for (let p = 1; p <= 10; p++) {
      sources.push({ site: 'locanto', listingUrl: `https://www.locanto.co.ke/ID_5/Services-Personals-Kenya.html?page=${p}` })
    }
    for (const city of ['Nairobi','Mombasa','Kisumu','Nakuru']) {
      sources.push({ site: 'locanto', listingUrl: `https://www.locanto.co.ke/ID_5/${city}-personals.html` })
    }
  }

  return sources
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Wet3Camp Multi-Source Escort Scraper')
  console.log(`   DB:      ${IS_MYSQL ? 'MySQL/MariaDB' : 'PostgreSQL'}`)
  console.log(`   Mode:    ${DRY_RUN ? 'DRY RUN' : FAST_MODE ? 'FAST (remote URLs)' : 'FULL (download images)'}`)
  console.log(`   Source:  ${SRC_FILTER || 'ALL (nairobiraha + skokka + locanto)'}`)
  console.log(`   Limit:   ${LIMIT}`)
  console.log()

  let db
  if (!DRY_RUN) {
    db = await createDb()
    await ensureColumns(db)
    console.log('✅ Database connected\n')
  }

  const SOURCES   = buildSources()
  const seenUrls  = new Set()
  const seenPhones= new Set()
  const seenNames = new Set()
  const allProfiles = []

  // ── Step 1: collect listing URLs ──────────────────────────────────────────
  for (const source of SOURCES) {
    if (allProfiles.length >= LIMIT) break
    process.stdout.write(`📋 [${source.site}] ${source.listingUrl} ... `)
    const html = await fetchPage(source.listingUrl, source.site === 'skokka' ? SKOKKA_BASE : undefined)
    if (!html) { console.log('skip'); await sleep(DELAY_MS); continue }

    const listings = parseListing(html, source.site)
    let added = 0
    for (const p of listings) {
      if (seenUrls.has(p.url)) continue
      seenUrls.add(p.url)
      allProfiles.push(p)
      added++
    }
    console.log(`${listings.length} found, ${added} new`)
    await sleep(DELAY_MS)
  }

  const total = Math.min(allProfiles.length, LIMIT)
  console.log(`\n📦 Total unique profile URLs collected: ${total}\n`)

  // ── Step 2: scrape + import each profile ──────────────────────────────────
  let imported = 0, skipped = 0, errors = 0

  for (let i = 0; i < total; i++) {
    const listing = allProfiles[i]
    const num     = `[${i+1}/${total}]`
    process.stdout.write(`${num} [${listing.site}] ${listing.rawName.slice(0, 30).padEnd(30)} ... `)

    const referer = listing.site === 'skokka' ? SKOKKA_BASE
                  : listing.site === 'locanto' ? LOCANTO_BASE : undefined
    const html = await fetchPage(listing.url, referer)
    if (!html) { console.log('❌ fetch failed'); errors++; await sleep(DELAY_MS); continue }

    const profile = parseProfile(html, listing.site, listing.url)
    if (!profile) { console.log('❌ parse failed'); errors++; await sleep(DELAY_MS); continue }

    // Location fallback
    if (!profile.area && listing.location) {
      const loc = normalizeCity(listing.location)
      profile.city = loc.city; profile.area = loc.area
    }

    // Skip if no name
    if (!profile.name || profile.name.length < 2) { console.log('❌ no name'); errors++; await sleep(DELAY_MS); continue }

    if (DRY_RUN) {
      console.log(`✓ ${profile.name} | ${profile.phone} | ${profile.area} | ${profile.price_incall ? 'KES '+profile.price_incall : 'no rate'} | ${profile.services.length} svcs`)
      imported++; await sleep(300); continue
    }

    // Global dedup across sources: skip if phone or name already seen this run
    if (profile.phone && seenPhones.has(profile.phone)) { console.log('⏭  dup(phone)'); skipped++; await sleep(300); continue }
    if (seenNames.has(profile.name.toLowerCase()))       { console.log('⏭  dup(name)');  skipped++; await sleep(300); continue }

    // DB dedup
    if (await escortExists(db, profile.phone, profile.name)) {
      console.log('⏭  in DB')
      if (profile.phone) seenPhones.add(profile.phone)
      seenNames.add(profile.name.toLowerCase())
      skipped++; await sleep(300); continue
    }

    if (profile.phone) seenPhones.add(profile.phone)
    seenNames.add(profile.name.toLowerCase())

    // Images
    let avatarPath = null
    const primaryImg = profile.galleryImgs[0] || listing.thumbnailUrl
    if (primaryImg) {
      if (FAST_MODE) {
        avatarPath = primaryImg
      } else {
        const ext  = primaryImg.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
        const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`
        avatarPath = await downloadImage(primaryImg, fname, referer) || primaryImg
      }
    }

    const galleryPaths = avatarPath ? [avatarPath] : []
    if (FAST_MODE) {
      for (let g = 1; g < Math.min(profile.galleryImgs.length, 6); g++) {
        galleryPaths.push(profile.galleryImgs[g])
      }
    } else {
      for (let g = 1; g < Math.min(profile.galleryImgs.length, 5); g++) {
        const ext  = profile.galleryImgs[g].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
        const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`
        const gp   = await downloadImage(profile.galleryImgs[g], fname, referer)
        if (gp) galleryPaths.push(gp)
        await sleep(300)
      }
    }

    try {
      const escortId = await insertEscort(db, profile, avatarPath)
      await insertGallery(db, escortId, galleryPaths)
      if (profile.services.length)  await insertServices(db, escortId, profile.services)
      if (profile.languages.length) await insertLanguages(db, escortId, profile.languages)

      const parts = []
      if (profile.services.length)                       parts.push(`${profile.services.length} svcs`)
      if (profile.languages.length)                      parts.push(`${profile.languages.length} langs`)
      if (profile.price_incall || profile.price_outcall) parts.push(`KES ${profile.price_incall || 0}/${profile.price_outcall || 0}`)
      console.log(`✅ id:${escortId} ${parts.length ? '['+parts.join(', ')+']' : ''}`)
      imported++
    } catch (err) {
      console.log(`❌ DB error: ${err.message}`)
      errors++
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅ Done — imported: ${imported} | skipped: ${skipped} | errors: ${errors}`)
  console.log(`${'─'.repeat(60)}\n`)

  if (!DRY_RUN) await db.end()
}

main().catch(err => { console.error('\n💥 Fatal error:', err.message); process.exit(1) })
