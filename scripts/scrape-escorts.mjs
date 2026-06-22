/**
 * Kenyan Escort Directory Scraper
 * Scrapes profiles from nairobiraha.com and imports them into the wet3.camp database.
 * Works with both MySQL (live server) and PostgreSQL (Replit dev) — auto-detected
 * from DATABASE_URL.  Escorts can later claim their profiles via the registration flow.
 *
 * Usage (run from project root or artifacts/api-server/):
 *   node scrape-escorts.mjs                  — full scrape + import
 *   node scrape-escorts.mjs --dry-run        — parse only, no DB writes
 *   node scrape-escorts.mjs --limit=10       — import first 10 profiles
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
const DELAY_MS     = 1200
const USER_AGENT   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const args    = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT   = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '9999', 10)
const IS_MYSQL = DATABASE_URL?.startsWith('mysql://')

// Listing pages to scrape — add more as needed
const SOURCES = [
  // Main escort listings — paginate deep
  { listingUrl: 'https://nairobiraha.com/escorts/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/2/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/3/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/4/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/5/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/6/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/7/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/8/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/9/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/10/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/11/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/12/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/13/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/14/' },
  { listingUrl: 'https://nairobiraha.com/escorts/page/15/' },
  // Category-specific listings
  { listingUrl: 'https://nairobiraha.com/african-escorts/' },
  { listingUrl: 'https://nairobiraha.com/call-girls/' },
  { listingUrl: 'https://nairobiraha.com/nairobi-escorts/' },
  { listingUrl: 'https://nairobiraha.com/mombasa-escorts/' },
  { listingUrl: 'https://nairobiraha.com/vip-escorts/' },
  { listingUrl: 'https://nairobiraha.com/massage/' },
  { listingUrl: 'https://nairobiraha.com/indian-escorts/' },
  { listingUrl: 'https://nairobiraha.com/kisumu-escorts/' },
  { listingUrl: 'https://nairobiraha.com/nakuru-escorts/' },
  { listingUrl: 'https://nairobiraha.com/westlands-escorts/' },
  { listingUrl: 'https://nairobiraha.com/karen-escorts/' },
  { listingUrl: 'https://nairobiraha.com/kilimani-escorts/' },
  { listingUrl: 'https://nairobiraha.com/nairobi-cbd-escorts/' },
]

// ── Dual-DB adapter ──────────────────────────────────────────────────────────
// Wraps both mysql2 (? placeholders, result.insertId) and pg ($N placeholders,
// RETURNING id) behind a single uniform interface so the rest of the script
// doesn't care which backend is in use.

class DbAdapter {
  constructor(pool, isMysql) {
    this.pool    = pool
    this.isMysql = isMysql
  }

  // Convert $1/$2... placeholders to ? for MySQL
  #toMysql(sql) {
    return sql.replace(/\$\d+/g, '?').replace(/\s+RETURNING\s+id\s*;?\s*$/i, '')
  }

  // Execute a query and return a normalised { rows } object
  async query(sql, params = []) {
    if (this.isMysql) {
      const [rows] = await this.pool.query(this.#toMysql(sql), params)
      return { rows: Array.isArray(rows) ? rows : [rows] }
    }
    return this.pool.query(sql, params)
  }

  // INSERT — returns the new row's id
  async insert(sql, params = []) {
    if (this.isMysql) {
      const [result] = await this.pool.query(this.#toMysql(sql), params)
      return result.insertId
    }
    // PostgreSQL — append RETURNING id if not already present
    const pgSql = /RETURNING\s+id/i.test(sql) ? sql : sql.trimEnd() + ' RETURNING id'
    const res   = await this.pool.query(pgSql, params)
    return res.rows[0].id
  }

  // Fire-and-forget (DDL, gallery inserts, etc.)
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
    // mysql2 is a production dep — always available on the live server
    const mysql = (await import('mysql2/promise')).default
    const pool  = mysql.createPool(DATABASE_URL)
    return new DbAdapter(pool, true)
  } else {
    // pg is a dep of api-server — available on Replit dev
    const { default: pg } = await import('pg')
    const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 3 })
    return new DbAdapter(pool, false)
  }
}

// ── Ensure optional columns exist ────────────────────────────────────────────
async function ensureColumns(db) {
  const stmts = db.isMysql
    ? [
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall         TINYINT  NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall        TINYINT  NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site    VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_incall   INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_outcall  INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_overnight INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS hobbies        VARCHAR(255) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS sexual_orientation VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS looks          VARCHAR(100) DEFAULT NULL',
      ]
    : [
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall          SMALLINT NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall         SMALLINT NOT NULL DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site     VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_incall    INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_outcall   INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS price_overnight  INT DEFAULT 0',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS hobbies         VARCHAR(255) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS sexual_orientation VARCHAR(100) DEFAULT NULL',
        'ALTER TABLE escorts ADD COLUMN IF NOT EXISTS looks           VARCHAR(100) DEFAULT NULL',
      ]
  for (const sql of stmts) {
    try { await db.run(sql) } catch { /* already exists — fine */ }
  }
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
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

