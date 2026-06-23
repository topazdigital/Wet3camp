/**
 * Quick completion scraper — imports remaining nairobiraha profiles into dev DB
 * Fetches listing pages first, then scrapes each new profile.
 */
import pg from 'pg'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
const EUR_TO_KES = 145
const DELAY      = 700

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchHtml(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(18000),
    })
    if (!r.ok) return null
    return r.text()
  } catch { return null }
}

function decodeHtml(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim()
}

function parsePhone(html) {
  const m = html.match(/href="tel:(\+?[\d]+)"/)
  if (!m) return null
  const d = m[1].replace(/\D/g, '')
  if (d.startsWith('254') && d.length >= 11 && d.length <= 12) return '+' + d
  if (d.startsWith('0') && d.length === 10) return '+254' + d.slice(1)
  if (d.length === 9) return '+254' + d
  return '+' + d
}

function parseRates(html) {
  const eur = [...html.matchAll(/(\d{1,6})\s*EUR/gi)].map(m => parseInt(m[1])).filter(n => n > 0 && n < 1000)
  const kes = [...html.matchAll(/(?:KES|KSH)\s*([\d,]+)/gi)].map(m => parseInt(m[1].replace(/,/g,''))).filter(n => n > 500 && n < 500000)
  if (eur.length >= 2) return { incall: Math.round(eur[0]*EUR_TO_KES), outcall: Math.round(eur[1]*EUR_TO_KES) }
  if (eur.length === 1) return { incall: Math.round(eur[0]*EUR_TO_KES), outcall: 0 }
  if (kes.length >= 2) return { incall: kes[0], outcall: kes[1] }
  if (kes.length === 1) return { incall: kes[0], outcall: 0 }
  return { incall: 0, outcall: 0 }
}

function parseServices(html) {
  const services = []
  const re = /[✓✔✅]\s*([A-Za-z][A-Za-z\s\-()\/]{1,50}?)(?=[✓✔✅<\n]|$)/g
  let m
  while ((m = re.exec(html)) !== null) {
    const s = m[1].trim()
    if (s.length >= 2 && s.length <= 80 && !services.includes(s)) services.push(s)
  }
  return services.slice(0, 30)
}

async function profileExists(phone) {
  if (!phone) return false
  const { rows } = await pool.query('SELECT 1 FROM escorts WHERE phone=$1', [phone])
  return rows.length > 0
}

async function importProfile(url) {
  const html = await fetchHtml(url)
  if (!html) return { status: 'fetch-fail' }

  const nameM = html.match(/<h3[^>]*class="profile-title"[^>]*title="([^"]+)"/)
  if (!nameM) return { status: 'no-name' }

  let name = nameM[1].replace(/\s*\+?[\d]{7,}$/, '').trim()
  if (!name || name.length < 2) return { status: 'bad-name' }

  const phone = parsePhone(html)
  if (phone && await profileExists(phone)) return { status: 'exists' }

  const locM = html.match(/escorts-from\/kenya\/[^/"]+\/[^"]*" title="([^"]+)"/)
  const area = locM ? locM[1].trim() : 'Nairobi'
  const city = /nairobi/i.test(area) ? 'Nairobi'
    : /mombasa/i.test(area) ? 'Mombasa'
    : /kisumu/i.test(area)  ? 'Kisumu'
    : area.split(',')[0]

  const ageM = html.match(/Age[^:]*:\s*(\d{2})\b/i)
  const age = ageM ? parseInt(ageM[1]) : 0

  const { incall, outcall } = parseRates(html)
  const services = parseServices(html)

  const imgM = html.match(/data-responsive-img-url="([^"]+)"/) || html.match(/data-fancybox="profile-photo"[^>]*>\s*<img[^>]+src="([^"]+)"/)
  const avatar = imgM ? imgM[1].trim() : null

  const htM = html.match(/(\d{3})\s*cm/i)
  const height = htM ? `${htM[1]}cm` : null

  const bioM = html.match(/<div class="aboutme">([\s\S]{0,800}?)<\/div>/)
  const bio = bioM ? decodeHtml(bioM[1]).slice(0, 600) : null

  const { rows } = await pool.query(
    `INSERT INTO escorts (name,phone,whatsapp,age,city,area,bio,height,tier,is_active,verified,gender,incall,outcall,source_site,price_incall,price_outcall,image)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
    [name, phone, phone, age, city, area, bio, height, 'standard', 1, 0, 'Female',
     incall ? 1 : 0, outcall ? 1 : 0, 'nairobiraha', incall || null, outcall || null, avatar]
  )
  const id = rows[0].id

  await pool.query('INSERT INTO escort_languages (escort_id,language,proficiency) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [id,'English','Fluent'])
  await pool.query('INSERT INTO escort_languages (escort_id,language,proficiency) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [id,'Swahili','Conversational'])

  for (const svc of services) {
    await pool.query('INSERT INTO escort_services (escort_id,name,available) VALUES ($1,$2,1) ON CONFLICT DO NOTHING', [id, svc]).catch(() => {})
  }

  return { status: 'ok', id, name, phone, city: area, incall, outcall, services: services.length }
}

async function main() {
  const LISTING_PAGES = [
    'https://nairobiraha.com/escorts/',
    'https://nairobiraha.com/escorts/page/2/',
    'https://nairobiraha.com/escorts/page/3/',
    'https://nairobiraha.com/escorts/page/4/',
    'https://nairobiraha.com/massage/',
    'https://nairobiraha.com/vip-escorts/',
    'https://nairobiraha.com/african-escorts/',
  ]

  // Collect unique profile URLs
  const seen = new Set()
  const urls = []
  for (const page of LISTING_PAGES) {
    const html = await fetchHtml(page)
    if (!html) { await sleep(500); continue }
    const re = /href="(https:\/\/nairobiraha\.com\/escort\/[^"]+)" class="girlimg"/g
    let m
    while ((m = re.exec(html)) !== null) {
      if (!seen.has(m[1])) { seen.add(m[1]); urls.push(m[1]) }
    }
    await sleep(500)
  }
  console.log(`Found ${urls.length} unique profile URLs\n`)

  let ok = 0, skipped = 0, failed = 0
  for (let i = 0; i < urls.length; i++) {
    const result = await importProfile(urls[i])
    const label = urls[i].split('/').filter(Boolean).pop()
    if (result.status === 'ok') {
      ok++
      const rate = result.incall ? `KES ${result.incall}/${result.outcall}` : '—'
      console.log(`✅ [${i+1}/${urls.length}] id:${result.id} ${result.name} | ${result.phone} | ${result.city} | ${rate} | ${result.services}svc`)
    } else if (result.status === 'exists') {
      skipped++
      process.stdout.write(`⏭  `)
    } else {
      failed++
      console.log(`❌ [${i+1}/${urls.length}] ${result.status} — ${label}`)
    }
    await sleep(DELAY)
  }

  const { rows } = await pool.query('SELECT COUNT(*) cnt FROM escorts')
  const { rows: s } = await pool.query('SELECT COUNT(*) cnt FROM escort_services')
  const { rows: l } = await pool.query('SELECT COUNT(*) cnt FROM escort_languages')
  await pool.end()
  console.log(`\n${'═'.repeat(50)}`)
  console.log(`✅ Imported: ${ok}  ⏭  Skipped: ${skipped}  ❌ Failed: ${failed}`)
  console.log(`📊 DB totals — Escorts: ${rows[0].cnt} | Services: ${s[0].cnt} | Languages: ${l[0].cnt}`)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
