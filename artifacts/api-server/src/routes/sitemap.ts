import { Router } from 'express'
import { getPool } from '../lib/db.js'

const router = Router()

const BASE = 'https://wet3.camp'

// ── All Kenyan cities covered ─────────────────────────────────────────────────
const CITIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
  'Thika', 'Machakos', 'Nyeri', 'Meru', 'Kitale',
  'Malindi', 'Kilifi', 'Diani', 'Nanyuki', 'Embu',
]

// ── Nairobi areas for hyper-local SEO ─────────────────────────────────────────
const NAIROBI_AREAS = [
  'westlands', 'karen', 'kilimani', 'lavington', 'parklands',
  'upperhill', 'gigiri', 'runda', 'muthaiga', 'eastleigh',
  'south-b', 'south-c', 'langata', 'ngong-road', 'thika-road',
  'spring-valley', 'loresho', 'rosslyn', 'ruaka', 'kileleshwa',
  'embakasi', 'cbd',
]

// ── Mombasa areas ─────────────────────────────────────────────────────────────
const MOMBASA_AREAS = [
  'nyali', 'bamburi', 'diani-beach', 'mtwapa', 'tudor', 'likoni', 'kisauni',
]

// ── High-demand escort services for SEO ───────────────────────────────────────
const ESCORT_SERVICES = [
  'massage', 'erotic-massage', 'sensual-massage', 'tantric-massage', 'nuru-massage',
  'body-slide', 'body-rub', 'four-hands-massage', 'happy-ending',
  'gfe', 'girlfriend-experience', 'pse', 'porn-star-experience', 'bfe', 'boyfriend-experience',
  'bdsm', 'dominatrix', 'submissive', 'bondage', 'shibari', 'rope-bondage',
  'anal', 'anal-sex', 'oral', 'blowjob', 'deep-throat', 'rimming', 'rimjob',
  'handjob', 'fingering', '69', 'full-service', 'creampie', 'squirting',
  'cum-on-face', 'cum-in-mouth', 'prostate-massage',
  'overnight', 'incall', 'outcall', 'roleplay', 'role-play', 'fantasy', 'cosplay',
  'striptease', 'strip-tease', 'lap-dance', 'duo', 'threesome', 'ffm', 'mmf',
  'group', 'orgy', 'gangbang', 'dp', 'double-penetration', 'swinging', 'cuckolding',
  'exhibitionism', 'couples', 'webcam', 'camgirl', 'video-call', 'sexting',
  'onlyfans', 'custom-videos', 'nude-photos', 'phone-sex', 'live-shows',
  'foot-fetish', 'golden-shower', 'watersports', 'pegging', 'strap-on',
  'face-sitting', 'humiliation', 'spanking', 'wax-play', 'latex', 'leather',
  'cross-dressing', 'fisting', 'fetish',
  'dinner-dates', 'travel-escort', 'events', 'hotel-visits', 'weekend-trips',
  'dancing-partner', 'airport-pickup', 'social-companion', 'party-companion',
  'bbw', 'milf', 'petite', 'busty', 'curvy', 'mature', 'young', 'teen-18',
]

// Only include city slugs that have a real landing page in the frontend CITY_DATA
const CITY_PAGES = [
  'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret',
]

const STATIC_PAGES = [
  { loc: '/',              changefreq: 'hourly',  priority: '1.0' },
  { loc: '/search',        changefreq: 'hourly',  priority: '0.9' },
  { loc: '/exclusive',     changefreq: 'daily',   priority: '0.9' },
  { loc: '/adverts',       changefreq: 'daily',   priority: '0.8' },
  { loc: '/feeds',         changefreq: 'hourly',  priority: '0.8' },
  { loc: '/live',          changefreq: 'always',  priority: '0.8' },
  { loc: '/events',        changefreq: 'daily',   priority: '0.7' },
  { loc: '/videos',        changefreq: 'daily',   priority: '0.7' },
  { loc: '/shop',          changefreq: 'daily',   priority: '0.6' },
  { loc: '/reviews',       changefreq: 'daily',   priority: '0.6' },
  { loc: '/rooms',         changefreq: 'daily',   priority: '0.6' },
  { loc: '/tours',         changefreq: 'daily',   priority: '0.6' },
  { loc: '/register',      changefreq: 'monthly', priority: '0.8' },
  { loc: '/login',         changefreq: 'monthly', priority: '0.5' },
  { loc: '/faqs',          changefreq: 'monthly', priority: '0.5' },
  { loc: '/contact',       changefreq: 'monthly', priority: '0.4' },
  { loc: '/install',       changefreq: 'monthly', priority: '0.3' },
  { loc: '/blacklist',     changefreq: 'weekly',  priority: '0.5' },
  { loc: '/testimonials',  changefreq: 'weekly',  priority: '0.5' },
]

