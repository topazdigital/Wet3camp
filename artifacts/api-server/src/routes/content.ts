// =============================================================================
// Content routes: live, feeds, events, escort-videos, tours, shop,
//                 testimonials, blacklist
// =============================================================================
import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { getMergedEscortIds, resolveCanonicalEscortId } from '../lib/escort-merge.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { escortImageSql, escortPhotoPrioritySql } from '../lib/escort-image.js'

const router = Router()

// ── GET /api/live ─────────────────────────────────────────────────────────────
// Returns escorts currently marked online=1
router.get('/live', async (_req, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT e.id, e.name, e.age, e.city, e.area, ${escortImageSql()} AS image,
             e.tier, e.verified, e.rating, e.online, e.bio
      FROM escorts e
      WHERE e.is_active = 1 AND e.online = 1
      ORDER BY ${escortPhotoPrioritySql()},
               CASE e.tier WHEN 'elite' THEN 0 WHEN 'vip' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END,
               e.rating DESC
      LIMIT 40
    `)
    res.json(rows)
  } catch (err: any) {
    console.error('[live]', err?.message)
    res.json([])
  }
})

// ── GET /api/feeds ────────────────────────────────────────────────────────────
// Returns escort profiles formatted as activity feed posts
router.get('/feeds', async (_req, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT e.id, e.name, e.city, e.area, ${escortImageSql()} AS image, e.tier, e.verified,
             e.rating, e.online, e.bio, e.phone, e.created_at,
             u.id AS user_id
      FROM escorts e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.is_active = 1 AND (e.bio IS NOT NULL AND e.bio != '')
      ORDER BY ${escortPhotoPrioritySql()}, e.created_at DESC, e.rating DESC
      LIMIT 30
    `)
    res.json(rows)
  } catch (err: any) {
    console.error('[feeds]', err?.message)
    res.json([])
  }
})

function parseFeedMedia(value: unknown): Array<{ type: 'image' | 'video'; url: string }> {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is { type: 'image' | 'video'; url: string } =>
      item && (item.type === 'image' || item.type === 'video') && typeof item.url === 'string'
    )
  } catch {
    return []
  }
}

function serializeFeedPost(row: any) {
  return {
    ...row,
    id: String(row.id),
    escort_id: String(row.escort_id),
    user_id: String(row.user_id),
    media: parseFeedMedia(row.media_json),
  }
}

function validateFeedMedia(value: unknown, userId: number): Array<{ type: 'image' | 'video'; url: string }> | null {
  if (!Array.isArray(value) || value.length > 4) return null
  const ownerUpload = new RegExp(`^/api/uploads/\\d+_${userId}_feed_[a-z0-9._-]+\\.(?:jpeg|jpg|png|webp|gif|mp4|webm|mov)$`, 'i')
  const items: Array<{ type: 'image' | 'video'; url: string }> = []
  for (const entry of value) {
    if (!entry || (entry.type !== 'image' && entry.type !== 'video') || typeof entry.url !== 'string' || !ownerUpload.test(entry.url)) return null
    const isVideoUrl = /\\.(mp4|webm|mov)$/i.test(entry.url)
    if (isVideoUrl !== (entry.type === 'video')) return null
    items.push({ type: entry.type, url: entry.url })
  }
  const videos = items.filter(item => item.type === 'video').length
  if (videos > 1 || (videos === 1 && items.length !== 1)) return null
  return items
}

