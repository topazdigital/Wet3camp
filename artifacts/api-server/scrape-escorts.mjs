/**
 * Kenyan Escort Directory Scraper
 * Scrapes profiles from nairobiraha.com (and more Kenya sites) and imports them
 * into the wet3.camp database. Works with both MySQL (live server) and PostgreSQL
 * (Replit dev) — auto-detected from DATABASE_URL.
 *
 * Usage (run from project root or artifacts/api-server/):
 *   node scrape-escorts.mjs                  — full scrape + import
 *   node scrape-escorts.mjs --dry-run        — parse only, no DB writes
 *   node scrape-escorts.mjs --limit=10       — import first 10 profiles
 *   node scrape-escorts.mjs --site=nairobiraha  — scrape one site only
 *
 * On the live server:
 *   cd /home/admin/wet3camp-build/artifacts/api-server
 *   DATABASE_URL="mysql://admin_wet3camp:PASSWORD@localhost/admin_wet3camp" node scrape-escorts.mjs
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

const args    = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT   = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '9999', 10)
const SITE_FILTER = args.find(a => a.startsWith('--site='))?.split('=')[1] || null
const IS_MYSQL = DATABASE_URL?.startsWith('mysql://')

// ── Source pages to scrape ───────────────────────────────────────────────────
// nairobiraha.com — Kenya's largest escort directory
const NAIROBIRAHA_SOURCES = Array.from({ length: 20 }, (_, i) => ({
  site: 'nairobiraha',
  listingUrl: i === 0
    ? 'https://nairobiraha.com/escorts/'
    : `https://nairobiraha.com/escorts/page/${i + 1}/`,
}))
const NAIROBIRAHA_CATEGORY_SOURCES = [
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/african-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/call-girls/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/nairobi-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/mombasa-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/vip-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/massage/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/indian-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/kisumu-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/nakuru-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/eldoret-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/thika-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/westlands-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/kilimani-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/lavington-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/langata-escorts/' },
]

// hotescorts.co.ke — another Kenya directory
const HOTESCORTS_SOURCES = [
  { site: 'hotescorts', listingUrl: 'https://hotescorts.co.ke/escorts/' },
  { site: 'hotescorts', listingUrl: 'https://hotescorts.co.ke/escorts/page/2/' },
  { site: 'hotescorts', listingUrl: 'https://hotescorts.co.ke/escorts/page/3/' },
  { site: 'hotescorts', listingUrl: 'https://hotescorts.co.ke/nairobi-escorts/' },
  { site: 'hotescorts', listingUrl: 'https://hotescorts.co.ke/mombasa-escorts/' },
]

let SOURCES = [
  ...NAIROBIRAHA_SOURCES,
  ...NAIROBIRAHA_CATEGORY_SOURCES,
  ...HOTESCORTS_SOURCES,
]

if (SITE_FILTER) {
  SOURCES = SOURCES.filter(s => s.site === SITE_FILTER)
}

// ── Dual-DB adapter ──────────────────────────────────────────────────────────
class DbAdapter {
  constructor(pool, isMysql) {
    this.pool    = pool
    this.isMysql = isMysql
  }

  #toMysql(sql) {
    return sql.replace(/\$\d+/g, '?').replace(/\s+RETURNING\s+id\s*;?\s*$/i, '')
  }

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
    const res   = await this.pool.query(pgSql, params)
    return res.rows[0].id
  }

  async run(sql, params = []) {
    if (this.isMysql) {
      await this.pool.query(this.#toMysql(sql), params)
    } else {
      await this.pool.query(sql, params)
    }
  }

  async end() { await this.pool.end() }
}

async function createDb() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is not set')
  if (IS_MYSQL) {
    const mysql = (await import('mysql2/promise')).default
    const pool  = mysql.createPool(DATABASE_URL)
    return new DbAdapter(pool, true)
  } else {
    const { default: pg } = await import('pg')
    const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 3 })
    return new DbAdapter(pool, false)
  }
}

// ── Ensure optional columns exist ────────────────────────────────────────────
async function ensureColumns(db) {
  const stmts = db.isMysql
    ? [
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall     TINYINT  NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall    TINYINT  NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS weight     VARCHAR(20) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS email      VARCHAR(255) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS services   TEXT DEFAULT NULL',
      ]
    : [
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall     SMALLINT NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall    SMALLINT NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS weight     VARCHAR(20) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS email      VARCHAR(255) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS services   TEXT DEFAULT NULL',
      ]
  for (const sql of stmts) {
    try { await db.run(sql) } catch { /* already exists — fine */ }
  }

  // Ensure escort_services table exists for structured service data
  const createServices = db.isMysql
    ? `CREATE TABLE IF NOT EXISTS escort_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        escort_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        UNIQUE KEY uq_escort_service (escort_id, name)
      )`
    : `CREATE TABLE IF NOT EXISTS escort_services (
        id SERIAL PRIMARY KEY,
        escort_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        UNIQUE (escort_id, name)
      )`
  try { await db.run(createServices) } catch { /* already exists */ }
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  } catch (err) {
    console.warn(`  [WARN] fetch failed for ${url}: ${err.message}`)
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
    console.warn(`  [WARN] image download failed (${imageUrl}): ${err.message}`)
    return null
  }
}

