import type { CompatQuery } from './db.js'

type MergeIds = {
  candidateId: string | number
  primaryId: string | number
  userId: string | number
}

function mergeError(message: string, statusCode = 409) {
  return Object.assign(new Error(message), { statusCode })
}

const PROFILE_TEXT_FIELDS = [
  'bio',
  'image',
  'height',
  'body_type',
  'ethnicity',
  'hair_color',
  'city',
  'area',
  'phone',
  'whatsapp',
  'telegram',
  'instagram',
  'facebook',
  'source_site',
  'source_url',
]

const PROFILE_ZERO_FIELDS = [
  'age',
]

const SIMPLE_ESCORT_LINK_TABLES = [
  'bookings',
  'messages',
  'subscriptions',
  'escort_profile_events',
  'feed_comments',
  'escort_videos',
  'adverts',
] as const

const UNIQUE_ESCORT_LINK_TABLES: ReadonlyArray<{ table: string; keys: string[] }> = [
  { table: 'reviews', keys: ['user_id'] },
  { table: 'favorites', keys: ['user_id'] },
  { table: 'followers', keys: ['user_id'] },
  { table: 'user_follows', keys: ['user_id'] },
  { table: 'feed_likes', keys: ['user_id', 'guest_key'] },
]

function sameId(left: unknown, right: unknown): boolean {
  return left !== null && left !== undefined && String(left) === String(right)
}

function isBlank(value: unknown, zeroIsBlank = false): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  return zeroIsBlank && Number(value) === 0
}

async function getRows(query: CompatQuery, sql: string, params: unknown[] = []): Promise<any[]> {
  const [rows] = await query(sql, params)
  return Array.isArray(rows) ? rows : []
}

export async function getMergedEscortIds(query: CompatQuery, primaryId: string | number): Promise<string[]> {
  const rows = await getRows(query, 'SELECT id FROM escorts WHERE merged_into_id = ?', [primaryId])
  return [String(primaryId), ...rows.map(row => String(row.id))]
}

export async function resolveCanonicalEscortId(
  query: CompatQuery,
  requestedId: string | number,
): Promise<{ id: string; redirected: boolean } | null> {
  let currentId = String(requestedId)
  const visited = new Set<string>()
  let redirected = false

  for (let depth = 0; depth < 20; depth += 1) {
    if (visited.has(currentId)) return null
    visited.add(currentId)
    const rows = await getRows(query, 'SELECT id, merged_into_id FROM escorts WHERE id = ? LIMIT 1', [currentId])
    const row = rows[0]
    if (!row) return null
    if (!row.merged_into_id) return { id: String(row.id), redirected }
    currentId = String(row.merged_into_id)
    redirected = true
  }

  return null
}

async function mergeMissingProfileFields(
  query: CompatQuery,
  columns: Set<string>,
  primary: Record<string, any>,
  candidate: Record<string, any>,
  primaryId: string | number,
) {
  const updates: Array<[string, unknown]> = []
  for (const field of PROFILE_TEXT_FIELDS) {
    if (
      columns.has(`escorts.${field}`) &&
      isBlank(primary[field]) &&
      !isBlank(candidate[field])
    ) {
      updates.push([field, candidate[field]])
    }
  }
  for (const field of PROFILE_ZERO_FIELDS) {
    if (
      columns.has(`escorts.${field}`) &&
      isBlank(primary[field], true) &&
      !isBlank(candidate[field], true)
    ) {
      updates.push([field, candidate[field]])
    }
  }

  if (updates.length === 0) return
  const setClauses = updates.map(([field]) => `${field} = ?`)
  const values = updates.map(([, value]) => value)
  if (columns.has('escorts.updated_at')) setClauses.push('updated_at = NOW()')
  await query(`UPDATE escorts SET ${setClauses.join(', ')} WHERE id = ?`, [...values, primaryId])
}

