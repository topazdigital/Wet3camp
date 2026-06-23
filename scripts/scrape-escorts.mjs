/**
 * Wet3Camp Multi-Source Kenyan Escort Scraper
 *
 * Sources (in order):
 *   1. nairobiraha.com  — static HTML profiles, services from bio text, languages from section-boxes
 *   2. hookup254.com    — WordPress AJAX-based, discovers nonce from listing page then POSTs to admin-ajax
 *
 * Usage (run from artifacts/api-server/):
 *   node scrape-escorts.mjs                       — full scrape all sources
 *   node scrape-escorts.mjs --fast                — skip image downloads (store remote URLs)
 *   node scrape-escorts.mjs --dry-run             — parse only, no DB writes
 *   node scrape-escorts.mjs --limit=20            — stop after N imports
 *   node scrape-escorts.mjs --source=nairobiraha  — one source only
 *   node scrape-escorts.mjs --source=hookup254
 *   node scrape-escorts.mjs --update              — re-fetch existing escorts and update services/languages/rates
 *
 * Live server:
 *   cd /home/admin/wet3camp-build/artifacts/api-server
 *   DATABASE_URL="mysql://admin_wet3camp:PASS@localhost/admin_wet3camp" node scrape-escorts.mjs --fast
 *   DATABASE_URL="mysql://admin_wet3camp:PASS@localhost/admin_wet3camp" node scrape-escorts.mjs --update
 */

import { mkdirSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DATABASE_URL = process.env.DATABASE_URL
const UPLOADS_DIR  = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads')
const USER_AGENT   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const args        = process.argv.slice(2)
const DRY_RUN     = args.includes('--dry-run')
const FAST_MODE   = args.includes('--fast')
const UPDATE_MODE = args.includes('--update')
const LIMIT       = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '9999', 10)
const SRC_FILTER  = args.find(a => a.startsWith('--source='))?.split('=')[1]?.toLowerCase() || null
const IS_MYSQL    = DATABASE_URL?.startsWith('mysql://')
const DELAY_MS    = FAST_MODE ? 600 : 1200

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
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall          TINYINT      NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall         TINYINT      NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site     VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_url      VARCHAR(500) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_incall    INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_outcall   INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_overnight INT DEFAULT 0',
      ]
    : [
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall          SMALLINT NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall         SMALLINT NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site     VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_url      VARCHAR(500) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_incall    INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_outcall   INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_overnight INT DEFAULT 0',
      ]
  for (const sql of cols) {
    try { await db.run(sql) } catch { /* already exists */ }
  }
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchPage(url, referer, extraHeaders = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        // Don't request compressed encoding — Node fetch's behaviour with
        // content-encoding varies; simpler to request plain text
        'Referer': referer || url,
        ...extraHeaders,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    // Use .text() which handles encoding transparently; if that fails
    // (binary / already compressed), fall back to manual decompress
    try {
      const text = await res.text()
      if (text && text.length > 100) return text
    } catch { /* fall through to manual decompress */ }
    return null
  } catch (err) {
    console.warn(`  [WARN] fetch failed for ${url}: ${err.message}`)
    return null
  }
}