// ── HTML utility ─────────────────────────────────────────────────────────────
function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&ndash;/g, '–').replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── nairobiraha.com parsers ───────────────────────────────────────────────────
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
  // ── Name ──
  const titleM = html.match(/<h3[^>]*class="profile-title"[^>]*title="([^"]+)"/)
  let rawName  = titleM ? titleM[1].trim() : null
  if (!rawName) return null

  // ── Phone ──
  const phoneM = html.match(/href="tel:(\+?[\d]+)"/)
  let phone    = phoneM ? phoneM[1].trim() : null
  if (phone) {
    const d = phone.replace(/\D/g, '')
    if      (d.startsWith('254') && d.length === 12) phone = `+${d}`
    else if (d.startsWith('0')   && d.length === 10) phone = `+254${d.slice(1)}`
    else if (d.length === 9)                          phone = `+254${d}`
    else                                              phone = `+${d}`
  }

  // Strip phone from name
  let name = rawName.replace(/\s*\+?2540?\d{8,9}\s*$/, '').replace(/\s*0\d{9}\s*$/, '').trim()
  if (!name) return null

  // ── Email ──
  const emailM = html.match(/href="mailto:([^"]+)"/)
  const email  = emailM ? emailM[1].trim().toLowerCase() : null

  // ── Age / height / weight ──
  const ageM   = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>years<\/b>/)
  const htM    = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>cm<\/b>/)
  const wM     = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>kg<\/b>/)
  const age    = ageM ? parseInt(ageM[1], 10) : 0
  const height = htM  ? `${htM[1]}cm` : null
  const weight = wM   ? `${wM[1]}kg`  : null

  // ── Bio ──
  const bioM = html.match(/<div class="aboutme">([\s\S]*?)<\/div>\s*<div class="clear/)
  let bio = null
  if (bioM) {
    const raw = bioM[1].replace(/<h4>[^<]*<\/h4>/gi, '').replace(/<b>[^<]*<\/b>/gi, '')
    const txt = decodeHtml(raw)
    if (txt.length > 10) bio = txt
  }

  // ── Location ──
  let city = '', area = ''
  const cityM = html.match(/escorts-from\/kenya\/([^/"]+)\/?" title="([^"]+)"/)
  if (cityM) {
    area = cityM[2].trim()
    city = area.includes('Nairobi') ? 'Nairobi'
         : area.includes('Mombasa') ? 'Mombasa'
         : area.includes('Kisumu')  ? 'Kisumu'
         : area.includes('Nakuru')  ? 'Nakuru'
         : area.includes('Eldoret') ? 'Eldoret'
         : area
  }

  // ── Section-box fields ──
  const boxes = {}
  const boxRe = /<div class="section-box"><b[^>]*>([^<]+)<\/b><span[^>]*>([^<]*)<\/span><\/div>/g
  let bm
  while ((bm = boxRe.exec(html)) !== null) boxes[bm[1].trim()] = bm[2].trim()

  const availability = boxes['Availability'] || ''
  const ethnicity    = boxes['Ethnicity'] || null
  const bodyType     = boxes['Build'] || boxes['Body Type'] || null
  const incall       = availability.toLowerCase().includes('incall')  ? 1 : 0
  const outcall      = availability.toLowerCase().includes('outcall') ? 1 : 0

  // ── Services ──
  const services = []
  // Try structured list first
  const serviceBlockM = html.match(/<ul[^>]*class="[^"]*service[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi)
  if (serviceBlockM) {
    for (const block of serviceBlockM) {
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
      let lm
      while ((lm = liRe.exec(block)) !== null) {
        const svc = decodeHtml(lm[1]).replace(/[✓✗✔]/g, '').trim()
        if (svc && svc.length > 1 && svc.length < 80 && !services.includes(svc)) services.push(svc)
      }
    }
  }
  // Fallback: plain service items in the SERVICES section
  if (services.length === 0) {
    const svcSectionM = html.match(/SERVICES[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i)
    if (svcSectionM) {
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
      let lm
      while ((lm = liRe.exec(svcSectionM[1])) !== null) {
        const svc = decodeHtml(lm[1]).replace(/[✓✗✔]/g, '').trim()
        if (svc && svc.length > 1 && svc.length < 80 && !services.includes(svc)) services.push(svc)
      }
    }
  }
  // nairobiraha specific service pattern — "✓ Service Name" lines
  const svcCheckRe = /[✓✔]\s*([A-Za-z][A-Za-z\s\-()]{2,60}?)(?=\s*[✓✔<\n]|$)/g
  let scm
  while ((scm = svcCheckRe.exec(html)) !== null) {
    const svc = scm[1].trim()
    if (svc && !services.includes(svc)) services.push(svc)
  }

  // ── Gallery images ──
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

  return { name, phone, email, age, city, area, bio, height, weight, ethnicity, bodyType, incall, outcall, services, galleryImgs }
}

// ── hotescorts.co.ke parsers ─────────────────────────────────────────────────
function parseHotescorts_Listing(html) {
  const profiles = []
  // hotescorts uses WordPress-style links
  const linkRe = /href="(https?:\/\/hotescorts\.co\.ke\/escort\/[^"?#]+)"[^>]*>/gi
  let m
  const seen = new Set()
  while ((m = linkRe.exec(html)) !== null) {
    const url = m[1].replace(/\/$/, '') + '/'
    if (!seen.has(url)) {
      seen.add(url)
      profiles.push({ url, rawName: '', location: null, thumbnailUrl: null, site: 'hotescorts' })
    }
  }
  return profiles
}

function parseHotescorts_Profile(html) {
  // Name
  const nameM = html.match(/<h1[^>]*class="[^"]*entry-title[^"]*"[^>]*>([^<]+)<\/h1>/i)
             || html.match(/<title>([^<|–-]+)(?:\s*[-–|])/i)
  let name = nameM ? decodeHtml(nameM[1]).trim() : null
  if (!name || name.length < 2) return null

  // Phone
  const phoneM = html.match(/(?:href="tel:|Tel[:\s]+)(\+?[\d\s\-()]{7,15})/)
  let phone = phoneM ? phoneM[1].replace(/[^\d+]/g, '') : null
  if (phone) {
    if (phone.startsWith('0') && phone.length === 10) phone = '+254' + phone.slice(1)
    else if (!phone.startsWith('+')) phone = '+254' + phone
  }

  // Age
  const ageM = html.match(/(?:Age|age)[:\s]+(\d{2})\b/)
  const age  = ageM ? parseInt(ageM[1], 10) : 0

  // Location
  const locM = html.match(/(?:Location|City|Area)[:\s]+([A-Za-z\s]+?)(?:<|\n|,)/i)
  let city = '', area = ''
  if (locM) {
    area = locM[1].trim()
    city = area.includes('Nairobi') ? 'Nairobi'
         : area.includes('Mombasa') ? 'Mombasa'
         : area.includes('Kisumu')  ? 'Kisumu'
         : area || 'Nairobi'
  } else {
    city = 'Nairobi'; area = 'Nairobi'
  }

  // Bio
  const bioM = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]{40,800}?)<\/div>/i)
  const bio  = bioM ? decodeHtml(bioM[1]).slice(0, 600) : null

  // Height / weight
  const htM  = html.match(/(?:Height)[:\s]+(\d{2,3})\s*cm/i)
  const wM   = html.match(/(?:Weight)[:\s]+(\d{2,3})\s*kg/i)
  const height = htM ? `${htM[1]}cm` : null
  const weight = wM  ? `${wM[1]}kg`  : null

  // Services
  const services = []
  const svcRe = /[✓✔•]\s*([A-Za-z][A-Za-z\s\-()]{2,60}?)(?=\s*[✓✔•<\n]|$)/g
  let sm
  while ((sm = svcRe.exec(html)) !== null) {
    const s = sm[1].trim()
    if (s && s.length < 80 && !services.includes(s)) services.push(s)
  }

  // Gallery
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
    incall: 1, outcall: 1, services, galleryImgs,
  }
}

