/**
 * Kenyan Escort Directory Scraper
 * Scrapes nairobiraha.com + hotescorts.co.ke and imports into wet3.camp DB.
 * Works with MySQL (live) and PostgreSQL (Replit dev).
 *
 * Usage:
 *   node scrape-escorts.mjs                   — full scrape + import
 *   node scrape-escorts.mjs --dry-run         — parse only, no DB writes
 *   node scrape-escorts.mjs --limit=200       — import up to 200
 *   node scrape-escorts.mjs --site=nairobiraha
 */

import { mkdirSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Config ───────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL
const UPLOADS_DIR  = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads')
const DELAY_MS     = 1400
const USER_AGENT   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const EUR_TO_KES   = 145   // 1 EUR ≈ 145 KES (update as needed)
const USD_TO_KES   = 130   // 1 USD ≈ 130 KES

const args        = process.argv.slice(2)
const DRY_RUN     = args.includes('--dry-run')
const FAST        = args.includes('--fast')      // skip image downloads, shorter delays
const LIMIT       = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '200', 10)
const OFFSET_FROM = parseInt(args.find(a => a.startsWith('--from='))?.split('=')[1] || '0', 10)
const SITE_FILTER = args.find(a => a.startsWith('--site='))?.split('=')[1] || null
const IS_MYSQL    = DATABASE_URL?.startsWith('mysql://')

// ── Source pages ─────────────────────────────────────────────────────────────
const NAIROBIRAHA_PAGES = [
  '',         // page 1
  ...Array.from({ length: 24 }, (_, i) => `page/${i + 2}/`),
]
const NAIROBIRAHA_CATEGORIES = [
  'call-girls', 'nairobi-escorts', 'mombasa-escorts', 'african-escorts',
  'vip-escorts', 'massage', 'indian-escorts', 'kisumu-escorts',
  'nakuru-escorts', 'eldoret-escorts', 'westlands-escorts', 'kilimani-escorts',
  'lavington-escorts', 'langata-escorts', 'thika-escorts',
]

// Pagination sources — marked as paginated so we stop on first 404
const NAIROBIRAHA_PAGINATED = NAIROBIRAHA_PAGES.map(p => ({
  site: 'nairobiraha', paginated: true, listingUrl: `https://nairobiraha.com/escorts/${p}`
}))

let SOURCES = [
  ...NAIROBIRAHA_PAGINATED,
  ...NAIROBIRAHA_CATEGORIES.map(c => ({ site: 'nairobiraha', paginated: false, listingUrl: `https://nairobiraha.com/${c}/` })),
  { site: 'hotescorts', paginated: false, listingUrl: 'https://hotescorts.co.ke/escorts/' },
  { site: 'hotescorts', paginated: false, listingUrl: 'https://hotescorts.co.ke/escorts/page/2/' },
  { site: 'hotescorts', paginated: false, listingUrl: 'https://hotescorts.co.ke/nairobi-escorts/' },
  { site: 'hotescorts', paginated: false, listingUrl: 'https://hotescorts.co.ke/mombasa-escorts/' },
]

if (SITE_FILTER) SOURCES = SOURCES.filter(s => s.site === SITE_FILTER)

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
      const [r] = await this.pool.query(this.#toMysql(sql), params)
      return r.insertId
    }
    const pgSql = /RETURNING\s+id/i.test(sql) ? sql : sql.trimEnd() + ' RETURNING id'
    const res   = await this.pool.query(pgSql, params)
    return res.rows[0].id
  }

  async run(sql, params = []) {
    if (this.isMysql) await this.pool.query(this.#toMysql(sql), params)
    else              await this.pool.query(sql, params)
  }

  async end() { await this.pool.end() }
}

async function createDb() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set')
  if (IS_MYSQL) {
    const mysql = (await import('mysql2/promise')).default
    return new DbAdapter(mysql.createPool(DATABASE_URL), true)
  }
  const { default: pg } = await import('pg')
  return new DbAdapter(new pg.Pool({ connectionString: DATABASE_URL, max: 3 }), false)
}