async function postPage(url, body, referer, extraHeaders = {}) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/json,*/*;q=0.8',
        'Referer': referer || url,
        'X-Requested-With': 'XMLHttpRequest',
        ...extraHeaders,
      },
      body: new URLSearchParams(body).toString(),
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } catch (err) {
    console.warn(`  [WARN] POST failed for ${url}: ${err.message}`)
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
      r.includes('ruaka') || r.includes('parklands') || r.includes('upperhill') ||
      r.includes('allsops') || r.includes('baba dogo') || r.includes('bahati') ||
      r.includes('kasarani') || r.includes('githurai') || r.includes('eastleigh') ||
      r.includes('kileleshwa') || r.includes('donholm') || r.includes('buruburu')) {
    return { city: 'Nairobi', area: raw.trim() }
  }
  return { city: raw.trim(), area: raw.trim() }
}

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

// ── Kenya escort services — extracted from bio text ──────────────────────────
const SERVICE_PATTERNS = [
  { name: 'Massage',            re: /\b(?:full\s*body\s*massage|body\s*massage|massage)\b/i },
  { name: 'Happy ending',       re: /\bhappy\s*ending\b/i },
  { name: 'Oral sex',           re: /\b(?:oral\s*sex|oral|blow\s*job|blowjob|bj|fellatio)\b/i },
  { name: 'Sex',                re: /\b(?:sex|intercourse|penetration|making\s*love|fuck)\b/i },
  { name: 'Threesome',          re: /\b(?:threesome|3some|trio)\b/i },
  { name: '69',                 re: /\b(?:sixty.?nine|69)\b/i },
  { name: 'Anal sex',           re: /\b(?:anal\s*sex|anal)\b/i },
  { name: 'GFE',                re: /\b(?:girlfriend\s*experience|gfe)\b/i },
  { name: 'BDSM',               re: /\b(?:bdsm|bondage|dominant|domination|submissive)\b/i },
  { name: 'Striptease',         re: /\b(?:strip\s*tease|striptease|strip\s*show)\b/i },
  { name: 'Lap dance',          re: /\blap\s*dance\b/i },
  { name: 'Hand job',           re: /\b(?:hand\s*job|handjob|hj)\b/i },
  { name: 'Webcam / Video call',re: /\b(?:webcam|video\s*call|video\s*sex|online\s*show)\b/i },
  { name: 'Phone sex',          re: /\bphone.?sex\b/i },
  { name: 'Lesbian show',       re: /\b(?:lesbian\s*show|girl.on.girl)\b/i },
  { name: 'Rimming',            re: /\b(?:rimming|rim\s*job|ass\s*rimming|anilingus)\b/i },
  { name: 'Titjob',             re: /\b(?:boob\s*fuck|tit.?job|titfuck|breast\s*sex)\b/i },
  { name: 'Deep throat',        re: /\bdeep\s*throat\b/i },
  { name: 'Squirting',          re: /\bsquirt\b/i },
  { name: 'Tantric massage',    re: /\btantric\b/i },
  { name: 'Role play',          re: /\brole.?play\b/i },
  { name: 'Fetish',             re: /\bfetish\b/i },
  { name: 'Cum on face',        re: /\b(?:facial|cum.on.face|cum\s*on\s*body)\b/i },
  { name: 'Overnight',          re: /\bovernight\b/i },
]

function servicesFromBio(bioText) {
  if (!bioText) return []
  const found = []
  for (const { name, re } of SERVICE_PATTERNS) {
    if (re.test(bioText) && !found.includes(name)) found.push(name)
  }
  return found
}

// ══════════════════════════════════════════════════════════════════════════════
// SOURCE 1 — nairobiraha.com
// ══════════════════════════════════════════════════════════════════════════════
const NAIROBIRAHA_BASE = 'https://nairobiraha.com'

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

function parseNairobirahaProfile(html, profileUrl) {
  // Name — profile title
  const titleM = html.match(/<h3[^>]*class="profile-title"[^>]*title="([^"]+)"/)
  let rawName  = titleM ? titleM[1].trim() : null
  // Fallback: og:title
  if (!rawName) {
    const ogM = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/)
    rawName = ogM ? ogM[1].trim() : null
  }
  if (!rawName) return null

  // Strip phone number from name
  let name = rawName
    .replace(/\s*\+?2540?\d{8,9}\s*$/, '')
    .replace(/\s*0\d{9}\s*$/, '')
    .replace(/\s*-\s*\d{10,12}\s*$/, '')
    .trim()
  if (!name || name.length < 2) return null

  // Phone — href="tel:..." OR data-phone attr OR inline text
  let phone = null
  const telM = html.match(/href="tel:(\+?[\d\s()-]+)"/)
    || html.match(/data-phone="(\+?[\d\s()-]+)"/)
  if (telM) phone = normalizePhone(telM[1])
  // Fallback: extract from slug
  if (!phone) {
    const slugPhone = profileUrl?.match(/escort\/[^-]+-(\d{10,12})/)
    if (slugPhone) phone = normalizePhone(slugPhone[1])
  }

  // Age / height / weight from section-boxes
  const ageM   = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>years<\/b>/)
  const htM    = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>cm<\/b>/)
  const age    = ageM ? parseInt(ageM[1], 10) : 0
  const height = htM  ? `${htM[1]}cm` : null

  // Bio — the "aboutme" div
  const bioM = html.match(/<div class="aboutme">([\s\S]*?)<\/div>\s*<div class="clear/)
    || html.match(/<div class="aboutme">([\s\S]*?)<\/div>/)
  let bio = null
  if (bioM) {
    const raw = bioM[1].replace(/<h4>[^<]*<\/h4>/gi, '').replace(/<b>[^<]*<\/b>/gi, '')
    const txt = decodeHtml(raw)
    if (txt.length > 10) bio = txt
  }

  // Location
  let city = 'Nairobi', area = 'Nairobi'
  const cityM = html.match(/escorts-from\/kenya\/([^/"]+)\/?" title="([^"]+)"/)
    || html.match(/escorts-from\/([^/"]+)\/?" title="([^"]+)"/)
  if (cityM) {
    const loc = normalizeCity(cityM[2].trim())
    city = loc.city; area = loc.area
  }

  // Section-box fields — nairobiraha uses EITHER single OR double quotes
  const boxes = {}
  const boxRe = /<div class=['"]section-box['"]>\s*<b[^>]*>([^<]+)<\/b>\s*<span[^>]*>([^<]*)<\/span>\s*<\/div>/g
  let bm
  while ((bm = boxRe.exec(html)) !== null) boxes[bm[1].trim()] = bm[2].trim()

  const availability = boxes['Availability'] || ''
  const ethnicity    = boxes['Ethnicity'] || boxes['Race'] || 'African'
  const bodyType     = boxes['Build'] || null
  const incall       = availability.toLowerCase().includes('incall')  ? 1 : (bio && /incall/i.test(bio) ? 1 : 0)
  const outcall      = availability.toLowerCase().includes('outcall') ? 1 : (bio && /outcall/i.test(bio) ? 1 : 0)

  // Languages — nairobiraha puts them in section-box divs: <b>English:</b><span>Fluent</span>
  const languages = []
  const knownLangs = ['English','Swahili','French','Arabic','Spanish','German','Chinese','Portuguese','Somali','Kikuyu','Luo','Luhya','Italian']
  for (const [key, val] of Object.entries(boxes)) {
    const k = key.replace(/:$/, '').trim()
    const match = knownLangs.find(l => l.toLowerCase() === k.toLowerCase())
    if (match && val.toLowerCase() !== 'no' && val.toLowerCase() !== '') languages.push(match)
  }
  // Always ensure English + Swahili for Kenya
  if (!languages.some(l => l.toLowerCase() === 'english')) languages.unshift('English')
  if (!languages.some(l => l.toLowerCase() === 'swahili')) languages.push('Swahili')

  // Services — extract from bio text (nairobiraha services are JS-loaded, but bio describes them)
  const services = servicesFromBio(bio)

  // Also check for explicitly listed services in any static block
  const svcListM = html.match(/(?:icon-yes|✓|✔)\s*(?:<[^>]+>)?\s*([A-Za-z][A-Za-z0-9 (),/\-]{2,50})/g)
  if (svcListM) {
    for (const raw of svcListM) {
      const s = raw.replace(/(?:icon-yes|✓|✔)/g, '').replace(/<[^>]+>/g, '').trim()
      if (s && s.length > 2 && s.length < 60 && !services.includes(s)) services.push(s)
    }
  }

  // Rates — try structured block first, then bio text
  let price_incall = 0, price_outcall = 0, price_overnight = 0

  // Table-based rates
  const ratesM = html.match(/RATES?\s*:?\s*([\s\S]{0,3000}?)(?:SERVICES?\s*:|CONTACT|<footer|<div class="clear)/i)
  if (ratesM) {
    const rb = ratesM[1]
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
    // EUR fallback → convert to KES (approx 145 KES/EUR)
    if (!price_incall) {
      const hrM = rb.match(/(?:1\s*hour|short)[^<]*?(\d+)\s*EUR[^<]*?(\d+)\s*EUR/i)
      if (hrM) {
        price_incall  = Math.round(parseInt(hrM[1], 10) * 145 / 100) * 100
        price_outcall = Math.round(parseInt(hrM[2], 10) * 145 / 100) * 100
      }
    }
  }

  // Bio text rates fallback — "charge 3000", "3000 per hour", "KES 5000", "2k/hr"
  if (!price_incall && bio) {
    const bioLower = bio.toLowerCase()
    // KES/Ksh amounts
    const kesM = [...bio.matchAll(/(?:KES|Ksh?)\s*(\d{1,2}(?:,\d{3}|\d{3})?|\d+k)/gi)]
    if (kesM.length >= 1) price_incall  = parseKES(kesM[0][0])
    if (kesM.length >= 2) price_outcall = parseKES(kesM[1][0])

    // "charge X" or "X per hour" or "X/hr"
    if (!price_incall) {
      const chargeM = bio.match(/(?:charge|cost|fee|rate|price)[^0-9]{0,20}(\d{1,2},?\d{3}|\d+k)/i)
      if (chargeM) price_incall = parseKES(chargeM[1])
    }
    if (!price_incall) {
      const hrM = bio.match(/(\d{1,2},?\d{3}|\d+k)\s*(?:per\s*hr|\/hr|per\s*hour|\/hour)/i)
      if (hrM) price_incall = parseKES(hrM[1])
    }
    // Outcall from bio
    if (price_incall && !price_outcall) {
      const outM = bio.match(/out.?call[^0-9]{0,20}(\d{1,2},?\d{3}|\d+k)/i)
      if (outM) price_outcall = parseKES(outM[1])
      else price_outcall = Math.round(price_incall * 1.3 / 100) * 100
    }
    // Overnight
    if (!price_overnight) {
      const ovM = bio.match(/overnight[^0-9]{0,20}(\d{4,6}|\d+k)/i)
      if (ovM) price_overnight = parseKES(ovM[1])
    }
  }

  // Gallery — full-size images from fancybox links
  const galleryImgs = []
  // Priority: href with full URL (direct link to wp-content image)
  const fullRe = /href="(https?:\/\/nairobiraha\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi
  let fm
  while ((fm = fullRe.exec(html)) !== null) {
    const u = fm[1].trim().split('?')[0]
    if (!galleryImgs.includes(u)) galleryImgs.push(u)
  }
  // Fallback: data-responsive-img-url (relative → absolute)
  const thumbRe = /data-responsive-img-url="([^"]+)"/g
  let tm
  while ((tm = thumbRe.exec(html)) !== null) {
    let u = tm[1].trim().split('?')[0]
    if (u.startsWith('/')) u = `${NAIROBIRAHA_BASE}${u}`
    if (!galleryImgs.includes(u)) galleryImgs.push(u)
  }
  // Fallback: og:image
  const ogImgM = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)
  if (ogImgM && !galleryImgs.includes(ogImgM[1])) galleryImgs.push(ogImgM[1])

  return {
    name, phone, age, city, area, bio, height, ethnicity, bodyType,
    incall, outcall, price_incall, price_outcall, price_overnight,
    services, languages, galleryImgs,
    source: 'nairobiraha',
    sourceUrl: profileUrl || null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SOURCE 2 — hookup254.com
// WordPress escort directory — uses admin-ajax.php with nonce for dynamic loading
// Individual profile pages DO have static HTML when accessed directly
// ══════════════════════════════════════════════════════════════════════════════
const HOOKUP254_BASE   = 'https://www.hookup254.com'
const HOOKUP254_AJAX   = 'https://www.hookup254.com/wp-admin/admin-ajax.php'

// Known hookup254 AJAX action names used by escortwp theme variants
const HOOKUP254_ACTIONS = [
  'load_escort_listings',
  'escort_filter',
  'load_escorts',
  'get_escorts',
  'escortwp_load_more',
  'ew_load_more',
  'ewp_load_more',
  'filter_escorts_ajax',
  'escort_ajax_filter',
  'load_more_escorts',
]

// Cache hookup254 nonce across pages to avoid refetching
let hookup254Nonce = null
let hookup254Ajax  = HOOKUP254_AJAX

async function fetchHookup254Nonce(refPage) {
  const html = await fetchPage(refPage || `${HOOKUP254_BASE}/escorts-from/nairobi/`)
  if (!html) return null
  // Extract nonce from localized script vars (escortwp, cookie consent, etc.)
  const noncePatterns = [
    /(?:ewp_vars|escortwp_vars|ew_vars|listing_vars)[^{]*\{[^}]*"nonce"\s*:\s*"([a-f0-9]+)"/i,
    /"nonce"\s*:\s*"([a-f0-9]{10})"/,
    /wp_nonce\s*=\s*"([a-f0-9]{10})"/,
    /cookieadmin_pro_vars\s*=\s*\{[^}]*"nonce"\s*:\s*"([a-f0-9]+)"/,
  ]
  for (const pat of noncePatterns) {
    const m = html.match(pat)
    if (m) { hookup254Nonce = m[1]; break }
  }
  // Extract ajax_url
  const ajaxM = html.match(/"ajax_url"\s*:\s*"([^"]+)"/)
  if (ajaxM) hookup254Ajax = ajaxM[1].replace(/\\/g, '')
  return hookup254Nonce
}

async function fetchHookup254Escorts(page = 1, location = '') {
  if (!hookup254Nonce) await fetchHookup254Nonce()
  if (!hookup254Nonce) {
    console.warn('  [hookup254] Could not get nonce — skipping AJAX fetch')
    return []
  }
  const profiles = []
  for (const action of HOOKUP254_ACTIONS) {
    const body = {
      action,
      nonce: hookup254Nonce,
      page: String(page),
      paged: String(page),
      location,
      category: '',
    }
    const result = await postPage(hookup254Ajax, body, `${HOOKUP254_BASE}/escorts-from/${location || 'nairobi'}/`)
    if (!result || result === '0' || result === '-1' || result.length < 50) continue
    // Parse HTML cards from the AJAX response
    const cardProfiles = parseHookup254Cards(result)
    if (cardProfiles.length > 0) {
      profiles.push(...cardProfiles)
      break  // found working action
    }
  }
  return profiles
}

function parseHookup254Cards(html) {
  const profiles = []
  // escortwp theme renders cards as article.escort-card or div.escort-card with links
  const cardRe = /<(?:article|div)[^>]*class="[^"]*(?:escort-card|girl-card|model-card|listing-item)[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div)>/gi
  let m
  while ((m = cardRe.exec(html)) !== null) {
    const card = m[1]
    const linkM = card.match(/href="(https?:\/\/[^"]*\/escort\/[^"]+)"/)
    if (!linkM) continue
    const url = linkM[1]
    const nameM = card.match(/<(?:h2|h3|span)[^>]*class="[^"]*(?:title|name)[^"]*"[^>]*>([^<]+)</)
    const rawName = nameM ? decodeHtml(nameM[1]).trim() : null
    const imgM = card.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp))"/) || card.match(/src="([^"]+\.(?:jpg|jpeg|png|webp))"/)
    const thumbnailUrl = imgM ? imgM[1] : null
    const locM = card.match(/<(?:span|div)[^>]*class="[^"]*(?:location|city)[^"]*"[^>]*>([^<]+)</)
    const location = locM ? decodeHtml(locM[1]).trim() : null
    if (!rawName || profiles.find(p => p.url === url)) continue
    profiles.push({ url, rawName, location, thumbnailUrl, site: 'hookup254' })
  }
  // Fallback: any /escort/ links in the response HTML
  if (profiles.length === 0) {
    const linkRe = /href="(https?:\/\/www\.hookup254\.com\/escort\/[^"]+)"/g
    let lm
    while ((lm = linkRe.exec(html)) !== null) {
      const url = lm[1]
      if (!profiles.find(p => p.url === url)) {
        profiles.push({ url, rawName: url.split('/').filter(Boolean).pop().replace(/-/g, ' '), location: null, thumbnailUrl: null, site: 'hookup254' })
      }
    }
  }
  return profiles
}

function parseHookup254Profile(html, profileUrl) {
  // escortwp theme profile structure
  // Name — h1 or profile-title
  const nameM = html.match(/<h1[^>]*class="[^"]*(?:profile-title|escort-name|name)[^"]*"[^>]*>([^<]+)<\/h1>/)
    || html.match(/<h1[^>]*>([^<]{2,60})<\/h1>/)
    || html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/)
  let name = nameM ? decodeHtml(nameM[1]).split(/[|–-]/)[0].trim() : null
  if (!name && profileUrl) name = decodeURIComponent(profileUrl.split('/').filter(Boolean).pop().replace(/-/g,' '))
  if (!name || name.length < 2) return null
  name = name.replace(/\s*\+?2540?\d{8,9}\s*$/, '').replace(/\s*0\d{9}\s*$/, '').trim()
  if (name.length < 2) return null

  // Phone
  const telM = html.match(/href="tel:(\+?[\d\s()-]+)"/)
    || html.match(/data-(?:phone|tel|number)="(\+?[\d\s()-]+)"/)
    || html.match(/(?:whatsapp|phone|mobile|call)[^>]*>[\s\S]{0,30}?(\+?(?:254|07|01)[\d\s()-]{7,11})/)
  let phone = telM ? normalizePhone(telM[1]) : null

  // Phone from description
  if (!phone) {
    const descText = decodeHtml(html.slice(0, 5000))
    const numM = descText.match(/(?:\+?254|07|01)[\d\s-]{7,11}/)
    if (numM) phone = normalizePhone(numM[0].replace(/\s/g, ''))
  }

  // Age
  const ageM = html.match(/\b(1[89]|2\d|3[05])\s*(?:years?\s*old|yrs?)\b/i)
    || html.match(/(?:age|years)\s*:?\s*<[^>]*>\s*(\d{2})\b/i)
  const age = ageM ? parseInt(ageM[1], 10) : 0

  // Location
  const locM = html.match(/<span[^>]*(?:class|itemprop)="[^"]*(?:location|city|area|region)[^"]*"[^>]*>([^<]+)<\/span>/i)
    || html.match(/(?:Location|City|Area|County)\s*:?\s*<?\/?\w*>?\s*([A-Za-z][^<,\n]{2,40})/i)
    || html.match(/<meta[^>]*property="og:locality"[^>]*content="([^"]+)"/)
  const rawLoc = locM ? decodeHtml(locM[1]).trim() : ''
  const { city, area } = normalizeCity(rawLoc || 'Nairobi')

  // Bio / description
  const descM = html.match(/<div[^>]*(?:class|itemprop)="[^"]*(?:description|about|bio|text)[^"]*"[^>]*>([\s\S]{0,3000}?)<\/div>/i)
    || html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)
  const bio = descM ? decodeHtml(descM[1]).slice(0, 1000).trim() || null : null

  // Height
  const htM = html.match(/(\d{3})\s*cm/)
  const height = htM ? `${htM[1]}cm` : null

  // Ethnicity
  const ethnicityM = html.match(/(?:ethnicity|nationality|race)\s*:?\s*<?\/?\w*>?\s*([A-Za-z][^<,\n]{2,30})/i)
  const ethnicity = ethnicityM ? decodeHtml(ethnicityM[1]).trim() : 'African'

  // Incall / outcall
  const incall  = /\bincall\b/i.test(html) ? 1 : 0
  const outcall = /\boutcall\b/i.test(html) ? 1 : 0

  // Languages — look for section-box or standard fields
  const languages = ['English', 'Swahili']
  const langWords = ['French', 'Arabic', 'Spanish', 'German', 'Somali', 'Kikuyu', 'Luo', 'Luhya', 'Italian']
  for (const lw of langWords) {
    if (new RegExp(`\\b${lw}\\b`, 'i').test(html)) languages.push(lw)
  }

  // Services — section-box "yes" items OR bio text
  const services = servicesFromBio(bio)
  // escortwp "service" checkboxes
  const yesRe = /<(?:span|div|li)[^>]*class="[^"]*(?:yes|available|included|icon-yes)[^"]*"[^>]*>\s*(?:<[^>]+>\s*)?([A-Za-z][^<]{2,50})</gi
  let ym
  while ((ym = yesRe.exec(html)) !== null) {
    const s = decodeHtml(ym[1]).trim()
    if (s.length > 1 && s.length < 60 && !services.includes(s)) services.push(s)
  }

  // Rates — escortwp rate table or inline
  let price_incall = 0, price_outcall = 0, price_overnight = 0
  const rateM = html.match(/(?:rates?|pricing|price)[^<]{0,30}([\s\S]{0,1500}?)(?:<h[23]|<footer|class="contact)/i)
  if (rateM) {
    const rb = rateM[1]
    const rows = rb.split(/<tr[^>]*>/)
    for (const row of rows) {
      const text = decodeHtml(row)
      if (/\b1\s*h(?:our|r)?\b|short/i.test(text)) {
        const nums = [...text.matchAll(/\b(\d{3,6})\b/g)].map(m => parseInt(m[1], 10)).filter(n => n >= 500 && n <= 200000)
        if (nums.length >= 2) { price_incall = nums[0]; price_outcall = nums[1] }
        else if (nums.length === 1) { price_incall = nums[0]; price_outcall = Math.round(nums[0] * 1.3 / 100) * 100 }
      }
      if (/overnight/i.test(text)) {
        const nums = [...text.matchAll(/\b(\d{4,6})\b/g)].map(m => parseInt(m[1], 10)).filter(n => n >= 1000)
        if (nums.length) price_overnight = nums[0]
      }
    }
  }
  // Bio rates fallback
  if (!price_incall && bio) {
    const chargeM = bio.match(/(?:KES|Ksh?)\s*(\d{1,2}(?:,\d{3}|\d{3})?|\d+k)/gi)
    if (chargeM) {
      price_incall  = parseKES(chargeM[0])
      if (chargeM.length > 1) price_outcall = parseKES(chargeM[1])
    }
    if (price_incall && !price_outcall) price_outcall = Math.round(price_incall * 1.3 / 100) * 100
  }

  // Gallery
  const galleryImgs = []
  const imgRe = /(?:data-src|href|src)="(https?:\/\/(?:www\.)?hookup254\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi
  let gm
  while ((gm = imgRe.exec(html)) !== null) {
    const u = gm[1].trim().split('?')[0]
    if (!galleryImgs.includes(u) && !u.includes('logo') && !u.includes('favicon')) galleryImgs.push(u)
  }
  const ogImgM = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)
  if (ogImgM && !galleryImgs.includes(ogImgM[1])) galleryImgs.push(ogImgM[1])

  return {
    name, phone, age, city, area, bio, height, ethnicity, bodyType: null,
    incall, outcall, price_incall, price_outcall, price_overnight,
    services, languages, galleryImgs,
    source: 'hookup254',
    sourceUrl: profileUrl || null,
  }
}

// ── Unified dispatcher ────────────────────────────────────────────────────────
function parseProfile(html, site, url) {
  if (site === 'nairobiraha') return parseNairobirahaProfile(html, url)
  if (site === 'hookup254')   return parseHookup254Profile(html, url)
  return null
}

// ── DB operations ─────────────────────────────────────────────────────────────
async function escortExists(db, phone, name) {
  if (phone) {
    const { rows } = await db.query('SELECT id FROM escorts WHERE phone = $1', [phone])
    if (rows.length > 0) return rows[0].id
  }
  if (name) {
    const { rows } = await db.query('SELECT id FROM escorts WHERE LOWER(name) = LOWER($1)', [name])
    if (rows.length > 0) return rows[0].id
  }
  return null
}

async function insertEscort(db, profile, avatarPath) {
  const {
    name, phone, age, city, area, bio, height, ethnicity, bodyType,
    incall, outcall, price_incall, price_outcall, price_overnight, source, sourceUrl,
  } = profile
  return db.insert(
    `INSERT INTO escorts (
       name, phone, whatsapp, age, city, area, bio,
       height, ethnicity, body_type,
       image, tier, is_active, verified, gender,
       incall, outcall, source_site, source_url,
       price_incall, price_outcall, price_overnight
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,
       $8,$9,$10,
       $11,$12,$13,$14,$15,
       $16,$17,$18,$19,
       $20,$21,$22
     )`,
    [
      name, phone || null, phone || null, age || 0,
      city || 'Nairobi', area || city || 'Nairobi', bio || null,
      height || null, ethnicity || 'African', bodyType || null,
      avatarPath || null, 'standard', 1, 0, 'Female',
      incall || 0, outcall || 0, source || null, sourceUrl || null,
      price_incall || 0, price_outcall || 0, price_overnight || 0,
    ]
  )
}

async function upsertServices(db, escortId, services) {
  if (!services.length) return
  // Clear existing and re-insert (for --update mode accuracy)
  for (const svcName of services) {
    try {
      if (db.isMysql) {
        await db.run(
          'INSERT IGNORE INTO escort_services (escort_id, name, available) VALUES (?, ?, 1)',
          [escortId, svcName]
        )
      } else {
        await db.run(
          `INSERT INTO escort_services (escort_id, name, available)
           VALUES ($1, $2, 1)
           ON CONFLICT (escort_id, name) DO NOTHING`,
          [escortId, svcName]
        )
      }
    } catch { /* ignore */ }
  }
}

