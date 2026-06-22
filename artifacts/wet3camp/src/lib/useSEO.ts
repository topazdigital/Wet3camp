import { useEffect } from 'react'

export const SITE_NAME = 'Wet3 Camp'
export const SITE_URL = 'https://wet3.camp'
export const DEFAULT_TITLE = "Wet3Camp — Kenya's #1 Escort Directory | Nairobi, Mombasa, Kisumu"
export const DEFAULT_DESC = "Browse 1,200+ verified escorts in Nairobi, Mombasa, Kisumu & across Kenya. Find elite, VIP & premium female escorts near you. Discreet bookings. Join free today."
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`

// ── Master keyword list — targets every major Kenyan escort search query ──────
export const MASTER_KEYWORDS = [
  // Direct competitor brand targeting (what people search to find those sites)
  "nairobiraha", "nairobi raha", "raha nairobi", "rahazanairobi", "raha za nairobi",
  "nairobiescorts", "nairobi escorts", "nairobirahaescorts", "rahakenyaescorts",
  "wet3camp", "wet3.camp", "nairobi raha escorts", "kenya raha", "raha kenya",
  "escortify kenya", "xescorts kenya", "skissr kenya", "adultsearch kenya",
  "africanescorts", "kenyan escort site", "escort directory kenya",
  "escorts kenya 2025", "escorts nairobi 2025", "best escort site kenya",
  "top escort site nairobi", "escort website kenya", "escort listing kenya",

  // ── Escort services — high-intent queries ───────────────────────────────
  "massage escort Nairobi", "body massage Nairobi escort", "erotic massage Kenya",
  "girlfriend experience Kenya", "GFE escort Nairobi", "GFE escort Mombasa",
  "BDSM escort Kenya", "dominatrix Nairobi", "role play escort Kenya",
  "anal escort Kenya", "oral escort Nairobi", "blow job escort Kenya",
  "69 escort Nairobi", "threesome escort Kenya", "couple escort Nairobi",
  "escort with WhatsApp Kenya", "escort outcall Nairobi", "escort incall Nairobi",
  "escort video call Kenya", "webcam escort Kenya", "online escort Kenya",
  "escort overnight Kenya", "overnight escort Nairobi", "overnight escort Mombasa",
  "escort for hire Kenya", "escort for party Kenya", "escort for events Kenya",
  "escort for travel Kenya", "escort tours Kenya", "escort companion Kenya",
  "happy ending massage Nairobi", "sensual massage Kenya", "escort full service Kenya",
  "escort striptease Kenya", "escort lapdance Nairobi", "escort foot fetish Kenya",
  "escort golden shower Kenya", "escort squirting Kenya", "escort deep throat Kenya",
  "escort CIM Kenya", "escort MILF Nairobi", "BBW escort Nairobi", "slim escort Kenya",
  "curvy escort Nairobi", "plus size escort Kenya", "petite escort Kenya",
  "tall escort Kenya", "busty escort Nairobi", "big ass escort Kenya",

  // City-level — primary
  "Nairobi escorts", "Mombasa escorts", "Kisumu escorts", "Nakuru escorts",
  "Eldoret escorts", "Thika escorts", "Machakos escorts", "Nyeri escorts",
  "Meru escorts", "Kitale escorts", "Malindi escorts", "Kilifi escorts",
  "Lamu escorts", "Diani escorts", "Nanyuki escorts", "Embu escorts",
  "Nakuru escorts", "Eldoret escorts", "Thika escorts",

  // Nairobi areas
  "Westlands escorts", "CBD Nairobi escorts", "Karen escorts Nairobi",
  "Kilimani escorts", "Lavington escorts", "Parklands escorts", "Upperhill escorts",
  "Gigiri escorts", "Runda escorts", "Muthaiga escorts", "Eastleigh escorts",
  "South B escorts", "Langata escorts", "Ngong Road escorts", "Thika Road escorts",
  "Spring Valley escorts", "Loresho escorts", "Rosslyn escorts", "Ruaka escorts",
  "Kileleshwa escorts", "Embakasi escorts", "South C escorts",

  // Mombasa areas
  "Nyali escorts", "Bamburi escorts", "Diani Beach escorts", "Mtwapa escorts",
  "Tudor escorts", "Likoni escorts", "Kisauni escorts",

  // Tier/type
  "elite escorts Kenya", "VIP escorts Nairobi", "premium escorts Kenya",
  "verified escorts Kenya", "female escorts Kenya", "Kenyan escort girls",
  "high class escorts Nairobi", "luxury escorts Kenya", "independent escorts Nairobi",

  // Action keywords
  "book escort Nairobi", "hire escort Kenya", "escort booking Kenya",
  "escort near me Kenya", "escort services Nairobi", "escort agency Nairobi",
  "call girl Nairobi", "call girls Kenya", "call girl Mombasa",
  "escorts near me", "find escort Nairobi", "escort contact Kenya",

  // GFE & services
  "girlfriend experience Nairobi", "GFE escort Kenya", "escort incall Nairobi",
  "escort outcall Kenya", "overnight escort Nairobi", "escort video call Kenya",

  // SEO long-tail
  "verified escort profiles Kenya", "real escort photos Kenya",
  "escort reviews Kenya", "top rated escorts Nairobi",
  "how to find escort Nairobi", "escort guide Kenya 2025",
  "escort with WhatsApp Kenya", "escort Telegram Kenya",
  "female escort Nairobi WhatsApp", "escort WhatsApp number Kenya",
]

export const CITY_KEYWORDS: Record<string, string[]> = {
  Nairobi: [
    "Nairobi escorts", "escort Nairobi", "nairobi raha", "raha nairobi",
    "Westlands escort", "Karen escort", "Kilimani escort", "Lavington escort",
    "CBD escort Nairobi", "Parklands escort", "Upperhill escort", "Gigiri escort",
    "VIP escort Nairobi", "elite escort Nairobi", "book escort Nairobi",
    "call girl Nairobi", "independent escort Nairobi", "escort agency Nairobi",
    "nairobiraha", "rahazanairobi",
  ],
  Mombasa: [
    "Mombasa escorts", "escort Mombasa", "Nyali escort", "Bamburi escort",
    "Diani escort", "Mtwapa escort", "coastal escort Kenya",
    "beach escort Mombasa", "escort Mombasa CBD", "VIP escort Mombasa",
    "call girl Mombasa", "raha Mombasa",
  ],
  Kisumu: [
    "Kisumu escorts", "escort Kisumu", "Milimani escort Kisumu",
    "lakeside escort Kenya", "call girl Kisumu",
  ],
  Nakuru: [
    "Nakuru escorts", "escort Nakuru", "Milimani Nakuru escort",
    "Rift Valley escort",
  ],
  Eldoret: [
    "Eldoret escorts", "escort Eldoret", "North Rift escort",
  ],
}

export function buildCityKeywords(city?: string): string {
  if (!city) return MASTER_KEYWORDS.slice(0, 40).join(', ')
  const cityKw = CITY_KEYWORDS[city] ?? [`${city} escorts`, `escort ${city}`, `call girl ${city}`]
  return [...cityKw, ...MASTER_KEYWORDS.slice(0, 20)].join(', ')
}

export function buildEscortKeywords(escort: {
  name: string; city: string; area: string; tier?: string;
  ethnicity?: string; bodyType?: string; gender?: string; age?: number;
  services?: string[];
}): string {
  const { name, city, area, tier, ethnicity, gender = 'female', age, services = [] } = escort
  const g = gender.toLowerCase()
  const specific = [
    `${name}`, `${name} ${city}`, `${name} escort`, `${name} wet3camp`,
    age ? `${name} ${age} escort` : '',
    `${area} escort`, `${area} ${g} escort ${city}`, `${city} escort`,
    `${g} escort ${city}`, `${g} escort ${area}`,
    tier ? `${tier} ${g} escort ${city}` : '',
    tier ? `${tier} escort ${area}` : '',
    ethnicity ? `${ethnicity} escort Kenya` : '',
    ethnicity ? `${ethnicity} ${g} escort ${city}` : '',
    `book ${name}`, `${name} WhatsApp`, `${name} Telegram`,
    `escort ${area} Kenya`, `${city} ${g} escort`,
    `verified escort ${city}`, `${tier ?? 'premium'} escort ${area}`,
    `nairobi raha ${city.toLowerCase()}`, `raha za nairobi ${city.toLowerCase()}`,
    `${city} raha escorts`, `escorts ${city} Kenya 2025`,
  ].filter(Boolean)
  const serviceKw = services.flatMap(svc => [
    `${svc} escort ${city}`, `${svc} services ${area}`, `${svc} escort near me Kenya`,
  ])
  const cityKw = CITY_KEYWORDS[city] ?? [`${city} escorts`, `${city} ${g} escort`, `escort ${city}`]
  return [...specific, ...serviceKw, ...cityKw, ...MASTER_KEYWORDS.slice(0, 20)].join(', ')
}

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  noIndex?: boolean
  canonicalPath?: string
  schema?: object | object[]
  city?: string
  escort?: { name: string; city: string; area: string; tier?: string; ethnicity?: string; bodyType?: string; gender?: string; age?: number }
  type?: 'website' | 'profile' | 'article' | 'place'
}

function setMeta(name: string, content: string, prop = false) {
  const attr = prop ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setSchema(id: string, data: object | object[]) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function useSEO({
  title, description, keywords, ogImage, noIndex, canonicalPath, schema,
  city, escort, type = 'website',
}: SEOProps = {}) {
  useEffect(() => {
    // Strip any existing site-name suffix (| Wet3Camp, — Wet3Camp, – Wet3Camp, etc.) to prevent duplication
    const cleanTitle = title?.replace(/[\s—–|]*Wet3\s?Camp\s*$/i, '').trim() ?? ''
    const fullTitle = cleanTitle ? `${cleanTitle} | ${SITE_NAME}` : DEFAULT_TITLE
    const desc = description ?? DEFAULT_DESC
    const kw = keywords
      ? keywords
      : escort ? buildEscortKeywords(escort)
      : city   ? buildCityKeywords(city)
      : MASTER_KEYWORDS.slice(0, 50).join(', ')
    const img = ogImage ?? DEFAULT_OG_IMAGE

    document.title = fullTitle

    // Basic meta
    setMeta('description', desc)
    setMeta('keywords', kw)
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    setMeta('author', 'Wet3 Camp')
    setMeta('theme-color', '#8B0000')
    setMeta('language', 'English')
    setMeta('geo.region', 'KE')
    setMeta('geo.placename', city ?? 'Kenya')
    setMeta('ICBM', city === 'Nairobi' ? '-1.2921, 36.8219'
                  : city === 'Mombasa' ? '-4.0435, 39.6682'
                  : city === 'Kisumu'  ? '-0.1022, 34.7617'
                  : '-1.2921, 36.8219')

    // Open Graph
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', desc, true)
    setMeta('og:type', type === 'profile' ? 'profile' : type === 'article' ? 'article' : 'website', true)
    setMeta('og:image', img, true)
    setMeta('og:image:width', '1200', true)
    setMeta('og:image:height', '630', true)
    setMeta('og:site_name', SITE_NAME, true)
    setMeta('og:locale', 'en_KE', true)
    setMeta('og:url', `${SITE_URL}${canonicalPath ?? window.location.pathname}`, true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', img)
    setMeta('twitter:site', '@wet3camp')
    setMeta('twitter:creator', '@wet3camp')

    // Canonical
    setLink('canonical', `${SITE_URL}${canonicalPath ?? window.location.pathname}`)

    // Alternate hreflang
    setLink('alternate', `${SITE_URL}${canonicalPath ?? window.location.pathname}`)

    // Base schema: WebSite + Organization
    const baseSchemas: object[] = [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "name": "Wet3 Camp",
        "alternateName": ["Wet3Camp", "wet3.camp", "Kenya Escort Directory"],
        "url": SITE_URL,
        "description": DEFAULT_DESC,
        "inLanguage": "en-KE",
        "potentialAction": {
          "@type": "SearchAction",
          "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/?q={search_term_string}` },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Wet3 Camp",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/favicon.svg`,
          "width": 512,
          "height": 512
        },
        "description": DEFAULT_DESC,
        "areaServed": [
          { "@type": "City", "name": "Nairobi", "addressCountry": "KE" },
          { "@type": "City", "name": "Mombasa", "addressCountry": "KE" },
          { "@type": "City", "name": "Kisumu",  "addressCountry": "KE" },
          { "@type": "City", "name": "Nakuru",  "addressCountry": "KE" },
          { "@type": "City", "name": "Eldoret", "addressCountry": "KE" },
          { "@type": "Country", "name": "Kenya" }
        ],
        "sameAs": ["https://twitter.com/wet3camp"],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "areaServed": "KE",
          "availableLanguage": ["English", "Swahili"]
        }
      }
    ]

    // City-specific LocalBusiness schema
    if (city) {
      const coords: Record<string, { lat: number; lng: number }> = {
        Nairobi: { lat: -1.2921, lng: 36.8219 },
        Mombasa: { lat: -4.0435, lng: 39.6682 },
        Kisumu:  { lat: -0.1022, lng: 34.7617 },
        Nakuru:  { lat: -0.3031, lng: 36.0800 },
        Eldoret: { lat:  0.5143, lng: 35.2698 },
      }
      const geo = coords[city]
      if (geo) {
        baseSchemas.push({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": `Wet3 Camp — ${city} Escorts`,
          "url": `${SITE_URL}/?city=${city}`,
          "description": `Browse verified female escorts in ${city}, Kenya. Elite, VIP & premium escorts available now.`,
          "geo": { "@type": "GeoCoordinates", "latitude": geo.lat, "longitude": geo.lng },
          "address": { "@type": "PostalAddress", "addressLocality": city, "addressCountry": "KE" },
          "areaServed": { "@type": "City", "name": city },
        })
      }
    }

    const allSchemas = schema
      ? [...baseSchemas, ...(Array.isArray(schema) ? schema : [schema])]
      : baseSchemas

    setSchema('schema-org', allSchemas)
  }, [title, description, keywords, ogImage, noIndex, canonicalPath, schema, city, escort, type])
}