// ── Schema helpers ────────────────────────────────────────────────────────────
async function ensureColumns(db) {
  const int = db.isMysql ? 'TINYINT' : 'SMALLINT'
  const alterEscorts = [
    `ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall      ${int}    NOT NULL DEFAULT 0`,
    `ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall     ${int}    NOT NULL DEFAULT 0`,
    `ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site VARCHAR(100) DEFAULT NULL`,
    `ALTER TABLE escorts ADD COLUMN IF NOT EXISTS weight      VARCHAR(20)  DEFAULT NULL`,
    `ALTER TABLE escorts ADD COLUMN IF NOT EXISTS email       VARCHAR(255) DEFAULT NULL`,
  ]
  for (const sql of alterEscorts) { try { await db.run(sql) } catch {} }

  // escort_services WITH available column
  await db.run(db.isMysql
    ? `CREATE TABLE IF NOT EXISTS escort_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        escort_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        available TINYINT NOT NULL DEFAULT 1,
        UNIQUE KEY uq_es (escort_id, name)
      )`
    : `CREATE TABLE IF NOT EXISTS escort_services (
        id SERIAL PRIMARY KEY,
        escort_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        available SMALLINT NOT NULL DEFAULT 1,
        UNIQUE (escort_id, name)
      )`
  ).catch(() => {})

  // Add available column if table existed without it
  try { await db.run(`ALTER TABLE escort_services ADD COLUMN IF NOT EXISTS available ${int} NOT NULL DEFAULT 1`) } catch {}

  // escort_languages
  await db.run(db.isMysql
    ? `CREATE TABLE IF NOT EXISTS escort_languages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        escort_id INT NOT NULL,
        language VARCHAR(80) NOT NULL,
        proficiency VARCHAR(40) DEFAULT NULL,
        UNIQUE KEY uq_el (escort_id, language)
      )`
    : `CREATE TABLE IF NOT EXISTS escort_languages (
        id SERIAL PRIMARY KEY,
        escort_id INTEGER NOT NULL,
        language VARCHAR(80) NOT NULL,
        proficiency VARCHAR(40) DEFAULT NULL,
        UNIQUE (escort_id, language)
      )`
  ).catch(() => {})
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  } catch (err) {
    console.warn(`  [WARN] fetch ${url}: ${err.message}`)
    return null
  }
}

async function downloadImage(imageUrl, localFilename) {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
  const destPath = path.join(UPLOADS_DIR, localFilename)
  if (existsSync(destPath)) return `/api/uploads/${localFilename}`
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': USER_AGENT, Referer: 'https://nairobiraha.com/' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await writeFile(destPath, Buffer.from(await res.arrayBuffer()))
    return `/api/uploads/${localFilename}`
  } catch (err) {
    console.warn(`  [WARN] img ${imageUrl}: ${err.message}`)
    return null
  }
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&ndash;/g, '–').replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── Rate parsing helpers ──────────────────────────────────────────────────────
function parseRatesFromHtml(html) {
  let incall = 0, outcall = 0

  // nairobiraha RATES table: looks like rows with currency amounts
  // Try to find a table/section that has Incall + Outcall columns
  // Pattern: "1 hour" row with two currency values
  const ratesBlockM = html.match(/RATES?[\s\S]{0,200}?(?:Incall|In-call)[\s\S]{0,500}?(?=REVIEWS|SERVICES|LANGUAGES|$)/i)
  const ratesHtml = ratesBlockM ? ratesBlockM[0] : html

  // Extract all currency amounts with type from the rates section
  // Format: "30 EUR" or "KES 5,000" or "5000 KSH"
  const eurAmounts = [...ratesHtml.matchAll(/(\d{1,6})\s*EUR/gi)].map(m => parseInt(m[1]))
  const kesAmounts = [...ratesHtml.matchAll(/(?:KES|KSH)\s*([\d,]+)/gi)].map(m => parseInt(m[1].replace(/,/g,'')))
  const usdAmounts = [...ratesHtml.matchAll(/\$\s*(\d{1,5})|USD\s*(\d{1,5})/gi)].map(m => parseInt(m[1]||m[2]))

  // Determine incall/outcall from positional context
  // nairobiraha layout: first amount = incall, second = outcall for "1 hour" row
  const allEur = eurAmounts.filter(n => n > 0 && n < 10000)
  const allKes = kesAmounts.filter(n => n > 0 && n < 500000)
  const allUsd = usdAmounts.filter(n => n > 0 && n < 10000)

  if (allEur.length >= 2) {
    incall  = Math.round(allEur[0] * EUR_TO_KES)
    outcall = Math.round(allEur[1] * EUR_TO_KES)
  } else if (allEur.length === 1) {
    incall = Math.round(allEur[0] * EUR_TO_KES)
  } else if (allKes.length >= 2) {
    incall  = allKes[0]; outcall = allKes[1]
  } else if (allKes.length === 1) {
    incall  = allKes[0]
  } else if (allUsd.length >= 2) {
    incall  = Math.round(allUsd[0] * USD_TO_KES)
    outcall = Math.round(allUsd[1] * USD_TO_KES)
  }

  // Try explicit incall/outcall labels near amounts (more precise)
  const incallM  = html.match(/(?:incall|in-call)[^<]*?[£€$]?\s*(\d+)\s*(EUR|KES|KSH|USD)?/i)
               || html.match(/[£€$]?\s*(\d+)\s*(EUR|KES|KSH|USD)?[^<]*?(?:incall|in-call)/i)
  const outcallM = html.match(/(?:outcall|out-call)[^<]*?[£€$]?\s*(\d+)\s*(EUR|KES|KSH|USD)?/i)
               || html.match(/[£€$]?\s*(\d+)\s*(EUR|KES|KSH|USD)?[^<]*?(?:outcall|out-call)/i)

  if (incallM) {
    const amt  = parseInt(incallM[1])
    const curr = (incallM[2] || 'EUR').toUpperCase()
    incall = curr === 'KES' || curr === 'KSH' ? amt : curr === 'USD' ? Math.round(amt * USD_TO_KES) : Math.round(amt * EUR_TO_KES)
  }
  if (outcallM) {
    const amt  = parseInt(outcallM[1])
    const curr = (outcallM[2] || 'EUR').toUpperCase()
    outcall = curr === 'KES' || curr === 'KSH' ? amt : curr === 'USD' ? Math.round(amt * USD_TO_KES) : Math.round(amt * EUR_TO_KES)
  }

  return { incall, outcall }
}

