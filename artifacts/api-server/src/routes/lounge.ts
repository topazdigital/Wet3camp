import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()
const CATEGORIES = ['looking', 'general'] as const
type LoungeCategory = typeof CATEGORIES[number]

function isMember(req: AuthRequest, res: any): boolean {
  if (req.userRole !== 'user') {
    res.status(403).json({ message: 'The Lounge is for client accounts' })
    return false
  }
  return true
}

function asIsoDate(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Error('Invalid Lounge message timestamp')
  return date.toISOString()
}

function toMessage(row: any) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    category: row.category as LoungeCategory,
    body: String(row.body),
    authorName: String(row.author_name || row.username || 'Member'),
    authorAvatar: row.avatar ?? null,
    createdAt: asIsoDate(row.created_at),
  }
}

const MESSAGE_SELECT = `
  SELECT m.id, m.user_id, m.category, m.body, m.created_at,
         u.display_name AS author_name, u.username, u.avatar
    FROM lounge_messages m
    JOIN users u ON u.id = m.user_id
   WHERE u.is_active = 1`

router.get('/lounge/messages', requireAuth, async (req: AuthRequest, res) => {
  if (!isMember(req, res)) return
  const category = req.query.category == null ? '' : String(req.query.category)
  if (category && !CATEGORIES.includes(category as LoungeCategory)) {
    res.status(400).json({ message: 'Invalid Lounge category' })
    return
  }

  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }
    const [rows] = await pool.query<any[]>(
      `${MESSAGE_SELECT}${category ? ' AND m.category = ?' : ''}
       ORDER BY m.id DESC
       LIMIT 100`,
      category ? [category] : [],
    )
    res.setHeader('Cache-Control', 'private, no-store')
    res.json((rows as any[]).map(toMessage))
  } catch (error) {
    console.error('[lounge] messages fetch failed:', error)
    res.status(500).json({ message: 'Could not load Lounge messages' })
  }
})

router.post('/lounge/messages', requireAuth, async (req: AuthRequest, res) => {
  if (!isMember(req, res)) return
  const { category, body } = req.body as { category?: unknown; body?: unknown }
  if (typeof category !== 'string' || !CATEGORIES.includes(category as LoungeCategory)) {
    res.status(400).json({ message: 'Choose a valid Lounge category' })
    return
  }
  if (typeof body !== 'string' || !body.trim()) {
    res.status(400).json({ message: 'Write a message before sending' })
    return
  }
  const content = body.trim()
  if (Array.from(content).length > 800) {
    res.status(400).json({ message: 'Messages must be 800 characters or fewer' })
    return
  }

  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }

    const oneMinuteAgo = new Date(Date.now() - 60_000)
    const [[recent]] = await pool.query<any[]>(
      'SELECT COUNT(*) AS total FROM lounge_messages WHERE user_id = ? AND created_at >= ?',
      [req.userId, oneMinuteAgo],
    )
    if (Number(recent?.total ?? 0) >= 5) {
      res.status(429).json({ message: 'Please wait a moment before posting again' })
      return
    }

    const [insertResult] = await pool.query<any>(
      'INSERT INTO lounge_messages (user_id, category, body) VALUES (?, ?, ?)',
      [req.userId, category, content],
    )
    const messageId = (insertResult as any).insertId
    const [[row]] = await pool.query<any[]>(
      `${MESSAGE_SELECT} AND m.id = ? LIMIT 1`,
      [messageId],
    )
    if (!row) {
      res.status(500).json({ message: 'Message was saved but could not be returned' })
      return
    }

    res.setHeader('Cache-Control', 'private, no-store')
    res.status(201).json(toMessage(row))
  } catch (error) {
    console.error('[lounge] message create failed:', error)
    res.status(500).json({ message: 'Could not send Lounge message' })
  }
})

router.delete('/lounge/messages/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!isMember(req, res)) return
  const id = String(req.params.id ?? '')
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    res.status(400).json({ message: 'Invalid message ID' })
    return
  }

  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }
    const [result] = await pool.query<any>(
      'DELETE FROM lounge_messages WHERE id = ? AND user_id = ?',
      [id, req.userId],
    )
    const affectedRows = Number((result as any)?.affectedRows ?? (result as any)?.rowCount ?? 0)
    if (!affectedRows) {
      res.status(404).json({ message: 'Message not found' })
      return
    }
    res.setHeader('Cache-Control', 'private, no-store')
    res.json({ success: true })
  } catch (error) {
    console.error('[lounge] message delete failed:', error)
    res.status(500).json({ message: 'Could not delete Lounge message' })
  }
})

router.post('/lounge/presence', requireAuth, async (req: AuthRequest, res) => {
  if (!isMember(req, res)) return
  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }
    await pool.query(
      `INSERT INTO lounge_presence (user_id, last_seen)
       VALUES (?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP`,
      [req.userId],
    )
    res.setHeader('Cache-Control', 'private, no-store')
    res.json({ ok: true })
  } catch (error) {
    console.error('[lounge] presence update failed:', error)
    res.status(500).json({ message: 'Could not update Lounge presence' })
  }
})

router.get('/lounge/online', requireAuth, async (req: AuthRequest, res) => {
  if (!isMember(req, res)) return
  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }
    const cutoff = new Date(Date.now() - 2 * 60_000)
    const [[countRow]] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total
         FROM lounge_presence p
         JOIN users u ON u.id = p.user_id
        WHERE p.last_seen >= ? AND u.is_active = 1 AND u.role = 'user'`,
      [cutoff],
    )
    const [rows] = await pool.query<any[]>(
      `SELECT u.id, COALESCE(NULLIF(u.display_name, ''), u.username) AS name,
              u.avatar, p.last_seen
         FROM lounge_presence p
         JOIN users u ON u.id = p.user_id
        WHERE p.last_seen >= ? AND u.is_active = 1 AND u.role = 'user'
        ORDER BY p.last_seen DESC
        LIMIT 16`,
      [cutoff],
    )
    res.setHeader('Cache-Control', 'private, no-store')
    res.json({
      count: Number(countRow?.total ?? 0),
      members: (rows as any[]).map((row: any) => ({
        id: String(row.id),
        name: String(row.name || 'Member'),
        avatar: row.avatar ?? null,
        lastSeen: asIsoDate(row.last_seen),
      })),
    })
  } catch (error) {
    console.error('[lounge] online members fetch failed:', error)
    res.status(500).json({ message: 'Could not load online members' })
  }
})

export default router
