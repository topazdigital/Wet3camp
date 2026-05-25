import { useEffect } from 'react'

const SITE_NAME = 'Wet3 Camp'
const DEFAULT_TITLE = "Wet3 Camp — Kenya's #1 Premium Escort & Companion Directory"
const DEFAULT_DESC = "Browse 1,200+ verified escorts and companions in Nairobi, Mombasa, Kisumu & across Kenya. Discreet, safe, and premium adult services. Join free today."
const DEFAULT_KEYWORDS = "escorts Kenya, Nairobi escorts, Mombasa escorts, premium companions Kenya, adult services Kenya, verified escorts Nairobi, companion booking Kenya"
const DEFAULT_OG_IMAGE = "/og-image.jpg"

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

    if (canonicalPath) {
      setLink('canonical', `https://www.wet3camp.co.ke${canonicalPath}`)
    }

    // Schema.org JSON-LD
    let schemaEl = document.getElementById('schema-org') as HTMLScriptElement | null
    if (!schemaEl) {
      schemaEl = document.createElement('script')
      schemaEl.id = 'schema-org'
      schemaEl.type = 'application/ld+json'
      document.head.appendChild(schemaEl)
    }
    schemaEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Wet3 Camp",
      "url": "https://www.wet3camp.co.ke",
      "logo": "https://www.wet3camp.co.ke/favicon.svg",
      "description": desc,
      "areaServed": { "@type": "Country", "name": "Kenya" },
      "contactPoint": { "@type": "ContactPoint", "contactType": "customer support", "areaServed": "KE" }
    })
  }, [title, description, keywords, ogImage, noIndex, canonicalPath])
}