// ── Language parsing ──────────────────────────────────────────────────────────
function parseLanguages(html) {
  const langs = []
  // Look for LANGUAGES SPOKEN section
  const langSectionM = html.match(/LANGUAGES?\s+SPOKEN[\s\S]{0,800}?(?=CONTACT|SERVICES|RATES|REVIEWS|$)/i)
  const langHtml = langSectionM ? langSectionM[0] : html.slice(0, 3000)

  // nairobiraha: <td>English:</td><td>Fluent</td> or <b>ENGLISH:</b> <span>Fluent</span>
  const tableRe = /<(?:td|th|b|strong|span|div)[^>]*>\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*:?\s*<\/(?:td|th|b|strong|span|div)>\s*<(?:td|th|b|strong|span|div)[^>]*>\s*([A-Za-z]+)\s*<\/(?:td|th|b|strong|span|div)>/g
  let m
  while ((m = tableRe.exec(langHtml)) !== null) {
    const lang = m[1].trim()
    const prof = m[2].trim()
    const validLangs = ['english','swahili','french','arabic','spanish','portuguese','hindi','chinese','german','italian','russian','kikuyu','luo','kamba','kalenjin']
    if (validLangs.includes(lang.toLowerCase()) && lang.length < 20 && !langs.find(l => l.name.toLowerCase() === lang.toLowerCase())) {
      langs.push({ name: lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase(), proficiency: prof })
    }
  }

  // Fallback: named language tokens like "English: Fluent" in plain text
  if (langs.length === 0) {
    const langRe = /\b(English|Swahili|French|Arabic|Spanish|Kikuyu|Luo|Kamba|Hindi|Portuguese)\b[:\s]+([A-Za-z]+)/gi
    while ((m = langRe.exec(langHtml)) !== null) {
      const lang = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()
      const prof = m[2].trim()
      if (!langs.find(l => l.name.toLowerCase() === lang.toLowerCase())) {
        langs.push({ name: lang, proficiency: prof })
      }
    }
  }

  // Default: English if nothing found but we're on a Kenyan site
  if (langs.length === 0) langs.push({ name: 'English', proficiency: 'Fluent' })

  return langs
}

