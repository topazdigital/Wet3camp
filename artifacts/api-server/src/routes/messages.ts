import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { sendNewMessageEmail } from '../lib/mailer.js'

const router = Router()

router.get('/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

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
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
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
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

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

    const [[escort]] = await pool.query<any[]>(
      'SELECT e.name, e.image, u.email AS escort_email FROM escorts e JOIN users u ON u.id = e.user_id WHERE e.id = ? LIMIT 1',
      [escortId]
    ).catch(() => [[null]])

    if (escort?.escort_email) {
      const [[sender]] = await pool.query<any[]>('SELECT display_name FROM users WHERE id = ? LIMIT 1', [req.userId]).catch(() => [[null]])
      sendNewMessageEmail({
        toEmail: escort.escort_email,
        toName: escort.name,
        fromName: sender?.display_name ?? 'A client',
        preview: content.trim().slice(0, 120),
      }).catch(() => {})
    }

  } catch {
    res.status(500).json({ message: 'Failed to send message' })
  }
})

export default router
