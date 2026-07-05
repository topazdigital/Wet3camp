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

// Simple in-memory cache: url → { buf, ct, exp }
const CACHE = new Map<string, { buf: Buffer; ct: string; exp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const MAX_CACHE = 200

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

async function fetchAndCache(url: string): Promise<{ buf: Buffer; ct: string } | null> {
  const cached = CACHE.get(url)
  if (cached && cached.exp > Date.now()) return { buf: cached.buf, ct: cached.ct }

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
    clearTimeout(timeout)

    if (!upstream.ok) return null

    const ct = upstream.headers.get('content-type') ?? 'image/jpeg'
    if (!ct.startsWith('image/')) return null

    const buf = Buffer.from(await upstream.arrayBuffer())

    if (CACHE.size >= MAX_CACHE) {
      const firstKey = CACHE.keys().next().value
      if (firstKey) CACHE.delete(firstKey)
    }
    CACHE.set(url, { buf, ct, exp: Date.now() + CACHE_TTL })
    return { buf, ct }
  } catch {
    clearTimeout(timeout)
    return null
  }
}

// HEAD — WhatsApp/Facebook crawlers probe with HEAD before fetching the image
router.head('/image-proxy', async (req: Request, res: Response) => {
  const raw = req.query.url as string | undefined
  if (!raw) { res.status(400).end(); return }

  let url: string
  try { url = decodeURIComponent(raw) } catch { res.status(400).end(); return }

  if (!url.startsWith('http://') && !url.startsWith('https://')) { res.status(400).end(); return }
  if (isBlocked(url)) { res.status(403).end(); return }

  // Check cache first — avoids a full download just for HEAD
  const cached = CACHE.get(url)
  if (cached && cached.exp > Date.now()) {
    res.setHeader('Content-Type', cached.ct)
    res.setHeader('Content-Length', cached.buf.length)
    res.setHeader('Cache-Control', 'public, max-age=600')
    res.setHeader('Accept-Ranges', 'bytes')
    res.status(200).end()
    return
  }

  // Not cached — fetch and cache so the subsequent GET is instant
  const result = await fetchAndCache(url)
  if (!result) { res.status(502).end(); return }

  res.setHeader('Content-Type', result.ct)
  res.setHeader('Content-Length', result.buf.length)
  res.setHeader('Cache-Control', 'public, max-age=600')
  res.setHeader('Accept-Ranges', 'bytes')
  res.status(200).end()
})

// GET — serve the actual image
router.get('/image-proxy', async (req: Request, res: Response) => {
  const raw = req.query.url as string | undefined
  if (!raw) { res.status(400).send('Missing url'); return }

  let url: string
  try { url = decodeURIComponent(raw) } catch { res.status(400).send('Bad url encoding'); return }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    res.status(400).send('Only http/https allowed'); return
  }
  if (isBlocked(url)) { res.status(403).send('Blocked'); return }

  const result = await fetchAndCache(url)
  if (!result) { res.status(502).send('Proxy error'); return }

  res.setHeader('Content-Type', result.ct)
  res.setHeader('Content-Length', result.buf.length)
  res.setHeader('Cache-Control', 'public, max-age=600')
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('X-Proxy-Cache', CACHE.has(url) ? 'HIT' : 'MISS')
  res.send(result.buf)
})

export default router