async function mergeGallery(query: CompatQuery, columns: Set<string>, candidateId: string | number, primaryId: string | number) {
  if (!columns.has('escort_gallery.id') || !columns.has('escort_gallery.escort_id') || !columns.has('escort_gallery.image_url')) return
  const existing = await getRows(query, 'SELECT image_url FROM escort_gallery WHERE escort_id = ?', [primaryId])
  const seen = new Set(existing.map(row => String(row.image_url ?? '').trim().toLowerCase()).filter(Boolean))
  const candidates = await getRows(query, 'SELECT id, image_url FROM escort_gallery WHERE escort_id = ?', [candidateId])
  for (const row of candidates) {
    const image = String(row.image_url ?? '').trim()
    if (!image || seen.has(image.toLowerCase())) continue
    await query('UPDATE escort_gallery SET escort_id = ? WHERE id = ?', [primaryId, row.id])
    seen.add(image.toLowerCase())
  }
}

async function mergeNamedRows(
  query: CompatQuery,
  columns: Set<string>,
  table: 'escort_services' | 'escort_languages',
  candidateId: string | number,
  primaryId: string | number,
) {
  if (!columns.has(`${table}.id`) || !columns.has(`${table}.escort_id`) || !columns.has(`${table}.${table === 'escort_services' ? 'name' : 'language'}`)) return

  const valueColumn = table === 'escort_services' ? 'name' : 'language'
  const sourceColumns = table === 'escort_services' && columns.has('escort_services.available')
    ? `id, ${valueColumn}, available`
    : `id, ${valueColumn}`
  const targetRows = await getRows(query, `SELECT id, ${valueColumn}${table === 'escort_services' && columns.has('escort_services.available') ? ', available' : ''} FROM ${table} WHERE escort_id = ?`, [primaryId])
  const existing = new Map(targetRows.map(row => [String(row[valueColumn] ?? '').trim().toLowerCase(), row]))
  const sourceRows = await getRows(query, `SELECT ${sourceColumns} FROM ${table} WHERE escort_id = ?`, [candidateId])

  for (const row of sourceRows) {
    const key = String(row[valueColumn] ?? '').trim().toLowerCase()
    if (!key) continue
    const target = existing.get(key)
    if (target) {
      if (
        table === 'escort_services' &&
        columns.has('escort_services.available') &&
        Number(row.available) > Number(target.available)
      ) {
        await query('UPDATE escort_services SET available = ? WHERE id = ?', [row.available, target.id])
      }
      continue
    }

    await query(`UPDATE ${table} SET escort_id = ? WHERE id = ?`, [primaryId, row.id])
    existing.set(key, row)
  }
}

async function moveUniqueRows(
  query: CompatQuery,
  columns: Set<string>,
  table: string,
  keys: string[],
  candidateId: string | number,
  primaryId: string | number,
) {
  if (
    !columns.has(`${table}.id`) ||
    !columns.has(`${table}.escort_id`) ||
    keys.some(key => !columns.has(`${table}.${key}`))
  ) return

  const sourceRows = await getRows(
    query,
    `SELECT id, ${keys.join(', ')} FROM ${table} WHERE escort_id = ?`,
    [candidateId],
  )

  for (const row of sourceRows) {
    const conflictParts: string[] = []
    const conflictValues: unknown[] = [primaryId]
    for (const key of keys) {
      if (row[key] === null || row[key] === undefined) continue
      conflictParts.push(`${key} = ?`)
      conflictValues.push(row[key])
    }

    // If every unique key is NULL, MySQL and PostgreSQL both permit the row;
    // there is no meaningful duplicate actor to collapse.
    let conflict: any = null
    if (conflictParts.length) {
      const conflicts = await getRows(
        query,
        `SELECT id FROM ${table} WHERE escort_id = ? AND (${conflictParts.join(' OR ')}) LIMIT 1`,
        conflictValues,
      )
      conflict = conflicts[0]
    }
    if (!conflict) {
      await query(`UPDATE ${table} SET escort_id = ? WHERE id = ?`, [primaryId, row.id])
    }
  }
}