async function upsertLanguages(db, escortId, languages) {
  if (!languages.length) return
  for (const lang of languages) {
    try {
      if (db.isMysql) {
        await db.run(
          'INSERT IGNORE INTO escort_languages (escort_id, language) VALUES (?, ?)',
          [escortId, lang]
        )
      } else {
        await db.run(
          `INSERT INTO escort_languages (escort_id, language)
           VALUES ($1, $2)
           ON CONFLICT (escort_id, language) DO NOTHING`,
          [escortId, lang]
        )
      }
    } catch { /* ignore */ }
  }
}

async function insertGallery(db, escortId, imageUrls) {
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      if (db.isMysql) {
        await db.run(
          'INSERT IGNORE INTO escort_gallery (escort_id, image_url, sort_order) VALUES (?, ?, ?)',
          [escortId, imageUrls[i], i]
        )
      } else {
        await db.run(
          'INSERT INTO escort_gallery (escort_id, image_url, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [escortId, imageUrls[i], i]
        )
      }
    } catch { /* ignore duplicate */ }
  }
}

async function updateEscortRates(db, escortId, { price_incall, price_outcall, price_overnight, incall, outcall }) {
  // Only update if we found real values
  const updates = []
  const vals    = []
  let paramIdx  = 1
  if (price_incall)    { updates.push(`price_incall = $${paramIdx++}`);    vals.push(price_incall) }
  if (price_outcall)   { updates.push(`price_outcall = $${paramIdx++}`);   vals.push(price_outcall) }
  if (price_overnight) { updates.push(`price_overnight = $${paramIdx++}`); vals.push(price_overnight) }
  if (incall)          { updates.push(`incall = $${paramIdx++}`);           vals.push(incall) }
  if (outcall)         { updates.push(`outcall = $${paramIdx++}`);          vals.push(outcall) }
  if (!updates.length) return
  vals.push(escortId)
  await db.run(`UPDATE escorts SET ${updates.join(', ')} WHERE id = $${paramIdx}`, vals)
}

