import type { CompatQuery } from './db.js'

export const ADMIN_ACCOUNT_CLEANUP_TABLES = [
  'adverts',
  'bookings',
  'blacklist',
  'blacklist_reports',
  'escort_gallery',
  'escort_languages',
  'escort_profile_events',
  'escort_services',
  'escort_videos',
  'favorites',
  'feed_comments',
  'feed_likes',
  'followers',
  'messages',
  'notifications',
  'password_resets',
  'profile_claims',
  'referrals',
  'reviews',
  'room_bookings',
  'sessions',
  'subscriptions',
  'testimonials',
  'user_follows',
] as const

const ESCORT_CHILD_TABLES: ReadonlyArray<readonly [string, string]> = [
  ['escort_gallery', 'escort_id'],
  ['escort_languages', 'escort_id'],
  ['escort_services', 'escort_id'],
  ['bookings', 'escort_id'],
  ['reviews', 'escort_id'],
  ['favorites', 'escort_id'],
  ['followers', 'escort_id'],
  ['messages', 'escort_id'],
  ['subscriptions', 'escort_id'],
  ['profile_claims', 'escort_id'],
  ['escort_profile_events', 'escort_id'],
  ['feed_likes', 'escort_id'],
  ['feed_comments', 'escort_id'],
  ['escort_videos', 'escort_id'],
]

const USER_CHILD_TABLES: ReadonlyArray<readonly [string, string]> = [
  ['sessions', 'user_id'],
  ['bookings', 'user_id'],
  ['reviews', 'user_id'],
  ['favorites', 'user_id'],
  ['followers', 'user_id'],
  ['notifications', 'user_id'],
  ['messages', 'sender_id'],
  ['messages', 'receiver_id'],
  ['subscriptions', 'user_id'],
  ['profile_claims', 'user_id'],
  ['referrals', 'user_id'],
  ['feed_likes', 'user_id'],
  ['feed_comments', 'user_id'],
  ['testimonials', 'user_id'],
  ['user_follows', 'user_id'],
]

async function deleteRows(
  query: CompatQuery,
  columns: Set<string>,
  table: string,
  column: string,
  value: string | number,
) {
  if (columns.has(`${table}.${column}`)) {
    await query(`DELETE FROM ${table} WHERE ${column} = ?`, [value])
  }
}

export async function deleteEscortProfileData(
  query: CompatQuery,
  escortId: string | number,
  columns: Set<string>,
) {
  for (const [table, column] of ESCORT_CHILD_TABLES) {
    await deleteRows(query, columns, table, column, escortId)
  }
  if (columns.has('adverts.escort_id')) {
    await query('UPDATE adverts SET escort_id = NULL WHERE escort_id = ?', [escortId])
  }
  await query('DELETE FROM escorts WHERE id = ?', [escortId])
}

export async function permanentlyDeleteUser(
  query: CompatQuery,
  userId: string | number,
  columns: Set<string>,
) {
  const [userRows] = await query(
    'SELECT id, email, role FROM users WHERE id = ? LIMIT 1',
    [userId],
  )
  const user = (userRows as any[])[0]
  if (!user) return null

  const [escortRows] = await query(
    'SELECT id FROM escorts WHERE user_id = ?',
    [userId],
  )
  const escortIds = (escortRows as any[]).map(row => String(row.id))

  for (const escortId of escortIds) {
    await deleteEscortProfileData(query, escortId, columns)
  }

  for (const [table, column] of USER_CHILD_TABLES) {
    await deleteRows(query, columns, table, column, userId)
  }

  if (user.email && columns.has('password_resets.email')) {
    await query('DELETE FROM password_resets WHERE email = ?', [user.email])
  }
  if (user.email && columns.has('room_bookings.guest_email')) {
    await query('DELETE FROM room_bookings WHERE guest_email = ?', [user.email])
  }
  if (columns.has('referrals.referred_user_id')) {
    await query('UPDATE referrals SET referred_user_id = NULL WHERE referred_user_id = ?', [userId])
  }
  if (columns.has('blacklist.reported_by')) {
    await query('UPDATE blacklist SET reported_by = NULL WHERE reported_by = ?', [userId])
  }
  if (columns.has('blacklist_reports.reported_by')) {
    await query('UPDATE blacklist_reports SET reported_by = NULL WHERE reported_by = ?', [userId])
  }

  await query('DELETE FROM users WHERE id = ?', [userId])
  return { userId: String(user.id), escortIds }
}
