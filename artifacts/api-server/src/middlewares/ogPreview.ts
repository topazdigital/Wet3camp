// =============================================================================
// OG Preview + SEO Middleware
// =============================================================================
// Social crawlers (WhatsApp, Telegram, Facebook, Twitter/X, Slack, Discord, etc.)
// and search bots (Googlebot, Bingbot, etc.) don't execute JavaScript.
// They read the raw HTML <head> for Open Graph tags and JSON-LD structured data.
// This middleware detects bots, fetches real data, and returns rich HTML with:
//   - og:* and twitter:* meta tags (social sharing)
//   - JSON-LD structured data (Google rich results)
//   - keywords, robots, canonical, geo meta tags (SEO)
//   - Dynamic DB queries per page type
// Regular browsers are passed straight through to the SPA.
// =============================================================================

import type { Request, Response, NextFunction } from 'express'
import { getPool } from '../lib/db.js'

const SITE_URL  = 'https://wet3.camp'
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`
const SITE_NAME = 'Wet3 Camp'

// ── Image URL normaliser ──────────────────────────────────────────────────────
function ogImage(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return DEFAULT_IMAGE
  const s = raw.trim()
  if (s.startsWith(SITE_URL))             return s
  if (s.startsWith('/api/uploads/'))      return `${SITE_URL}${s}`
  if (s.startsWith('/uploads/'))          return `${SITE_URL}/api${s}`
  if (s.startsWith('http://') || s.startsWith('https://'))
    return `${SITE_URL}/api/image-proxy?url=${encodeURIComponent(s)}`
  if (/\.(jpe?g|png|webp|gif|avif)$/i.test(s)) return `${SITE_URL}/api/uploads/${s}`
  if (s.startsWith('/')) return `${SITE_URL}${s}`
  return DEFAULT_IMAGE
}

// ── Bot detection ─────────────────────────────────────────────────────────────
const BOT_RE =
  /facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|linkedinbot|slackbot|discordbot|applebot|googlebot|bingbot|yandex|duckduckbot|pinterest|skypeuripreview|nuzzel|outbrain|flipboard|tumblr|vkshare|w3c_validator|baiduspider|embedly|quora|ia_archiver|semrush|ahrefs|mj12bot|rogerbot|dotbot|petalbot/i

function isBot(ua: string): boolean { return BOT_RE.test(ua) }

// ── XML/HTML escape ───────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Build full HTML for bots ──────────────────────────────────────────────────
function buildHtml(opts: {
  title:       string
  description: string
  image:       string
  url:         string
  keywords?:   string
  type?:       string
  schema?:     object | object[]
}): string {
  const t   = esc(opts.title)
  const d   = esc(opts.description)
  const i   = esc(opts.image)
  const u   = esc(opts.url)
  const tp  = esc(opts.type ?? 'website')
  const kw  = opts.keywords ? esc(opts.keywords) : ''
  const jsonLd = opts.schema
    ? `<script type="application/ld+json">${JSON.stringify(opts.schema)}</script>`
    : ''

  return `<!DOCTYPE html>
<html lang="en-KE">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${t}</title>
<meta name="description" content="${d}"/>
${kw ? `<meta name="keywords" content="${kw}"/>` : ''}
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"/>
<meta name="author" content="Wet3 Camp"/>
<meta name="geo.region" content="KE"/>
<meta name="geo.placename" content="Kenya"/>
<!-- Open Graph -->
<meta property="og:title" content="${t}"/>
<meta property="og:description" content="${d}"/>
<meta property="og:image" content="${i}"/>
<meta property="og:image:secure_url" content="${i}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
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
${jsonLd}
</head>
<body>
<h1><a href="${u}">${t}</a></h1>
<p>${d}</p>
</body>
</html>`
}

// ── Shared base schemas (added to every page) ─────────────────────────────────
const BASE_SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ['Wet3Camp', 'wet3.camp', 'Kenya Escort Directory'],
    url: SITE_URL,
    description: "Kenya's #1 escort directory. 1,200+ verified escorts in Nairobi, Mombasa, Kisumu and across Kenya.",
    inLanguage: 'en-KE',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg`, width: 512, height: 512 },
    description: "Kenya's #1 escort directory. Verified escorts across Nairobi, Mombasa, Kisumu and all major Kenyan cities.",
    areaServed: [
      { '@type': 'City', name: 'Nairobi', addressCountry: 'KE' },
      { '@type': 'City', name: 'Mombasa', addressCountry: 'KE' },
      { '@type': 'City', name: 'Kisumu',  addressCountry: 'KE' },
      { '@type': 'City', name: 'Nakuru',  addressCountry: 'KE' },
      { '@type': 'City', name: 'Eldoret', addressCountry: 'KE' },
      { '@type': 'Country', name: 'Kenya' },
    ],
    sameAs: ['https://twitter.com/wet3camp'],
  },
]

