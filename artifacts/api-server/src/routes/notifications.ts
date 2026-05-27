import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

function formatTime(d: Date): string {
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString()
}

router.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json([]); return }
    const [rows] = await pool.query<any[]>(
      'SELECT id, type, text, link, dot, avatar, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 60',
      [req.userId]
    )
    res.json(rows.map((r: any) => ({
      id: String(r.id),
      type: r.type ?? 'system',
      text: r.text,
      link: r.link ?? '/',
      dot: r.dot ?? '#8B0000',
      avatar: r.avatar ?? null,
      read: !!r.read_at,
      time: formatTime(new Date(r.created_at)),
    })))
  } catch {
    res.json([])
  }
})

router.patch('/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json({ ok: true }); return }
    await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL',
      [req.userId]
    )
    res.json({ ok: true })
  } catch {
    res.json({ ok: false })
  }
})

router.patch('/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json({ ok: true }); return }
    await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    res.json({ ok: true })
  } catch {
    res.json({ ok: false })
  }
})

router.post('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { type = 'system', text, link = '/', dot = '#8B0000', targetUserId, avatar } = req.body as any
    if (!text) { res.status(400).json({ message: 'text required' }); return }
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'No DB' }); return }
    const userId = targetUserId ?? req.userId
    const [r] = await pool.query<any>(
      'INSERT INTO notifications (user_id, type, text, link, dot, avatar) VALUES (?,?,?,?,?,?)',
      [userId, type, text, link, dot, avatar ?? null]
    )
    res.status(201).json({ id: String((r as any).insertId) })
  } catch {
    res.status(500).json({ message: 'Failed' })
  }
})

export default router
