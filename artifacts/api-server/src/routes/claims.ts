import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

router.post('/escorts/:id/claim', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const escortId = req.params!.id
    const { message } = req.body as { message?: string }

    const [[escort]] = await pool.query<any[]>('SELECT id, user_id FROM escorts WHERE id = ? AND is_active = 1', [escortId])
    if (!escort) { res.status(404).json({ message: 'Profile not found' }); return }
    if (escort.user_id) { res.status(409).json({ message: 'This profile has already been claimed' }); return }

    const [[existing]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ? LIMIT 1', [req.userId])
    if (existing) { res.status(409).json({ message: 'You already have an escort profile' }); return }

    const [[existingClaim]] = await pool.query<any[]>(
      "SELECT id FROM profile_claims WHERE escort_id = ? AND user_id = ? AND status = 'pending'",
      [escortId, req.userId]
    )
    if (existingClaim) { res.status(409).json({ message: 'You already have a pending claim for this profile' }); return }

    await pool.query(
      "INSERT INTO profile_claims (escort_id, user_id, message, status) VALUES (?,?,?,'pending')",
      [escortId, req.userId, message || null]
    )

    res.json({ success: true, message: 'Your claim has been submitted and is under review.' })
  } catch (err: any) {
    console.error('[claim]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to submit claim' })
  }
})

router.get('/escorts/:id/claim-status', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [[claim]] = await pool.query<any[]>(
      'SELECT status FROM profile_claims WHERE escort_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.params!.id, req.userId]
    )
    res.json({ status: claim?.status ?? null })
  } catch {
    res.json({ status: null })
  }
})

router.get('/admin/claims', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT pc.id, pc.escort_id, pc.user_id, pc.message, pc.status, pc.created_at,
             e.name AS escort_name, e.city AS escort_city,
             u.display_name AS user_name, u.email AS user_email
      FROM profile_claims pc
      LEFT JOIN escorts e ON e.id = pc.escort_id
      LEFT JOIN users u ON u.id = pc.user_id
      ORDER BY pc.created_at DESC
      LIMIT 200
    `)
    res.json(rows.map((r: any) => ({ ...r, id: String(r.id), escort_id: String(r.escort_id) })))
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch claims', detail: err?.message ?? '' })
  }
})

router.patch('/admin/claims/:id/approve', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [[claim]] = await pool.query<any[]>('SELECT * FROM profile_claims WHERE id = ?', [req.params!.id])
    if (!claim) { res.status(404).json({ message: 'Claim not found' }); return }
    await pool.query('UPDATE escorts SET user_id = ? WHERE id = ?', [claim.user_id, claim.escort_id])
    await pool.query("UPDATE users SET role = 'escort' WHERE id = ? AND role = 'user'", [claim.user_id])
    await pool.query("UPDATE profile_claims SET status = 'approved' WHERE id = ?", [req.params!.id])
    await pool.query("UPDATE profile_claims SET status = 'rejected' WHERE escort_id = ? AND id != ? AND status = 'pending'", [claim.escort_id, req.params!.id])
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to approve claim', detail: err?.message ?? '' })
  }
})

router.patch('/admin/claims/:id/reject', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    await pool.query("UPDATE profile_claims SET status = 'rejected' WHERE id = ?", [req.params!.id])
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to reject claim' })
  }
})

export default router