const HOMEPAGE_EXTRA_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#business`,
  name: 'Wet3 Camp — Kenya Escort Directory',
  url: SITE_URL,
  description: "Kenya's largest escort directory. Find verified female escorts in Nairobi (Westlands, Karen, Kilimani, CBD), Mombasa (Nyali, Bamburi, Diani), Kisumu, Nakuru, Eldoret and across Kenya.",
  image: `${SITE_URL}/opengraph.jpg`,
  priceRange: 'KES 2,000 — KES 50,000',
  address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'KE' },
  geo: { '@type': 'GeoCoordinates', latitude: -1.2921, longitude: 36.8219 },
  areaServed: { '@type': 'Country', name: 'Kenya' },
  telephone: null,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '1247',
    bestRating: '5',
  },
}

// ── City coords for LocalBusiness schema ──────────────────────────────────────
const CITY_GEO: Record<string, { lat: number; lng: number; region: string }> = {
  Nairobi: { lat: -1.2921, lng: 36.8219, region: 'Nairobi County' },
  Mombasa: { lat: -4.0435, lng: 39.6682, region: 'Mombasa County' },
  Kisumu:  { lat: -0.1022, lng: 34.7617, region: 'Kisumu County' },
  Nakuru:  { lat: -0.3031, lng: 36.0800, region: 'Nakuru County' },
  Eldoret: { lat:  0.5143, lng: 35.2698, region: 'Uasin Gishu County' },
  Thika:   { lat: -1.0332, lng: 37.0693, region: 'Kiambu County' },
  Malindi: { lat: -3.2183, lng: 40.1169, region: 'Kilifi County' },
  Diani:   { lat: -4.2761, lng: 39.5928, region: 'Kwale County' },
}

// ── Master keyword list (subset — keeps HTML small) ───────────────────────────
const BASE_KW = [
  'Nairobi escorts', 'Mombasa escorts', 'Kenya escorts', 'escort Kenya',
  'verified escorts Nairobi', 'call girl Nairobi', 'call girl Kenya',
  'nairobi raha', 'raha za nairobi', 'escort directory Kenya',
  'female escorts Kenya', 'VIP escort Nairobi', 'elite escort Kenya',
  'escort booking Kenya', 'escort near me Kenya', 'escort agency Nairobi',
  'independent escort Nairobi', 'incall escort Nairobi', 'outcall escort Kenya',
  'girlfriend experience Kenya', 'GFE escort Nairobi',
].join(', ')

// ── DB escort lookup ──────────────────────────────────────────────────────────
async function findEscortBySlug(slug: string): Promise<any | null> {
  const pool = getPool()
  if (!pool) return null
  try {
    let rows: any[]
    if (/^\d+$/.test(slug)) {
      const [r] = await pool.query<any[]>(
        `SELECT e.id, e.name, e.age, e.city, e.area, e.tier, e.bio,
                e.incall, e.outcall, e.price_incall, e.price_hourly, e.rating,
                COALESCE(NULLIF(e.image,''), eg.image_url) AS image
         FROM escorts e
         LEFT JOIN escort_gallery eg ON eg.escort_id = e.id
         WHERE e.id = ? AND e.is_active = 1
         ORDER BY eg.sort_order ASC LIMIT 1`,
        [slug],
      )
      rows = Array.isArray(r) ? r : []
    } else {
      const [r] = await pool.query<any[]>(
        `SELECT e.id, e.name, e.age, e.city, e.area, e.tier, e.bio,
                e.incall, e.outcall, e.price_incall, e.price_hourly, e.rating,
                COALESCE(NULLIF(e.image,''), eg.image_url) AS image
         FROM escorts e
         LEFT JOIN escort_gallery eg ON eg.escort_id = e.id
         WHERE (
           LOWER(REPLACE(REPLACE(REPLACE(e.name, ' ', '-'), '.', ''), ',', '')) = ?
           OR LOWER(e.name) = ?
         ) AND e.is_active = 1
         ORDER BY eg.sort_order ASC LIMIT 1`,
        [slug.toLowerCase(), slug.replace(/-/g, ' ').toLowerCase()],
      )
      rows = Array.isArray(r) ? r : []
    }
    return rows.length > 0 ? rows[0] : null
  } catch { return null }
}

