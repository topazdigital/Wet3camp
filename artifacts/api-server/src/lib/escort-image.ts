export const DEFAULT_ESCORT_IMAGE = '/icon-512.png'

const DEFAULT_IMAGE_PATHS = new Set([
  '/logo-woman.png',
  DEFAULT_ESCORT_IMAGE,
  '/icon-512-maskable.png',
  '/icon-192.png',
  '/icon-light-32x32.png',
  '/icon-dark-32x32.png',
  '/favicon.ico',
  '/apple-icon.png',
  '/wet3camp-wordmark.png',
  '/placeholder.jpg',
  '/placeholder-user.jpg',
  '/placeholder-logo.png',
  '/placeholder-logo.svg',
  '/placeholder.svg',
  '/api/placeholder-escort.jpg',
])

const DEFAULT_IMAGE_FILENAMES = [...DEFAULT_IMAGE_PATHS].map(path => path.slice(1))

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

export function hasEscortPhoto(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0 && !isDefaultEscortImage(value)
}

export function normalizeEscortImage(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() && !isDefaultEscortImage(candidate)) {
      return candidate.trim()
    }
  }
  return DEFAULT_ESCORT_IMAGE
}

export function defaultEscortImageSql(imageExpression: string): string {
  const lowered = `LOWER(COALESCE(${imageExpression}, ''))`
  return `(${DEFAULT_IMAGE_FILENAMES.map(filename => `${lowered} LIKE '%${filename}%'`).join(' OR ')})`
}

export function escortPhotoPrioritySql(escortAlias = 'e'): string {
  const imageExpression = `${escortAlias}.image`
  const galleryAlias = 'escort_photo_priority'
  return `CASE WHEN (
    NULLIF(TRIM(${imageExpression}), '') IS NOT NULL
    AND NOT ${defaultEscortImageSql(imageExpression)}
  ) OR EXISTS (
    SELECT 1 FROM escort_gallery ${galleryAlias}
    WHERE ${galleryAlias}.escort_id = ${escortAlias}.id
      AND ${galleryAlias}.image_url IS NOT NULL
      AND TRIM(${galleryAlias}.image_url) <> ''
      AND NOT ${defaultEscortImageSql(`${galleryAlias}.image_url`)}
  ) THEN 0 ELSE 1 END`
}

export function escortImageSql(escortAlias = 'e'): string {
  const imageExpression = `${escortAlias}.image`
  const galleryAlias = 'escort_image_fallback'
  return `COALESCE(
    NULLIF(CASE WHEN ${defaultEscortImageSql(imageExpression)} THEN NULL ELSE NULLIF(${imageExpression}, '') END, ''),
    (
      SELECT ${galleryAlias}.image_url
      FROM escort_gallery ${galleryAlias}
      WHERE ${galleryAlias}.escort_id = ${escortAlias}.id
        AND ${galleryAlias}.image_url IS NOT NULL
        AND TRIM(${galleryAlias}.image_url) <> ''
        AND NOT ${defaultEscortImageSql(`${galleryAlias}.image_url`)}
      ORDER BY ${galleryAlias}.id ASC
      LIMIT 1
    ),
    '${DEFAULT_ESCORT_IMAGE}'
  )`
}
