// =============================================================================
// OG Preview Middleware
// =============================================================================
// Social crawlers (WhatsApp, Telegram, Facebook, Twitter/X, Slack, Discord, etc.)
// don't execute JavaScript. They read the raw HTML <head> for Open Graph tags.
// This middleware detects bots, fetches real data, and returns a minimal HTML
// page with correct og:title / og:description / og:image tags.
// Regular browsers are passed straight through to the SPA.
// =============================================================================

import type { Request, Response, NextFunction } from 'express'
import { getPool } from '../lib/db.js'

const SITE_URL = 'https://wet3.camp'
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`
const SITE_NAME = 'Wet3 Camp'

// ── Image proxy helper (wraps external images so bots get real photos) ────────
function ogImage(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return DEFAULT_IMAGE
  const s = raw.trim()
  // Already a full same-domain URL — serve directly, no proxy loop
  if (s.startsWith(SITE_URL)) return s
  // Relative upload paths
  if (s.startsWith('/api/uploads/')) return `${SITE_URL}${s}`
  // /uploads/ without /api prefix (old format)
  if (s.startsWith('/uploads/')) return `${SITE_URL}/api${s}`
  // External URL — proxy through our image proxy so bots can fetch it
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return `${SITE_URL}/api/image-proxy?url=${encodeURIComponent(s)}`
  }
  // Bare filename (e.g. "photo.jpg" or "scraped_xxx.jpg") — assume uploads dir
  if (/\.(jpe?g|png|webp|gif|avif)$/i.test(s)) return `${SITE_URL}/api/uploads/${s}`
  // Any other absolute path
  if (s.startsWith('/')) return `${SITE_URL}${s}`
  return DEFAULT_IMAGE
}

// ── Bot detection ─────────────────────────────────────────────────────────────
const BOT_RE =
  /facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|linkedinbot|slackbot|discordbot|applebot|googlebot|bingbot|yandex|duckduckbot|pinterest|skypeuripreview|nuzzel|outbrain|flipboard|tumblr|vkshare|w3c_validator|baiduspider|embedly|quora|ia_archiver|semrush|ahrefs|mj12bot|rogerbot|dotbot/i

function isBot(ua: string): boolean {
  return BOT_RE.test(ua)
}

// ── HTML helpers ──────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildHtml(opts: {
  title: string
  description: string
  image: string
  url: string
  type?: string
}): string {
  const t = esc(opts.title)
  const d = esc(opts.description)
  const i = esc(opts.image)
  const u = esc(opts.url)
  const tp = esc(opts.type ?? 'website')
  return `<!DOCTYPE html>