// ── Fetch a featured photo from DB by city ────────────────────────────────────
async function fetchCityPhoto(city?: string): Promise<string> {
  const pool = getPool()
  if (!pool) return DEFAULT_IMAGE
  try {
    const cityFilter = city ? `AND e.city = ?` : ''
    const params: any[] = city ? [city] : []
    const [rows] = await pool.query<any[]>(
      `SELECT COALESCE(NULLIF(e.image,''), eg.image_url) AS image
       FROM escorts e
       LEFT JOIN escort_gallery eg ON eg.escort_id = e.id
       WHERE e.is_active = 1 ${cityFilter}
       HAVING image IS NOT NULL AND image != ''
       ORDER BY e.featured DESC, e.rating DESC LIMIT 5`,
      params
    )
    const list = Array.isArray(rows) ? rows : []
    const pick = list.find((r: any) => r.image?.trim())
    return pick?.image ? ogImage(pick.image) : DEFAULT_IMAGE
  } catch { return DEFAULT_IMAGE }
}

// ── Per-page static OG data ───────────────────────────────────────────────────
interface PageOg { title: string; description: string; keywords?: string; image?: string; type?: string }

const PAGE_OG: Record<string, PageOg> = {
  '/': {
    title: "Wet3Camp — Kenya's #1 Escort Directory | Nairobi, Mombasa, Kisumu",
    description: "Browse 1,200+ verified escorts in Nairobi, Mombasa, Kisumu & across Kenya. Elite, VIP & premium female escorts. Discreet bookings. Join free today.",
    keywords: BASE_KW,
  },
  '/search': {
    title: 'Search Escorts in Kenya | Wet3Camp — Find Verified Escorts Near You',
    description: 'Find verified escorts near you. Filter by city, area, tier, and service. Nairobi, Mombasa, Kisumu and all major Kenyan cities.',
    keywords: `${BASE_KW}, find escort Kenya, escort search, escort near me`,
  },
  '/exclusive': {
    title: "Exclusive VIP & Elite Escorts in Kenya | Wet3Camp",
    description: "Access Wet3Camp's most exclusive VIP and Elite escort profiles. Premium verified escorts in Nairobi, Mombasa and across Kenya. The finest companion experience.",
    keywords: `elite escorts Kenya, VIP escorts Nairobi, exclusive escorts Kenya, high class escorts Nairobi, luxury escort Kenya, ${BASE_KW}`,
  },
  '/adverts': {
    title: 'Featured Escort Adverts in Kenya | Wet3Camp',
    description: 'Browse featured escort adverts from verified escorts across Kenya. Nairobi, Mombasa, Kisumu — top escorts advertising on Wet3Camp.',
    keywords: `escort adverts Kenya, escort ads Nairobi, featured escorts Kenya, ${BASE_KW}`,
  },
  '/feeds': {
    title: "Escort Feeds & Latest Updates — Kenya's Escorts | Wet3Camp",
    description: 'Latest photos, posts and updates from verified escorts across Kenya. Follow your favourite escorts on Wet3Camp.',
    keywords: `escort photos Kenya, escort updates Nairobi, escort feed Kenya, ${BASE_KW}`,
  },
  '/live': {
    title: 'Escorts Live Now — Watch Live Streams | Wet3Camp Kenya',
    description: 'Watch verified escorts live right now on Wet3Camp. Kenyan escorts streaming live from Nairobi, Mombasa and across Kenya.',
    keywords: `escort live stream Kenya, escort live Nairobi, watch escort online Kenya, cam escort Kenya, ${BASE_KW}`,
  },
  '/events': {
    title: 'Escort Events & Parties in Kenya | Wet3Camp',
    description: 'Upcoming escort events, parties and gatherings across Kenya. Nairobi nightlife, Mombasa beach parties, VIP escort events on Wet3Camp.',
    keywords: `escort events Kenya, escort party Nairobi, nightlife escort Kenya, escort companion events, ${BASE_KW}`,
  },
  '/tours': {
    title: 'Escort Travel Companions in Kenya — Tours & Trips | Wet3Camp',
    description: 'Book escort travel companions for tours, safaris and trips across Kenya. Nairobi, Mombasa, Diani Beach, Maasai Mara and beyond.',
    keywords: `escort travel Kenya, escort tour companion Kenya, safari escort Kenya, travel companion Nairobi, escort trips Kenya, ${BASE_KW}`,
  },
  '/rooms': {
    title: 'Discreet Hotel Rooms & Spaces in Kenya | Wet3Camp',
    description: 'Book discreet hotel rooms and private spaces across Kenya. Hourly and overnight bookings in Nairobi, Mombasa and across Kenya.',
    keywords: `discreet rooms Kenya, hotel escort Nairobi, incall rooms Kenya, escort room booking Kenya, ${BASE_KW}`,
  },
  '/shop': {
    title: "Escort Shop — Buy from Verified Escorts | Wet3Camp Kenya",
    description: 'Shop exclusive items and content from verified escorts on Wet3Camp Kenya. Photos, videos and exclusive content from your favourite escorts.',
    keywords: `escort shop Kenya, buy escort content Kenya, escort photos shop, ${BASE_KW}`,
  },
  '/reviews': {
    title: 'Escort Reviews Kenya — Read Verified Client Reviews | Wet3Camp',
    description: 'Read verified client reviews of escorts in Kenya. Find the best-rated escorts in Nairobi, Mombasa and across Kenya on Wet3Camp.',
    keywords: `escort reviews Kenya, best escorts Nairobi rated, top rated escort Kenya, escort ratings, client reviews escorts Kenya, ${BASE_KW}`,
  },
  '/blog': {
    title: "Escort Blog — Kenya Escort Guides & Stories | Wet3Camp",
    description: "Tips, guides and stories about escorts in Kenya. Kenya's #1 escort blog covering Nairobi, Mombasa, safety tips, booking guides and more.",
    keywords: `escort blog Kenya, escort guide Nairobi, escort tips Kenya, how to book escort Kenya, escort safety Kenya, ${BASE_KW}`,
    type: 'article',
  },
  '/blacklist': {
    title: 'Blacklisted Clients — Stay Safe | Wet3Camp Kenya',
    description: 'Problematic clients reported by escorts across Kenya. Stay safe — check the blacklist before bookings on Wet3Camp.',
    keywords: `escort blacklist Kenya, unsafe clients Nairobi, escort safety Kenya, ${BASE_KW}`,
  },
  '/faqs': {
    title: "Escort FAQs — Everything You Need to Know | Wet3Camp",
    description: "Answers to common questions about using Wet3Camp — Kenya's #1 escort directory. Booking, verification, safety and more.",
    keywords: `escort FAQ Kenya, how to book escort Nairobi, escort verification Kenya, escort booking guide, ${BASE_KW}`,
  },
  '/contact': {
    title: 'Contact Wet3Camp — Support & Enquiries | Kenya Escort Directory',
    description: 'Get in touch with the Wet3Camp team. Support, partnerships, advertising and general enquiries for Kenya\'s #1 escort directory.',
    keywords: `contact wet3camp, escort site support Kenya, ${BASE_KW}`,
  },
  '/testimonials': {
    title: "Client Testimonials — What People Say | Wet3Camp Kenya",
    description: "What clients say about Wet3Camp — Kenya's most trusted escort directory. Real reviews from verified clients across Kenya.",
    keywords: `wet3camp reviews, escort site Kenya testimonials, client feedback wet3camp, ${BASE_KW}`,
  },
  '/register': {
    title: 'Join Free — Create Your Account | Wet3Camp Kenya',
    description: 'Create your free account on Wet3Camp and connect with 1,200+ verified escorts across Kenya. Free to join as a client or register as an escort.',
    keywords: `join wet3camp, escort registration Kenya, create escort profile Kenya, ${BASE_KW}`,
  },
  '/login': {
    title: 'Sign In to Wet3Camp | Kenya Escort Directory',
    description: 'Sign in to your Wet3Camp account to manage bookings, messages and favourites.',
    keywords: BASE_KW,
  },
  '/tier-benefits': {
    title: "Escort Tier Benefits — Elite, VIP, Premium | Wet3Camp Kenya",
    description: "Compare Wet3Camp escort tiers — Elite, VIP, Premium and Standard. Find the right escort tier for you across Kenya.",
    keywords: `elite escort Kenya benefits, VIP escort tier Kenya, premium escort Kenya, escort tier Nairobi, ${BASE_KW}`,
  },
  '/install': {
    title: 'Install Wet3Camp App | Kenya Escort Directory PWA',
    description: 'Install the Wet3Camp app for quick access to Kenya\'s #1 escort directory. Available as a PWA on Android and iOS.',
    keywords: `wet3camp app, escort app Kenya, install escort app Nairobi, ${BASE_KW}`,
  },
}

