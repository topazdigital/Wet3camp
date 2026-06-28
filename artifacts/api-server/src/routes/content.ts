// =============================================================================
// Content routes: live, feeds, events, escort-videos, tours, shop,
//                 testimonials, blacklist
// =============================================================================
import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

// ── GET /api/live ─────────────────────────────────────────────────────────────
// Returns escorts currently marked online=1
router.get('/live', async (_req, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT id, name, age, city, area, image, tier, verified, rating, online, bio
      FROM escorts
      WHERE is_active = 1 AND online = 1
      ORDER BY CASE tier WHEN 'elite' THEN 0 WHEN 'vip' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END, rating DESC
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
      SELECT e.id, e.name, e.city, e.area, e.image, e.tier, e.verified,
             e.rating, e.online, e.bio, e.phone, e.created_at,
             u.id AS user_id
      FROM escorts e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.is_active = 1 AND (e.bio IS NOT NULL AND e.bio != '')
      ORDER BY e.created_at DESC, e.rating DESC
      LIMIT 30
    `)
    res.json(rows)
  } catch (err: any) {
    console.error('[feeds]', err?.message)
    res.json([])
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
      SELECT ev.*, e.name AS escort_name, e.image AS escort_image, e.verified AS escort_verified, e.tier AS escort_tier
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
      SELECT id, name, age, city, area, image, tier, verified, rating, bio, phone, incall, outcall
      FROM escorts
      WHERE is_active = 1 AND outcall = 1`
    const params: string[] = []
    if (city && city !== 'All') { sql += ` AND city = ?`; params.push(city) }
    sql += ` ORDER BY CASE tier WHEN 'elite' THEN 0 WHEN 'vip' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END, rating DESC LIMIT 60`
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
    const [[row]] = await pool.query<any[]>('SELECT COUNT(*) AS cnt FROM feed_likes WHERE escort_id = ?', [id])
    const count = Number(row?.cnt ?? 0)
    let liked = false
    if (guestKey) {
      const [[lk]] = await pool.query<any[]>('SELECT id FROM feed_likes WHERE escort_id = ? AND guest_key = ? LIMIT 1', [id, guestKey])
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
    if (unlike) {
      await pool.query('DELETE FROM feed_likes WHERE escort_id = ? AND guest_key = ?', [id, guestKey])
    } else {
      await pool.query('INSERT INTO feed_likes (escort_id, guest_key) VALUES (?,?) ON CONFLICT DO NOTHING', [id, guestKey])
    }
    const [[row]] = await pool.query<any[]>('SELECT COUNT(*) AS cnt FROM feed_likes WHERE escort_id = ?', [id])
    res.json({ count: Number(row?.cnt ?? 0), liked: !unlike })
  } catch (err: any) { res.status(500).json({ message: err?.message ?? 'error' }) }
})

// ── GET /api/feeds/:id/comments ───────────────────────────────────────────────
router.get('/feeds/:id/comments', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  const { id } = req.params
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT id, parent_id, author_name, body, created_at
       FROM feed_comments WHERE escort_id = ? ORDER BY created_at ASC LIMIT 200`,
      [id]
    )
    res.json(rows)
  } catch { res.json([]) }
})

// ── POST /api/feeds/:id/comments ──────────────────────────────────────────────
router.post('/feeds/:id/comments', async (req: any, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'DB error' }); return }
  const { id } = req.params
  const { body, author_name, parent_id } = req.body as { body?: string; author_name?: string; parent_id?: number }
  if (!body || body.trim().length < 1) { res.status(400).json({ message: 'Comment cannot be empty' }); return }
  const name = (author_name || 'Anonymous').slice(0, 60)
  try {
    const [result] = await pool.query<any>(
      'INSERT INTO feed_comments (escort_id, author_name, body, parent_id) VALUES (?,?,?,?)',
      [id, name, body.trim().slice(0, 1000), parent_id ?? null]
    )
    const newId = result?.insertId ?? result?.id
    const [[row]] = await pool.query<any[]>('SELECT id, parent_id, author_name, body, created_at FROM feed_comments WHERE id = ? LIMIT 1', [newId])
    res.status(201).json(row ?? { id: newId, escort_id: id, author_name: name, body: body.trim(), parent_id: parent_id ?? null, created_at: new Date() })
  } catch (err: any) { res.status(500).json({ message: err?.message ?? 'error' }) }
})

export default router
