/**
 * Route external images through the server-side proxy so that
 * hotlink-protected CDNs (e.g. nairobiraha.com) serve real photos
 * instead of watermarks.
 *
 * Local paths (/api/uploads/...) are returned unchanged.
 * Null / undefined → undefined (safe for optional src attributes).
 */
export function proxyImg(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://'))
    return `/api/image-proxy?url=${encodeURIComponent(url)}`
  return url
}
