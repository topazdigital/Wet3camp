import { Router } from 'express'
import { getPool } from '../lib/db.js'

const router = Router()

const BASE = 'https://wet3.camp'

const STATIC_PAGES = [
  { loc: '/',           changefreq: 'hourly',  priority: '1.0' },
  { loc: '/exclusive',  changefreq: 'daily',   priority: '0.9' },
  { loc: '/adverts',    changefreq: 'daily',   priority: '0.8' },
  { loc: '/feeds',      changefreq: 'hourly',  priority: '0.8' },
  { loc: '/live',       changefreq: 'always',  priority: '0.8' },
  { loc: '/events',     changefreq: 'daily',   priority: '0.7' },
  { loc: '/videos',     changefreq: 'daily',   priority: '0.7' },
  { loc: '/shop',       changefreq: 'daily',   priority: '0.6' },
  { loc: '/reviews',    changefreq: 'daily',   priority: '0.6' },
  { loc: '/rooms',      changefreq: 'daily',   priority: '0.6' },
  { loc: '/tours',      changefreq: 'daily',   priority: '0.6' },
  { loc: '/register',   changefreq: 'monthly', priority: '0.8' },
  { loc: '/login',      changefreq: 'monthly', priority: '0.5' },
  { loc: '/faqs',       changefreq: 'monthly', priority: '0.5' },
  { loc: '/contact',    changefreq: 'monthly', priority: '0.4' },
  { loc: '/install',    changefreq: 'monthly', priority: '0.3' },
  { loc: '/blacklist',  changefreq: 'weekly',  priority: '0.5' },
  { loc: '/testimonials', changefreq: 'weekly', priority: '0.5' },
]

const BLOG_SLUGS = [
  'how-to-find-verified-escorts-nairobi',
  'top-escort-areas-nairobi-guide-2025',
  'mombasa-escort-guide-complete',
  'escort-booking-safety-tips-kenya',
  'vip-elite-escort-services-nairobi',
  'girlfriend-experience-gfe-nairobi',
  'nairobi-nightlife-escort-guide',
  'booking-companion-westlands-karen',
]

function xmlEscape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

router.get('/sitemap.xml', async (_req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200')

  const pool = getPool()
  const escortLines: string[] = []

  if (pool) {
    try {
      const [escorts] = await pool.query<any[]>(
        'SELECT id, updated_at FROM escorts WHERE is_active = 1 ORDER BY id LIMIT 2000'
      )
      for (const e of escorts) {
        const lastmod = e.updated_at
          ? new Date(e.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
        escortLines.push(
          `  <url><loc>${xmlEscape(`${BASE}/profile/${e.id}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
        )
      }
    } catch (err) {
      console.error('[sitemap] DB error:', err)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const staticLines = STATIC_PAGES.map(
    p => `  <url><loc>${xmlEscape(BASE + p.loc)}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  )

  const blogLines = BLOG_SLUGS.map(
    slug => `  <url><loc>${xmlEscape(`${BASE}/blog/${slug}`)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
  )

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
    '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    ...staticLines,
    ...blogLines,
    ...escortLines,
    '</urlset>',
  ].join('\n')

  res.send(xml)
})

export default router
