const BOT_USER_AGENT = 'Wet3CampImporter/1.0 (+https://wet3.camp/)'

export const DIRECTORY_SOURCES = [
  {
    id: 'rahaescorts',
    name: 'Raha Escorts',
    baseUrl: 'https://rahaescorts.com',
    hosts: ['rahaescorts.com', 'www.rahaescorts.com'],
    profilePath: /^\/escort\/[^/]+\/?$/i,
    listingPaths: ['/', '/all-escorts/', '/escorts/nairobi/'],
    sitemapPaths: ['/sitemap_index.xml'],
  },
  {
    id: 'raha-ke',
    name: 'Raha Kenya',
    baseUrl: 'https://raha.ke',
    hosts: ['raha.ke', 'www.raha.ke'],
    profilePath: /^\/escort\/[^/]+\/?$/i,
    listingPaths: ['/', '/escorts/nairobi/'],
    sitemapPaths: ['/sitemap_index.xml'],
  },
  {
    id: 'toplesskenya',
    name: 'Topless Kenya',
    baseUrl: 'https://toplesskenya.com',
    hosts: ['toplesskenya.com', 'www.toplesskenya.com'],
    profilePath: /^\/escort\/[^/]+\/?$/i,
    listingPaths: ['/', '/escorts/nairobi/'],
    sitemapPaths: ['/sitemap_index.xml'],
  },
  {
    id: 'nairobihot',
    name: 'Nairobi Hot',
    baseUrl: 'https://nairobihot.com',
    hosts: ['nairobihot.com', 'www.nairobihot.com'],
    profilePath: /^\/escort\/[^/]+\/?$/i,
    listingPaths: ['/', '/escorts/nairobi/'],
    sitemapPaths: [],
  },
  {
    id: 'kenyaraha',
    name: 'Kenya Raha',
    baseUrl: 'https://www.kenyaraha.com',
    hosts: ['kenyaraha.com', 'www.kenyaraha.com'],
    profilePath: /^\/(?:kenyan|tanzanian|ugandan|rwandan)-escort-from-[^/]+-kenya\/[^/]+\/?$/i,
    listingPaths: ['/', '/escorts-from/kenya/nairobi/', '/escorts-from/kenya/'],
    sitemapPaths: ['/sitemap.xml'],
  },
  {
    id: 'escortamus',
    name: 'Escortamus',
    baseUrl: 'https://www.escortamus.com',
    hosts: ['escortamus.com', 'www.escortamus.com'],
    profilePath: /^\/kenya\/[^/]+\/[^/]+\/?$/i,
    listingPaths: ['/', '/kenya/'],
    sitemapPaths: ['/sitemap.xml'],
  },
  {
    id: 'rahaanairobi',
    name: 'Raha Nairobi',
    baseUrl: 'https://www.rahaanairobi.com',
    hosts: ['rahaanairobi.com', 'www.rahaanairobi.com'],
    profilePath: /^\/(?:escort\/[^/]+|escorts-from\/nairobi\/[^/]+)\/?$/i,
    listingPaths: ['/', '/all-escorts/', '/new-escorts/', '/escorts-from/nairobi/'],
    sitemapPaths: [],
  },
  {
    id: 'mahabakenya',
    name: 'Mahaba Kenya',
    baseUrl: 'https://mahabakenya.com',
    hosts: ['mahabakenya.com', 'www.mahabakenya.com'],
    profilePath: /^\/(?:escort\/[^/]+|escorts-from\/nairobi\/[^/]+)\/?$/i,
    listingPaths: ['/', '/all-escorts/', '/escorts-from/nairobi/'],
    sitemapPaths: [],
  },
  {
    id: 'lovebiteglobal',
    name: 'Lovebite Global',
    baseUrl: 'https://lovebiteglobal.com',
    hosts: ['lovebiteglobal.com', 'www.lovebiteglobal.com'],
    profilePath: /^\/(?:escort\/[^/]+|escorts-from\/nairobi\/[^/]+)\/?$/i,
    listingPaths: ['/', '/all-escorts/', '/escorts-from/nairobi/'],
    sitemapPaths: [],
  },
  {
    id: 'ladys-one',
    name: 'Ladys One',
    baseUrl: 'https://ladys.one',
    hosts: ['ladys.one', 'www.ladys.one'],
    profilePath: /^\/(?:kenya\/[^/]+\/[^/]+|escort\/[^/]+)\/?$/i,
    listingPaths: ['/', '/kenya/'],
    sitemapPaths: [],
  },
].map((source) => ({
  ...source,
  sitemapPaths: source.sitemapPaths ?? ['/sitemap_index.xml', '/sitemap-index.xml', '/sitemap.xml', '/wp-sitemap.xml'],
  maxProfilesPerRun: 200,
  maxProfilesPerDiscovery: 1000,
}))