// ── Escort-authored feed posts ──────────────────────────────────────────────────
router.get('/feeds/posts', async (_req, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT p.id, p.escort_id, p.user_id, p.body, p.media_json, p.created_at,
             e.name AS escort_name, e.image AS escort_image, e.city, e.area,
             e.tier, e.verified, e.online
      FROM feed_posts p
      JOIN escorts e ON e.id = p.escort_id
      WHERE p.is_active = 1 AND e.is_active = 1
      ORDER BY p.created_at DESC
      LIMIT 60
    `)
    res.json(rows.map(serializeFeedPost))
  } catch (err: any) {
    console.error('[feed-posts]', err?.message)
    res.status(500).json({ message: 'Could not load feed posts' })
  }
})

router.post('/feeds/posts', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'escort' || req.userId == null) {
    res.status(403).json({ message: 'An active escort account is required to post' }); return
  }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
  if (body.length > 2000) { res.status(400).json({ message: 'Post text must be 2,000 characters or fewer' }); return }
  const media = validateFeedMedia(req.body?.media, req.userId)
  if (!media) { res.status(400).json({ message: 'Choose up to four photos or one video uploaded to your account' }); return }
  if (!body && media.length === 0) { res.status(400).json({ message: 'Add some text or media before posting' }); return }
  try {
    const [[escort]] = await pool.query<any[]>(
      'SELECT id FROM escorts WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1',
      [req.userId],
    )
    if (!escort) { res.status(403).json({ message: 'An active, claimed escort profile is required to post' }); return }
    const [result] = await pool.query<any>(
      'INSERT INTO feed_posts (escort_id, user_id, body, media_json, is_active) VALUES (?, ?, ?, ?, 1)',
      [escort.id, req.userId, body, JSON.stringify(media)],
    )
    const newId = result?.insertId ?? result?.id
    const [[row]] = await pool.query<any[]>(`
      SELECT p.id, p.escort_id, p.user_id, p.body, p.media_json, p.created_at,
             e.name AS escort_name, e.image AS escort_image, e.city, e.area,
             e.tier, e.verified, e.online
      FROM feed_posts p
      JOIN escorts e ON e.id = p.escort_id
      WHERE p.id = ? LIMIT 1
    `, [newId])
    if (!row) { res.status(500).json({ message: 'Post was saved but could not be loaded' }); return }
    res.status(201).json(serializeFeedPost(row))
  } catch (err: any) {
    console.error('[create-feed-post]', err?.message)
    res.status(500).json({ message: 'Could not publish your post' })
  }
})

router.delete('/feeds/posts/:id', requireAuth, async (req: AuthRequest, res) => {
  const postId = Number(req.params.id)
  if (!Number.isSafeInteger(postId) || postId <= 0) { res.status(400).json({ message: 'Invalid post ID' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [result] = await pool.query<any>(
      req.userRole === 'admin'
        ? 'UPDATE feed_posts SET is_active = 0 WHERE id = ? AND is_active = 1'
        : 'UPDATE feed_posts SET is_active = 0 WHERE id = ? AND user_id = ? AND is_active = 1',
      req.userRole === 'admin' ? [postId] : [postId, req.userId],
    )
    if (!Number(result?.affectedRows ?? result?.rowCount ?? 0)) { res.status(404).json({ message: 'Post not found or not yours' }); return }
    res.json({ success: true })
  } catch (err: any) {
    console.error('[delete-feed-post]', err?.message)
    res.status(500).json({ message: 'Could not remove post' })
  }
})

router.post('/feeds/posts/:id/report', requireAuth, async (req: AuthRequest, res) => {
  const postId = Number(req.params.id)
  if (!Number.isSafeInteger(postId) || postId <= 0) { res.status(400).json({ message: 'Invalid post ID' }); return }
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 100) : ''
  const details = typeof req.body?.details === 'string' ? req.body.details.trim().slice(0, 500) : ''
  const allowedReasons = ['Spam', 'Inappropriate content', 'Unauthorized media', 'Other']
  if (!allowedReasons.includes(reason)) { res.status(400).json({ message: 'Choose a valid report reason' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [[post]] = await pool.query<any[]>('SELECT id FROM feed_posts WHERE id = ? AND is_active = 1 LIMIT 1', [postId])
    if (!post) { res.status(404).json({ message: 'Post not found' }); return }
    await pool.query(
      'INSERT IGNORE INTO feed_post_reports (post_id, reporter_id, reason, details, status) VALUES (?, ?, ?, ?, ?)',
      [postId, req.userId, reason, details || null, 'pending'],
    )
    res.json({ success: true })
  } catch (err: any) {
    console.error('[report-feed-post]', err?.message)
    res.status(500).json({ message: 'Could not submit report' })
  }
})

router.get('/feeds/posts/:id/likes', async (req, res) => {
  const postId = Number(req.params.id)
  const guestKey = typeof req.query.gk === 'string' ? req.query.gk.slice(0, 64) : ''
  if (!Number.isSafeInteger(postId) || postId <= 0) { res.status(400).json({ message: 'Invalid post ID' }); return }
  const pool = getPool()
  if (!pool) { res.json({ count: 0, liked: false }); return }
  try {
    const [[post]] = await pool.query<any[]>('SELECT id FROM feed_posts WHERE id = ? AND is_active = 1 LIMIT 1', [postId])
    if (!post) { res.status(404).json({ message: 'Post not found' }); return }
    const [[row]] = await pool.query<any[]>('SELECT COUNT(*) AS cnt FROM feed_post_likes WHERE post_id = ?', [postId])
    let liked = false
    if (guestKey) {
      const [[like]] = await pool.query<any[]>('SELECT id FROM feed_post_likes WHERE post_id = ? AND guest_key = ? LIMIT 1', [postId, guestKey])
      liked = !!like
    }
    res.json({ count: Number(row?.cnt ?? 0), liked })
  } catch {
    res.json({ count: 0, liked: false })
  }
})

router.post('/feeds/posts/:id/like', async (req, res) => {
  const postId = Number(req.params.id)
  const { guestKey, unlike } = req.body as { guestKey?: string; unlike?: boolean }
  if (!Number.isSafeInteger(postId) || postId <= 0) { res.status(400).json({ message: 'Invalid post ID' }); return }
  if (typeof guestKey !== 'string' || !guestKey.trim() || guestKey.length > 64) { res.status(400).json({ message: 'guestKey required' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [[post]] = await pool.query<any[]>('SELECT id FROM feed_posts WHERE id = ? AND is_active = 1 LIMIT 1', [postId])
    if (!post) { res.status(404).json({ message: 'Post not found' }); return }
    if (unlike) {
      await pool.query('DELETE FROM feed_post_likes WHERE post_id = ? AND guest_key = ?', [postId, guestKey.trim()])
    } else {
      await pool.query('INSERT IGNORE INTO feed_post_likes (post_id, guest_key) VALUES (?, ?)', [postId, guestKey.trim()])
    }
    const [[row]] = await pool.query<any[]>('SELECT COUNT(*) AS cnt FROM feed_post_likes WHERE post_id = ?', [postId])
    res.json({ count: Number(row?.cnt ?? 0), liked: !unlike })
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? 'Could not update like' })
  }
})

router.get('/feeds/posts/:id/comments', async (req, res) => {
  const postId = Number(req.params.id)
  if (!Number.isSafeInteger(postId) || postId <= 0) { res.status(400).json({ message: 'Invalid post ID' }); return }
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT id, parent_id, author_name, body, created_at FROM feed_post_comments WHERE post_id = ? ORDER BY created_at ASC LIMIT 200',
      [postId],
    )
    res.json(rows)
  } catch {
    res.json([])
  }
})

router.post('/feeds/posts/:id/comments', async (req, res) => {
  const postId = Number(req.params.id)
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
  const parentId = req.body?.parent_id == null ? null : Number(req.body.parent_id)
  const authorName = typeof req.body?.author_name === 'string' ? req.body.author_name.trim().slice(0, 60) : 'Anonymous'
  if (!Number.isSafeInteger(postId) || postId <= 0) { res.status(400).json({ message: 'Invalid post ID' }); return }
  if (!body || body.length > 1000) { res.status(400).json({ message: 'Comment must contain 1 to 1,000 characters' }); return }
  if (parentId !== null && (!Number.isSafeInteger(parentId) || parentId <= 0)) { res.status(400).json({ message: 'Invalid reply target' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [[post]] = await pool.query<any[]>('SELECT id FROM feed_posts WHERE id = ? AND is_active = 1 LIMIT 1', [postId])
    if (!post) { res.status(404).json({ message: 'Post not found' }); return }
    if (parentId !== null) {
      const [[parent]] = await pool.query<any[]>('SELECT id FROM feed_post_comments WHERE id = ? AND post_id = ? LIMIT 1', [parentId, postId])
      if (!parent) { res.status(400).json({ message: 'Reply target does not belong to this post' }); return }
    }
    const [result] = await pool.query<any>(
      'INSERT INTO feed_post_comments (post_id, parent_id, author_name, body) VALUES (?, ?, ?, ?)',
      [postId, parentId, authorName || 'Anonymous', body],
    )
    const newId = result?.insertId ?? result?.id
    const [[comment]] = await pool.query<any[]>(
      'SELECT id, parent_id, author_name, body, created_at FROM feed_post_comments WHERE id = ? LIMIT 1',
      [newId],
    )
    res.status(201).json(comment ?? { id: newId, parent_id: parentId, author_name: authorName || 'Anonymous', body, created_at: new Date() })
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? 'Could not add comment' })
  }
})

// ── GET /api/events ───────────────────────────────────────────────────────────
router.get('/events', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const { city, cat } = req.query as Record<string, string>
    let sql = `SELECT * FROM events WHERE is_active = 1`
    const params: string[] = []
    if (city && city !== 'All') { sql += ` AND city = ?`; params.push(city) }
    if (cat && cat !== 'All') { sql += ` AND category = ?`; params.push(cat) }
    sql += ` ORDER BY event_date ASC LIMIT 100`
    const [rows] = await pool.query<any[]>(sql, params)
    res.json(rows)
  } catch (err: any) {
    console.error('[events]', err?.message)
    res.json([])
  }
})

// ── POST /api/events (admin) ──────────────────────────────────────────────────
router.post('/events', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin only' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'DB error' }); return }
  const { title, description, event_date, event_time, venue, city, price, capacity, category, image_url } = req.body as any
  if (!title || !event_date) { res.status(400).json({ message: 'title and event_date required' }); return }
  try {
    await pool.query(
      `INSERT INTO events (title,description,event_date,event_time,venue,city,price,capacity,category,image_url,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
      [title,description||'',event_date,event_time||'',venue||'',city||'Nairobi',price||0,capacity||50,category||'Mixer',image_url||'']
    )
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? 'DB error' })
  }
})

