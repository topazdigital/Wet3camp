/**
 * Kenyan Escort Directory Scraper
 * Scrapes profiles from nairobiraha.com and imports into the wet3.camp database.
 * Escorts can later claim their profiles via the wet3.camp registration flow.
 *
 * Usage:
 *   node scripts/scrape-escorts.mjs
 *   node scripts/scrape-escorts.mjs --limit=10   (scrape only 10 profiles)
 *   node scripts/scrape-escorts.mjs --dry-run    (parse but don't insert)
 */

import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Config ──────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL
const UPLOADS_DIR = process.env.UPLOADS_DIR
  || path.join(__dirname, 'uploads')
const DELAY_MS = 1200          // polite delay between requests
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '9999', 10)

// Source sites to scrape — add more listing URLs here as needed
const SOURCES = [
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/escorts/page/2/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/african-escorts/' },
  { site: 'nairobiraha', listingUrl: 'https://nairobiraha.com/call-girls/' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } catch (err) {
    console.warn(`  [WARN] fetch failed for ${url}: ${err.message}`)
    return null
  }
}

async function downloadImage(imageUrl, localFilename) {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
  const destPath = path.join(UPLOADS_DIR, localFilename)
  if (existsSync(destPath)) return `/api/uploads/${localFilename}`  // already cached

  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://nairobiraha.com/' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(destPath, buf)
    return `/api/uploads/${localFilename}`
  } catch (err) {
    console.warn(`  [WARN] image download failed (${imageUrl}): ${err.message}`)
    return null
  }
}

// ── HTML parsing helpers (no external deps) ─────────────────────────────────
function extractText(html, pattern) {
  const m = html.match(pattern)
  return m ? m[1].trim().replace(/&amp;/g, '&').replace(/&ndash;/g, '–').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, '').trim() : null
}

function extractAttr(html, pattern) {
  const m = html.match(pattern)
  return m ? m[1].trim() : null
}

function parseListingPage(html) {
  const profiles = []
  // Match: <a href="URL" class="girlimg" ...><img ... data-responsive-img-url="IMG_URL" ... />...<span class="modelname">NAME</span>...<span class="modelinfo-location">LOCATION</span>
  const blockRe = /<a\s+href="(https:\/\/nairobiraha\.com\/escort\/[^"]+)"\s+class="girlimg"[^>]*>([\s\S]*?)<\/a>/g
  let m
  while ((m = blockRe.exec(html)) !== null) {
    const url = m[1]
    const block = m[2]

    const nameM = block.match(/<span[^>]*class="modelname"[^>]*>([\s\S]*?)<\/span>/i)
    const locM = block.match(/<span[^>]*class="modelinfo-location"[^>]*>([\s\S]*?)<\/span>/i)
    const imgM = block.match(/data-responsive-img-url="([^"]+)"/)

    const rawName = nameM ? nameM[1].replace(/<[^>]+>/g, '').trim() : null
    const location = locM ? locM[1].replace(/<[^>]+>/g, '').trim() : null
    const thumbnailUrl = imgM ? imgM[1].trim() : null

    if (!rawName || profiles.find(p => p.url === url)) continue
    profiles.push({ url, rawName, location, thumbnailUrl })
  }
  return profiles
}