// ── Blog posts — all 15 slugs with rich data ───────────────────────────────────
const BLOG_OG: Record<string, { title: string; description: string; image: string; keywords: string }> = {
  'how-to-find-verified-escorts-nairobi': {
    title: 'How to Find Verified Escorts in Nairobi (2025 Guide) | Wet3Camp',
    description: 'A practical 2025 guide to finding verified, safe escorts in Nairobi. Check profiles, read reviews, and book safely on Wet3Camp — Kenya\'s #1 escort directory.',
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `how to find escort Nairobi, verified escorts Nairobi, escort guide Nairobi 2025, safe escort booking Nairobi, ${BASE_KW}`,
  },
  'top-escort-areas-nairobi-guide-2025': {
    title: 'Top Escort Areas in Nairobi — Westlands, Karen, CBD & More | Wet3Camp',
    description: 'The complete guide to Nairobi\'s top escort areas: Westlands, Karen, Kilimani, CBD, Lavington, Parklands. Find the best escorts near you in 2025.',
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `Nairobi escort areas, Westlands escort, Karen escort Nairobi, Kilimani escort, CBD escort Nairobi, Lavington escort, escort near me Nairobi, ${BASE_KW}`,
  },
  'mombasa-escort-guide-complete': {
    title: 'Mombasa Escort Guide 2025 — Nyali, Bamburi, Diani | Wet3Camp',
    description: 'The complete guide to finding escorts in Mombasa. Top areas: Nyali, Bamburi, Diani Beach, Mtwapa. Verified escort profiles, rates & tips for 2025.',
    image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1200&h=630&fit=crop',
    keywords: `Mombasa escort guide, Nyali escort, Bamburi escort, Diani escort, Mtwapa escort, coast escort Kenya, escort Mombasa 2025, ${BASE_KW}`,
  },
  'escort-booking-safety-tips-kenya': {
    title: 'Escort Booking Safety Tips in Kenya — Stay Safe | Wet3Camp',
    description: 'Essential safety tips for clients booking escorts in Kenya. How to verify profiles, spot fakes, arrange safe meetups, and have a positive experience.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=630&fit=crop',
    keywords: `escort safety tips Kenya, safe escort booking Nairobi, verify escort Kenya, escort scam Kenya, fake escort Kenya, ${BASE_KW}`,
  },
  'vip-elite-escort-services-nairobi': {
    title: 'VIP & Elite Escort Services in Nairobi | Wet3Camp',
    description: 'Discover Nairobi\'s finest VIP and Elite escorts. High-class companion experiences, luxury hotels, dinner dates and overnights. Verified elite escort profiles.',
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `VIP escort Nairobi, elite escort Nairobi, high class escort Kenya, luxury escort Nairobi, exclusive escort Nairobi, ${BASE_KW}`,
  },
  'girlfriend-experience-gfe-nairobi': {
    title: 'Girlfriend Experience (GFE) in Nairobi — Escorts | Wet3Camp',
    description: 'Looking for the girlfriend experience in Nairobi? Discover GFE escorts across Nairobi\'s top areas — Westlands, Karen, Kilimani and beyond on Wet3Camp.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=630&fit=crop',
    keywords: `GFE escort Nairobi, girlfriend experience Kenya, GFE escort Kenya, girlfriend experience Nairobi, GFE Westlands, GFE Karen, ${BASE_KW}`,
  },
  'nairobi-nightlife-escort-guide': {
    title: "Nairobi Nightlife & Escort Guide 2025 | Wet3Camp",
    description: "Your guide to Nairobi's nightlife and escort scene. Top clubs, hotels, and verified escort companions for a memorable night in Nairobi.",
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `Nairobi nightlife escorts, nightlife escort Nairobi, escort night out Nairobi, party escort Nairobi, club escort Nairobi, ${BASE_KW}`,
  },
  'booking-escorts-westlands-karen': {
    title: 'Booking Escorts in Westlands & Karen, Nairobi | Wet3Camp',
    description: 'Find and book verified escorts in Westlands and Karen, Nairobi. Incall and outcall available. VIP, Premium and Elite escort profiles on Wet3Camp.',
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `Westlands escort, Karen escort, escort Westlands Nairobi, escort Karen Nairobi, incall Westlands, outcall Karen Nairobi, ${BASE_KW}`,
  },
  'elite-escorts-nairobi-cbd': {
    title: 'Elite Escorts in Nairobi CBD — Top Profiles | Wet3Camp',
    description: 'Elite and VIP escort profiles in Nairobi CBD. High-class companions available for incall and outcall in the Central Business District. Book on Wet3Camp.',
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `escort Nairobi CBD, CBD escort, elite escort CBD Nairobi, VIP escort CBD, incall CBD Nairobi, ${BASE_KW}`,
  },
  'escort-tours-kenya-2025': {
    title: "Escort Tour Companions in Kenya 2025 — Safaris & Trips | Wet3Camp",
    description: "Book escort travel companions for safaris, beach trips and tours across Kenya. Maasai Mara, Diani Beach, Amboseli, Nakuru and more — with Wet3Camp.",
    image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1200&h=630&fit=crop',
    keywords: `escort tour Kenya, safari escort, travel companion Kenya, escort trip Nairobi, escort holiday Kenya, ${BASE_KW}`,
  },
  'verified-escorts-mombasa-guide': {
    title: 'Verified Escorts in Mombasa — Complete Guide | Wet3Camp',
    description: 'Find verified escorts in Mombasa across Nyali, Bamburi, Diani Beach, Mtwapa, Tudor and more. Checked profiles, real photos, safe bookings on Wet3Camp.',
    image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1200&h=630&fit=crop',
    keywords: `verified escorts Mombasa, checked escort Mombasa, real escort Mombasa, escort Nyali, escort Bamburi, ${BASE_KW}`,
  },
  'kisumu-escort-guide-2025': {
    title: 'Escorts in Kisumu 2025 — Verified Profiles | Wet3Camp',
    description: "Your 2025 guide to verified escorts in Kisumu, Kenya. Find female escorts around Milimani, Kondele and Kisumu CBD on Wet3Camp — Kenya's #1 escort directory.",
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `escort Kisumu, Kisumu escort guide, female escort Kisumu, call girl Kisumu, escort Milimani Kisumu, ${BASE_KW}`,
  },
  'how-to-stay-safe-booking-escorts-kenya': {
    title: 'How to Stay Safe Booking Escorts in Kenya | Wet3Camp',
    description: 'A safety guide for clients booking escorts in Kenya. Learn how to verify profiles, use secure messaging, choose safe locations, and protect yourself.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=630&fit=crop',
    keywords: `escort safety Kenya, safe escort booking, protect yourself escort Kenya, verify escort profile, escort scam Kenya, ${BASE_KW}`,
  },
  'nakuru-eldoret-escort-guide': {
    title: 'Escorts in Nakuru & Eldoret — Guide 2025 | Wet3Camp',
    description: 'Find verified escorts in Nakuru and Eldoret, Kenya. Your 2025 guide to female escorts in the Rift Valley — profiles, rates and booking tips on Wet3Camp.',
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `escort Nakuru, escort Eldoret, Rift Valley escort Kenya, female escort Nakuru, escort Eldoret 2025, ${BASE_KW}`,
  },
  'best-escort-rates-nairobi-2025': {
    title: 'Escort Rates in Nairobi 2025 — Prices & Costs | Wet3Camp',
    description: 'What do escorts charge in Nairobi? A 2025 guide to escort rates — Standard, Premium, VIP and Elite pricing, incall vs outcall, hourly and overnight rates.',
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
    keywords: `escort rates Nairobi 2025, escort prices Kenya, how much escort Nairobi, incall rates escort Nairobi, outcall escort price Kenya, ${BASE_KW}`,
  },
}