// ── GET /api/escort-videos ────────────────────────────────────────────────────
router.get('/escort-videos', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const { cat } = req.query as Record<string, string>
    let sql = `
      SELECT ev.*, e.name AS escort_name, ${escortImageSql()} AS escort_image,
             e.verified AS escort_verified, e.tier AS escort_tier
      FROM escort_videos ev
      LEFT JOIN escorts e ON e.id = ev.escort_id
      WHERE ev.is_active = 1`
    const params: string[] = []
    if (cat && cat !== 'All') {
      if (cat === 'Free') { sql += ` AND ev.is_locked = 0` }
      else { sql += ` AND ev.tier = ?`; params.push(cat.toLowerCase()) }
    }
    sql += ` ORDER BY ev.created_at DESC LIMIT 60`
    const [rows] = await pool.query<any[]>(sql, params)
    res.json(rows)
  } catch (err: any) {
    console.error('[videos]', err?.message)
    res.json([])
  }
})

// ── GET /api/tours ────────────────────────────────────────────────────────────
// Returns escorts with outcall=1 (available to travel with clients)
router.get('/tours', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const { city } = req.query as Record<string, string>
    let sql = `
      SELECT e.id, e.name, e.age, e.city, e.area, ${escortImageSql()} AS image,
             e.tier, e.verified, e.rating, e.bio, e.phone, e.incall, e.outcall
      FROM escorts e
      WHERE e.is_active = 1 AND e.outcall = 1`
    const params: string[] = []
    if (city && city !== 'All') { sql += ` AND e.city = ?`; params.push(city) }
    sql += ` ORDER BY ${escortPhotoPrioritySql()}, CASE e.tier WHEN 'elite' THEN 0 WHEN 'vip' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END, e.rating DESC LIMIT 60`
    const [rows] = await pool.query<any[]>(sql, params)
    res.json(rows)
  } catch (err: any) {
    console.error('[tours]', err?.message)
    res.json([])
  }
})