function parseProfilePage(html, url) {
  // ── Name + phone from header ────────────────────────────────────────────
  const titleM = html.match(/<h3[^>]*class="profile-title"[^>]*title="([^"]+)"/)
  const rawName = titleM ? titleM[1].trim() : null

  const phoneM = html.match(/href="tel:(\+?[\d]+)"/)
  let phone = phoneM ? phoneM[1].trim() : null
  // Normalize Kenyan numbers to +254XXXXXXXXX
  if (phone) {
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('254') && digits.length === 12) phone = `+${digits}`
    else if (digits.startsWith('0') && digits.length === 10) phone = `+254${digits.slice(1)}`
    else if (digits.length === 9) phone = `+254${digits}`
    else phone = `+${digits}`
  }

  // Strip phone from name
  let name = rawName || ''
  if (phone) name = name.replace(phone, '').trim()
  // Also strip 07xxxx patterns
  name = name.replace(/\s*0\d{9}\s*$/,'').trim()
  if (!name) return null

  // ── Stats block: age/height/weight ─────────────────────────────────────
  // Format: <span class="valuecolumn">174</span><b>cm</b>
  const ageM2  = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>years<\/b>/)
  const htM2   = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>cm<\/b>/)
  const wM2    = html.match(/<span[^>]*class="valuecolumn"[^>]*>(\d+)<\/span><b>kg<\/b>/)
  const age    = ageM2 ? parseInt(ageM2[1], 10) : 0
  const height = htM2 ? `${htM2[1]}cm` : null
  const weight = wM2 ? `${wM2[1]}kg` : null

  // ── Bio ─────────────────────────────────────────────────────────────────
  const bioSectionM = html.match(/<div class="aboutme">([\s\S]*?)<\/div>\s*<div class="clear/)
  let bio = null
  if (bioSectionM) {
    // Skip the <h4> and <b> intro line, grab the text after
    let raw = bioSectionM[1]
    raw = raw.replace(/<h4>[^<]*<\/h4>/gi, '')
    raw = raw.replace(/<b>[^<]*<\/b>/gi, '')
    raw = raw.replace(/<[^>]+>/g, ' ')
    raw = raw.replace(/\s+/g, ' ').trim()
    // Decode HTML entities
    raw = raw.replace(/&amp;/g, '&').replace(/&ndash;/g, '–').replace(/&#039;/g, "'")
             .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    bio = raw.length > 10 ? raw : null
  }

  // ── Location from aboutme link ───────────────────────────────────────────
  let city = '', area = ''
  const cityLinkM = html.match(/escorts-from\/kenya\/([^/"]+)\/?" title="([^"]+)"/)
  if (cityLinkM) {
    area = cityLinkM[2].trim()
    city = area.includes('Nairobi') ? 'Nairobi' : area
  }
  // Fallback to contact city field
  if (!area) {
    const contactCityM = html.match(/addressLocality"[^>]*>([^<]+)<\/a>/)
    if (contactCityM) { area = contactCityM[1].trim(); city = area }
  }

  // ── Section boxes (Availability, Ethnicity, Build, etc.) ────────────────
  const sectionBoxes = {}
  const sboxRe = /<div class="section-box"><b[^>]*>([^<]+)<\/b><span[^>]*>([^<]*)<\/span><\/div>/g
  let sbM
  while ((sbM = sboxRe.exec(html)) !== null) {
    sectionBoxes[sbM[1].trim()] = sbM[2].trim()
  }

  const availability = sectionBoxes['Availability'] || ''
  const ethnicity    = sectionBoxes['Ethnicity'] || null
  const bodyType     = sectionBoxes['Build'] || null
  const incall       = availability.toLowerCase().includes('incall') ? 1 : 0
  const outcall      = availability.toLowerCase().includes('outcall') ? 1 : 0

  // ── Gallery images ───────────────────────────────────────────────────────
  const galleryImgs = []
  const thumbRe = /data-fancybox="profile-photo"[^>]*>\s*<img[^>]+data-responsive-img-url="([^"]+)"/g
  let gM
  while ((gM = thumbRe.exec(html)) !== null) {
    const imgUrl = gM[1].trim().split('?')[0]  // strip CDN query params
    if (!galleryImgs.includes(imgUrl)) galleryImgs.push(imgUrl)
  }
  // Also grab fancybox href (full size)
  const fullImgRe = /href="(https:\/\/nairobiraha\.com\/wp-content\/uploads\/[^"]+\.jpg)" data-fancybox="profile-photo"/g
  let fM
  while ((fM = fullImgRe.exec(html)) !== null) {
    const url2 = fM[1].trim()
    if (!galleryImgs.includes(url2)) galleryImgs.unshift(url2)
  }

  return { name, phone, age, city, area, bio, height, weight, ethnicity, bodyType, incall, outcall, galleryImgs }
}

// ── Database ────────────────────────────────────────────────────────────────
async function getDb() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set')
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 3 })
  return pool
}

async function escortExists(pool, phone) {
  if (!phone) return false
  const res = await pool.query('SELECT id FROM escorts WHERE phone = $1', [phone])
  return res.rows.length > 0
}

async function insertEscort(pool, data, avatarPath) {
  const {
    name, phone, age, city, area, bio,
    height, ethnicity, bodyType, incall, outcall
  } = data

  const slug = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()).slice(0, 80)

  const res = await pool.query(
    `INSERT INTO escorts (
      name, phone, whatsapp, age, city, area, bio,
      height, ethnicity, body_type,
      image, tier, is_active, verified, gender,
      incall, outcall, source_site
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, $18
    ) RETURNING id`,
    [
      name, phone, phone, age || 0, city || 'Nairobi', area || city || 'Nairobi', bio,
      height, ethnicity, bodyType,
      avatarPath, 'standard', 1, 0, 'Female',
      incall, outcall, 'nairobiraha'
    ]
  )
  return res.rows[0].id
}