// ── Source definitions ────────────────────────────────────────────────────────
function buildNairobirahaListingUrls() {
  const urls = []
  // Paginated main listing
  for (let p = 1; p <= 30; p++) {
    urls.push(`${NAIROBIRAHA_BASE}/escorts/page/${p}/`)
  }
  // Category pages — cover all major topics to capture unique profiles
  const categories = [
    'african-escorts','call-girls','nairobi-escorts','mombasa-escorts',
    'vip-escorts','massage','indian-escorts','kisumu-escorts','nakuru-escorts',
    'westlands-escorts','karen-escorts','kilimani-escorts','nairobi-cbd-escorts',
    'eldoret-escorts','cbd-escorts','mombasa-cbd-escorts','kenyan-escorts',
    'bbw-escorts','milf-escorts','young-escorts','mature-escorts',
    'apartment-escorts','hotel-escorts','executive-escorts',
  ]
  for (const cat of categories) {
    urls.push(`${NAIROBIRAHA_BASE}/${cat}/`)
    // Some categories have pagination too
    for (let p = 2; p <= 5; p++) {
      urls.push(`${NAIROBIRAHA_BASE}/${cat}/page/${p}/`)
    }
  }
  return urls
}

// ── --update mode: re-fetch existing escorts by source_url ────────────────────
async function runUpdateMode(db) {
  console.log('\n🔄  UPDATE MODE — re-fetching existing escorts for real data\n')

  const { rows } = await db.query(
    `SELECT id, name, source_site, source_url FROM escorts
     WHERE source_url IS NOT NULL AND source_url != ''
     ORDER BY id ASC`
  )

  if (rows.length === 0) {
    console.log('  No escorts with source_url found. Run a full scrape first.')
    return
  }

  console.log(`  Found ${rows.length} escorts with source URLs to update\n`)
  let updated = 0, failed = 0

  for (let i = 0; i < rows.length; i++) {
    const escort = rows[i]
    const num    = `[${i+1}/${rows.length}]`
    process.stdout.write(`${num} ${escort.name?.slice(0,30).padEnd(30)} [${escort.source_site}] ... `)

    const html = await fetchPage(escort.source_url)
    if (!html) { console.log('❌ fetch failed'); failed++; await sleep(1000); continue }

    const profile = parseProfile(html, escort.source_site, escort.source_url)
    if (!profile) { console.log('❌ parse failed'); failed++; await sleep(1000); continue }

    // Update services, languages, rates
    await upsertServices(db, escort.id, profile.services)
    await upsertLanguages(db, escort.id, profile.languages)
    await updateEscortRates(db, escort.id, profile)

    const parts = []
    if (profile.services.length)                       parts.push(`${profile.services.length} svcs`)
    if (profile.languages.length)                      parts.push(`${profile.languages.length} langs`)
    if (profile.price_incall || profile.price_outcall) parts.push(`KES ${profile.price_incall}/${profile.price_outcall}`)
    console.log(`✅ updated [${parts.join(', ') || 'no rates'}]`)
    updated++
    await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅ Update done — updated: ${updated} | failed: ${failed}`)
  console.log(`${'─'.repeat(60)}\n`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Wet3Camp Multi-Source Escort Scraper')
  console.log(`   DB:      ${DATABASE_URL ? (IS_MYSQL ? 'MySQL/MariaDB' : 'PostgreSQL') : 'NONE (dry run)'}`)
  console.log(`   Mode:    ${UPDATE_MODE ? 'UPDATE (re-fetch existing)' : DRY_RUN ? 'DRY RUN' : FAST_MODE ? 'FAST (remote URLs)' : 'FULL (download images)'}`)
  console.log(`   Source:  ${SRC_FILTER || 'ALL (nairobiraha + hookup254)'}`)
  console.log(`   Limit:   ${LIMIT}`)
  console.log()

  let db
  if (!DRY_RUN) {
    db = await createDb()
    await ensureColumns(db)
    console.log('✅ Database connected\n')
  }

  // Handle update mode
  if (UPDATE_MODE) {
    if (!db) { console.error('--update requires a live DB connection (set DATABASE_URL)'); process.exit(1) }
    await runUpdateMode(db)
    await db.end()
    return
  }

  // ── Collect all profile URLs from listing pages ───────────────────────────
  const seenUrls   = new Set()
  const allProfiles = []

  // Source 1 — nairobiraha.com
  if (!SRC_FILTER || SRC_FILTER === 'nairobiraha') {
    console.log('📋 Collecting nairobiraha.com listings...')
    const listingUrls = buildNairobirahaListingUrls()

    for (const listingUrl of listingUrls) {
      if (allProfiles.length >= LIMIT) break
      process.stdout.write(`   ${listingUrl.replace(NAIROBIRAHA_BASE, '').slice(0,50).padEnd(52)} ... `)
      const html = await fetchPage(listingUrl, NAIROBIRAHA_BASE)
      if (!html) { console.log('skip'); await sleep(DELAY_MS); continue }

      const listings = parseNairobirahaListing(html)
      let added = 0
      for (const p of listings) {
        if (seenUrls.has(p.url)) continue
        seenUrls.add(p.url)
        allProfiles.push(p)
        added++
      }
      console.log(`${added} new (total ${allProfiles.length})`)
      if (added === 0 && listings.length === 0) break  // no more pages
      await sleep(DELAY_MS)
    }
    console.log(`  ↳ nairobiraha: ${allProfiles.filter(p=>p.site==='nairobiraha').length} profiles\n`)
  }

  // Source 2 — hookup254.com (AJAX-based)
  if (!SRC_FILTER || SRC_FILTER === 'hookup254') {
    console.log('📋 Collecting hookup254.com listings (AJAX)...')
    const hook254Before = allProfiles.length

    // First fetch the nonce from a listing page
    await fetchHookup254Nonce()
    if (!hookup254Nonce) {
      console.log('  ↳ hookup254: Could not get nonce — skipping (JS-rendered, run from server)')
    } else {
      const locations = ['nairobi','mombasa','kisumu','nakuru','eldoret','westlands','kilimani','karen']
      for (const loc of locations) {
        if (allProfiles.length >= LIMIT) break
        for (let p = 1; p <= 5; p++) {
          if (allProfiles.length >= LIMIT) break
          process.stdout.write(`   hookup254 ${loc} page ${p} ... `)
          const results = await fetchHookup254Escorts(p, loc)
          let added = 0
          for (const profile of results) {
            if (seenUrls.has(profile.url)) continue
            seenUrls.add(profile.url)
            allProfiles.push(profile)
            added++
          }
          console.log(`${added} new`)
          if (results.length === 0) break
          await sleep(DELAY_MS)
        }
      }
      const addedFromHook254 = allProfiles.length - hook254Before
      console.log(`  ↳ hookup254: ${addedFromHook254} profiles\n`)
    }
  }

  const total = Math.min(allProfiles.length, LIMIT)
  console.log(`📦 Total unique profile URLs collected: ${total}\n`)

  if (total === 0) {
    console.log('No profiles found — check network connectivity and source sites')
    if (!DRY_RUN) await db.end()
    return
  }

  // ── Scrape + import each profile ─────────────────────────────────────────
  let imported = 0, skipped = 0, errors = 0
  const seenPhones = new Set()
  const seenNames  = new Set()

  for (let i = 0; i < total; i++) {
    const listing = allProfiles[i]
    const num     = `[${i+1}/${total}]`
    process.stdout.write(`${num} [${listing.site}] ${(listing.rawName || '').slice(0, 28).padEnd(28)} ... `)

    const referer = listing.site === 'hookup254' ? HOOKUP254_BASE : NAIROBIRAHA_BASE
    const html = await fetchPage(listing.url, referer)
    if (!html) { console.log('❌ fetch failed'); errors++; await sleep(DELAY_MS); continue }

    const profile = parseProfile(html, listing.site, listing.url)
    if (!profile) { console.log('❌ parse failed'); errors++; await sleep(DELAY_MS); continue }

    // Location fallback from listing
    if ((!profile.area || profile.area === 'Nairobi') && listing.location) {
      const loc = normalizeCity(listing.location)
      profile.city = loc.city; profile.area = loc.area
    }

    if (!profile.name || profile.name.length < 2) {
      console.log('❌ no name'); errors++; await sleep(DELAY_MS); continue
    }

    if (DRY_RUN) {
      const svcCount = profile.services.length
      const rate     = profile.price_incall ? `KES ${profile.price_incall}` : 'no rate'
      console.log(`✓ ${profile.name} | ${profile.phone || 'no phone'} | ${profile.area} | ${rate} | ${svcCount} svcs`)
      imported++; await sleep(300); continue
    }

    // In-memory dedup
    if (profile.phone && seenPhones.has(profile.phone)) { console.log('⏭  dup(phone)'); skipped++; await sleep(300); continue }
    if (seenNames.has(profile.name.toLowerCase()))       { console.log('⏭  dup(name)');  skipped++; await sleep(300); continue }

    // DB dedup
    const existingId = await escortExists(db, profile.phone, profile.name)
    if (existingId) {
      // Already in DB — update source_url if missing, then update services/languages
      try {
        await db.run(
          `UPDATE escorts SET source_url = $1 WHERE id = $2 AND (source_url IS NULL OR source_url = '')`,
          [listing.url, existingId]
        )
        await upsertServices(db, existingId, profile.services)
        await upsertLanguages(db, existingId, profile.languages)
        await updateEscortRates(db, existingId, profile)
      } catch { /* ignore */ }
      console.log('⏭  in DB (updated)')
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
        const ext   = primaryImg.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
        const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`
        avatarPath  = await downloadImage(primaryImg, fname, referer) || primaryImg
      }
    }

    const galleryPaths = avatarPath ? [avatarPath] : []
    const maxGallery   = FAST_MODE ? 6 : 5
    for (let g = 1; g < Math.min(profile.galleryImgs.length, maxGallery); g++) {
      if (FAST_MODE) {
        galleryPaths.push(profile.galleryImgs[g])
      } else {
        const ext   = profile.galleryImgs[g].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
        const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`
        const gp    = await downloadImage(profile.galleryImgs[g], fname, referer)
        if (gp) galleryPaths.push(gp)
        await sleep(300)
      }
    }

    try {
      const escortId = await insertEscort(db, profile, avatarPath)
      await insertGallery(db, escortId, galleryPaths)
      await upsertServices(db, escortId, profile.services)
      await upsertLanguages(db, escortId, profile.languages)

      const parts = []
      if (profile.services.length)                       parts.push(`${profile.services.length} svcs`)
      if (profile.languages.length)                      parts.push(`${profile.languages.length} langs`)
      if (profile.price_incall || profile.price_outcall) parts.push(`KES ${profile.price_incall}/${profile.price_outcall}`)
      console.log(`✅ id:${escortId} [${parts.join(', ') || 'no rates'}]`)
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