// ── HTML parsers ─────────────────────────────────────────────────────────────
function parseListingPage(html) {
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
    profiles.push({ url, rawName, location, thumbnailUrl })
  }
  return profiles
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&ndash;/g, '–').replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseProfilePage(html) {
  // ── Name ──────────────────────────────────────────────────────────────────
  const titleM = html.match(/<h3[^>]*class="profile-title"[^>]*title="([^"]+)"/)
  let rawName  = titleM ? titleM[1].trim() : null
  if (!rawName) return null

  // ── Phone ─────────────────────────────────────────────────────────────────
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

  // ── Age / height / weight ─────────────────────────────────────────────────
  const ageM    = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>years<\/b>/)
  const htM     = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>cm<\/b>/)
  const wM      = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>kg<\/b>/)
  const age     = ageM ? parseInt(ageM[1], 10) : 0
  const height  = htM  ? `${htM[1]}cm` : null
  const weight  = wM   ? `${wM[1]}kg`  : null

  // ── Bio ───────────────────────────────────────────────────────────────────
  const bioM  = html.match(/<div class="aboutme">([\s\S]*?)<\/div>\s*<div class="clear/)
  let bio     = null
  if (bioM) {
    const raw = bioM[1].replace(/<h4>[^<]*<\/h4>/gi, '').replace(/<b>[^<]*<\/b>/gi, '')
    const txt = decodeHtml(raw)
    if (txt.length > 10) bio = txt
  }

  // ── Location ──────────────────────────────────────────────────────────────
  let city = '', area = ''
  const cityM = html.match(/escorts-from\/kenya\/([^/"]+)\/?" title="([^"]+)"/)
  if (cityM) {
    area = cityM[2].trim()
    city = area.includes('Nairobi') ? 'Nairobi' : area
  }

  // ── Section-box fields ────────────────────────────────────────────────────
  const boxes = {}
  const boxRe = /<div class="section-box"><b[^>]*>([^<]+)<\/b><span[^>]*>([^<]*)<\/span><\/div>/g
  let bm
  while ((bm = boxRe.exec(html)) !== null) boxes[bm[1].trim()] = bm[2].trim()

  const availability = boxes['Availability'] || ''
  const ethnicity    = boxes['Ethnicity'] || null
  const bodyType     = boxes['Build'] || null
  const incall       = availability.toLowerCase().includes('incall')  ? 1 : 0
  const outcall      = availability.toLowerCase().includes('outcall') ? 1 : 0

  // ── Extra profile fields from section-boxes ───────────────────────────────
  const hobbies           = boxes['Hobbies'] || null
  const sexualOrientation = boxes['Sexual Orientation'] || boxes['Orientation'] || null
  const looks             = boxes['Looks'] || null

  // ── Languages ─────────────────────────────────────────────────────────────
  const languages = []
  const langBoxRe = /<b[^>]*>([A-Z][A-Z]+):<\/b>\s*<span[^>]*>([^<]+)<\/span>/gi
  let lbm
  while ((lbm = langBoxRe.exec(html)) !== null) {
    const lang = decodeHtml(lbm[1]).trim()
    const lvl  = decodeHtml(lbm[2]).trim()
    if (['ENGLISH','SWAHILI','FRENCH','ARABIC','SPANISH','GERMAN','CHINESE','PORTUGUESE'].includes(lang.toUpperCase()) && lvl.toLowerCase() !== 'no') {
      languages.push(lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase())
    }
  }

  // ── Services ──────────────────────────────────────────────────────────────
  // Nairobiraha marks available services with ✓ (green check) in a SERVICES section
  const services = []

  // Strategy 1: Look for the services block — items preceded by ✓ or check icons
  // Common pattern: <span class="yes">✓ OWO (Oral without condom)</span>
  const svcBlockM = html.match(/SERVICES?:?([\s\S]{0,4000}?)(?:<div class="section-box"|<h\d|RATES?:|CONTACT|<\/div>\s*<div class="col)/i)
  if (svcBlockM) {
    const block = svcBlockM[1]
    // Extract items with checkmarks or "yes" class
    const checkRe = /(?:✓|✔|fa-check|class="yes"|icon-check)[^>]*>?\s*([A-Za-z0-9][^<✗✘×]{2,60}?)(?=<|✓|✔|✗|✘|$)/gi
    let cm
    while ((cm = checkRe.exec(block)) !== null) {
      const raw = decodeHtml(cm[1]).replace(/^\s*>?\s*/, '').replace(/[✓✔✗✘×✗]/g, '').trim()
      if (raw && raw.length > 2 && raw.length < 60 && !services.includes(raw)) services.push(raw)
    }
    // Fallback within block: any span/li text that looks like a service
    if (services.length === 0) {
      const liRe = /<(?:li|span)[^>]*>\s*(?:<[^>]+>)*\s*([A-Z][A-Za-z0-9\s()/-]{2,50}?)\s*(?:<\/[^>]+>)*\s*<\/(?:li|span)>/g
      let lm
      while ((lm = liRe.exec(block)) !== null) {
        const raw = decodeHtml(lm[1]).replace(/[✓✔✗✘×]/g, '').trim()
        if (raw && raw.length > 2 && raw.length < 60 && !services.includes(raw)) services.push(raw)
      }
    }
  }

  // Strategy 2: Global scan for lines adjacent to check icons
  if (services.length === 0) {
    const globalRe = /(?:✓|✔|class="yes"|fa-check[^>]*>)\s*(?:<[^>]*>)*\s*([A-Za-z][^<✗✘]{3,60}?)(?=\s*<|\s*✓|\s*✔|\s*✗|\s*✘)/gi
    let gm
    while ((gm = globalRe.exec(html)) !== null) {
      const raw = decodeHtml(gm[1]).replace(/[✓✔✗✘×]/g, '').trim()
      if (raw && raw.length > 2 && raw.length < 60 && !services.includes(raw)) services.push(raw)
    }
  }

  // ── Gallery images ────────────────────────────────────────────────────────
  const galleryImgs = []
  // Full-size fancybox hrefs first
  const fullRe = /href="(https:\/\/nairobiraha\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))" data-fancybox="profile-photo"/gi
  let fm
  while ((fm = fullRe.exec(html)) !== null) {
    const u = fm[1].trim()
    if (!galleryImgs.includes(u)) galleryImgs.push(u)
  }
  // Thumbnail fallback
  const thumbRe = /data-fancybox="profile-photo"[^>]*>\s*<img[^>]+data-responsive-img-url="([^"]+)"/g
  let tm
  while ((tm = thumbRe.exec(html)) !== null) {
    const u = tm[1].trim().split('?')[0]
    if (!galleryImgs.includes(u)) galleryImgs.push(u)
  }

  // ── Rates table (EUR → KES, 1 EUR ≈ 145 KES) ────────────────────────────
  const EUR_TO_KES = 145
  let price_incall = 0, price_outcall = 0, price_overnight = 0
  // Look for rates in the HTML: "1 hour" row with EUR prices
  const ratesBlockM = html.match(/RATES?:?([\s\S]{0,3000}?)(?:SERVICES?:|CONTACT|<\/div>\s*<div class="col|<footer)/i)
  if (ratesBlockM) {
    const rb = ratesBlockM[1]
    // Match "1 hour" or "Short" row — first pair of EUR numbers is incall/outcall
    const hrM = rb.match(/(?:1\s*hour|short[^<]*)\D+?(\d+)\s*EUR[^<]*?(\d+)\s*EUR/i)
    if (hrM) {
      price_incall  = Math.round(parseInt(hrM[1], 10) * EUR_TO_KES / 100) * 100
      price_outcall = Math.round(parseInt(hrM[2], 10) * EUR_TO_KES / 100) * 100
    }
    // Match "12 hours" or "overnight" row for overnight price
    const ovM = rb.match(/(?:12\s*hours?|overnight[^<]*)\D+?(\d+)\s*EUR/i)
    if (ovM) {
      price_overnight = Math.round(parseInt(ovM[1], 10) * EUR_TO_KES / 100) * 100
    }
    // If no EUR found, try plain KES/K/Ksh numbers adjacent to 1hr label
    if (!price_incall) {
      const kesM = rb.match(/(?:1\s*hour|short[^<]*)\D+?(?:KES|Ksh?)?\s*(\d{4,6})/i)
      if (kesM) price_incall = parseInt(kesM[1], 10)
    }
  }

  return { name, phone, age, city, area, bio, height, weight, ethnicity, bodyType, incall, outcall, galleryImgs, services, languages, hobbies, sexualOrientation, looks, price_incall, price_outcall, price_overnight }
}

// ── DB operations ────────────────────────────────────────────────────────────
async function escortExists(db, phone) {
  if (!phone) return false
  const { rows } = await db.query('SELECT id FROM escorts WHERE phone = $1', [phone])
  return rows.length > 0
}

async function insertEscort(db, profile, avatarPath) {
  const {
    name, phone, age, city, area, bio, height, ethnicity, bodyType,
    incall, outcall, price_incall, price_outcall, price_overnight,
    hobbies, sexualOrientation, looks,
  } = profile
  return db.insert(
    `INSERT INTO escorts (
       name, phone, whatsapp, age, city, area, bio,
       height, ethnicity, body_type,
       image, tier, is_active, verified, gender,
       incall, outcall, source_site,
       price_incall, price_outcall, price_overnight,
       hobbies, sexual_orientation, looks
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7,
       $8, $9, $10,
       $11, $12, $13, $14, $15,
       $16, $17, $18,
       $19, $20, $21,
       $22, $23, $24
     )`,
    [
      name, phone, phone, age || 0,
      city || 'Nairobi', area || city || 'Nairobi', bio,
      height, ethnicity, bodyType,
      avatarPath, 'standard', 1, 0, 'Female',
      incall, outcall, 'nairobiraha',
      price_incall || 0, price_outcall || 0, price_overnight || 0,
      hobbies || null, sexualOrientation || null, looks || null,
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

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Wet3Camp Escort Scraper')
  console.log(`   DB backend: ${IS_MYSQL ? 'MySQL/MariaDB' : 'PostgreSQL'}`)
  console.log(`   Uploads:    ${UPLOADS_DIR}`)
  console.log(`   Dry run:    ${DRY_RUN}`)
  console.log(`   Limit:      ${LIMIT}`)
  console.log()

  let db
  if (!DRY_RUN) {
    db = await createDb()
    await ensureColumns(db)
    console.log('✅ Database connected\n')
  }

  // ── Step 1: collect listing URLs ──────────────────────────────────────────
  const allProfiles = []
  const seen = new Set()

  for (const source of SOURCES) {
    if (allProfiles.length >= LIMIT) break
    console.log(`📋 Fetching listing: ${source.listingUrl}`)
    const html = await fetchPage(source.listingUrl)
    if (!html) { await sleep(DELAY_MS); continue }

    const profiles = parseListingPage(html)
    console.log(`   Found ${profiles.length} profiles`)
    for (const p of profiles) {
      if (!seen.has(p.url)) { seen.add(p.url); allProfiles.push(p) }
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

    process.stdout.write(`${num} ${listing.rawName}... `)

    const html = await fetchPage(listing.url)
    if (!html) { console.log('❌ fetch failed'); errors++; await sleep(DELAY_MS); continue }

    const profile = parseProfilePage(html)
    if (!profile) { console.log('❌ parse failed'); errors++; await sleep(DELAY_MS); continue }

    // Location fallback from listing page
    if (!profile.area && listing.location) {
      const parts  = listing.location.split(',')
      profile.area = parts[0].trim()
      profile.city = profile.area.includes('Nairobi') ? 'Nairobi' : profile.area
    }

    if (DRY_RUN) {
      console.log(`✓ (dry) ${profile.name} | ${profile.phone} | ${profile.area} | age:${profile.age} | imgs:${profile.galleryImgs.length}`)
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
      const name = `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      avatarPath = await downloadImage(primaryImg, name)
    }

    // Download extra gallery images (up to 4 more = 5 total)
    const galleryPaths = avatarPath ? [avatarPath] : []
    for (let g = 1; g < Math.min(profile.galleryImgs.length, 5); g++) {
      const ext  = profile.galleryImgs[g].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
      const name = `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      const gp   = await downloadImage(profile.galleryImgs[g], name)
      if (gp) galleryPaths.push(gp)
      await sleep(300)
    }

    try {
      const escortId = await insertEscort(db, profile, avatarPath)
      await insertGallery(db, escortId, galleryPaths)

      // Insert scraped services (upsert — avoid duplicates on re-run)
      if (profile.services && profile.services.length > 0) {
        for (const svcName of profile.services) {
          await db.query(
            `INSERT INTO escort_services (escort_id, name, available)
             VALUES ($1, $2, true)
             ON CONFLICT (escort_id, name) DO NOTHING`,
            [escortId, svcName],
          ).catch(() => {})
        }
        process.stdout.write(` [${profile.services.length} services]`)
      }

      console.log(`✅ id:${escortId} ${profile.name} | ${profile.phone} | ${profile.area}`)
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