// ── Service parsing ───────────────────────────────────────────────────────────
function parseServices(html) {
  const services = []

  // nairobiraha service list pattern: ✓ Service Name (multiple columns)
  // Also: <li class="yes">GFE</li> or checkmark tick icons
  const checkRe = /[✓✔✅☑]\s*([A-Za-z][A-Za-z\s\-()\/]{1,60}?)(?=[✓✔✅☑<\n]|$)/g
  let m
  while ((m = checkRe.exec(html)) !== null) {
    const svc = m[1].trim().replace(/\s+/g, ' ')
    if (svc.length >= 2 && svc.length <= 80 && !services.includes(svc)) services.push(svc)
  }

  // Structured lists with class indicators
  const yesClassRe = /<(?:li|div|span)[^>]*class="[^"]*(?:yes|available|check|service-yes)[^"]*"[^>]*>\s*([^<]{2,60}?)\s*<\/(?:li|div|span)>/gi
  while ((m = yesClassRe.exec(html)) !== null) {
    const svc = decodeHtml(m[1]).trim()
    if (svc.length >= 2 && svc.length <= 80 && !services.includes(svc)) services.push(svc)
  }

  // nairobiraha-specific: service items in a services section
  const svcSectionM = html.match(/(?:SERVICES?|OFFERED SERVICES?)[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i)
  if (svcSectionM) {
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
    while ((m = liRe.exec(svcSectionM[1])) !== null) {
      const svc = decodeHtml(m[1]).replace(/[✓✔✅☑]/g, '').trim()
      if (svc.length >= 2 && svc.length <= 80 && !services.includes(svc)) services.push(svc)
    }
  }

  // Common known services to match with keyword scan (catches abbreviated names)
  const KNOWN_SERVICES = [
    'GFE', 'Girlfriend Experience', 'COF', 'COB', 'Swallow', 'DFK', 'Deep French Kissing',
    'Anal sex', 'A-Level', 'Anal Rimming', 'Rimming', '69', 'Striptease', 'Lapdance',
    'Erotic massage', 'Massage', 'Golden shower', 'Couples', 'Threesome', 'Foot fetish',
    'Sex toys', 'Extraball', 'Domination', 'LT', 'Long Time', 'Overnight', 'BDSM',
    'Role play', 'Roleplay', 'Kissing', 'OWO', 'CIM', 'Squirting', 'Lesbian show',
    'Body to body massage', 'Nuru massage', 'Tantric massage', 'Prostate massage',
    'Dinner date', 'Travel companion', 'PSE', 'Porn Star Experience',
  ]
  for (const svc of KNOWN_SERVICES) {
    const re = new RegExp(`\\b${svc.replace(/[()]/g, '\\$&')}\\b`, 'i')
    if (re.test(html) && !services.some(s => s.toLowerCase() === svc.toLowerCase())) {
      services.push(svc)
    }
  }

  return [...new Set(services)].slice(0, 30)
}

// ── nairobiraha parsers ───────────────────────────────────────────────────────
function parseNairobiraha_Listing(html) {
  const profiles = []
  const blockRe  = /<a\s+href="(https:\/\/nairobiraha\.com\/escort\/[^"]+)"\s+class="girlimg"[^>]*>([\s\S]*?)<\/a>/g
  let m
  while ((m = blockRe.exec(html)) !== null) {
    const url   = m[1]
    const block = m[2]
    const nameM = block.match(/<span[^>]*class="modelname"[^>]*>([\s\S]*?)<\/span>/i)
    const locM  = block.match(/<span[^>]*class="modelinfo-location"[^>]*>([\s\S]*?)<\/span>/i)
    const imgM  = block.match(/data-responsive-img-url="([^"]+)"/)
    const rawName      = nameM ? nameM[1].replace(/<[^>]+>/g, '').trim() : null
    const location     = locM  ? locM[1].replace(/<[^>]+>/g, '').trim() : null
    const thumbnailUrl = imgM  ? imgM[1].trim() : null
    if (!rawName || profiles.find(p => p.url === url)) continue
    profiles.push({ url, rawName, location, thumbnailUrl, site: 'nairobiraha' })
  }
  return profiles
}