// ── Generic dispatcher ────────────────────────────────────────────────────────
function parseListing(html, site) {
  if (site === 'nairobiraha') return parseNairobiraha_Listing(html)
  if (site === 'hotescorts')  return parseHotescorts_Listing(html)
  return []
}

function parseProfile(html, site) {
  if (site === 'nairobiraha') return parseNairobiraha_Profile(html)
  if (site === 'hotescorts')  return parseHotescorts_Profile(html)
  return null
}

// ── DB operations ────────────────────────────────────────────────────────────
async function escortExists(db, phone) {
  if (!phone) return false
  const { rows } = await db.query('SELECT id FROM escorts WHERE phone = $1', [phone])
  return rows.length > 0
}

async function insertEscort(db, profile, avatarPath) {
  const { name, phone, email, age, city, area, bio, height, weight, ethnicity, bodyType, incall, outcall, source } = profile
  return db.insert(
    `INSERT INTO escorts (
       name, phone, whatsapp, age, city, area, bio,
       height, body_type, ethnicity,
       image, tier, is_active, verified, gender,
       incall, outcall, source_site, weight, email
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7,
       $8, $9, $10,
       $11, $12, $13, $14, $15,
       $16, $17, $18, $19, $20
     )`,
    [
      name, phone, phone, age || 0,
      city || 'Nairobi', area || city || 'Nairobi', bio,
      height, bodyType, ethnicity,
      avatarPath, 'standard', 1, 0, 'Female',
      incall, outcall, source || 'nairobiraha', weight || null, email || null,
    ]
  )
}