const BLOG_SLUGS = [
  'how-to-find-verified-escorts-nairobi',
  'top-escort-areas-nairobi-guide-2025',
  'mombasa-escort-guide-complete',
  'escort-booking-safety-tips-kenya',
  'vip-elite-escort-services-nairobi',
  'girlfriend-experience-gfe-nairobi',
  'nairobi-nightlife-escort-guide',
  'booking-escorts-westlands-karen',
  'elite-escorts-nairobi-cbd',
  'escort-tours-kenya-2025',
  'verified-escorts-mombasa-guide',
  'kisumu-escort-guide-2025',
  'how-to-stay-safe-booking-escorts-kenya',
  'nakuru-eldoret-escort-guide',
  'best-escort-rates-nairobi-2025',
  // New posts
  'nairobi-escort-rates-2025',
  'westlands-escorts-nairobi-guide',
  'gfe-girlfriend-experience-nairobi',
  'incall-outcall-escorts-kenya',
  'kisumu-escorts-guide-2025',
  'elite-vip-escorts-nairobi-difference',
  'massage-escorts-nairobi-guide',
  'overnight-escorts-nairobi-guide',
  'nakuru-eldoret-escorts-guide',
  'how-to-spot-fake-escorts-kenya',
  'nairobi-nightlife-escort-companion-guide',
  'kenya-travel-escort-safari-companion',
  'mombasa-escort-guide-2025',
  'escort-safety-tips-kenya',
]

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function url(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}

