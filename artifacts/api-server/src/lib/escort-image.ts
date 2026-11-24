export const DEFAULT_ESCORT_IMAGE = '/icon-512.png'

const DEFAULT_IMAGE_PATHS = new Set([
  '/logo-woman.png',
  DEFAULT_ESCORT_IMAGE,
])

export function isDefaultEscortImage(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false
  const input = value.trim()
  let pathname: string
  try {
    pathname = new URL(input, 'https://wet3.camp').pathname.toLowerCase()
  } catch {
    pathname = input.split(/[?#]/, 1)[0].toLowerCase()
  }
  return DEFAULT_IMAGE_PATHS.has(pathname)
}

export function normalizeEscortImage(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() && !isDefaultEscortImage(candidate)) {
      return candidate.trim()
    }
  }
  return DEFAULT_ESCORT_IMAGE
}
