import { load } from 'cheerio'
import {
  DIRECTORY_SOURCES,
  fetchDirectoryResource,
  getDirectoryRobotsStatus,
  isDirectoryProfileUrl,
} from '../../scraper-directories.mjs'

const NAIROBIRAHA_SOURCE = {
  id: 'nairobiraha',
  name: 'NairobiRaha',
  baseUrl: 'https://nairobiraha.com',
  hosts: ['nairobiraha.com', 'www.nairobiraha.com'],
}

export const BLOG_IMPORT_SOURCES = [NAIROBIRAHA_SOURCE, ...DIRECTORY_SOURCES]
export const MAX_BLOG_ARTICLES_PER_SOURCE = 10

const WORDPRESS_PATH = '/wp-json/wp/v2/posts/'
const FEED_PATHS = ['/feed/', '/blog/feed/']
const SITEMAP_PATHS = [
  '/wp-sitemap-posts-post-1.xml',
  '/wp-sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap.xml',
]
const ARCHIVE_PATHS = ['/blog/', '/blogs/', '/news/', '/stories/', '/articles/']
const BLOCKED_CONTENT_SELECTOR = [
  'script', 'style', 'noscript', 'nav', 'header', 'footer', 'aside', 'form',
  '.related-posts', '.related-articles', '.social-share', '.share-buttons',
  '.advertisement', '.ads', '.comments', '#comments',
  '.escort-quick-filter', '.location-search-results', '.search-filters',
  '.filter-section', '.breadcrumbs', '.breadcrumb', '.post-navigation',
]

function textContent($, value) {
  if (!value) return ''
  return $('<div>').html(String(value)).text().replace(/\s+/g, ' ').trim()
}

function normalizedSourceUrl(source, rawUrl) {
  if (!rawUrl) return null
  try {
    const url = new URL(String(rawUrl || ''), source.baseUrl)
    if (!['https:', 'http:'].includes(url.protocol)) return null
    if (!source.hosts.includes(url.hostname.toLowerCase())) return null
    url.protocol = 'https:'
    url.hostname = new URL(source.baseUrl).hostname
    url.port = ''
    url.hash = ''
    // Keep article query parameters that can identify distinct content only
    // when they are not obvious tracking parameters.
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ref$|source$)/i.test(key)) url.searchParams.delete(key)
    }
    return url.toString()
  } catch {
    return null
  }
}

function isProfilePage(source, url) {
  try {
    if (/(?:^|\/)(?:ad|ads|listing|listings|profile|profiles|room|rooms|tour|tours)(?:\/|$)/i.test(new URL(url).pathname)) {
      return true
    }
  } catch {
    return true
  }
  if (isDirectoryProfileUrl(source, url)) return true
  if (source.id === 'nairobiraha') {
    try {
      return /^\/(?:escort|escorts|profile)\/[^/]+\/?$/i.test(new URL(url).pathname)
    } catch {
      return true
    }
  }
  return false
}

export function isExcludedBlogCandidate(source, url) {
  try {
    const parsed = new URL(url)
    if (isProfilePage(source, url)) return true
    const queryKeys = [...parsed.searchParams.keys()]
    return queryKeys.some((key) =>
      /filter|search|sort|location|city|service|category|view|page|order/i.test(key)
    )
  } catch {
    return true
  }
}

function isEditorialPath(url) {
  try {
    return /(?:^|\/)(?:blog|blogs|news|stories|articles|guides|updates)(?:\/|$)/i.test(new URL(url).pathname)
  } catch {
    return false
  }
}

function firstText($, selectors) {
  for (const selector of selectors) {
    const value = $(selector).first().text().replace(/\s+/g, ' ').trim()
    if (value) return value
  }
  return ''
}

function firstMeta($, selectors) {
  for (const selector of selectors) {
    const value = $(selector).first().attr('content')?.trim()
    if (value) return value
  }
  return ''
}