// ── Main middleware ────────────────────────────────────────────────────────────
export function ogPreviewMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET') { next(); return }
  const ua = req.headers['user-agent'] ?? ''
  if (!isBot(ua)) { next(); return }

  const path    = req.path
  const query   = req.query as Record<string, string>
  const fullUrl = `${SITE_URL}${path}${Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : ''}`

  // ── Escort profile: /@slug or /profile/:id-or-slug ──────────────────────────
  const atMatch      = path.match(/^\/@([^/?#]+)/)
  const profileMatch = path.match(/^\/profile\/([^/?#]+)/)
  const slug = atMatch?.[1] ?? profileMatch?.[1]

  if (slug) {
    findEscortBySlug(slug)
      .then(escort => {
        if (!escort) {
          const def = PAGE_OG['/']!
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.send(buildHtml({ title: def.title, description: def.description, image: DEFAULT_IMAGE, url: fullUrl, keywords: def.keywords }))
          return
        }

        const tier       = (escort.tier ?? 'premium') as string
        const tierLabel  = tier.charAt(0).toUpperCase() + tier.slice(1)
        const area       = escort.area ? `${escort.area}, ` : ''
        const age        = escort.age  ? `, ${escort.age}`  : ''
        const bio        = ((escort.bio as string) ?? '').replace(/\n/g, ' ').trim()
        const price      = escort.price_incall || escort.price_hourly

        // Availability hint
        const avail: string[] = []
        if (escort.incall  === 1 || escort.incall  === '1') avail.push('incall')
        if (escort.outcall === 1 || escort.outcall === '1') avail.push('outcall')
        const availStr = avail.length ? ` Available for ${avail.join(' & ')}.` : ''

        const title = `${escort.name}${age} — ${tierLabel} Escort in ${area}${escort.city} | ${SITE_NAME}`

        let description: string
        if (bio && bio.length > 30) {
          const bioSnip = bio.slice(0, 140)
          description = `${bioSnip}${bio.length > 140 ? '…' : ''}${availStr} Book ${escort.name} on Wet3Camp.`
        } else {
          description = `Verified ${tierLabel.toLowerCase()} escort in ${area}${escort.city}, Kenya.${
            price ? ` From KES ${Number(price).toLocaleString()}.` : ''
          }${availStr} Book ${escort.name} on Wet3Camp — Kenya's #1 escort directory.`
        }

        const escortKw = [
          escort.name, `${escort.name} escort`, `${escort.name} ${escort.city}`,
          `${escort.name} wet3camp`, `escort ${escort.city}`, `${tierLabel.toLowerCase()} escort ${escort.city}`,
          area ? `escort ${escort.area}` : '', `call girl ${escort.city}`,
          `verified escort ${escort.city}`, BASE_KW,
        ].filter(Boolean).join(', ')

        const image = ogImage((escort.image as string) || '')

        // Person schema for Google
        const escortUrl = `${SITE_URL}/@${slug}`
        const personSchema = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': escortUrl,
          name: escort.name,
          url: escortUrl,
          image: image !== DEFAULT_IMAGE ? { '@type': 'ImageObject', url: image } : undefined,
          description: description,
          jobTitle: `${tierLabel} Escort`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: area.replace(', ', '') || escort.city,
            addressRegion: escort.city,
            addressCountry: 'KE',
          },
          ...(escort.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(escort.rating), bestRating: '5', reviewCount: '1' } } : {}),
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
        res.send(buildHtml({
          title, description, image, url: escortUrl,
          keywords: escortKw,
          type: 'profile',
          schema: [...BASE_SCHEMAS, personSchema],
        }))
      })
      .catch(() => next())
    return
  }

  // ── Blog post: /blog/:slug ──────────────────────────────────────────────────
  const blogMatch = path.match(/^\/blog\/([^/?#]+)/)
  if (blogMatch) {
    const bslug = blogMatch[1]
    const staticBlog = BLOG_OG[bslug]

    if (staticBlog) {
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: staticBlog.title,
        description: staticBlog.description,
        image: staticBlog.image,
        url: fullUrl,
        author: { '@type': 'Organization', name: SITE_NAME },
        publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` } },
        mainEntityOfPage: fullUrl,
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.send(buildHtml({
        ...staticBlog, url: fullUrl, type: 'article',
        schema: [...BASE_SCHEMAS, articleSchema],
      }))
      return
    }

    // DB fallback for dynamic blog posts
    const pool = getPool()
    const blogFallback = () => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=600')
      res.send(buildHtml({
        title: 'Escort Blog | Wet3Camp',
        description: 'Read the latest escort guides and stories from Kenya on Wet3Camp.',
        image: DEFAULT_IMAGE, url: fullUrl, type: 'article',
        keywords: PAGE_OG['/blog']?.keywords,
        schema: BASE_SCHEMAS,
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
            title: `${post.title} | ${SITE_NAME}`,
            description: post.excerpt ?? 'Read more on Wet3Camp.',
            image: ogImage(post.image_url || post.image),
            url: fullUrl, type: 'article',
            keywords: PAGE_OG['/blog']?.keywords,
            schema: BASE_SCHEMAS,
          }))
        } else { blogFallback() }
      })
      .catch(() => blogFallback())
    return
  }

  // ── Live stream: /live/:escortId ────────────────────────────────────────────
  const liveMatch = path.match(/^\/live\/(\d+)/)
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
            title: e ? `${e.name} is Live Now 🔴 | ${SITE_NAME}` : `Live Escort Stream | ${SITE_NAME}`,
            description: e
              ? `Watch ${e.name} live right now on Wet3Camp. ${e.city} escort streaming live.`
              : 'An escort is streaming live right now on Wet3Camp Kenya.',
            image: ogImage(e?.image),
            url: fullUrl,
            keywords: PAGE_OG['/live']?.keywords,
            schema: BASE_SCHEMAS,
          }))
        })
        .catch(() => next())
      return
    }
  }

  const pathKey = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path

  // ── Homepage: dynamic escort photo + structured data ─────────────────────────
  if (pathKey === '/') {
    const pool = getPool()
    if (pool) {
      pool.query<any[]>(
        `SELECT e.name, e.city, e.tier,
                COALESCE(NULLIF(e.image,''), eg.image_url) AS image
         FROM escorts e
         LEFT JOIN escort_gallery eg ON eg.escort_id = e.id
         WHERE e.is_active = 1
         ORDER BY e.featured DESC, e.rating DESC, e.id DESC, eg.sort_order ASC
         LIMIT 10`
      )
        .then(([rows]) => {
          const featured = Array.isArray(rows) ? rows : []
          const pick = featured.find((r: any) => r.image?.trim()) ?? featured[0]
          const homeMeta = PAGE_OG['/']!
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
          res.send(buildHtml({
            title: homeMeta.title,
            description: pick
              ? `Meet ${pick.name} and 1,200+ verified escorts in ${pick.city} and across Kenya. Elite, VIP & premium escorts. Browse free on Wet3Camp.`
              : homeMeta.description,
            image: pick?.image ? ogImage(pick.image) : DEFAULT_IMAGE,
            url: `${SITE_URL}/`,
            keywords: homeMeta.keywords,
            schema: [...BASE_SCHEMAS, HOMEPAGE_EXTRA_SCHEMA],
          }))
        })
        .catch(() => {
          const def = PAGE_OG['/']!
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=60')
          res.send(buildHtml({ title: def.title, description: def.description, image: DEFAULT_IMAGE, url: `${SITE_URL}/`, keywords: def.keywords, schema: [...BASE_SCHEMAS, HOMEPAGE_EXTRA_SCHEMA] }))
        })
      return
    }
  }

  // ── Search page: handle ?city=X&tier=Y&service=Z for Google ─────────────────
  if (pathKey === '/search' || (pathKey === '/' && (query.city || query.tier || query.service || query.q))) {
    const city    = (query.city    as string | undefined)?.trim()
    const tier    = (query.tier    as string | undefined)?.trim()
    const service = (query.service as string | undefined)?.trim()
    const q       = (query.q       as string | undefined)?.trim()

    // Build contextual title + description
    let title: string
    let description: string
    let keywords: string

    if (service) {
      const svcLabel = service.replace(/-/g, ' ')
      const inCity   = city ? ` in ${city}` : ' in Kenya'
      title       = `${svcLabel} Escorts${inCity} | ${SITE_NAME}`
      description = `Find verified ${svcLabel} escorts${inCity}. Browse profiles, photos and rates for ${svcLabel} escort services${inCity} on Wet3Camp.`
      keywords    = `${svcLabel} escort${inCity}, ${svcLabel} escort Kenya, ${svcLabel} escort Nairobi, ${BASE_KW}`
    } else if (city && tier && tier !== 'all') {
      const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
      title       = `${tierLabel} Escorts in ${city} | ${SITE_NAME}`
      description = `Browse verified ${tierLabel} escorts in ${city}, Kenya. Real profiles, photos & rates for ${tierLabel} escorts in ${city} on Wet3Camp.`
      keywords    = `${tierLabel} escort ${city}, ${tier} escort ${city} Kenya, ${BASE_KW}`
    } else if (city) {
      const cityGeo = CITY_GEO[city]
      title       = `Escorts in ${city}, Kenya — Verified Profiles | ${SITE_NAME}`
      description = `Find verified female escorts in ${city}, Kenya. Browse ${city} escort profiles with real photos, rates and reviews. Book on Wet3Camp.`
      keywords    = `escort ${city}, ${city} escort, call girl ${city}, female escort ${city} Kenya, book escort ${city}, ${BASE_KW}`
      if (cityGeo) keywords = `${keywords}, escort near me ${city}, incall ${city}, outcall ${city}`
    } else if (tier && tier !== 'all') {
      const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1)
      title       = `${tierLabel} Escorts in Kenya | ${SITE_NAME}`
      description = `Browse verified ${tierLabel} escorts across Kenya. Nairobi, Mombasa, Kisumu and more. ${tierLabel} escort profiles on Wet3Camp.`
      keywords    = `${tierLabel} escort Kenya, ${tierLabel} escort Nairobi, ${BASE_KW}`
    } else if (q) {
      title       = `"${q}" — Kenya Escorts | ${SITE_NAME}`
      description = `Search results for "${q}" on Wet3Camp — Kenya's #1 escort directory. Verified escorts across Kenya.`
      keywords    = `${q} escort Kenya, ${BASE_KW}`
    } else {
      const def = PAGE_OG['/search']!
      title       = def.title
      description = def.description
      keywords    = def.keywords ?? BASE_KW
    }

    // Fetch a city-specific photo if available
    fetchCityPhoto(city)
      .then(image => {
        // City LocalBusiness schema if applicable
        const schemas: object[] = [...BASE_SCHEMAS]
        if (city) {
          const geo = CITY_GEO[city]
          schemas.push({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `Wet3 Camp — ${city} Escorts`,
            url: fullUrl,
            description,
            ...(geo ? { geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } } : {}),
            address: { '@type': 'PostalAddress', addressLocality: city, addressCountry: 'KE' },
          })
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
        res.send(buildHtml({ title, description, image, url: fullUrl, keywords, schema: schemas }))
      })
      .catch(() => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.send(buildHtml({ title, description, image: DEFAULT_IMAGE, url: fullUrl, keywords, schema: BASE_SCHEMAS }))
      })
    return
  }

  // ── Static pages ─────────────────────────────────────────────────────────────
  const staticOg = PAGE_OG[pathKey]
  if (staticOg) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(buildHtml({
      title: staticOg.title,
      description: staticOg.description,
      image: staticOg.image ?? DEFAULT_IMAGE,
      url: fullUrl,
      keywords: staticOg.keywords,
      type: staticOg.type,
      schema: BASE_SCHEMAS,
    }))
    return
  }

  next()
}