// ── GET /api/shop ─────────────────────────────────────────────────────────────
router.get('/shop', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const { cat } = req.query as Record<string, string>
    let sql = `SELECT * FROM shop_products WHERE is_active = 1`
    const params: string[] = []
    if (cat && cat !== 'All') { sql += ` AND category = ?`; params.push(cat) }
    sql += ` ORDER BY created_at DESC LIMIT 100`
    const [rows] = await pool.query<any[]>(sql, params)
    res.json(rows)
  } catch (err: any) {
    console.error('[shop]', err?.message)
    res.json([])
  }
})

// ── GET /api/testimonials ─────────────────────────────────────────────────────
// Reads from reviews table (public reviews about the platform), falls back to []
router.get('/testimonials', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const { role } = req.query as Record<string, string>
    // Testimonials table (generic platform reviews, no escort_id)
    let sql = `SELECT * FROM testimonials WHERE is_active = 1`
    const params: string[] = []
    if (role && role !== 'All') { sql += ` AND role = ?`; params.push(role) }
    sql += ` ORDER BY created_at DESC LIMIT 60`
    const [rows] = await pool.query<any[]>(sql, params)
    res.json(rows)
  } catch {
    // Table may not exist yet
    res.json([])
  }
})

// ── POST /api/testimonials ────────────────────────────────────────────────────
router.post('/testimonials', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'DB error' }); return }
  const { text, rating, role } = req.body as { text?: string; rating?: number; role?: string }
  if (!text || text.length < 10) { res.status(400).json({ message: 'Please write at least 10 characters' }); return }
  try {
    // Get user display name
    const [[user]] = await pool.query<any[]>('SELECT display_name, email FROM users WHERE id = ?', [req.userId])
    const name = user?.display_name || (user?.email?.split('@')[0] ?? 'Anonymous')
    await pool.query(
      `INSERT INTO testimonials (user_id, name, role, rating, text, is_active) VALUES (?,?,?,?,?,0)`,
      [req.userId, name, role || 'Client', rating || 5, text]
    )
    res.json({ success: true, message: 'Your review is pending approval.' })
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? 'Submit failed' })
  }
})