const ROBOTS_CACHE = new Map()
const MAX_SITEMAP_FILES = 40
const MAX_LISTING_PAGES = 12
export const APPROVED_IMPORT_SOURCE_IDS = new Set([
  'nairobiraha',
  ...DIRECTORY_SOURCES.map((source) => source.id),
])

export function getDirectorySource(idOrHost) {
  const key = String(idOrHost || '').toLowerCase().replace(/^www\./, '')
  return DIRECTORY_SOURCES.find((source) =>
    source.id === key || source.hosts.some((host) => host.replace(/^www\./, '') === key)
  ) || null
}

export function isSourceSelected(sourceId, filter) {
  const selectedFilter = String(filter || '').toLowerCase()
  if (!selectedFilter || selectedFilter === 'all') return true
  if (selectedFilter === 'approved') return APPROVED_IMPORT_SOURCE_IDS.has(sourceId)
  if (selectedFilter === sourceId) return true
  return getDirectorySource(selectedFilter)?.id === sourceId
}

export function normalizeDirectoryUrl(source, rawUrl) {
  if (!source || !rawUrl) return null
  try {
    const url = new URL(String(rawUrl).replace(/&amp;/g, '&'), source.baseUrl)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (!source.hosts.includes(url.hostname.toLowerCase())) return null
    url.protocol = 'https:'
    url.hostname = new URL(source.baseUrl).hostname
    url.port = ''
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

export function isDirectoryProfileUrl(source, rawUrl) {
  const normalized = normalizeDirectoryUrl(source, rawUrl)
  if (!normalized) return false
  try {
    return source.profilePath.test(new URL(normalized).pathname)
  } catch {
    return false
  }
}

function robotsPatternMatches(pattern, path) {
  if (!pattern) return false
  const anchored = pattern.endsWith('$')
  const raw = anchored ? pattern.slice(0, -1) : pattern
  const expression = raw
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')
  return new RegExp(`^${expression}${anchored ? '$' : ''}`).test(path)
}

export function parseRobotsRules(text, userAgent = 'Wet3CampImporter') {
  const groups = []
  const sitemaps = []
  let agents = []
  let rules = []

  const finishGroup = () => {
    if (agents.length) groups.push({ agents, rules })
    agents = []
    rules = []
  }

  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.split('#', 1)[0].trim()
    if (!line) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const key = line.slice(0, colon).trim().toLowerCase()
    const value = line.slice(colon + 1).trim()

    if (key === 'user-agent') {
      if (rules.length) finishGroup()
      agents.push(value.toLowerCase())
    } else if ((key === 'allow' || key === 'disallow') && agents.length && value) {
      rules.push({ type: key, pattern: value })
    } else if (key === 'sitemap' && value) {
      sitemaps.push(value)
    }
  }
  finishGroup()

  const agent = userAgent.toLowerCase()
  const specific = groups.filter((group) =>
    group.agents.some((name) => name !== '*' && agent.includes(name))
  )
  const selected = specific.length ? specific : groups.filter((group) => group.agents.includes('*'))
  return { rules: selected.flatMap((group) => group.rules), sitemaps }
}

export function robotsPathAllowed(path, rules) {
  let winningRule = null
  for (const rule of rules || []) {
    if (!robotsPatternMatches(rule.pattern, path)) continue
    const specificity = rule.pattern.replace(/[*/$]/g, '').length
    if (!winningRule || specificity > winningRule.specificity ||
      (specificity === winningRule.specificity && rule.type === 'allow')) {
      winningRule = { type: rule.type, specificity }
    }
  }
  return !winningRule || winningRule.type === 'allow'
}

export function extractSitemapEntries(xml) {
  const entries = []
  const urlBlocks = String(xml || '').match(/<(?:url|sitemap)\b[^>]*>[\s\S]*?<\/(?:url|sitemap)>/gi)
  if (urlBlocks?.length) {
    for (const block of urlBlocks) {
      const loc = block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i)?.[1]
      if (!loc) continue
      const lastmod = block.match(/<lastmod\b[^>]*>([\s\S]*?)<\/lastmod>/i)?.[1]
      entries.push({
        url: loc.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').trim(),
        lastmod: lastmod?.trim() || '',
      })
    }
    return entries
  }

  for (const match of String(xml || '').matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)) {
    entries.push({
      url: match[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').trim(),
      lastmod: '',
    })
  }
  return entries
}