function parseNairobiraha_Profile(html) {
  // Name
  const titleM = html.match(/<h3[^>]*class="profile-title"[^>]*title="([^"]+)"/)
  let rawName  = titleM ? titleM[1].trim() : null
  if (!rawName) {
    const h1M = html.match(/<h1[^>]*class="[^"]*profile[^"]*"[^>]*>([^<]+)<\/h1>/i)
    rawName = h1M ? decodeHtml(h1M[1]) : null
  }
  if (!rawName) return null

  // Phone
  const phoneM = html.match(/href="tel:(\+?[\d]+)"/)
  let phone    = phoneM ? phoneM[1].trim() : null
  if (phone) {
    const d = phone.replace(/\D/g, '')
    if      (d.startsWith('254') && d.length === 12) phone = `+${d}`
    else if (d.startsWith('0')   && d.length === 10) phone = `+254${d.slice(1)}`
    else if (d.length === 9)                          phone = `+254${d}`
    else                                              phone = `+${d}`
  }

  // Strip phone digits from name
  let name = rawName.replace(/\s*\+?2540?\d{8,9}\s*$/, '').replace(/\s*0\d{9}\s*$/, '').trim()
  if (!name) return null

  // Email
  const emailM = html.match(/href="mailto:([^"]+)"/)
  const email  = emailM ? emailM[1].trim().toLowerCase() : null

  // Age / height / weight
  const ageM  = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>years<\/b>/)
             || html.match(/Age[^:]*:\s*(\d{2})\b/i)
  const htM   = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>cm<\/b>/)
             || html.match(/Height[^:]*:\s*(\d{3})\s*cm/i)
  const wM    = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>kg<\/b>/)
             || html.match(/Weight[^:]*:\s*(\d{2,3})\s*kg/i)
  const age    = ageM ? parseInt(ageM[1], 10) : 0
  const height = htM  ? `${htM[1]}cm` : null
  const weight = wM   ? `${wM[1]}kg`  : null

  // Bio — about me section
  const bioM = html.match(/<div class="aboutme">([\s\S]*?)<\/div>\s*<div class="clear/)
            || html.match(/<div[^>]*class="[^"]*about[^"]*"[^>]*>([\s\S]{40,600}?)<\/div>/i)
  let bio = null
  if (bioM) {
    const raw = bioM[1].replace(/<h4>[^<]*<\/h4>/gi, '').replace(/<b>[^<]*<\/b>/gi, '')
    const txt = decodeHtml(raw)
    if (txt.length > 10) bio = txt.slice(0, 600)
  }

  // Location — from breadcrumb or section-box
  let city = '', area = ''
  const cityM = html.match(/escorts-from\/kenya\/([^/"]+)\/[^"]*"\s+title="([^"]+)"/)
             || html.match(/class="location"[^>]*>([^<]+)</)
  if (cityM) {
    area = cityM[2]?.trim() || cityM[1].trim()
    city = area.toLowerCase().includes('nairobi') ? 'Nairobi'
         : area.toLowerCase().includes('mombasa') ? 'Mombasa'
         : area.toLowerCase().includes('kisumu')  ? 'Kisumu'
         : area.toLowerCase().includes('nakuru')  ? 'Nakuru'
         : area.toLowerCase().includes('eldoret') ? 'Eldoret'
         : area
  }

  // Section boxes (Availability, Ethnicity, Build, etc.)
  const boxes = {}
  const boxRe = /<div class="section-box"><b[^>]*>([^<]+)<\/b><span[^>]*>([^<]*)<\/span><\/div>/g
  let bm
  while ((bm = boxRe.exec(html)) !== null) boxes[bm[1].trim()] = bm[2].trim()
  // Also try key:value in table rows
  const rowRe = /<(?:td|dt|th)[^>]*>\s*([A-Z][A-Z\s]+):?\s*<\/(?:td|dt|th)>\s*<(?:td|dd|td)[^>]*>\s*([^<]+?)\s*<\/(?:td|dd|td)>/gi
  while ((bm = rowRe.exec(html)) !== null) {
    const key = bm[1].trim().toUpperCase()
    if (!boxes[key]) boxes[key] = bm[2].trim()
  }

  const availability = boxes['AVAILABILITY'] || boxes['Availability'] || ''
  const ethnicity    = boxes['ETHNICITY'] || boxes['Ethnicity'] || null
  const bodyType     = boxes['BUILD'] || boxes['Build'] || boxes['BODY TYPE'] || boxes['Body Type'] || null
  const orientation  = boxes['SEXUAL ORIENTATION'] || null
  const hobbies      = boxes['HOBBIES'] || null
  const incall       = availability.toLowerCase().includes('incall')  ? 1 : 0
  const outcall      = availability.toLowerCase().includes('outcall') ? 1 : 0

  // Rates
  const { incall: priceIncall, outcall: priceOutcall } = parseRatesFromHtml(html)

  // Languages
  const languages = parseLanguages(html)

  // Services
  const services = parseServices(html)

  // Gallery images
  const galleryImgs = []
  const fullRe = /href="(https:\/\/nairobiraha\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))" data-fancybox="profile-photo"/gi
  let fm
  while ((fm = fullRe.exec(html)) !== null) {
    const u = fm[1].trim()
    if (!galleryImgs.includes(u)) galleryImgs.push(u)
  }
  if (galleryImgs.length === 0) {
    const thumbRe = /data-fancybox="profile-photo"[^>]*>\s*<img[^>]+(?:src|data-responsive-img-url)="([^"]+)"/gi
    while ((fm = thumbRe.exec(html)) !== null) {
      const u = fm[1].trim().split('?')[0]
      if (!galleryImgs.includes(u)) galleryImgs.push(u)
    }
  }

  return {
    name, phone, email, age, city, area, bio,
    height, weight, ethnicity, bodyType,
    incall, outcall, priceIncall, priceOutcall,
    languages, services, galleryImgs,
  }
}

// ── hotescorts.co.ke parsers ──────────────────────────────────────────────────
function parseHotescorts_Listing(html) {
  const profiles = []
  const linkRe = /href="(https?:\/\/hotescorts\.co\.ke\/escort\/[^"?#]+)"[^>]*>/gi
  let m; const seen = new Set()
  while ((m = linkRe.exec(html)) !== null) {
    const url = m[1].replace(/\/$/, '') + '/'
    if (!seen.has(url)) { seen.add(url); profiles.push({ url, rawName: '', location: null, thumbnailUrl: null, site: 'hotescorts' }) }
  }
  return profiles
}

function parseHotescorts_Profile(html) {
  const nameM = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)<\/h1>/i)
             || html.match(/<title>([^<|–-]+?)(?:\s*[-–|])/i)
  let name = nameM ? decodeHtml(nameM[1]).trim() : null
  if (!name || name.length < 2) return null

  const phoneM = html.match(/(?:href="tel:|Tel[:\s]+)(\+?[\d\s\-()]{7,15})/)
  let phone = phoneM ? phoneM[1].replace(/[^\d+]/g, '') : null
  if (phone) {
    if (phone.startsWith('0') && phone.length === 10) phone = '+254' + phone.slice(1)
    else if (!phone.startsWith('+')) phone = '+254' + phone
  }

  const ageM = html.match(/(?:Age|age)[:\s]+(\d{2})\b/)
  const htM  = html.match(/(?:Height)[:\s]+(\d{2,3})\s*cm/i)
  const wM   = html.match(/(?:Weight)[:\s]+(\d{2,3})\s*kg/i)
  const age    = ageM ? parseInt(ageM[1], 10) : 0
  const height = htM  ? `${htM[1]}cm` : null
  const weight = wM   ? `${wM[1]}kg`  : null

  const locM = html.match(/(?:Location|City|Area)[:\s]+([A-Za-z\s]+?)(?:<|\n|,)/i)
  let city = '', area = ''
  if (locM) {
    area = locM[1].trim()
    city = area.includes('Nairobi') ? 'Nairobi' : area.includes('Mombasa') ? 'Mombasa' : area.includes('Kisumu') ? 'Kisumu' : area || 'Nairobi'
  } else { city = 'Nairobi'; area = 'Nairobi' }

  const bioM = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]{40,800}?)<\/div>/i)
  const bio  = bioM ? decodeHtml(bioM[1]).slice(0, 600) : null

  const { incall: priceIncall, outcall: priceOutcall } = parseRatesFromHtml(html)
  const languages = parseLanguages(html)
  const services  = parseServices(html)

  const galleryImgs = []
  const imgRe = /<img[^>]+src="(https?:\/\/hotescorts\.co\.ke\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"[^>]*>/gi
  let im
  while ((im = imgRe.exec(html)) !== null) {
    const u = im[1].split('?')[0]
    if (!galleryImgs.includes(u)) galleryImgs.push(u)
  }

  return {
    name, phone, email: null, age, city, area, bio,
    height, weight, ethnicity: null, bodyType: null,
    incall: 1, outcall: 1, priceIncall, priceOutcall,
    languages, services, galleryImgs,
  }
}