// ── Sitemap index ─────────────────────────────────────────────────────────────
router.get('/sitemap.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0]
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200')
  res.setHeader('Expires', new Date(Date.now() + 3600 * 1000).toUTCString())

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <sitemap><loc>${BASE}/sitemap-main.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${BASE}/sitemap-escorts.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${BASE}/sitemap-cities.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${BASE}/sitemap-services.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    `  <sitemap><loc>${BASE}/sitemap-blog.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    '</sitemapindex>',
  ].join('\n')

  res.send(xml)
})

// ── Main pages sitemap ────────────────────────────────────────────────────────
router.get('/sitemap-main.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0]
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200')
  res.setHeader('Expires', new Date(Date.now() + 3600 * 1000).toUTCString())

  const lines = STATIC_PAGES.map(p => url(`${BASE}${p.loc}`, today, p.changefreq, p.priority))

  res.send([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...lines,
    '</urlset>',
  ].join('\n'))
})

// ── Escorts profiles sitemap (from DB) ────────────────────────────────────────
router.get('/sitemap-escorts.xml', async (_req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200')
  res.setHeader('Expires', new Date(Date.now() + 3600 * 1000).toUTCString())

  const pool = getPool()
  const escortLines: string[] = []

  if (pool) {
    try {
      const [escorts] = await pool.query<any[]>(
        `SELECT e.id, e.name, e.city, e.updated_at
         FROM escorts e WHERE e.is_active = 1 ORDER BY e.featured DESC, e.rating DESC LIMIT 5000`
      )
      for (const e of escorts) {
        const lastmod = e.updated_at
          ? new Date(e.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
        // Use /@slug as canonical URL (matches app routing)
        const slug = (e.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        if (slug) {
          escortLines.push(url(`${BASE}/@${slug}`, lastmod, 'daily', '0.8'))
        }
        // Keep /profile/:id as fallback for backwards compatibility
        escortLines.push(url(`${BASE}/profile/${e.id}`, lastmod, 'daily', '0.6'))
      }
    } catch (err) {
      console.error('[sitemap-escorts] DB error:', err)
    }
  }

  res.send([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...escortLines,
    '</urlset>',
  ].join('\n'))
})

// ── City & area location pages sitemap ───────────────────────────────────────
router.get('/sitemap-cities.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0]
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=172800')
  res.setHeader('Expires', new Date(Date.now() + 86400 * 1000).toUTCString())

  const lines: string[] = []

  // Dedicated city landing pages — /escorts/:city (highest SEO priority)
  for (const citySlug of CITY_PAGES) {
    lines.push(url(`${BASE}/escorts/${citySlug}`, today, 'daily', '0.95'))
  }

  // City-level pages (high value — target "escorts in Nairobi" etc)
  for (const city of CITIES) {
    lines.push(url(`${BASE}/?city=${encodeURIComponent(city)}`, today, 'daily', '0.9'))
    lines.push(url(`${BASE}/search?city=${encodeURIComponent(city)}`, today, 'daily', '0.8'))
    // Tier pages per city
    for (const tier of ['elite', 'vip', 'premium']) {
      lines.push(url(`${BASE}/?city=${encodeURIComponent(city)}&tier=${tier}`, today, 'daily', '0.7'))
    }
  }

  // Nairobi area hyper-local pages
  for (const area of NAIROBI_AREAS) {
    lines.push(url(`${BASE}/search?city=Nairobi&area=${area}`, today, 'weekly', '0.7'))
  }

  // Mombasa area pages
  for (const area of MOMBASA_AREAS) {
    lines.push(url(`${BASE}/search?city=Mombasa&area=${area}`, today, 'weekly', '0.6'))
  }

  res.send([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...lines,
    '</urlset>',
  ].join('\n'))
})

// ── Services sitemap — targets high-intent service-specific search queries ─────
router.get('/sitemap-services.xml', (_req, res) => {
  const today = new Date().toISOString().split('T')[0]
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=172800')

  const lines: string[] = []

  // Service landing pages — /search?service=X (high priority)
  for (const svc of ESCORT_SERVICES) {
    lines.push(url(`${BASE}/search?service=${encodeURIComponent(svc)}`, today, 'daily', '0.8'))
  }

  // Service + city combos (Nairobi, Mombasa, Kisumu are highest value)
  const topCities = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']
  for (const svc of ESCORT_SERVICES) {
    for (const city of topCities) {
      lines.push(url(
        `${BASE}/search?service=${encodeURIComponent(svc)}&city=${encodeURIComponent(city)}`,
        today, 'daily', '0.7',
      ))
    }
  }

  // Service homepage filter links (/?service=X)
  for (const svc of ESCORT_SERVICES) {
    lines.push(url(`${BASE}/?service=${encodeURIComponent(svc)}`, today, 'daily', '0.6'))
  }

  res.send([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...lines,
    '</urlset>',
  ].join('\n'))
})

// ── Blog sitemap ──────────────────────────────────────────────────────────────
router.get('/sitemap-blog.xml', async (_req, res) => {
  const today = new Date().toISOString().split('T')[0]
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200')

  // Merge static slugs + all published DB posts
  const allSlugs: { slug: string; date: string }[] = BLOG_SLUGS.map(s => ({ slug: s, date: today }))
  const seenSlugs = new Set(BLOG_SLUGS)

  const pool = getPool()
  if (pool) {
    try {
      const [rows] = await pool.query<any[]>(
        'SELECT slug, published_at FROM blog_posts WHERE published = 1 ORDER BY published_at DESC LIMIT 1000'
      )
      for (const row of rows as any[]) {
        if (!seenSlugs.has(row.slug)) {
          allSlugs.push({
            slug: row.slug,
            date: row.published_at ? new Date(row.published_at).toISOString().split('T')[0] : today,
          })
          seenSlugs.add(row.slug)
        }
      }
    } catch { /* ignore DB errors */ }
  }

  const lines = allSlugs.map(({ slug, date }) =>
    url(`${BASE}/blog/${slug}`, date, 'weekly', '0.7')
  )

  res.send([
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...lines,
    '</urlset>',
  ].join('\n'))
})

export default router
