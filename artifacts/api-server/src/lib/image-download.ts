/**
 * Shared utility: download a remote image and store it permanently in our
 * uploads directory so we never depend on an external CDN.
 *
 * Automatically spoofs the correct Referer for sites that use hotlink
 * protection (e.g. nairobiraha.com, hookup254.com).
 */
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads')

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Known sites whose CDN requires the same-domain Referer */
const REFERER_MAP: Record<string, string> = {
  'nairobiraha.com': 'https://nairobiraha.com/',
  'hookup254.com': 'https://hookup254.com/',
}

function getRefererForUrl(imageUrl: string): string | undefined {
  try {
    const host = new URL(imageUrl).hostname.replace(/^www\./, '')
    return REFERER_MAP[host]
  } catch {
    return undefined
  }
}

async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true })
  }
}

/**
 * Download `imageUrl` and save it locally.
 * Returns the local API path `/api/uploads/<filename>` on success,
 * or `null` if the download fails.
 *
 * @param imageUrl  Full remote URL to download
 * @param prefix    Optional filename prefix (e.g. "escort_42")
 * @param referer   Override Referer header (auto-detected if omitted)
 */
export async function downloadAndStoreImage(
  imageUrl: string,
  prefix = 'img',
  referer?: string,
): Promise<string | null> {
  if (!imageUrl || !imageUrl.startsWith('http')) return null

  const spoofedReferer = referer ?? getRefererForUrl(imageUrl)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const resp = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        ...(spoofedReferer ? { 'Referer': spoofedReferer } : {}),
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!resp.ok) return null

    const ct = resp.headers.get('content-type') ?? 'image/jpeg'
    if (!ct.startsWith('image/')) return null

    const buf = Buffer.from(await resp.arrayBuffer())
    if (buf.length < 1024) return null // probably an error page / tiny placeholder

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }
    const ext = extMap[ct.split(';')[0].trim()] ?? 'jpg'

    await ensureUploadsDir()

    const safeName = `${prefix}_${Date.now()}.${ext}`
    const filePath = path.join(UPLOADS_DIR, safeName)
    await writeFile(filePath, buf)

    return `/api/uploads/${safeName}`
  } catch {
    return null
  }
}