// ── GET /api/blacklist ────────────────────────────────────────────────────────
router.get('/blacklist', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const { q, filter } = req.query as Record<string, string>
    let sql = `SELECT * FROM blacklist_reports WHERE is_active = 1`
    const params: string[] = []
    if (q) { sql += ` AND (name LIKE ? OR reason LIKE ?)`; params.push(`%${q}%`, `%${q}%`) }
    if (filter && filter !== 'All') {
      if (['client','escort','agency'].includes(filter)) { sql += ` AND type = ?`; params.push(filter) }
      else if (['critical','high','medium'].includes(filter)) { sql += ` AND severity = ?`; params.push(filter) }
    }
    sql += ` ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, report_count DESC LIMIT 100`
    const [rows] = await pool.query<any[]>(sql, params)
    res.json(rows)
  } catch (err: any) {
    console.error('[blacklist]', err?.message)
    res.json([])
  }
})

// ── POST /api/blacklist/report ────────────────────────────────────────────────
router.post('/blacklist/report', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'DB error' }); return }
  const { name, type, reason, city, severity } = req.body as any
  if (!name || !reason) { res.status(400).json({ message: 'name and reason required' }); return }
  try {
    // Check if same name already reported — increment count
    const [[existing]] = await pool.query<any[]>(
      `SELECT id FROM blacklist_reports WHERE name = ? AND is_active = 1 LIMIT 1`,
      [name]
    )
    if (existing) {
      await pool.query(`UPDATE blacklist_reports SET report_count = report_count + 1 WHERE id = ?`, [existing.id])
    } else {
      await pool.query(
        `INSERT INTO blacklist_reports (name, type, reason, city, severity, report_count, reported_by, is_active)
         VALUES (?,?,?,?,?,1,?,0)`,
        [name, type||'client', reason, city||'Nairobi', severity||'medium', req.userId]
      )
    }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? 'Submit failed' })
  }
})

// ── GET /api/feeds/:id/likes ──────────────────────────────────────────────────
router.get('/feeds/:id/likes', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json({ count: 0, liked: false }); return }
  const { id } = req.params
  const guestKey = req.query.gk as string | undefined
  try {
    const query = (sql: string, params: unknown[] = []) => pool.query(sql, params)
    const canonical = await resolveCanonicalEscortId(query, id)
    if (!canonical) { res.json({ count: 0, liked: false }); return }
    const ids = await getMergedEscortIds(query, canonical.id)
    const placeholders = ids.map(() => '?').join(', ')
    const [[row]] = await pool.query<any[]>(
      `SELECT COUNT(DISTINCT CASE
         WHEN user_id IS NOT NULL THEN CONCAT('u:', user_id)
         WHEN guest_key IS NOT NULL THEN CONCAT('g:', guest_key)
       END) AS cnt
       FROM feed_likes WHERE escort_id IN (${placeholders})`,
      ids,
    )
    const count = Number(row?.cnt ?? 0)
    let liked = false
    if (guestKey) {
      const [[lk]] = await pool.query<any[]>(
        `SELECT id FROM feed_likes WHERE escort_id IN (${placeholders}) AND guest_key = ? LIMIT 1`,
        [...ids, guestKey],
      )
      liked = !!lk
    }
    res.json({ count, liked })
  } catch { res.json({ count: 0, liked: false }) }
})

