import { useEffect } from 'react'

export const SITE_NAME = 'Wet3 Camp'
export const SITE_URL = 'https://wet3.camp'
export const DEFAULT_TITLE = 'Verified Escorts in Kenya | Nairobi, Mombasa & More'
export const DEFAULT_DESC = 'Browse verified escort profiles in Nairobi, Mombasa, Kisumu and cities across Kenya. Compare profiles, services and availability, then contact directly on Wet3 Camp.'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`

// Keep metadata focused on genuine search intent. Search engines largely ignore
// keyword tags, and competitor names or unsubstantiated claims can look spammy.
export const MASTER_KEYWORDS = [
  'Nairobi escorts', 'Mombasa escorts', 'Kisumu escorts', 'Nakuru escorts',
  'Eldoret escorts', 'verified escorts Kenya', 'escort directory Kenya',
  'escort booking Kenya', 'escort profiles Nairobi', 'escort profiles Mombasa',
  'independent escorts Kenya', 'incall escorts Kenya', 'outcall escorts Kenya',
  'escort reviews Kenya', 'escort services Nairobi', 'escort services Mombasa',
  'VIP escorts Kenya', 'premium escorts Kenya', 'elite escorts Kenya',
  'find escorts near me Kenya',

]

export const CITY_KEYWORDS: Record<string, string[]> = {
  Nairobi: [
    "Nairobi escorts", "escort Nairobi",
    "Westlands escort", "Karen escort", "Kilimani escort", "Lavington escort",
    "CBD escort Nairobi", "Parklands escort", "Upperhill escort", "Gigiri escort",
    "VIP escort Nairobi", "elite escort Nairobi", "book escort Nairobi",
    "call girl Nairobi", "independent escort Nairobi", "escort agency Nairobi",
    "verified escorts Nairobi", "escort directory Nairobi",
  ],
  Mombasa: [
    "Mombasa escorts", "escort Mombasa", "Nyali escort", "Bamburi escort",
    "Diani escort", "Mtwapa escort", "coastal escort Kenya",
    "beach escort Mombasa", "escort Mombasa CBD", "VIP escort Mombasa",
    "verified escorts Mombasa", "escort directory Mombasa",
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
    `${city} verified escorts`, `escorts ${city} Kenya`,
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
  escort?: { name: string; city: string; area: string; tier?: string; ethnicity?: string; bodyType?: string; gender?: string; age?: number; services?: string[] }
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

function setLink(rel: string, href: string, attrs: Record<string, string> = {}) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value))
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
    setLink('alternate', `${SITE_URL}${canonicalPath ?? window.location.pathname}`, { hreflang: 'en-KE' })

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
