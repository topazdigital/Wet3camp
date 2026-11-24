const IMAGE_EXTENSION = /\.(?:jpe?g|png|webp|gif|avif)(?:$|[?#])/i
const IMAGE_PATH_HINT = /(?:\/images?\/|\/uploads?\/|\/media\/|[?&](?:format|fm)=(?:jpe?g|png|webp|avif))/i
const BAD_IMAGE_HINT = /(?:logo|favicon|placeholder|no[-_ ]?image|default[-_ ]?(?:image|avatar)|avatar[-_ ]?default|banner|sprite|captcha|payment|sponsor|tracking|pixel|flag|whatsapp|telegram|wechat|viber|messenger|social[-_ ]?(?:media|icon)|contact[-_ ]?icon|phone[-_ ]?icon)/i
const ARCHIVE_NAME_HINT = /\b(?:archives?|categories?|tags?|search results|escort listings|all escorts)\b/i

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
}

function attributesFromTag(tag) {
  const attributes = {}
  const pattern = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return attributes
}

function hasPrivateOrLocalHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.includes(':')
  ) return true

  const octets = host.split('.').map(Number)
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const [a, b] = octets
  return a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
}

function normalizeImageUrl(raw, baseUrl, context = '') {
  const candidate = decodeHtml(raw).trim().replace(/^['"]|['"]$/g, '')
  if (!candidate || /^(?:data|blob|javascript):/i.test(candidate)) return null
  if (BAD_IMAGE_HINT.test(`${candidate} ${context}`)) return null

  try {
    const url = new URL(candidate, baseUrl)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
    if (hasPrivateOrLocalHost(url.hostname)) return null
    // Keep stored image references secure even when source markup uses http.
    url.protocol = 'https:'
    url.hash = ''
    return url.toString().length <= 500 ? url.toString() : null
  } catch {
    return null
  }
}

function srcsetCandidates(value) {
  return String(value || '')
    .split(',')
    .map((entry) => {
      const [url, descriptor] = entry.trim().split(/\s+/, 2)
      const size = Number.parseInt(descriptor || '', 10)
      return { url, size: Number.isFinite(size) ? size : 0 }
    })
    .filter((entry) => entry.url)
    .sort((a, b) => b.size - a.size)
}

function cleanText(value) {
  return decodeHtml(String(value || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\b[^>]*>/gi, ' ')
    .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function usableBio(value) {
  const text = cleanText(value)
  if (text.length < 30 || !/[a-z]{3}/i.test(text)) return null
  if (/^(?:home|escort|escorts|profile|read more|browse escorts)\b/i.test(text)) return null
  if (/\b(?:archive|archives|category archive|search results)\b/i.test(text)) return null
  return text.slice(0, 1200)
}

function walkStructuredData(value, visit, depth = 0) {
  if (!value || depth > 8) return
  if (Array.isArray(value)) {
    for (const item of value) walkStructuredData(item, visit, depth + 1)
    return
  }
  if (typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    visit(key, child)
    if (child && typeof child === 'object') walkStructuredData(child, visit, depth + 1)
  }
}

export function isArchiveLikeDirectoryName(name) {
  return ARCHIVE_NAME_HINT.test(String(name || ''))
}

export function isDirectoryBrandOrPlaceholderImage(value) {
  return BAD_IMAGE_HINT.test(String(value || ''))
}

export function extractDirectoryProfileImageCandidates(html, profileUrl, limit = 6) {
  const candidates = new Map()
  const add = (raw, score, context = '', allowExtensionless = false) => {
    const url = normalizeImageUrl(raw, profileUrl, context)
    if (!url) return
    const path = new URL(url).pathname
    if (!allowExtensionless && !IMAGE_EXTENSION.test(path) && !IMAGE_PATH_HINT.test(url)) return
    const current = candidates.get(url)
    if (!current || current.score < score) candidates.set(url, { url, score })
  }

  for (const tag of String(html || '').matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributesFromTag(tag[0])
    const key = `${attrs.property || ''} ${attrs.name || ''}`.toLowerCase()
    if (/\b(?:og:image|twitter:image|twitter:image:src)\b/.test(key)) {
      // Social metadata often points at a site-wide fallback image. Keep it as
      // a low-priority candidate unless stronger profile-specific evidence exists.
      const metadataLooksProfileSpecific = /(?:profile|escort|gallery|portrait|model)/i.test(attrs.content || '')
      add(attrs.content, metadataLooksProfileSpecific ? 85 : 58, `${key} ${attrs.alt || ''}`, true)
    }
  }

  for (const tag of String(html || '').matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributesFromTag(tag[0])
    if (/\bimage_src\b/i.test(attrs.rel || '')) add(attrs.href, 65, attrs.rel, true)
  }

  for (const script of String(html || '').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/application\/ld\+json/i.test(attributesFromTag(`<script ${script[1]}>`).type || '')) continue
    try {
      const structured = JSON.parse(script[2].replace(/^\s*<!--|-->\s*$/g, '').trim())
      walkStructuredData(structured, (key, value) => {
        if (/^(?:image|photo|thumbnailurl|primaryimageofpage|contenturl)$/i.test(key)) {
          const values = Array.isArray(value) ? value : [value]
          for (const item of values) {
            const raw = typeof item === 'string'
              ? item
              : item && typeof item === 'object'
                ? item.url || item.contentUrl || item['@id']
                : null
            add(raw, 85, key, true)
          }
        }
      })
    } catch {
      // Ignore malformed JSON-LD and continue with HTML metadata.
    }
  }

  for (const tag of String(html || '').matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const attrs = attributesFromTag(tag[0])
    const context = `${attrs.class || ''} ${attrs.id || ''} ${attrs.alt || ''} ${attrs.title || ''}`
    if (BAD_IMAGE_HINT.test(context)) continue
    const width = Number.parseInt(attrs.width || attrs['data-width'] || '', 10)
    const height = Number.parseInt(attrs.height || attrs['data-height'] || '', 10)
    if ((width && width < 80) || (height && height < 80)) continue

    const descriptive = /(?:profile|escort|gallery|portrait|model|photo|image)/i.test(context)
    const portraitSized = width >= 180 && height >= 180 && height / width >= 0.9
    const score = descriptive ? 100 : portraitSized ? 85 : 45
    for (const key of ['data-full', 'data-large', 'data-large_image', 'data-original', 'data-lazy-src', 'data-src', 'src']) {
      if (attrs[key]) add(attrs[key], score, context, true)
    }
    for (const key of ['data-srcset', 'srcset']) {
      for (const candidate of srcsetCandidates(attrs[key])) add(candidate.url, score + 1, context, true)
    }
  }

  return [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .filter((candidate, index, all) => all.findIndex((item) => item.url === candidate.url) === index)
    .slice(0, Math.max(0, limit))
}

export function extractDirectoryProfileImages(html, profileUrl, limit = 6) {
  return extractDirectoryProfileImageCandidates(html, profileUrl, limit)
    .map((candidate) => candidate.url)
}

export function extractDirectoryBio(html) {
  const source = String(html || '')
  const candidates = []
  for (const tag of source.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributesFromTag(tag[0])
    const key = `${attrs.name || ''} ${attrs.property || ''}`.toLowerCase()
    if (/\b(?:description|og:description|twitter:description)\b/.test(key) && attrs.content) {
      candidates.push(attrs.content)
    }
  }

  for (const script of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/application\/ld\+json/i.test(attributesFromTag(`<script ${script[1]}>`).type || '')) continue
    try {
      const structured = JSON.parse(script[2].replace(/^\s*<!--|-->\s*$/g, '').trim())
      walkStructuredData(structured, (key, value) => {
        if (/^description$/i.test(key) && typeof value === 'string') candidates.push(value)
      })
    } catch {
      // Ignore malformed JSON-LD and continue with HTML descriptions.
    }
  }

  const bioBlock = /<(?:div|section|article|p)\b([^>]*)>([\s\S]{0,5000}?)<\/(?:div|section|article|p)>/gi
  for (const match of source.matchAll(bioBlock)) {
    const attrs = attributesFromTag(`<div ${match[1]}>`)
    const context = `${attrs.class || ''} ${attrs.id || ''} ${attrs.itemprop || ''}`
    if (/(?:bio|about|description|biography|profile-text|escort)/i.test(context)) candidates.push(match[2])
  }

  const article = source.match(/<article\b[^>]*>([\s\S]{0,8000}?)<\/article>/i)?.[1]
  if (article) {
    const paragraphs = [...article.matchAll(/<p\b[^>]*>([\s\S]{0,1800}?)<\/p>/gi)]
      .map((match) => match[1])
    candidates.push(...paragraphs)
  }

  for (const candidate of candidates) {
    const bio = usableBio(candidate)
    if (bio) return bio
  }
  return null
}