async function insertGallery(pool, escortId, imageUrls) {
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      await pool.query(
        'INSERT INTO escort_gallery (escort_id, image_url, sort_order) VALUES ($1, $2, $3)',
        [escortId, imageUrls[i], i]
      )
    } catch {}
  }
}

// ── Check if escorts table has source_site column ────────────────────────────
async function ensureSourceSiteColumn(pool) {
  try {
    await pool.query(`ALTER TABLE escorts ADD COLUMN IF NOT EXISTS incall SMALLINT NOT NULL DEFAULT 0`)
    await pool.query(`ALTER TABLE escorts ADD COLUMN IF NOT EXISTS outcall SMALLINT NOT NULL DEFAULT 0`)
    await pool.query(`ALTER TABLE escorts ADD COLUMN IF NOT EXISTS source_site VARCHAR(100) DEFAULT NULL`)
  } catch (e) {
    // May already exist — that's fine
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Wet3Camp Escort Scraper`)
  console.log(`   Uploads: ${UPLOADS_DIR}`)
  console.log(`   Dry run: ${DRY_RUN}`)
  console.log(`   Limit:   ${LIMIT}`)
  console.log()

  let pool
  if (!DRY_RUN) {
    pool = await getDb()
    await ensureSourceSiteColumn(pool)
    console.log('✅ Database connected\n')
  }

  // Step 1 — Collect all profile URLs from listing pages
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
      if (!seen.has(p.url)) {
        seen.add(p.url)
        allProfiles.push({ ...p, site: source.site })
      }
    }
    await sleep(DELAY_MS)
  }

  console.log(`\n📦 Total unique profiles to process: ${Math.min(allProfiles.length, LIMIT)}\n`)

  // Step 2 — Scrape each profile detail page
  let imported = 0, skipped = 0, errors = 0

  for (let i = 0; i < Math.min(allProfiles.length, LIMIT); i++) {
    const listing = allProfiles[i]
    const num = `[${i + 1}/${Math.min(allProfiles.length, LIMIT)}]`

    process.stdout.write(`${num} ${listing.rawName}... `)

    const html = await fetchPage(listing.url)
    if (!html) { console.log('❌ fetch failed'); errors++; await sleep(DELAY_MS); continue }

    const profile = parseProfilePage(html, listing.url)
    if (!profile) { console.log('❌ parse failed'); errors++; await sleep(DELAY_MS); continue }

    // Fallback location from listing
    if (!profile.area && listing.location) {
      const parts = listing.location.split(',')
      profile.area = parts[0].trim()
      profile.city = profile.area.includes('Nairobi') ? 'Nairobi' : profile.area
    }

    if (DRY_RUN) {
      console.log(`✓ (dry) ${profile.name} | ${profile.phone} | ${profile.area} | age:${profile.age} | imgs:${profile.galleryImgs.length}`)
      imported++
      await sleep(300)
      continue
    }

    // Skip if phone already exists
    if (profile.phone && await escortExists(pool, profile.phone)) {
      console.log(`⏭  already exists (phone: ${profile.phone})`)
      skipped++
      await sleep(300)
      continue
    }

    // Download avatar (first gallery image or thumbnail)
    let avatarPath = null
    const primaryImgUrl = profile.galleryImgs[0] || listing.thumbnailUrl
    if (primaryImgUrl) {
      const ext = primaryImgUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
      const filename = `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      avatarPath = await downloadImage(primaryImgUrl, filename)
    }

    // Download additional gallery images
    const galleryPaths = []
    if (avatarPath) galleryPaths.push(avatarPath)
    for (let g = 1; g < Math.min(profile.galleryImgs.length, 5); g++) {
      const ext = profile.galleryImgs[g].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg'
      const fname = `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      const gPath = await downloadImage(profile.galleryImgs[g], fname)
      if (gPath) galleryPaths.push(gPath)
      await sleep(300)
    }

    try {
      const escortId = await insertEscort(pool, profile, avatarPath)
      if (galleryPaths.length > 0) await insertGallery(pool, escortId, galleryPaths)
      console.log(`✅ id:${escortId} ${profile.name} | ${profile.phone} | ${profile.area}`)
      imported++
    } catch (err) {
      console.log(`❌ DB error: ${err.message}`)
      errors++
    }

    await sleep(DELAY_MS)
  }

  if (!DRY_RUN) await pool.end()

  console.log(`\n════════════════════════════════════════`)
  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭  Skipped:  ${skipped}`)
  console.log(`❌ Errors:   ${errors}`)
  console.log(`════════════════════════════════════════\n`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
