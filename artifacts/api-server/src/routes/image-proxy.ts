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

function isBlocked(url: string): boolean {
  return BLOCKED.some(r => r.test(url))
}

router.get('/image-proxy', async (req: Request, res: Response) => {
  const raw = req.query.url as string | undefined
  if (!raw) { res.status(400).send('Missing url'); return }

  let url: string
  try { url = decodeURIComponent(raw) } catch { res.status(400).send('Bad url encoding'); return }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    res.status(400).send('Only http/https allowed'); return
  }
  if (isBlocked(url)) { res.status(403).send('Blocked'); return }

  // Serve from cache if fresh
  const cached = CACHE.get(url)
  if (cached && cached.exp > Date.now()) {
    res.setHeader('Content-Type', cached.ct)
    res.setHeader('Cache-Control', 'public, max-age=600')
    res.setHeader('X-Proxy-Cache', 'HIT')
    res.send(cached.buf)
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        // No Referer — this bypasses hotlink checks
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!upstream.ok) { res.status(upstream.status).send('Upstream error'); return }

    const ct = upstream.headers.get('content-type') ?? 'image/jpeg'
    if (!ct.startsWith('image/')) { res.status(400).send('Not an image'); return }

    const buf = Buffer.from(await upstream.arrayBuffer())

    // Store in cache (evict oldest if full)
    if (CACHE.size >= MAX_CACHE) {
      const firstKey = CACHE.keys().next().value
      if (firstKey) CACHE.delete(firstKey)
    }
    CACHE.set(url, { buf, ct, exp: Date.now() + CACHE_TTL })

    res.setHeader('Content-Type', ct)
    res.setHeader('Cache-Control', 'public, max-age=600')
    res.setHeader('X-Proxy-Cache', 'MISS')
    res.send(buf)
  } catch (err: any) {
    if (err?.name === 'AbortError') { res.status(504).send('Upstream timeout'); return }
    res.status(502).send('Proxy error')
  }
})

export default router
