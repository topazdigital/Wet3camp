import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

router.get('/favorites', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json([]); return }

    const [rows] = await pool.query<any[]>(
      'SELECT escort_id FROM favorites WHERE user_id = ?',
      [req.userId]
    )
    res.json(rows.map((r: any) => String(r.escort_id)))
  } catch {
    res.status(500).json({ message: 'Failed to fetch favorites' })
  }
})

router.post('/favorites/:escortId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { escortId } = req.params
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const [[existing]] = await pool.query<any[]>('SELECT id FROM favorites WHERE user_id = ? AND escort_id = ?', [req.userId, escortId])
    if (existing) {
      await pool.query('DELETE FROM favorites WHERE user_id = ? AND escort_id = ?', [req.userId, escortId])
      res.json({ saved: false })
    } else {
      await pool.query('INSERT INTO favorites (user_id, escort_id) VALUES (?,?)', [req.userId, escortId])
      res.json({ saved: true })
    }
  } catch {
    res.status(500).json({ message: 'Failed to toggle favorite' })
  }
})

export default router
