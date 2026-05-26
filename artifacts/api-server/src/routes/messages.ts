import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { broadcastToUser } from '../lib/message-store.js'

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
       ORDER BY m.created_at ASC`,
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
        acc[row.escort_id].messages.push({
          id: row.id,
          content: row.content,
          fromEscort: !!row.is_from_escort,
          createdAt: row.created_at,
          readAt: row.read_at,
        })
        return acc
      }, {})
    )

    res.json(threads)
  } catch {
    res.status(500).json({ message: 'Failed to fetch messages' })
  }
})

router.post('/messages/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { escortId } = req.body as { escortId?: number }
    if (!escortId) { res.status(400).json({ message: 'escortId required' }); return }
    const pool = getPool()
    if (!pool) { res.json({ ok: true }); return }
    await pool.query(
      'UPDATE messages SET read_at = NOW() WHERE sender_id = ? AND escort_id = ? AND is_from_escort = 1 AND read_at IS NULL',
      [req.userId, escortId]
    )
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Failed to mark read' })
  }
})

router.post('/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { escortId, content } = req.body as { escortId?: number; content?: string }
    if (!escortId || !content?.trim()) {
      res.status(400).json({ message: 'escortId and content are required' }); return
    }

    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured' }); return
    }

    const [result] = await pool.query<any>(
      'INSERT INTO messages (sender_id, escort_id, content, is_from_escort) VALUES (?,?,?,0)',
      [req.userId, escortId, content.trim()]
    )

    const insertId = (result as any).insertId
    const now = new Date().toISOString()

    res.status(201).json({
      id: insertId,
      escortId,
      content: content.trim(),
      fromEscort: false,
      createdAt: now,
    })

    // Simulate escort reply after short delay (when no real escort backend exists)
    const [[escort]] = await pool.query<any[]>(
      'SELECT name, image FROM escorts WHERE id = ? LIMIT 1',
      [escortId]
    ).catch(() => [[null]])

    if (escort && req.userId) {
      const userId = req.userId
      const replyDelay = 3000 + Math.floor(Math.random() * 4000)

      setTimeout(async () => {
        const replies = [
          "I'd love that! Let me check my schedule 😊",
          'That sounds perfect 🔥',
          "Sure! What's your preference for location?",
          "I'm available — when exactly?",
          'Looking forward to it! 💕',
          'Let me know the time and I will confirm.',
        ]
        const replyText = replies[Math.floor(Math.random() * replies.length)]

        try {
          const [r2] = await pool.query<any>(
            'INSERT INTO messages (sender_id, escort_id, content, is_from_escort) VALUES (?,?,?,1)',
            [userId, escortId, replyText]
          )
          const replyId = (r2 as any).insertId
          const replyTime = new Date().toISOString()

          broadcastToUser(userId, {
            id: replyId,
            escortId,
            escortName: escort.name,
            escortImage: escort.image,
            content: replyText,
            fromEscort: true,
            createdAt: replyTime,
          })
        } catch {}
      }, replyDelay)
    }

  } catch {
    res.status(500).json({ message: 'Failed to send message' })
  }
})

export default router
