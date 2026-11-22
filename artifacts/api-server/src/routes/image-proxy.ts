/**
 * GET /api/image-proxy?url=<encoded-url>
 *
 * Server-side image proxy: fetches the remote image without a Referer header,
 * bypassing hotlink-protection watermarks served by scraped source sites.
 *
 * Security: only allows http/https with a public routable IP (no localhost,
 * no RFC-1918 addresses, no file:// etc.).
 */
import { Router, type Request, type Response } from 'express'
import sharp from 'sharp'

const router = Router()

const BLOCKED = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/\[::1\]/,
]

type ImageData = { buf: Buffer; ct: string }
type CachedImage = ImageData & { exp: number }
type ProxyResult = ImageData & { cacheStatus: 'HIT' | 'MISS' | 'COALESCED' }

// Cache optimized variants for a day, while keeping memory use bounded.
const CACHE = new Map<string, CachedImage>()
const IN_FLIGHT = new Map<string, Promise<ImageData | null>>()
const CACHE_TTL = 24 * 60 * 60 * 1000
const MAX_CACHE_ENTRIES = 200
const MAX_CACHE_BYTES = 64 * 1024 * 1024
const MAX_CACHE_ENTRY_BYTES = 4 * 1024 * 1024
const IMAGE_WIDTHS = new Set([320, 480, 640, 960, 1280])
let cachedBytes = 0

/** Sites whose CDN requires a same-domain Referer to serve real images */
const REFERER_SPOOF: Record<string, string> = {
  'nairobiraha.com': 'https://nairobiraha.com/',
  'hookup254.com':   'https://hookup254.com/',
}

function isBlocked(url: string): boolean {
  return BLOCKED.some(r => r.test(url))
}

function getSpoofedReferer(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return REFERER_SPOOF[host]
  } catch {
    return undefined
  }
}

function readCache(key: string): ImageData | null {
  const cached = CACHE.get(key)
  if (!cached) return null
  if (cached.exp <= Date.now()) {
    CACHE.delete(key)
    cachedBytes -= cached.buf.length
    return null
  }

  // Refresh insertion order so eviction is least-recently-used.
  CACHE.delete(key)
  CACHE.set(key, cached)
  return { buf: cached.buf, ct: cached.ct }
}

function writeCache(key: string, image: ImageData) {
  if (image.buf.length > MAX_CACHE_ENTRY_BYTES) return
  const previous = CACHE.get(key)
  if (previous) {
    CACHE.delete(key)
    cachedBytes -= previous.buf.length
  }

  while (
    CACHE.size >= MAX_CACHE_ENTRIES ||
    cachedBytes + image.buf.length > MAX_CACHE_BYTES
  ) {
    const oldestKey = CACHE.keys().next().value
    if (!oldestKey) break
    const oldest = CACHE.get(oldestKey)
    CACHE.delete(oldestKey)
    if (oldest) cachedBytes -= oldest.buf.length
  }

  CACHE.set(key, { ...image, exp: Date.now() + CACHE_TTL })
  cachedBytes += image.buf.length
}

async function fetchAndOptimize(url: string, width?: number): Promise<ImageData | null> {
  const spoofedReferer = getSpoofedReferer(url)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/jpeg,image/png,image/*,*/*;q=0.8',
        ...(spoofedReferer ? { 'Referer': spoofedReferer } : {}),
      },
      redirect: 'follow',
    })

    if (!upstream.ok) return null

    const sourceType = (upstream.headers.get('content-type') ?? 'image/jpeg')
      .split(';', 1)[0]
      .trim()
      .toLowerCase()
    if (!sourceType.startsWith('image/')) return null

    const source = Buffer.from(await upstream.arrayBuffer())
    let image: ImageData = { buf: source, ct: sourceType }

    // Profile cards and galleries only need a resized WebP, not the full
    // original upload. Leave animated GIFs, SVGs, and unknown formats intact.
    if (
      width &&
      /^image\/(jpeg|jpg|png|webp|avif|tiff)$/.test(sourceType)
    ) {
      try {
        const optimized = await sharp(source, { limitInputPixels: 40_000_000 })
          .rotate()
          .resize({ width, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toBuffer()
        image = { buf: optimized, ct: 'image/webp' }
      } catch {
        // Keep serving unusual but valid image files when they cannot be
        // decoded by the optimizer.
      }
    }

    return image
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchAndCache(url: string, width?: number): Promise<ProxyResult | null> {
  const key = `${width ?? 'original'}:${url}`
  const cached = readCache(key)
  if (cached) return { ...cached, cacheStatus: 'HIT' }

  let pending = IN_FLIGHT.get(key)
  const cacheStatus = pending ? 'COALESCED' : 'MISS'
  if (!pending) {
    pending = fetchAndOptimize(url, width).then(image => {
      if (image) writeCache(key, image)
      return image
    }).finally(() => {
      IN_FLIGHT.delete(key)
    })
    IN_FLIGHT.set(key, pending)
  }

  const image = await pending
  return image ? { ...image, cacheStatus } : null
}

function parseWidth(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') return null
  const width = Number(value)
  return IMAGE_WIDTHS.has(width) ? width : null
}

function setImageHeaders(res: Response, image: ImageData) {
  res.setHeader('Content-Type', image.ct)
  res.setHeader('Content-Length', image.buf.length)
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  res.setHeader('Accept-Ranges', 'bytes')
}

// HEAD — WhatsApp/Facebook crawlers probe with HEAD before fetching the image
router.head('/image-proxy', async (req: Request, res: Response) => {
  const raw = req.query.url as string | undefined
  if (!raw) { res.status(400).end(); return }
  const width = parseWidth(req.query.w)
  if (width === null) { res.status(400).end(); return }

  let url: string
  try { url = decodeURIComponent(raw) } catch { res.status(400).end(); return }

  if (!url.startsWith('http://') && !url.startsWith('https://')) { res.status(400).end(); return }
  if (isBlocked(url)) { res.status(403).end(); return }

  const result = await fetchAndCache(url, width)
  if (!result) { res.status(502).end(); return }

  setImageHeaders(res, result)
  res.status(200).end()
})

// GET — serve the actual image
router.get('/image-proxy', async (req: Request, res: Response) => {
  const raw = req.query.url as string | undefined
  if (!raw) { res.status(400).send('Missing url'); return }
  const width = parseWidth(req.query.w)
  if (width === null) { res.status(400).send('Unsupported image width'); return }

  let url: string
  try { url = decodeURIComponent(raw) } catch { res.status(400).send('Bad url encoding'); return }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    res.status(400).send('Only http/https allowed'); return
  }
  if (isBlocked(url)) { res.status(403).send('Blocked'); return }

  const result = await fetchAndCache(url, width)
  if (!result) { res.status(502).send('Proxy error'); return }

  setImageHeaders(res, result)
  res.setHeader('X-Proxy-Cache', result.cacheStatus)
  if (result.ct === 'image/webp' && width) {
    res.setHeader('X-Image-Width', String(width))
  }
  res.send(result.buf)
})

export default router