<html lang="en-KE">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${t}</title>
<meta name="description" content="${d}"/>
<!-- Open Graph -->
<meta property="og:title" content="${t}"/>
<meta property="og:description" content="${d}"/>
<meta property="og:image" content="${i}"/>
<meta property="og:image:secure_url" content="${i}"/>
<meta property="og:url" content="${u}"/>
<meta property="og:type" content="${tp}"/>
<meta property="og:site_name" content="${esc(SITE_NAME)}"/>
<meta property="og:locale" content="en_KE"/>
<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@wet3camp"/>
<meta name="twitter:title" content="${t}"/>
<meta name="twitter:description" content="${d}"/>
<meta name="twitter:image" content="${i}"/>
<meta name="twitter:image:src" content="${i}"/>
<!-- Canonical -->
<link rel="canonical" href="${u}"/>
</head>
<body>
<p><a href="${u}">${t}</a></p>
</body>
</html>`
}

// ── DB lookup ─────────────────────────────────────────────────────────────────
async function findEscortBySlug(slug: string): Promise<any | null> {
  const pool = getPool()
  if (!pool) return null
  try {
    let rows: any[]

    // Numeric ID → direct lookup
    if (/^\d+$/.test(slug)) {
      const [r] = await pool.query<any[]>(
        `SELECT e.id, e.name, e.age, e.city, e.area, e.tier, e.bio,
                COALESCE(NULLIF(e.image,''), eg.image_url) AS image
         FROM escorts e
         LEFT JOIN escort_gallery eg ON eg.escort_id = e.id
         WHERE e.id = ? AND e.is_active = 1
         ORDER BY eg.sort_order ASC
         LIMIT 1`,
        [slug],
      )
      rows = Array.isArray(r) ? r : []
    } else {
      // Slug → match by name slug (fix: wrap OR in parens so AND applies to both branches)
      const [r] = await pool.query<any[]>(
        `SELECT e.id, e.name, e.age, e.city, e.area, e.tier, e.bio,
                COALESCE(NULLIF(e.image,''), eg.image_url) AS image
         FROM escorts e
         LEFT JOIN escort_gallery eg ON eg.escort_id = e.id
         WHERE (
           LOWER(REPLACE(REPLACE(REPLACE(e.name, ' ', '-'), '.', ''), ',', '')) = ?
           OR LOWER(e.name) = ?
         )
         AND e.is_active = 1
         ORDER BY eg.sort_order ASC
         LIMIT 1`,
        [slug.toLowerCase(), slug.replace(/-/g, ' ').toLowerCase()],
      )
      rows = Array.isArray(r) ? r : []
    }

    return rows.length > 0 ? rows[0] : null
  } catch {
    return null
  }
}

// ── Per-page static OG data ───────────────────────────────────────────────────
interface PageOg { title: string; description: string; image?: string; type?: string }

const PAGE_OG: Record<string, PageOg> = {
  '/': {
    title: "Wet3Camp — Kenya's #1 Escort Directory | Nairobi, Mombasa, Kisumu",
    description: "Browse 1,200+ verified escorts in Nairobi, Mombasa, Kisumu & across Kenya. Elite, VIP & premium. Join free.",
  },
  '/search': {
    title: 'Search Escorts in Kenya | Wet3Camp',
    description: 'Find verified escorts near you. Filter by city, area, tier, and service. Nairobi, Mombasa, Kisumu and more.',
  },
  '/rooms': {
    title: 'Hotel Rooms & Discreet Spaces in Kenya | Wet3Camp',
    description: 'Book discreet hotel rooms and private spaces across Kenya. Hourly and overnight bookings available on Wet3Camp.',
  },
  '/live': {
    title: 'Live Streams — Escorts Online Now | Wet3Camp',
    description: 'Watch verified escorts live right now on Wet3Camp. See who is streaming across Kenya.',
  },
  '/feeds': {
    title: 'Escort Feeds & Latest Updates | Wet3Camp',
    description: 'Latest photos, posts and updates from verified escorts across Kenya on Wet3Camp.',
  },
  '/events': {
    title: 'Escort Events in Kenya | Wet3Camp',
    description: 'Upcoming events, parties and gatherings featuring escorts across Kenya on Wet3Camp.',
  },
  '/tours': {
    title: 'Escort Tour Companions in Kenya | Wet3Camp',
    description: 'Book escort travel companions for tours across Kenya. Nairobi, Mombasa, Diani Beach and beyond.',
  },
  '/shop': {
    title: 'Escort Shop | Wet3Camp',
    description: 'Shop exclusive items from verified escorts on Wet3Camp Kenya.',
  },
  '/blog': {
    title: 'Escort Blog — Guides & Stories | Wet3Camp',
    description: "Tips, guides and stories about escorts in Kenya. Kenya's #1 escort blog on Wet3Camp.",
    type: 'article',
  },
  '/reviews': {
    title: 'Escort Reviews Kenya | Wet3Camp',
    description: 'Read verified client reviews of escorts in Kenya. Find top-rated escorts in Nairobi, Mombasa and across Kenya.',
  },
  '/adverts': {
    title: 'Featured Escort Adverts | Wet3Camp',
    description: 'Featured escort adverts from verified escorts across Kenya on Wet3Camp.',
  },
  '/blacklist': {
    title: 'Blacklisted Clients | Wet3Camp',
    description: 'Safety first — problematic clients reported by escorts across Kenya. Stay safe on Wet3Camp.',
  },
  '/faqs': {
    title: 'Frequently Asked Questions | Wet3Camp',
    description: "Everything you need to know about using Wet3Camp — Kenya's #1 escort directory.",
  },
  '/contact': {
    title: 'Contact Us | Wet3Camp',
    description: 'Get in touch with the Wet3Camp team. Support, partnerships and enquiries.',
  },
  '/testimonials': {
    title: 'Client Testimonials | Wet3Camp',
    description: "What clients say about Wet3Camp — Kenya's most trusted escort directory.",
  },
  '/register': {
    title: 'Join Free — Create Your Account | Wet3Camp',
    description: 'Create your free account on Wet3Camp and connect with 1,200+ verified escorts across Kenya.',
  },
  '/login': {
    title: 'Sign In | Wet3Camp',
    description: 'Sign in to your Wet3Camp account to manage bookings, messages and favourites.',
  },
  '/exclusive': {
    title: 'Exclusive VIP Escorts | Wet3Camp',
    description: 'Access Wet3Camp\'s most exclusive VIP and Elite escort profiles. Premium service across Kenya.',
  },
  '/tier-benefits': {
    title: 'Escort Tier Benefits — Elite, VIP, Premium | Wet3Camp',
    description: 'Compare Wet3Camp escort tiers — Elite, VIP, Premium and Standard. Find the right escort for you.',
  },
}

// ── Main middleware ────────────────────────────────────────────────────────────
export function ogPreviewMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only intercept GET requests from bots
  if (req.method !== 'GET') { next(); return }
  const ua = req.headers['user-agent'] ?? ''
  if (!isBot(ua)) { next(); return }

  const url = req.path
  const fullUrl = `${SITE_URL}${url}`

  // ── Escort profile: /@slug or /profile/:id-or-slug ─────────────────────────
  const atMatch = url.match(/^\/@([^/?#]+)/)
  const profileMatch = url.match(/^\/profile\/([^/?#]+)/)
  const slug = atMatch?.[1] ?? profileMatch?.[1]

  if (slug) {
    findEscortBySlug(slug)
      .then(escort => {
        if (escort) {
          const tier = (escort.tier ?? 'premium')
          const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
          const area = escort.area ? `${escort.area}, ` : ''
          const age = escort.age ? `, ${escort.age}` : ''
          const bio = ((escort.bio as string) ?? '').replace(/\n/g, ' ').trim().slice(0, 150)
          const title = `${escort.name}${age} — ${tierLabel} Escort in ${area}${escort.city} | ${SITE_NAME}`
          const description = bio
            ? `${bio}${bio.length >= 150 ? '…' : ''} — Book ${escort.name} on Wet3Camp, Kenya's #1 escort directory.`
            : `Verified ${tierLabel.toLowerCase()} escort in ${escort.city}, Kenya. Book ${escort.name} on Wet3Camp.`
          const image = ogImage((escort.image as string) || '')

          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
          res.send(buildHtml({ title, description, image, url: fullUrl, type: 'profile' }))
        } else {
          // Unknown escort slug — default fallback
          const def = PAGE_OG['/']!
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.send(buildHtml({ title: def.title, description: def.description, image: DEFAULT_IMAGE, url: fullUrl }))
        }
      })
      .catch(() => next())
    return
  }

  // ── Blog post: /blog/:slug ─────────────────────────────────────────────────
  // Blog posts are static data (data/blog.ts). We keep a slug→meta map here
  // so bots get the correct image and title without needing a DB round-trip.
  const BLOG_OG: Record<string, { title: string; description: string; image: string }> = {
    'how-to-find-verified-escorts-nairobi': {
      title: 'How to Find Verified Escorts in Nairobi | Wet3Camp',
      description: 'A practical guide to finding verified, safe escorts in Nairobi. Tips on checking profiles, reviews, and booking safely on Wet3Camp.',
      image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    },
    'mombasa-escort-guide-2025': {
      title: 'Mombasa Escort Guide 2025 | Wet3Camp',
      description: 'Everything you need to know about finding and booking escorts in Mombasa. Top areas, rates, and tips for 2025.',
      image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1200&h=630&fit=crop',
    },
    'escort-safety-tips-kenya': {
      title: 'Escort Safety Tips in Kenya | Wet3Camp',
      description: 'Essential safety tips for clients and escorts in Kenya. How to stay safe, verify profiles, and have a positive experience.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=630&fit=crop',
    },
  }

  const blogMatch = url.match(/^\/blog\/([^/?#]+)/)
  if (blogMatch) {
    const bslug = blogMatch[1]
    const staticBlog = BLOG_OG[bslug]
    if (staticBlog) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.send(buildHtml({ ...staticBlog, url: fullUrl, type: 'article' }))
      return
    }

    // Fallback: try DB (for dynamically created posts)
    const pool = getPool()
    const blogFallback = () => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=600')
      res.send(buildHtml({
        title: 'Escort Blog | Wet3Camp',
        description: 'Read the latest escort guides and stories from Kenya on Wet3Camp.',
        image: DEFAULT_IMAGE,
        url: fullUrl,
        type: 'article',
      }))
    }
    if (!pool) { blogFallback(); return }
    pool.query<any[]>(
      'SELECT title, excerpt, image_url, image FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1',
      [bslug]
    )
      .then(([rows]) => {
        const post = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
        if (post) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=600')
          res.send(buildHtml({
            title: `${post.title} | Wet3Camp`,
            description: post.excerpt ?? 'Read more on Wet3Camp.',
            image: ogImage(post.image_url || post.image),
            url: fullUrl,
            type: 'article',
          }))
        } else {
          blogFallback()
        }
      })
      .catch(() => blogFallback())
    return
  }

  // ── Live stream: /live/:escortId ───────────────────────────────────────────
  const liveMatch = url.match(/^\/live\/(\d+)/)
  if (liveMatch) {
    const pool = getPool()
    if (pool) {
      pool.query<any[]>(
        'SELECT name, city, image, tier FROM escorts WHERE id = ? AND is_active = 1 LIMIT 1',
        [liveMatch[1]],
      )
        .then(([rows]) => {
          const e = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.send(buildHtml({
            title: e ? `${e.name} is Live Now 🔴 | Wet3Camp` : 'Live Escort Stream | Wet3Camp',
            description: e
              ? `Watch ${e.name} live right now on Wet3Camp. ${e.city} escort streaming live.`
              : 'An escort is streaming live right now on Wet3Camp Kenya.',
            image: ogImage(e?.image),
            url: fullUrl,
          }))
        })
        .catch(() => next())
      return
    }
  }

  // ── Static pages ───────────────────────────────────────────────────────────
  const pathKey = url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url

  // Homepage: dynamically show the latest active escort photo
  if (pathKey === '/') {
    const pool = getPool()
    if (pool) {
      pool.query<any[]>(
        `SELECT e.name, e.city, e.tier,
                COALESCE(NULLIF(e.image,''), eg.image_url) AS image
         FROM escorts e
         LEFT JOIN escort_gallery eg ON eg.escort_id = e.id
         WHERE e.is_active = 1
         ORDER BY e.id DESC, eg.sort_order ASC
         LIMIT 5`
      )
        .then(([rows]) => {
          const featured = Array.isArray(rows) ? rows : []
          // Pick first escort that has any image
          const pick = featured.find((r: any) => r.image && r.image.trim()) ?? featured[0]
          const homeMeta = PAGE_OG['/']!
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
          res.send(buildHtml({
            title: homeMeta.title,
            description: pick
              ? `Meet ${pick.name} and 1,200+ verified escorts in ${pick.city} and across Kenya. Browse free on Wet3Camp.`
              : homeMeta.description,
            image: pick?.image ? ogImage(pick.image) : DEFAULT_IMAGE,
            url: fullUrl,
          }))
        })
        .catch(() => {
          const def = PAGE_OG['/']!
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=60')
          res.send(buildHtml({ title: def.title, description: def.description, image: DEFAULT_IMAGE, url: fullUrl }))
        })
      return
    }
  }

  const staticOg = PAGE_OG[pathKey]
  if (staticOg) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(buildHtml({
      title: staticOg.title,
      description: staticOg.description,
      image: staticOg.image ?? DEFAULT_IMAGE,
      url: fullUrl,
      type: staticOg.type,
    }))
    return
  }

  // ── Default passthrough ────────────────────────────────────────────────────
  next()
}