export async function mergeEscortProfiles(
  query: CompatQuery,
  columns: Set<string>,
  { candidateId, primaryId, userId }: MergeIds,
) {
  if (!columns.has('escorts.merged_into_id')) {
    throw mergeError('The escort merge schema has not been applied', 503)
  }
  if (sameId(candidateId, primaryId)) {
    throw mergeError('A profile cannot be merged into itself')
  }

  const primaryRows = await getRows(query, 'SELECT * FROM escorts WHERE id = ? FOR UPDATE', [primaryId])
  const candidateRows = await getRows(query, 'SELECT * FROM escorts WHERE id = ? FOR UPDATE', [candidateId])
  const primary = primaryRows[0]
  const candidate = candidateRows[0]

  if (!primary || !candidate) throw mergeError('One of the profiles no longer exists', 404)
  if (!sameId(primary.user_id, userId) || Number(primary.is_active) !== 1 || primary.merged_into_id) {
    throw mergeError('The existing managed profile is no longer available for this merge')
  }
  if (candidate.user_id !== null && candidate.user_id !== undefined) {
    throw mergeError('The listing has already been claimed')
  }
  if (Number(candidate.is_active) !== 1 || candidate.merged_into_id) {
    throw mergeError('The listing is no longer available to merge')
  }

  await mergeMissingProfileFields(query, columns, primary, candidate, primaryId)
  await mergeGallery(query, columns, candidateId, primaryId)
  await mergeNamedRows(query, columns, 'escort_services', candidateId, primaryId)
  await mergeNamedRows(query, columns, 'escort_languages', candidateId, primaryId)

  for (const table of SIMPLE_ESCORT_LINK_TABLES) {
    if (columns.has(`${table}.escort_id`)) {
      await query(`UPDATE ${table} SET escort_id = ? WHERE escort_id = ?`, [primaryId, candidateId])
    }
  }

  for (const { table, keys } of UNIQUE_ESCORT_LINK_TABLES) {
    await moveUniqueRows(query, columns, table, keys, candidateId, primaryId)
  }

  const candidateSet = ['merged_into_id = ?', 'is_active = 0']
  const candidateParams: unknown[] = [primaryId]
  if (columns.has('escorts.online')) candidateSet.push('online = 0')
  if (columns.has('escorts.available')) candidateSet.push('available = 0')
  if (columns.has('escorts.updated_at')) candidateSet.push('updated_at = NOW()')
  await query(`UPDATE escorts SET ${candidateSet.join(', ')} WHERE id = ?`, [...candidateParams, candidateId])

  const primarySet = ['verified = 1']
  if (columns.has('escorts.updated_at')) primarySet.push('updated_at = NOW()')
  await query(`UPDATE escorts SET ${primarySet.join(', ')} WHERE id = ?`, [primaryId])

  if (columns.has('reviews.escort_id') && columns.has('reviews.rating')) {
    const visibleCondition = columns.has('reviews.is_visible') ? ' AND r.is_visible = 1' : ''
    const [reviewRows] = await query(
      `SELECT COUNT(*) AS total, AVG(r.rating) AS average
       FROM reviews r
       LEFT JOIN escorts source ON source.id = r.escort_id
       WHERE (r.escort_id = ? OR source.merged_into_id = ?)${visibleCondition}`,
      [primaryId, primaryId],
    )
    const reviewSummary = Array.isArray(reviewRows) ? reviewRows[0] : null
    if (Number(reviewSummary?.total) > 0) {
      const metricUpdates: string[] = []
      const metricValues: unknown[] = []
      if (columns.has('escorts.reviews_count')) {
        metricUpdates.push('reviews_count = ?')
        metricValues.push(Number(reviewSummary.total))
      }
      if (columns.has('escorts.rating')) {
        metricUpdates.push('rating = ?')
        metricValues.push(Number(Number(reviewSummary.average).toFixed(1)))
      }
      if (metricUpdates.length) {
        await query(`UPDATE escorts SET ${metricUpdates.join(', ')} WHERE id = ?`, [...metricValues, primaryId])
      }
    }
  }

  return {
    primaryId: String(primaryId),
    primaryName: String(primary.name),
    candidateId: String(candidateId),
  }
}
