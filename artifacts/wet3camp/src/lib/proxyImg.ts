/**
 * Route external images through the server-side proxy so that
 * hotlink-protected CDNs (e.g. nairobiraha.com) serve real photos
 * instead of watermarks. Remote images are resized to a WebP variant;
 * local uploaded files keep their existing URL.
 *
 * Local paths (/api/uploads/...) are returned unchanged.
 * Null / undefined → undefined (safe for optional src attributes).
 */
export type ImageWidth = 320 | 480 | 640 | 960 | 1280

export function proxyImg(
  url: string | null | undefined,
  width: ImageWidth = 640,
): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://'))
    return `/api/image-proxy?url=${encodeURIComponent(url)}&w=${width}`
  return url
}
