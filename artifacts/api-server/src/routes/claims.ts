import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

// In-memory OTP store for claim verification (phone → {code, expires, escortId})
const claimOtpStore = new Map<string, { code: string; expires: number; escortId: string }>()

// ── POST /api/escorts/:id/claim/send-otp ──────────────────────────────────────
// Sends a 6-digit OTP to the phone number on the scraped profile
router.post('/escorts/:id/claim/send-otp', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const escortId = req.params!.id
    const [[escort]] = await pool.query<any[]>(
      'SELECT id, user_id, phone, name FROM escorts WHERE id = ? AND is_active = 1',
      [escortId]
    )
    if (!escort) { res.status(404).json({ message: 'Profile not found' }); return }
    if (escort.user_id) { res.status(409).json({ message: 'This profile has already been claimed' }); return }
    if (!escort.phone) { res.status(400).json({ message: 'No phone number on this profile — contact admin to claim it.' }); return }

    const code    = String(Math.floor(100000 + Math.random() * 900000))
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes
    claimOtpStore.set(escort.phone, { code, expires, escortId })

    // Try to send via SMTP-based SMS gateway or log to console in dev
    const [[smtpRow]] = await pool.query<any[]>("SELECT value FROM platform_settings WHERE `key` = 'smtp_host'").catch(() => [[null]])
    const smtpConfigured = !!(smtpRow as any)?.value

    if (!smtpConfigured || process.env.NODE_ENV !== 'production') {
      // Dev mode — log the code
      console.log(`[CLAIM OTP] ${escort.phone} → ${code}`)
    } else {
      // Production: send via mailer
      try {
        const { sendClaimOtp } = await import('../lib/mailer.js')
        await (sendClaimOtp as any)(escort.phone, escort.name, code)
      } catch (mailErr) {
        console.warn('[CLAIM OTP] Mail send failed:', mailErr)
      }
    }

    res.json({
      success: true,
      message: `Verification code sent to ${escort.phone.replace(/(\+\d{3})\d+(\d{3})/, '$1****$2')}.`,
      // Return code in dev so testers can proceed without real SMS
      ...(process.env.NODE_ENV !== 'production' ? { dev_code: code } : {}),
    })
  } catch (err: any) {
    console.error('[claim/send-otp]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to send verification code' })
  }
})

// ── POST /api/escorts/:id/claim/verify-otp ────────────────────────────────────
router.post('/escorts/:id/claim/verify-otp', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const escortId = req.params!.id
    const { code } = req.body as { code?: string }
    if (!code) { res.status(400).json({ message: 'Code is required' }); return }

    const [[escort]] = await pool.query<any[]>(
      'SELECT id, user_id, phone FROM escorts WHERE id = ? AND is_active = 1',
      [escortId]
    )
    if (!escort) { res.status(404).json({ message: 'Profile not found' }); return }
    if (!escort.phone) { res.status(400).json({ message: 'No phone on this profile' }); return }

    const stored = claimOtpStore.get(escort.phone)
    if (!stored || stored.escortId !== escortId) {
      res.status(400).json({ message: 'No OTP found for this profile. Please request a new code.' }); return
    }
    if (Date.now() > stored.expires) {
      claimOtpStore.delete(escort.phone)
      res.status(400).json({ message: 'Code expired. Please request a new one.' }); return
    }
    if (stored.code !== code.trim()) {
      res.status(400).json({ message: 'Incorrect code. Please check and try again.' }); return
    }

    // Mark OTP as verified (set a short-lived verified token in the store)
    claimOtpStore.set(escort.phone, { ...stored, code: `VERIFIED_${req.userId}` })

    res.json({ success: true, message: 'Phone verified successfully.' })
  } catch (err: any) {
    console.error('[claim/verify-otp]', err?.message ?? err)
    res.status(500).json({ message: 'Verification failed' })
  }
})

// ── POST /api/escorts/:id/claim ───────────────────────────────────────────────
// Submit a claim (requires OTP to have been verified first)
router.post('/escorts/:id/claim', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const escortId = req.params!.id
    const { message, otp_verified } = req.body as { message?: string; otp_verified?: boolean }

    const [[escort]] = await pool.query<any[]>(
      'SELECT id, user_id, phone FROM escorts WHERE id = ? AND is_active = 1',
      [escortId]
    )
    if (!escort) { res.status(404).json({ message: 'Profile not found' }); return }
    if (escort.user_id) { res.status(409).json({ message: 'This profile has already been claimed' }); return }

    // Check OTP was verified (unless skipped in dev by admin)
    if (escort.phone) {
      const stored = claimOtpStore.get(escort.phone)
      const isVerified = stored?.code === `VERIFIED_${req.userId}`
      if (!isVerified) {
        res.status(403).json({ message: 'Phone verification required. Please verify the OTP first.' }); return
      }
      claimOtpStore.delete(escort.phone)
    }

    // Check user doesn't already have a profile
    const [[existingProfile]] = await pool.query<any[]>(
      'SELECT id FROM escorts WHERE user_id = ? LIMIT 1',
      [req.userId]
    )
    if (existingProfile) {
      res.status(409).json({ message: 'You already have an escort profile linked to your account' }); return
    }

    // Check no pending claim from this user for this profile
    const [[existingClaim]] = await pool.query<any[]>(
      "SELECT id FROM profile_claims WHERE escort_id = ? AND user_id = ? AND status = 'pending'",
      [escortId, req.userId]
    )
    if (existingClaim) {
      res.status(409).json({ message: 'You already have a pending claim for this profile' }); return
    }

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

// ── GET /api/escorts/:id/claim-status ─────────────────────────────────────────
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

// ── GET /api/admin/claims ─────────────────────────────────────────────────────
router.get('/admin/claims', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [rows] = await pool.query<any[]>(`
      SELECT pc.id, pc.escort_id, pc.user_id, pc.message, pc.status, pc.created_at,
             e.name AS escort_name, e.city AS escort_city, e.phone AS escort_phone, e.image AS escort_image,
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

// ── PATCH /api/admin/claims/:id/approve ──────────────────────────────────────
router.patch('/admin/claims/:id/approve', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [[claim]] = await pool.query<any[]>('SELECT * FROM profile_claims WHERE id = ?', [req.params!.id])
    if (!claim) { res.status(404).json({ message: 'Claim not found' }); return }

    // Link escort to user
    await pool.query('UPDATE escorts SET user_id = ?, verified = 1 WHERE id = ?', [claim.user_id, claim.escort_id])
    // Promote user to escort role
    await pool.query("UPDATE users SET role = 'escort' WHERE id = ? AND role = 'user'", [claim.user_id])
    // Mark this claim approved, reject all others for same profile
    await pool.query("UPDATE profile_claims SET status = 'approved' WHERE id = ?", [req.params!.id])
    await pool.query(
      "UPDATE profile_claims SET status = 'rejected' WHERE escort_id = ? AND id != ? AND status = 'pending'",
      [claim.escort_id, req.params!.id]
    )

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to approve claim', detail: err?.message ?? '' })
  }
})

// ── PATCH /api/admin/claims/:id/reject ───────────────────────────────────────
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
