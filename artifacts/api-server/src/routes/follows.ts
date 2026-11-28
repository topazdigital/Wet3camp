import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { getMergedEscortIds, resolveCanonicalEscortId } from '../lib/escort-merge.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

router.get('/follows', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }

    const [rows] = await pool.query<any[]>(
      `SELECT DISTINCT COALESCE(e.merged_into_id, e.id) AS escort_id
       FROM (
         SELECT user_id, escort_id FROM user_follows WHERE user_id = ?
         UNION
         SELECT user_id, escort_id FROM followers WHERE user_id = ?
       ) f
       JOIN escorts e ON e.id = f.escort_id
       WHERE e.is_active = 1 OR e.merged_into_id IS NOT NULL`,
      [req.userId, req.userId],
    )

    res.setHeader('Cache-Control', 'private, no-store')
    res.json([...new Set((rows as any[]).map(row => String(row.escort_id)))])
  } catch (error) {
    console.error('[follows] list failed:', error)
    res.status(500).json({ message: 'Could not load followed profiles' })
  }
})

router.post('/follows/:escortId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rawEscortId = String(req.params.escortId ?? '')
    const shouldFollow = (req.body as Record<string, unknown>)?.following
    if (!/^\d+$/.test(rawEscortId) || !Number.isSafeInteger(Number(rawEscortId)) || Number(rawEscortId) < 1) {
      res.status(400).json({ message: 'Invalid profile ID' })
      return
    }
    if (typeof shouldFollow !== 'boolean') {
      res.status(400).json({ message: 'A following boolean is required' })
      return
    }

    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }

    const query = (sql: string, params: unknown[] = []) => pool.query(sql, params)
    const canonical = await resolveCanonicalEscortId(query, rawEscortId)
    if (!canonical) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }

    const [[profile]] = await pool.query<any[]>(
      'SELECT id, user_id FROM escorts WHERE id = ? AND is_active = 1',
      [canonical.id],
    )
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' })
      return
    }
    if (profile.user_id && Number(profile.user_id) === Number(req.userId)) {
      res.status(409).json({ message: 'You cannot follow your own profile' })
      return
    }

    const associatedIds = await getMergedEscortIds(query, canonical.id)
    const placeholders = associatedIds.map(() => '?').join(', ')
    if (shouldFollow) {
      await pool.query(
        'INSERT IGNORE INTO user_follows (user_id, escort_id) VALUES (?, ?)',
        [req.userId, canonical.id],
      )
    } else {
      await pool.query(
        `DELETE FROM user_follows WHERE user_id = ? AND escort_id IN (${placeholders})`,
        [req.userId, ...associatedIds],
      )
      await pool.query(
        `DELETE FROM followers WHERE user_id = ? AND escort_id IN (${placeholders})`,
        [req.userId, ...associatedIds],
      )
    }

    const [[countRow]] = await pool.query<any[]>(
      `SELECT COUNT(DISTINCT user_id) AS total FROM (
         SELECT user_id FROM user_follows WHERE escort_id IN (${placeholders})
         UNION
         SELECT user_id FROM followers WHERE escort_id IN (${placeholders})
       ) all_followers`,
      [...associatedIds, ...associatedIds],
    )

    res.setHeader('Cache-Control', 'private, no-store')
    res.json({
      following: shouldFollow,
      followerCount: Number(countRow?.total ?? 0),
    })
  } catch (error) {
    console.error('[follows] update failed:', error)
    res.status(500).json({ message: 'Could not update follow status' })
  }
})

export default router