function extractJsonLd($) {
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      const parsed = JSON.parse($(script).text())
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed]
      while (queue.length) {
        const item = queue.shift()
        if (!item || typeof item !== 'object') continue
        if (Array.isArray(item['@graph'])) queue.push(...item['@graph'])
        const type = Array.isArray(item['@type']) ? item['@type'].join(' ') : String(item['@type'] || '')
        if (/\b(article|blogposting|newsarticle)\b/i.test(type)) return item
      }
    } catch {
      // Ignore malformed structured data and continue with ordinary metadata.
    }
  }
  return null
}

function imageSource($, element) {
  const image = $(element)
  const candidates = [
    image.attr('data-lazy-src'),
    image.attr('data-src'),
    image.attr('data-original'),
    image.attr('src'),
  ].filter(Boolean)
  const srcset = image.attr('data-srcset') || image.attr('srcset') || ''
  if (srcset) {
    const entries = srcset.split(',').map((entry) => entry.trim()).filter(Boolean)
    const best = entries.at(-1)?.split(/\s+/)[0]
    if (best) candidates.unshift(best)
  }
  return candidates[0] || ''
}

function imageLooksLikeBranding(url, alt, className) {
  return /(?:logo|favicon|avatar|icon|banner|sprite|tracking|pixel|placeholder)/i.test(
    `${url} ${alt} ${className}`
  )
}

function chooseArticleRoot($) {
  const selectors = [
    '[itemprop="articleBody"]',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.blog-post-content',
    '.td-post-content',
    '.single-post-content',
    '.entry',
    'article',
    'main',
  ]
  for (const selector of selectors) {
    const node = $(selector).first()
    if (node.length && node.text().replace(/\s+/g, ' ').trim().length >= 160) return node
  }
  return $('body').first()
}

async function nodeToMarkdown($, node, resolveImage) {
  if (node.type === 'text') {
    return String(node.data || '')
      .replace(/\s+/g, ' ')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
  if (node.type !== 'tag' && node.type !== 'root') return ''
  const tag = String(node.name || '').toLowerCase()
  if (BLOCKED_CONTENT_SELECTOR.some((selector) => selector[0] === '.' || selector[0] === '#'
    ? $(node).is(selector)
    : selector === tag)) return ''

  if (tag === 'img') {
    const src = imageSource($, node)
    const alt = ($(node).attr('alt') || '').trim()
    const className = $(node).attr('class') || ''
    if (!src || imageLooksLikeBranding(src, alt, className)) return ''
    const markdownUrl = await resolveImage(src)
    return markdownUrl ? `\n\n![${alt.replace(/[\[\]]/g, '')}](${markdownUrl})\n\n` : ''
  }
  if (tag === 'br') return '\n'
  if (tag === 'a') {
    const href = $(node).attr('href') || ''
    const image = $(node).find('img').first()
    if (image.length && /\.(?:jpe?g|png|webp|gif)(?:[?#]|$)/i.test(href)) {
      const alt = (image.attr('alt') || '').trim().replace(/[\[\]]/g, '')
      const markdownUrl = await resolveImage(href)
      return markdownUrl ? `\n\n![${alt}](${markdownUrl})\n\n` : ''
    }
  }

  const children = []
  for (const child of node.children || []) {
    children.push(await nodeToMarkdown($, child, resolveImage))
  }
  const content = children.join('')
  if (['h1', 'h2'].includes(tag)) return `\n\n## ${content.trim()}\n\n`
  if (['h3', 'h4', 'h5', 'h6'].includes(tag)) return `\n\n### ${content.trim()}\n\n`
  if (tag === 'li') return `\n- ${content.trim()}`
  if (tag === 'ul' || tag === 'ol') return `\n${content}\n\n`
  if (tag === 'strong' || tag === 'b') return `**${content.trim()}**`
  if (tag === 'em' || tag === 'i') return `*${content.trim()}*`
  if (tag === 'blockquote') return `\n\n> ${content.trim()}\n\n`
  if (['p', 'div', 'section', 'figure', 'figcaption', 'article', 'main'].includes(tag)) {
    return `\n\n${content.trim()}\n\n`
  }
  return content
}

function collectLabels($, selectors) {
  const result = []
  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const value = $(element).text().replace(/\s+/g, ' ').trim()
      if (value && !result.includes(value)) result.push(value)
    })
  }
  return result
}

