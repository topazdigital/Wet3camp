import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

router.get('/reviews', async (req, res) => {
  try {
    const { escortId, limit = '20', offset = '0' } = req.query as Record<string, string>
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const conditions = ['r.is_visible = 1']
    const params: unknown[] = []
    if (escortId) { conditions.push('r.escort_id = ?'); params.push(escortId) }

    const where = conditions.join(' AND ')
    const [rows] = await pool.query<any[]>(
      `SELECT r.*, u.display_name AS client_name, e.name AS escort_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN escorts e ON e.id = r.escort_id
       WHERE ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10) || 20, parseInt(offset, 10) || 0]
    )

    res.json(rows.map(r => ({
      id: r.id,
      clientName: r.client_name,
      escortName: r.escort_name,
      escortId: String(r.escort_id),
      rating: r.rating,
      text: r.content,
      date: r.created_at,
    })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch reviews' })
  }
})

router.post('/reviews', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { escortId, rating, text } = req.body as { escortId?: string; rating?: number; text?: string }
    if (!escortId || !rating || !text?.trim()) {
      res.status(400).json({ message: 'escortId, rating and review text are required' }); return
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' }); return
    }

    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const [[existing]] = await pool.query<any[]>(
      'SELECT id FROM reviews WHERE user_id = ? AND escort_id = ? LIMIT 1',
      [req.userId, escortId]
    )
    if (existing) {
      res.status(409).json({ message: 'You have already reviewed this escort' }); return
    }

    const [result] = await pool.query<any>(
      'INSERT INTO reviews (user_id, escort_id, rating, content, is_visible) VALUES (?,?,?,?,1)',
      [req.userId, escortId, rating, text.trim()]
    )

    await pool.query(
      'UPDATE escorts SET rating = (SELECT AVG(rating) FROM reviews WHERE escort_id = ? AND is_visible=1), reviews_count = (SELECT COUNT(*) FROM reviews WHERE escort_id = ? AND is_visible=1) WHERE id = ?',
      [escortId, escortId, escortId]
    )

    res.status(201).json({ id: (result as any).insertId, rating, text: text.trim() })
  } catch {
    res.status(500).json({ message: 'Failed to submit review' })
  }
})

export default router
