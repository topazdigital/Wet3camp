import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { getMergedEscortIds, resolveCanonicalEscortId } from '../lib/escort-merge.js'

const router = Router()

router.get('/favorites', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const [rows] = await pool.query<any[]>(
      `SELECT DISTINCT COALESCE(e.merged_into_id, e.id) AS escort_id
       FROM favorites f
       JOIN escorts e ON e.id = f.escort_id
       WHERE f.user_id = ?`,
      [req.userId]
    )
    res.json([...new Set(rows.map((r: any) => String(r.escort_id)))])
  } catch {
    res.status(500).json({ message: 'Failed to fetch favorites' })
  }
})

router.post('/favorites/:escortId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const escortId = String(req.params.escortId)
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const query = (sql: string, params: unknown[] = []) => pool.query(sql, params)
    const canonical = await resolveCanonicalEscortId(query, escortId)
    if (!canonical) { res.status(404).json({ message: 'Profile not found' }); return }
    const [[profile]] = await pool.query<any[]>(
      'SELECT id FROM escorts WHERE id = ? AND is_active = 1',
      [canonical.id],
    )
    if (!profile) { res.status(404).json({ message: 'Profile not found' }); return }

    const ids = await getMergedEscortIds(query, canonical.id)
    const placeholders = ids.map(() => '?').join(', ')
    const [existingRows] = await pool.query<any[]>(
      `SELECT id FROM favorites WHERE user_id = ? AND escort_id IN (${placeholders}) LIMIT 1`,
      [req.userId, ...ids],
    )
    if (existingRows.length) {
      await pool.query(
        `DELETE FROM favorites WHERE user_id = ? AND escort_id IN (${placeholders})`,
        [req.userId, ...ids],
      )
      res.json({ saved: false })
    } else {
      await pool.query('INSERT INTO favorites (user_id, escort_id) VALUES (?,?)', [req.userId, canonical.id])
      res.json({ saved: true })
    }
  } catch {
    res.status(500).json({ message: 'Failed to toggle favorite' })
  }
})

export default router