export async function parseBlogArticleHtml(html, pageUrl, source, overrides = {}, downloadImage) {
  const $ = load(String(html || ''))
  const jsonLd = extractJsonLd($)
  const articleRoot = chooseArticleRoot($)
  const rootText = articleRoot.text().replace(/\s+/g, ' ').trim()

  const title = textContent($, overrides.title) ||
    firstMeta($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
    firstText($, ['h1', 'title']) ||
    textContent($, jsonLd?.headline)
  if (!title || rootText.length < 160) return null

  const articleMarker = Boolean(
    jsonLd ||
    $('meta[property="og:type"][content*="article" i]').length ||
    $('meta[property^="article:published_time"]').length ||
    $('[itemprop="articleBody"]').length ||
    $('article').length
  )
  if (!overrides.trusted && !articleMarker && !isEditorialPath(pageUrl)) return null

  const slug = String(overrides.slug || title)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'imported-article'

  const imageCandidates = []
  const addImage = (raw) => {
    const normalized = normalizedSourceUrl(source, raw)
    if (normalized && !imageCandidates.includes(normalized)) imageCandidates.push(normalized)
  }
  addImage(overrides.imageUrl)
  addImage(firstMeta($, [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
  ]))
  const ldImage = jsonLd?.image
  if (typeof ldImage === 'string') addImage(ldImage)
  else if (Array.isArray(ldImage)) {
    for (const item of ldImage) addImage(typeof item === 'string' ? item : item?.url)
  } else if (ldImage?.url) addImage(ldImage.url)

  articleRoot.find('img').each((_, image) => {
    const src = imageSource($, image)
    const alt = $(image).attr('alt') || ''
    const className = $(image).attr('class') || ''
    if (!imageLooksLikeBranding(src, alt, className)) addImage(src)
  })
  articleRoot.find('a[href]').each((_, anchor) => {
    const href = $(anchor).attr('href') || ''
    if (/\.(?:jpe?g|png|webp|gif)(?:[?#]|$)/i.test(href)) addImage(href)
  })

  const imageCache = new Map()
  const resolveImage = async (raw) => {
    const normalized = normalizedSourceUrl(source, raw)
    if (!normalized) return null
    if (imageCache.has(normalized)) return imageCache.get(normalized)
    const index = imageCache.size + 1
    let stored = null
    if (downloadImage) {
      stored = await downloadImage(normalized, `blog_${slug}_${index}`, pageUrl, source.hosts)
    }
    const result = stored || normalized
    imageCache.set(normalized, result)
    return result
  }

  const coverImage = imageCandidates.length ? await resolveImage(imageCandidates[0]) : ''
  const content = (await nodeToMarkdown($, articleRoot.get(0), resolveImage))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim().length < 160) return null

  const excerpt = textContent($, overrides.excerpt) ||
    firstMeta($, [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
    ]) ||
    textContent($, jsonLd?.description) ||
    rootText.slice(0, 240)
  const categories = overrides.categories || []
  const category = textContent($, overrides.category) ||
    firstMeta($, ['meta[property="article:section"]']) ||
    textContent($, jsonLd?.articleSection) ||
    collectLabels($, [
      '.cat-links a', '.post-categories a', '.entry-categories a',
      '.category-links a', '.post-taxonomies a', 'a[rel="category tag"]',
    ])[0] ||
    categories[0] ||
    'Kenya Escorts Guide'

  const keywordTags = firstMeta($, ['meta[name="keywords"]'])
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  const articleTags = [
    ...$('meta[property="article:tag"]').toArray().map((meta) => $(meta).attr('content') || ''),
    ...collectLabels($, ['.tags-links a', '.post-tags a']),
  ]
  const tags = [...new Set([...(overrides.tags || []), ...articleTags, ...keywordTags])]
    .map((tag) => textContent($, tag))
    .filter(Boolean)
    .slice(0, 20)

  const author = textContent($, overrides.author) ||
    firstMeta($, ['meta[name="author"]', 'meta[property="article:author"]']) ||
    firstText($, ['.author a', '.byline a', '[rel="author"]']) ||
    textContent($, jsonLd?.author?.name) ||
    'Wet3Camp Editorial'
  const publishedAt = overrides.publishedAt ||
    firstMeta($, ['meta[property="article:published_time"]', 'meta[name="date"]']) ||
    $('time[datetime]').first().attr('datetime') ||
    ''

  const wordCount = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').split(/\s+/).filter(Boolean).length
  return {
    title: title.slice(0, 300),
    slug,
    excerpt: excerpt.slice(0, 1000),
    content,
    category: category.slice(0, 80),
    tags,
    image_url: coverImage || '',
    author: author.slice(0, 100),
    published_at: publishedAt,
    read_time: Math.min(255, Math.max(2, Math.ceil(wordCount / 200))),
    seo_title: title.slice(0, 120),
    seo_description: excerpt.slice(0, 200),
    source_url: normalizedSourceUrl(source, pageUrl),
  }
}

function addCandidate(candidates, source, url, overrides = {}, excludedSourceUrls = new Set()) {
  const normalized = normalizedSourceUrl(source, url)
  if (!normalized || normalized.length > 500 || excludedSourceUrls.has(normalized) ||
    isExcludedBlogCandidate(source, normalized) || candidates.has(normalized)) return
  candidates.set(normalized, { url: normalized, overrides })
}

function parseWordPressPosts(payload, source, candidates, excludedSourceUrls) {
  if (!Array.isArray(payload)) return
  for (const post of payload) {
    const url = post?.link
    if (!url) continue
    const embedded = post?._embedded || {}
    const terms = Array.isArray(embedded['wp:term']) ? embedded['wp:term'].flat() : []
    const categories = terms
      .filter((term) => term?.taxonomy === 'category')
      .map((term) => textContent(load(''), term?.name))
      .filter(Boolean)
    const tags = terms
      .filter((term) => term?.taxonomy === 'post_tag')
      .map((term) => String(term?.name || '').trim())
      .filter(Boolean)
    const media = embedded['wp:featuredmedia']?.[0]?.source_url || ''
    const html = post?.content?.rendered || ''
    addCandidate(candidates, source, url, {
      trusted: true,
      title: post?.title?.rendered,
      excerpt: post?.excerpt?.rendered,
      contentHtml: html,
      categories,
      category: categories[0],
      tags,
      author: embedded.author?.[0]?.name,
      imageUrl: media,
      publishedAt: post?.date,
      slug: post?.slug,
    }, excludedSourceUrls)
  }
}

function parseFeed(xml, source, candidates, excludedSourceUrls) {
  const $ = load(String(xml || ''), { xmlMode: true })
  $('item, entry').each((_, entry) => {
    const item = $(entry)
    const linkNode = item.find('link').first()
    const url = linkNode.attr('href') || linkNode.text().trim() ||
      item.find('guid, id').first().text().trim()
    if (!url) return
    const categories = item.find('category').toArray()
      .map((category) => $(category).attr('term') || $(category).text().trim())
      .filter(Boolean)
    addCandidate(candidates, source, url, {
      trusted: true,
      title: item.find('title').first().text(),
      excerpt: item.find('description, summary').first().text(),
      categories,
      category: categories[0],
      publishedAt: item.find('pubDate, published, updated').first().text().trim(),
    }, excludedSourceUrls)
  })
}

function parseSitemap(xml, source, candidates, excludedSourceUrls) {
  const $ = load(String(xml || ''), { xmlMode: true })
  const sitemapEntries = $('sitemapindex > sitemap').toArray()
  if (sitemapEntries.length) {
    return sitemapEntries
      .map((entry) => $(entry).find('loc').first().text().trim())
      .filter(Boolean)
      .filter((url) => /(?:post|blog|article|news|story)/i.test(url))
      .slice(0, 2)
  }
  $('urlset > url').each((_, entry) => {
    const url = $(entry).find('loc').first().text().trim()
    if (!url) return
    addCandidate(candidates, source, url, {
      trusted: isEditorialPath(url),
    }, excludedSourceUrls)
  })
  return []
}

function collectArchiveLinks(html, pageUrl, source, candidates, excludedSourceUrls) {
  const $ = load(String(html || ''))
  const selector = 'article a[href], .post a[href], .blog-post a[href], .entry-title a[href], .post-title a[href]'
  $(selector).each((_, anchor) => {
    const href = $(anchor).attr('href')
    let url = null
    try {
      url = normalizedSourceUrl(source, new URL(href || '', pageUrl).toString())
    } catch {
      return
    }
    if (!url || (!isEditorialPath(url) && !isEditorialPath(pageUrl))) return
    addCandidate(candidates, source, url, { trusted: true }, excludedSourceUrls)
  })
}

async function requestSourcePage(source, url, referer = source.baseUrl) {
  return fetchDirectoryResource(source, url, referer, async (target, pageReferer, baseHeaders) => {
    try {
      const response = await fetch(target, {
        headers: {
          ...baseHeaders,
          Referer: pageReferer,
          Accept: 'text/html,application/xhtml+xml,application/xml,application/rss+xml,application/json;q=0.9,*/*;q=0.5',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      })
      const finalHost = new URL(response.url).hostname.toLowerCase()
      if (!response.ok || !source.hosts.includes(finalHost)) return null
      const contentLength = Number(response.headers.get('content-length') || 0)
      if (contentLength > 6_000_000) return null
      const body = await response.text()
      if (body.length > 6_000_000) return null
      return {
        url: response.url,
        contentType: response.headers.get('content-type') || '',
        body,
      }
    } catch {
      return null
    }
  })
}

async function collectCandidates(source, excludedSourceUrls) {
  const candidates = new Map()
  for (let pageNumber = 1; pageNumber <= 4 && candidates.size < MAX_BLOG_ARTICLES_PER_SOURCE; pageNumber++) {
    const apiUrl = new URL(WORDPRESS_PATH, source.baseUrl)
    apiUrl.searchParams.set('per_page', '30')
    apiUrl.searchParams.set('page', String(pageNumber))
    apiUrl.searchParams.set('_embed', '1')
    const apiPage = await requestSourcePage(source, apiUrl.toString())
    if (!apiPage || !/json/i.test(apiPage.contentType)) break
    try {
      const posts = JSON.parse(apiPage.body)
      if (!Array.isArray(posts) || posts.length === 0) break
      parseWordPressPosts(posts, source, candidates, excludedSourceUrls)
      if (posts.length < 30) break
    } catch {
      // A non-WordPress response at this path is not an import failure.
      break
    }
  }

  if (candidates.size < MAX_BLOG_ARTICLES_PER_SOURCE) {
    for (const path of FEED_PATHS) {
      const page = await requestSourcePage(source, new URL(path, source.baseUrl).toString())
      if (!page) continue
      if (/xml|rss|atom/i.test(page.contentType) || /<(?:rss|feed)\b/i.test(page.body.slice(0, 500))) {
        parseFeed(page.body, source, candidates, excludedSourceUrls)
      }
      if (candidates.size >= MAX_BLOG_ARTICLES_PER_SOURCE) break
    }
  }

  if (candidates.size < MAX_BLOG_ARTICLES_PER_SOURCE) {
    for (const path of SITEMAP_PATHS) {
      const page = await requestSourcePage(source, new URL(path, source.baseUrl).toString())
      if (!page || !/xml|text/i.test(page.contentType) && !/<(?:urlset|sitemapindex)\b/i.test(page.body.slice(0, 500))) continue
      const nestedSitemaps = parseSitemap(page.body, source, candidates, excludedSourceUrls)
      for (const sitemapUrl of nestedSitemaps) {
        const nested = await requestSourcePage(source, sitemapUrl)
        if (nested) parseSitemap(nested.body, source, candidates, excludedSourceUrls)
        if (candidates.size >= MAX_BLOG_ARTICLES_PER_SOURCE) break
      }
      if (candidates.size >= MAX_BLOG_ARTICLES_PER_SOURCE) break
    }
  }

  if (candidates.size < MAX_BLOG_ARTICLES_PER_SOURCE) {
    for (const path of ARCHIVE_PATHS) {
      const pageUrl = new URL(path, source.baseUrl).toString()
      const page = await requestSourcePage(source, pageUrl)
      if (!page) continue
      collectArchiveLinks(page.body, page.url, source, candidates, excludedSourceUrls)
      if (candidates.size >= MAX_BLOG_ARTICLES_PER_SOURCE) break
    }
  }
  return [...candidates.values()].slice(0, MAX_BLOG_ARTICLES_PER_SOURCE)
}

async function articleFromCandidate(source, candidate, downloadImage) {
  let html = candidate.overrides.contentHtml || ''
  let pageUrl = candidate.url
  if (!html) {
    const page = await requestSourcePage(source, candidate.url, source.baseUrl)
    if (!page) return null
    html = page.body
    pageUrl = page.url
  }
  return parseBlogArticleHtml(html, pageUrl, source, candidate.overrides, downloadImage)
}

async function mapWithConcurrency(values, concurrency, callback) {
  const results = new Array(values.length)
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++
      results[index] = await callback(values[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

export async function importBlogArticlesFromApprovedSources({
  sourceId = 'all',
  maxPerSource = MAX_BLOG_ARTICLES_PER_SOURCE,
  excludeSourceUrls = [],
  downloadImage,
  onSourceComplete,
} = {}) {
  const selectedSources = sourceId === 'all'
    ? BLOG_IMPORT_SOURCES
    : BLOG_IMPORT_SOURCES.filter((source) => source.id === sourceId)
  if (!selectedSources.length) throw new Error('Unknown approved blog source')

  const boundedLimit = Math.max(1, Math.min(Number(maxPerSource) || MAX_BLOG_ARTICLES_PER_SOURCE, MAX_BLOG_ARTICLES_PER_SOURCE))
  const excluded = new Set(excludeSourceUrls.map((url) => String(url || '').trim()).filter(Boolean))
  const perSourceResults = await mapWithConcurrency(selectedSources, 3, async (source) => {
    const result = { id: source.id, name: source.name, discovered: 0, parsed: 0, error: '' }
    let articles = []
    try {
      const robots = await getDirectoryRobotsStatus(source)
      if (!robots.allowed) {
        result.error = robots.reason || 'robots.txt does not allow importing'
      } else {
        const candidates = (await collectCandidates(source, excluded)).slice(0, boundedLimit)
        result.discovered = candidates.length
        for (const candidate of candidates) {
          try {
            const article = await articleFromCandidate(source, candidate, downloadImage)
            if (article) articles.push(article)
          } catch {
            // Skip one malformed post without stopping the rest of this source.
          }
        }
        result.parsed = articles.length
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message.slice(0, 180) : 'Source import failed'
    }
    await onSourceComplete?.({ ...result, articles })
    return result
  })
  return perSourceResults
}
