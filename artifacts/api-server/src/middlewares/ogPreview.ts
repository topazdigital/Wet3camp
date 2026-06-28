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
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:type" content="image/jpeg"/>
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
    // Numeric ID → direct lookup
    if (/^\d+$/.test(slug)) {
      const [rows] = await pool.query<any[]>(
        'SELECT id, name, age, city, area, tier, bio, image FROM escorts WHERE id = ? AND is_active = 1 LIMIT 1',
        [slug],
      )
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
    }
    // Slug → match by converting name to slug (lowercase, hyphens)
    // MySQL: LOWER(REPLACE(REPLACE(name, ' ', '-'), '.', ''))
    const [rows] = await pool.query<any[]>(
      `SELECT id, name, age, city, area, tier, bio, image FROM escorts
       WHERE LOWER(REPLACE(REPLACE(name, ' ', '-'), '.', '')) = ?
          OR LOWER(name) = ?
       AND is_active = 1
       LIMIT 1`,
      [slug.toLowerCase(), slug.replace(/-/g, ' ').toLowerCase()],
    )
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
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
          const rawImg = (escort.image as string) || ''
          const image = rawImg
            ? (rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg}`)
            : DEFAULT_IMAGE

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
  const blogMatch = url.match(/^\/blog\/([^/?#]+)/)
  if (blogMatch) {
    const pool = getPool()
    const fallback = () => {
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

    if (!pool) { fallback(); return }

    // Try to fetch blog post from DB (if stored there)
    pool.query<any[]>('SELECT title, excerpt, image, slug FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1', [blogMatch[1]])
      .then(([rows]) => {
        const post = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
        if (post) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=600')
          res.send(buildHtml({
            title: `${post.title} | Wet3Camp`,
            description: post.excerpt ?? 'Read more on Wet3Camp.',
            image: post.image || DEFAULT_IMAGE,
            url: fullUrl,
            type: 'article',
          }))
        } else {
          fallback()
        }
      })
      .catch(() => fallback())
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
            image: e?.image || DEFAULT_IMAGE,
            url: fullUrl,
          }))
        })
        .catch(() => next())
      return
    }
  }

  // ── Static pages ───────────────────────────────────────────────────────────
  // Strip trailing slash for lookup
  const pathKey = url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url
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
