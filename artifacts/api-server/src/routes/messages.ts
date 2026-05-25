import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

router.get('/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json([]); return }

    const [rows] = await pool.query<any[]>(
      `SELECT m.*, e.name AS escort_name, e.image AS escort_image
       FROM messages m
       JOIN escorts e ON e.id = m.escort_id
       WHERE m.sender_id = ?
       ORDER BY m.created_at DESC`,
      [req.userId]
    )

    const threads = Object.values(
      rows.reduce((acc: Record<number, any>, row: any) => {
        if (!acc[row.escort_id]) {
          acc[row.escort_id] = {
            escortId: row.escort_id,
            escortName: row.escort_name,
            escortImage: row.escort_image,
            messages: [],
          }
        }
        acc[row.escort_id].messages.push({ id: row.id, content: row.content, fromEscort: !!row.is_from_escort, createdAt: row.created_at, readAt: row.read_at })
        return acc
      }, {})
    )

    res.json(threads)
  } catch {
    res.status(500).json({ message: 'Failed to fetch messages' })
  }
})

router.post('/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { escortId, content } = req.body as { escortId?: number; content?: string }
    if (!escortId || !content?.trim()) { res.status(400).json({ message: 'escortId and content are required' }); return }

    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const [result] = await pool.query<any>(
      'INSERT INTO messages (sender_id, escort_id, content, is_from_escort) VALUES (?,?,?,0)',
      [req.userId, escortId, content.trim()]
    )

    res.status(201).json({ id: (result as any).insertId, escortId, content: content.trim(), fromEscort: false, createdAt: new Date() })
  } catch {
    res.status(500).json({ message: 'Failed to send message' })
  }
})

export default router