// ── POST /api/feeds/:id/like ──────────────────────────────────────────────────
router.post('/feeds/:id/like', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'DB error' }); return }
  const { id } = req.params
  const { guestKey, unlike } = req.body as { guestKey?: string; unlike?: boolean }
  if (!guestKey) { res.status(400).json({ message: 'guestKey required' }); return }
  try {
    const query = (sql: string, params: unknown[] = []) => pool.query(sql, params)
    const canonical = await resolveCanonicalEscortId(query, id)
    if (!canonical) { res.status(404).json({ message: 'Profile not found' }); return }
    const ids = await getMergedEscortIds(query, canonical.id)
    const placeholders = ids.map(() => '?').join(', ')
    if (unlike) {
      await pool.query(
        `DELETE FROM feed_likes WHERE escort_id IN (${placeholders}) AND guest_key = ?`,
        [...ids, guestKey],
      )
    } else {
      await pool.query(
        'INSERT IGNORE INTO feed_likes (escort_id, guest_key) VALUES (?,?)',
        [canonical.id, guestKey],
      )
    }
    const [[row]] = await pool.query<any[]>(
      `SELECT COUNT(DISTINCT CASE
         WHEN user_id IS NOT NULL THEN CONCAT('u:', user_id)
         WHEN guest_key IS NOT NULL THEN CONCAT('g:', guest_key)
       END) AS cnt
       FROM feed_likes WHERE escort_id IN (${placeholders})`,
      ids,
    )
    res.json({ count: Number(row?.cnt ?? 0), liked: !unlike })
  } catch (err: any) { res.status(500).json({ message: err?.message ?? 'error' }) }
})

// ── GET /api/feeds/:id/comments ───────────────────────────────────────────────
router.get('/feeds/:id/comments', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const query = (sql: string, params: unknown[] = []) => pool.query(sql, params)
    const canonical = await resolveCanonicalEscortId(query, req.params.id)
    if (!canonical) { res.json([]); return }
    const [rows] = await pool.query<any[]>(
      `SELECT id, parent_id, author_name, body, created_at
       FROM feed_comments WHERE escort_id = ? ORDER BY created_at ASC LIMIT 200`,
      [canonical.id],
    )
    res.json(rows)
  } catch { res.json([]) }
})

// ── POST /api/feeds/:id/comments ──────────────────────────────────────────────
router.post('/feeds/:id/comments', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'DB error' }); return }
  const { body, author_name, parent_id } = req.body as { body?: string; author_name?: string; parent_id?: number }
  if (!body || body.trim().length < 1) { res.status(400).json({ message: 'Comment cannot be empty' }); return }
  const name = (author_name || 'Anonymous').slice(0, 60)
  try {
    const query = (sql: string, params: unknown[] = []) => pool.query(sql, params)
    const canonical = await resolveCanonicalEscortId(query, req.params.id)
    if (!canonical) { res.status(404).json({ message: 'Profile not found' }); return }
    const [result] = await pool.query<any>(
      'INSERT INTO feed_comments (escort_id, author_name, body, parent_id) VALUES (?,?,?,?)',
      [canonical.id, name, body.trim().slice(0, 1000), parent_id ?? null]
    )
    const newId = result?.insertId ?? result?.id
    const [[row]] = await pool.query<any[]>('SELECT id, parent_id, author_name, body, created_at FROM feed_comments WHERE id = ? LIMIT 1', [newId])
    res.status(201).json(row ?? { id: newId, escort_id: canonical.id, author_name: name, body: body.trim(), parent_id: parent_id ?? null, created_at: new Date() })
  } catch (err: any) { res.status(500).json({ message: err?.message ?? 'error' }) }
})

export default router