function isSitemapUrl(rawUrl) {
  try {
    return /\.xml$/i.test(new URL(rawUrl).pathname) || /\/sitemap\//i.test(new URL(rawUrl).pathname)
  } catch {
    return false
  }
}

function extractAnchorHrefs(html) {
  const hrefs = []
  const anchor = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
  for (const match of String(html || '').matchAll(anchor)) {
    const href = match[1] ?? match[2] ?? match[3]
    if (href) hrefs.push(href)
  }
  return hrefs
}

function isPaginationUrl(rawUrl) {
  try {
    const url = new URL(rawUrl)
    return /\/page\/\d+\/?$/i.test(url.pathname) ||
      /\b(?:page|paged)=\d+/i.test(url.search)
  } catch {
    return false
  }
}

async function getRobotsPolicy(source) {
  const cacheKey = source.id
  if (ROBOTS_CACHE.has(cacheKey)) return ROBOTS_CACHE.get(cacheKey)

  const pending = (async () => {
    const robotsUrl = new URL('/robots.txt', source.baseUrl)
    try {
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': BOT_USER_AGENT, Accept: 'text/plain,*/*;q=0.5' },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      })
      if (!source.hosts.includes(new URL(response.url).hostname.toLowerCase())) {
        return { allowed: false, rules: [], sitemaps: [], reason: 'robots.txt redirected off the source domain' }
      }
      if (response.status === 404 || response.status === 410) {
        return { allowed: true, rules: [], sitemaps: [] }
      }
      if (!response.ok) {
        return { allowed: false, rules: [], sitemaps: [], reason: `robots.txt returned HTTP ${response.status}` }
      }
      return { allowed: true, ...parseRobotsRules(await response.text()) }
    } catch (error) {
      return { allowed: false, rules: [], sitemaps: [], reason: `robots.txt unavailable (${error.name || 'network error'})` }
    }
  })()

  ROBOTS_CACHE.set(cacheKey, pending)
  return pending
}

export async function directoryPathAllowed(source, url) {
  const normalized = normalizeDirectoryUrl(source, url)
  if (!normalized) return false
  const policy = await getRobotsPolicy(source)
  if (!policy.allowed) return false
  const parsed = new URL(normalized)
  return robotsPathAllowed(`${parsed.pathname}${parsed.search}`, policy.rules)
}

export async function fetchDirectoryPage(source, url, referer, fetchPage) {
  const normalized = normalizeDirectoryUrl(source, url)
  if (!normalized) return null
  const policy = await getRobotsPolicy(source)
  if (!policy.allowed) {
    console.warn(`  [${source.id}] skipped: ${policy.reason}`)
    return null
  }
  const parsed = new URL(normalized)
  if (!robotsPathAllowed(`${parsed.pathname}${parsed.search}`, policy.rules)) return null
  return fetchPage(normalized, referer || source.baseUrl, { 'User-Agent': BOT_USER_AGENT })
}

export async function collectDirectoryListings(source, { fetchPage, sleep, limit = 200 }) {
  const maxProfiles = Math.max(0, Math.min(limit, source.maxProfilesPerDiscovery || source.maxProfilesPerRun))
  if (!maxProfiles) return []

  const policy = await getRobotsPolicy(source)
  if (!policy.allowed) {
    console.warn(`  [${source.id}] skipped: ${policy.reason}`)
    return []
  }

  const profiles = new Map()
  const listingPages = new Set()
  const sitemapQueue = []
  const visitedSitemaps = new Set()
  const addProfile = (rawUrl) => {
    if (profiles.size >= maxProfiles) return
    if (!isDirectoryProfileUrl(source, rawUrl)) return
    const url = normalizeDirectoryUrl(source, rawUrl)
    if (!url || profiles.has(url)) return
    profiles.set(url, {
      url,
      rawName: decodeURIComponentSafe(url.split('/').filter(Boolean).at(-1)).replace(/[-_]+/g, ' '),
      location: null,
      thumbnailUrl: null,
      site: source.id,
    })
  }

  for (const sitemap of [...policy.sitemaps, ...source.sitemapPaths.map((path) => new URL(path, source.baseUrl).toString())]) {
    const normalized = normalizeDirectoryUrl(source, sitemap)
    if (normalized && isSitemapUrl(normalized)) sitemapQueue.push(normalized)
  }

  while (sitemapQueue.length && visitedSitemaps.size < MAX_SITEMAP_FILES && profiles.size < maxProfiles) {
    const url = sitemapQueue.shift()
    if (visitedSitemaps.has(url)) continue
    visitedSitemaps.add(url)
    const xml = await fetchDirectoryPage(source, url, source.baseUrl, fetchPage)
    await sleep(500)
    if (!xml) continue

    const entries = extractSitemapEntries(xml)
      .map((entry) => ({ ...entry, normalized: normalizeDirectoryUrl(source, entry.url) }))
      .filter((entry) => entry.normalized)
      .sort((a, b) => {
        const dateA = Date.parse(a.lastmod) || 0
        const dateB = Date.parse(b.lastmod) || 0
        return dateB - dateA
      })

    for (const entry of entries) {
      if (isSitemapUrl(entry.normalized)) {
        if (!visitedSitemaps.has(entry.normalized) && !sitemapQueue.includes(entry.normalized)) {
          sitemapQueue.push(entry.normalized)
        }
      } else {
        addProfile(entry.normalized)
      }
      if (profiles.size >= maxProfiles) break
    }
  }

  const listingQueue = [...new Set([
    ...source.listingPaths.map((path) => new URL(path, source.baseUrl).toString()),
  ])]
  const queuedListings = new Set(listingQueue)

  while (listingQueue.length && listingPages.size < MAX_LISTING_PAGES && profiles.size < maxProfiles) {
    const url = listingQueue.shift()
    if (listingPages.has(url)) continue
    listingPages.add(url)
    const html = await fetchDirectoryPage(source, url, source.baseUrl, fetchPage)
    await sleep(900)
    if (!html) continue

    for (const href of extractAnchorHrefs(html)) {
      const candidate = normalizeDirectoryUrl(source, href)
      if (!candidate) continue
      addProfile(candidate)
      if (listingPages.size + listingQueue.length < MAX_LISTING_PAGES &&
        isPaginationUrl(candidate) && !queuedListings.has(candidate)) {
        listingQueue.push(candidate)
        queuedListings.add(candidate)
      }
      if (profiles.size >= maxProfiles) break
    }
  }

  return [...profiles.values()]
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