function parseListing(html, site) {
  return site === 'nairobiraha' ? parseNairobiraha_Listing(html) : parseHotescorts_Listing(html)
}
function parseProfile(html, site) {
  return site === 'nairobiraha' ? parseNairobiraha_Profile(html) : parseHotescorts_Profile(html)
}

// ── DB operations ─────────────────────────────────────────────────────────────
async function escortExists(db, phone) {
  if (!phone) return false
  const { rows } = await db.query('SELECT id FROM escorts WHERE phone = $1', [phone])
  return rows.length > 0
}

async function insertEscort(db, profile, avatarPath) {
  const { name, phone, email, age, city, area, bio, height, weight, ethnicity, bodyType, incall, outcall, priceIncall, priceOutcall, source } = profile
  return db.insert(
    `INSERT INTO escorts (
       name, phone, whatsapp, age, city, area, bio,
       height, body_type, ethnicity,
       image, tier, is_active, verified, gender,
       incall, outcall, source_site, weight, email,
       price_incall, price_outcall
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,
       $8,$9,$10,
       $11,$12,$13,$14,$15,
       $16,$17,$18,$19,$20,
       $21,$22
     )`,
    [
      name, phone, phone, age || 0,
      city || 'Nairobi', area || city || 'Nairobi', bio,
      height, bodyType, ethnicity,
      avatarPath, 'standard', 1, 0, 'Female',
      incall, outcall, source || 'nairobiraha', weight || null, email || null,
      priceIncall || null, priceOutcall || null,
    ]
  )
}

