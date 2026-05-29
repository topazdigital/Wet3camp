import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

router.get('/posts', async (req, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

  const { limit = '20', offset = '0', escortId } = req.query as Record<string, string>
  const lim = Math.min(parseInt(limit, 10) || 20, 100)
  const off = parseInt(offset, 10) || 0

  try {
    const conditions: string[] = []
    const params: unknown[] = []
    if (escortId) { conditions.push('p.escort_id = ?'); params.push(escortId) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const [rows] = await pool.query<any[]>(`
      SELECT p.id, p.escort_id, p.text, p.image, p.likes, p.views, p.tip_enabled, p.created_at,
             e.name AS escort_name, e.image AS escort_avatar, e.tier, e.verified, e.city
      FROM posts p
      JOIN escorts e ON e.id = p.escort_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, lim, off])

    const [[{ total }]] = await pool.query<any[]>(`
      SELECT COUNT(*) AS total FROM posts p ${where}
    `, params)

    res.json({
      data: rows.map(r => ({
        id:           String(r.id),
        escortId:     String(r.escort_id),
        name:         r.escort_name,
        avatar:       r.escort_avatar || null,
        tier:         r.tier,
        verified:     !!r.verified,
        city:         r.city,
        text:         r.text,
        image:        r.image || null,
        likes:        Number(r.likes),
        views:        Number(r.views),
        tipEnabled:   !!r.tip_enabled,
        createdAt:    r.created_at,
      })),
      total: Number(total),
    })
  } catch (err: any) {
    if (err.code === '42P01' || err.code === 'ER_NO_SUCH_TABLE' || (err.message && err.message.includes('posts'))) {
      res.json({ data: [], total: 0 })
      return
    }
    console.error('[posts] list error:', err)
    res.status(500).json({ message: 'Failed to fetch posts' })
  }
})

router.post('/posts', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

  const { text, image, tipEnabled } = req.body as { text: string; image?: string; tipEnabled?: boolean }
  if (!text?.trim()) { res.status(400).json({ message: 'Post text is required' }); return }

  try {
    const [[escortRow]] = await pool.query<any[]>(
      'SELECT id FROM escorts WHERE user_id = ? AND is_active = 1 LIMIT 1',
      [req.userId]
    )
    if (!escortRow) { res.status(403).json({ message: 'Only escorts can post' }); return }

    const [[inserted]] = await pool.query<any[]>(
      'INSERT INTO posts (escort_id, text, image, tip_enabled) VALUES (?, ?, ?, ?)',
      [escortRow.id, text.trim(), image || null, tipEnabled ? 1 : 0]
    )
    const insertId = (inserted as any).insertId ?? (inserted as any).id
    res.json({ success: true, id: String(insertId) })
  } catch (err) {
    console.error('[posts] create error:', err)
    res.status(500).json({ message: 'Failed to create post' })
  }
})

router.post('/posts/:id/like', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  const postId = parseInt(String(req.params.id), 10)

  try {
    const [[existing]] = await pool.query<any[]>(
      'SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, req.userId]
    )
    if (existing) {
      await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, req.userId])
      await pool.query('UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = ?', [postId])
      res.json({ liked: false })
    } else {
      await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, req.userId])
      await pool.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId])
      res.json({ liked: true })
    }
  } catch (err) {
    console.error('[posts] like error:', err)
    res.status(500).json({ message: 'Failed to toggle like' })
  }
})

export default router
