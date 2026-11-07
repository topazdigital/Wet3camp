import type { CompatPool } from './db.js'

export function isMissingGallerySortOrderColumn(error: unknown): boolean {
  const message = String((error as any)?.message ?? error).toLowerCase()
  return message.includes('sort_order') && (
    message.includes('unknown column') ||
    message.includes('does not exist') ||
    message.includes('no such column')
  )
}

export async function getEscortGalleryRows(pool: CompatPool, escortId: string | number) {
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT id, image_url, sort_order FROM escort_gallery WHERE escort_id = ? ORDER BY sort_order ASC, id ASC',
      [escortId],
    )
    return Array.isArray(rows) ? rows : []
  } catch (error) {
    if (!isMissingGallerySortOrderColumn(error)) throw error

    const [rows] = await pool.query<any[]>(
      'SELECT id, image_url FROM escort_gallery WHERE escort_id = ? ORDER BY id ASC',
      [escortId],
    )
    return Array.isArray(rows) ? rows : []
  }
}