async function insertGallery(db, escortId, imageUrls) {
  const seen = new Set(); let order = 0
  for (const url of imageUrls) {
    if (!url || seen.has(url)) continue
    seen.add(url)
    try {
      const sql = db.isMysql
        ? 'INSERT IGNORE INTO escort_gallery (escort_id, image_url, sort_order) VALUES (?, ?, ?)'
        : 'INSERT INTO escort_gallery (escort_id, image_url, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING'
      await db.run(sql, [escortId, url, order++])
    } catch {}
  }
}

async function insertServices(db, escortId, services) {
  for (const svc of services) {
    if (!svc || svc.length > 100) continue
    try {
      const sql = db.isMysql
        ? 'INSERT IGNORE INTO escort_services (escort_id, name, available) VALUES (?, ?, 1)'
        : 'INSERT INTO escort_services (escort_id, name, available) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING'
      await db.run(sql, [escortId, svc.trim()])
    } catch {}
  }
}

async function insertLanguages(db, escortId, languages) {
  for (const lang of languages) {
    if (!lang?.name) continue
    try {
      const sql = db.isMysql
        ? 'INSERT IGNORE INTO escort_languages (escort_id, language, proficiency) VALUES (?, ?, ?)'
        : 'INSERT INTO escort_languages (escort_id, language, proficiency) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING'
      await db.run(sql, [escortId, lang.name, lang.proficiency || null])
    } catch {}
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Wet3Camp Escort Scraper')
  console.log(`   DB:      ${IS_MYSQL ? 'MySQL/MariaDB' : 'PostgreSQL (dev)'}`)
  console.log(`   Dry run: ${DRY_RUN}`)
  console.log(`   Limit:   ${LIMIT}`)
  console.log(`   Site:    ${SITE_FILTER || 'all'}`)
  console.log(`   Sources: ${SOURCES.length} listing pages\n`)

  let db
  if (!DRY_RUN) {
    db = await createDb()
    await ensureColumns(db)
    console.log('✅ Database ready\n')
  }

  // Step 1: Collect profile URLs from listing pages
  const allProfiles = []
  const seenUrls = new Set()
  let paginationDead = false   // stop paginated sources after first 404

  for (const source of SOURCES) {
    if (allProfiles.length >= LIMIT) break
    if (source.paginated && paginationDead) continue
    console.log(`📋 [${source.site}] ${source.listingUrl}`)
    const html = await fetchPage(source.listingUrl)
    if (!html) {
      if (source.paginated) paginationDead = true
      await sleep(500); continue
    }
    const profiles = parseListing(html, source.site)
    console.log(`   Found ${profiles.length} profiles`)
    if (profiles.length === 0 && source.paginated) { paginationDead = true; continue }
    for (const p of profiles) {
      if (!seenUrls.has(p.url)) { seenUrls.add(p.url); allProfiles.push(p) }
    }
    if (allProfiles.length < LIMIT) await sleep(DELAY_MS)
  }

  const total = Math.min(allProfiles.length, LIMIT)
  console.log(`\n📦 Unique profiles to process: ${total}\n`)

  // Step 2: Scrape + import each profile
  let imported = 0, skipped = 0, errors = 0

  for (let i = 0; i < total; i++) {
    const listing = allProfiles[i]
    const num     = `[${i + 1}/${total}]`
    const label   = listing.rawName || listing.url.split('/').slice(-2)[0]

    process.stdout.write(`${num} [${listing.site}] ${label}... `)

    const html = await fetchPage(listing.url)
    if (!html) { console.log('❌ fetch failed'); errors++; await sleep(DELAY_MS); continue }

    const profile = parseProfile(html, listing.site)
    if (!profile) { console.log('❌ parse failed'); errors++; await sleep(DELAY_MS); continue }

    if (!profile.area && listing.location) {
      const parts  = listing.location.split(',')
      profile.area = parts[0].trim()
      profile.city = profile.area.toLowerCase().includes('nairobi') ? 'Nairobi'
                   : profile.area.toLowerCase().includes('mombasa') ? 'Mombasa'
                   : profile.area
    }
    profile.source = listing.site

    if (DRY_RUN) {
      const extra = [
        profile.phone        ? `📞${profile.phone}` : '—',
        profile.priceIncall  ? `KES ${profile.priceIncall} incall` : '',
        profile.priceOutcall ? `KES ${profile.priceOutcall} outcall` : '',
        profile.services?.length ? `${profile.services.length} svc` : '',
        profile.languages?.map(l => l.name).join('/') || '',
      ].filter(Boolean).join(' | ')
      console.log(`✓ ${profile.name} | ${profile.area} | ${extra}`)
      imported++; await sleep(300); continue
    }

    if (profile.phone && await escortExists(db, profile.phone)) {
      console.log('⏭  exists')
      skipped++; await sleep(300); continue
    }

    // Download avatar + up to 4 more gallery images (skipped in --fast mode)
    let avatarPath = null
    const galleryPaths = []
    if (!FAST) {
      const primaryImg = profile.galleryImgs[0] || listing.thumbnailUrl
      if (primaryImg) {
        const ext  = primaryImg.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
        const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`
        avatarPath = await downloadImage(primaryImg, fname)
      }
      if (avatarPath) galleryPaths.push(avatarPath)
      for (let g = 1; g < Math.min(profile.galleryImgs.length, 5); g++) {
        const ext  = profile.galleryImgs[g].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
        const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`
        const gp   = await downloadImage(profile.galleryImgs[g], fname)
        if (gp) galleryPaths.push(gp)
        await sleep(250)
      }
    } else {
      // In fast mode: store original URLs directly as external image refs
      avatarPath = listing.thumbnailUrl || profile.galleryImgs[0] || null
    }

    try {
      const escortId = await insertEscort(db, profile, avatarPath)
      await insertGallery(db, escortId, galleryPaths)
      if (profile.services?.length)  await insertServices(db, escortId, profile.services)
      if (profile.languages?.length) await insertLanguages(db, escortId, profile.languages)

      const rateStr  = profile.priceIncall ? ` KES ${profile.priceIncall}/${profile.priceOutcall || '?'}` : ''
      const svcStr   = profile.services?.length ? ` ${profile.services.length}svc` : ''
      const langStr  = profile.languages?.map(l => l.name).join('/') || ''
      console.log(`✅ id:${escortId} ${profile.name} | ${profile.phone || '—'} | ${profile.area}${rateStr}${svcStr} [${langStr}]`)
      imported++
    } catch (err) {
      console.log(`❌ DB: ${err.message}`)
      errors++
    }

    await sleep(FAST ? 600 : DELAY_MS)
  }

  if (db) await db.end()

  console.log('\n════════════════════════════════════════')
  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭  Skipped:  ${skipped}`)
  console.log(`❌ Errors:   ${errors}`)
  console.log('════════════════════════════════════════\n')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
