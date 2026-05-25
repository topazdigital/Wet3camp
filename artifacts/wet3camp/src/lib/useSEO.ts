import { useEffect } from 'react'

const SITE_NAME = 'Wet3 Camp'
const SITE_URL = 'https://wet3.camp'
const DEFAULT_TITLE = "Wet3 Camp — Kenya's #1 Premium Escort & Companion Directory"
const DEFAULT_DESC = "Browse 1,200+ verified escorts and companions in Nairobi, Mombasa, Kisumu & across Kenya. Discreet, safe, and premium adult services. Join free today."
const DEFAULT_KEYWORDS = "escorts Kenya, Nairobi escorts, Mombasa escorts, premium companions Kenya, adult services Kenya, verified escorts Nairobi, companion booking Kenya, escort directory Kenya"
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  noIndex?: boolean
  canonicalPath?: string
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

export function useSEO({ title, description, keywords, ogImage, noIndex, canonicalPath }: SEOProps = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME} Kenya` : DEFAULT_TITLE
    const desc = description ?? DEFAULT_DESC
    const kw = keywords ?? DEFAULT_KEYWORDS
    const img = ogImage ?? DEFAULT_OG_IMAGE

    document.title = fullTitle

    setMeta('description', desc)
    setMeta('keywords', kw)
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow')

    setMeta('og:title', fullTitle, true)
    setMeta('og:description', desc, true)
    setMeta('og:type', 'website', true)
    setMeta('og:image', img, true)
    setMeta('og:site_name', SITE_NAME, true)
    setMeta('og:locale', 'en_KE', true)

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', img)
    setMeta('twitter:site', '@wet3camp')

    setLink('canonical', `${SITE_URL}${canonicalPath ?? window.location.pathname}`)

    // Schema.org JSON-LD — WebSite + Organization
    let schemaEl = document.getElementById('schema-org') as HTMLScriptElement | null
    if (!schemaEl) {
      schemaEl = document.createElement('script')
      schemaEl.id = 'schema-org'
      schemaEl.type = 'application/ld+json'
      document.head.appendChild(schemaEl)
    }
    schemaEl.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Wet3 Camp",
        "url": SITE_URL,
        "description": DEFAULT_DESC,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${SITE_URL}/?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Wet3 Camp",
        "url": SITE_URL,
        "logo": `${SITE_URL}/favicon.svg`,
        "description": desc,
        "areaServed": { "@type": "Country", "name": "Kenya" },
        "contactPoint": { "@type": "ContactPoint", "contactType": "customer support", "areaServed": "KE", "availableLanguage": ["English","Swahili"] }
      }
    ])
  }, [title, description, keywords, ogImage, noIndex, canonicalPath])
}