async function insertGallery(db, escortId, imageUrls) {
  const seen = new Set()
  let order = 0
  for (const url of imageUrls) {
    if (!url || seen.has(url)) continue
    seen.add(url)
    try {
      const sql = db.isMysql
        ? 'INSERT IGNORE INTO escort_gallery (escort_id, image_url, sort_order) VALUES (?, ?, ?)'
        : 'INSERT INTO escort_gallery (escort_id, image_url, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING'
      await db.run(sql, [escortId, url, order++])
    } catch { /* ignore */ }
  }
}

async function insertServices(db, escortId, services) {
  for (const svc of services) {
    if (!svc || svc.length > 100) continue
    try {
      const sql = db.isMysql
        ? 'INSERT IGNORE INTO escort_services (escort_id, name) VALUES (?, ?)'
        : 'INSERT INTO escort_services (escort_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING'
      await db.run(sql, [escortId, svc.trim()])
    } catch { /* ignore */ }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Wet3Camp Escort Scraper')
  console.log(`   DB backend: ${IS_MYSQL ? 'MySQL/MariaDB' : 'PostgreSQL'}`)
  console.log(`   Uploads:    ${UPLOADS_DIR}`)
  console.log(`   Dry run:    ${DRY_RUN}`)
  console.log(`   Limit:      ${LIMIT}`)
  console.log(`   Site:       ${SITE_FILTER || 'all'}`)
  console.log(`   Sources:    ${SOURCES.length} listing pages`)
  console.log()

  let db
  if (!DRY_RUN) {
    db = await createDb()
    await ensureColumns(db)
    console.log('✅ Database connected\n')
  }

  // ── Step 1: collect listing URLs ──────────────────────────────────────────
  const allProfiles = []
  const seenUrls = new Set()

  for (const source of SOURCES) {
    if (allProfiles.length >= LIMIT) break
    console.log(`📋 [${source.site}] Fetching: ${source.listingUrl}`)
    const html = await fetchPage(source.listingUrl)
    if (!html) { await sleep(DELAY_MS); continue }

    const profiles = parseListing(html, source.site)
    console.log(`   Found ${profiles.length} profiles`)
    for (const p of profiles) {
      if (!seenUrls.has(p.url)) {
        seenUrls.add(p.url)
        allProfiles.push(p)
      }
    }
    await sleep(DELAY_MS)
  }

  const total = Math.min(allProfiles.length, LIMIT)
  console.log(`\n📦 Total unique profiles to process: ${total}\n`)

  // ── Step 2: scrape + import each profile ──────────────────────────────────
  let imported = 0, skipped = 0, errors = 0

  for (let i = 0; i < total; i++) {
    const listing = allProfiles[i]
    const num     = `[${i + 1}/${total}]`

    process.stdout.write(`${num} [${listing.site}] ${listing.rawName || listing.url.split('/').slice(-2)[0]}... `)

    const html = await fetchPage(listing.url)
    if (!html) { console.log('❌ fetch failed'); errors++; await sleep(DELAY_MS); continue }

    const profile = parseProfile(html, listing.site)
    if (!profile) { console.log('❌ parse failed'); errors++; await sleep(DELAY_MS); continue }

    // Location fallback from listing page
    if (!profile.area && listing.location) {
      const parts  = listing.location.split(',')
      profile.area = parts[0].trim()
      profile.city = profile.area.includes('Nairobi') ? 'Nairobi'
                   : profile.area.includes('Mombasa') ? 'Mombasa'
                   : profile.area
    }
    profile.source = listing.site

    if (DRY_RUN) {
      const svcs = profile.services?.length ? ` | services:${profile.services.length}` : ''
      console.log(`✓ (dry) ${profile.name} | ${profile.phone || 'no phone'} | ${profile.area} | age:${profile.age} | imgs:${profile.galleryImgs.length}${svcs}`)
      imported++; await sleep(300); continue
    }

    // Skip duplicates by phone number
    if (profile.phone && await escortExists(db, profile.phone)) {
      console.log(`⏭  already exists`)
      skipped++; await sleep(300); continue
    }

    // Download avatar
    let avatarPath = null
    const primaryImg = profile.galleryImgs[0] || listing.thumbnailUrl
    if (primaryImg) {
      const ext  = primaryImg.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
      const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      avatarPath = await downloadImage(primaryImg, fname)
    }

    // Download extra gallery images (up to 5 total)
    const galleryPaths = avatarPath ? [avatarPath] : []
    for (let g = 1; g < Math.min(profile.galleryImgs.length, 5); g++) {
      const ext  = profile.galleryImgs[g].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
      const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      const gp   = await downloadImage(profile.galleryImgs[g], fname)
      if (gp) galleryPaths.push(gp)
      await sleep(300)
    }

    try {
      const escortId = await insertEscort(db, profile, avatarPath)
      await insertGallery(db, escortId, galleryPaths)
      if (profile.services?.length) await insertServices(db, escortId, profile.services)

      const svcs = profile.services?.length ? ` | ${profile.services.length} services` : ''
      const wt   = profile.weight ? ` | ${profile.weight}` : ''
      console.log(`✅ id:${escortId} ${profile.name} | ${profile.phone || 'no phone'} | ${profile.area}${wt}${svcs}`)
      imported++
    } catch (err) {
      console.log(`❌ DB error: ${err.message}`)
      errors++
    }

    await sleep(DELAY_MS)
  }

  if (db) await db.end()

  console.log('\n════════════════════════════════════════')
  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭  Skipped:  ${skipped}`)
  console.log(`❌ Errors:   ${errors}`)
  console.log('════════════════════════════════════════\n')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
