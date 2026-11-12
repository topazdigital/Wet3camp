import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { mergeEscortProfiles } from '../lib/escort-merge.js'

const router = Router()

// In-memory OTP store for claim verification (phone → {code, expires, escortId})
const claimOtpStore = new Map<string, { code: string; expires: number; escortId: string }>()

// ── POST /api/escorts/:id/claim/send-otp ──────────────────────────────────────
// Sends a 6-digit OTP to the phone number on the scraped profile
router.post('/escorts/:id/claim/send-otp', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const escortId = String(req.params!.id)
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

    // Read Africa's Talking credentials from platform_settings
    const [[atKeyRow]]  = await pool.query<any[]>("SELECT value FROM platform_settings WHERE `key` = 'at_api_key'").catch(() => [[null]])
    const [[atUserRow]] = await pool.query<any[]>("SELECT value FROM platform_settings WHERE `key` = 'at_username'").catch(() => [[null]])
    const [[atSenderRow]] = await pool.query<any[]>("SELECT value FROM platform_settings WHERE `key` = 'at_sender_id'").catch(() => [[null]])
    const atApiKey   = (atKeyRow  as any)?.value?.trim()
    const atUsername = (atUserRow as any)?.value?.trim()
    const atSenderId = (atSenderRow as any)?.value?.trim() || undefined

    let smsSent = false
    if (atApiKey && atUsername) {
      try {
        const { sendSmsOtp } = await import('../lib/mailer.js')
        smsSent = await sendSmsOtp(escort.phone, code, escort.name, { apiKey: atApiKey, username: atUsername, senderId: atSenderId })
      } catch (smsErr) {
        console.warn('[CLAIM OTP] SMS send failed:', smsErr)
      }
    }

    if (!smsSent) {
      // Fallback: log code (dev) or warn (prod — admin needs to configure AT)
      console.log(`[CLAIM OTP] ${escort.phone} → ${code}${smsSent === false && atApiKey ? ' (AT delivery failed)' : ' (AT not configured)'}`)
    }

    res.json({
      success: true,
      message: smsSent
        ? `Verification code sent via SMS to ${escort.phone.replace(/(\+\d{3})\d+(\d{3})/, '$1****$2')}.`
        : `Verification code generated. Check server logs (SMS not configured).`,
      // Always return code in non-production for easy testing
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

    const schemaColumns = await pool.getExistingColumns(['escorts', 'profile_claims'])
    if (!schemaColumns.has('escorts.merged_into_id') || !schemaColumns.has('profile_claims.merge_into_escort_id')) {
      res.status(503).json({ message: 'Claim merge schema is not ready. Please try again later.' }); return
    }

    // Existing owners can submit a duplicate claim for review, but the
    // approved listing will be merged into their current managed profile.
    const [ownedProfiles] = await pool.query<any[]>(
      'SELECT id, name, is_active FROM escorts WHERE user_id = ? AND merged_into_id IS NULL ORDER BY id LIMIT 2',
      [req.userId]
    )
    if (ownedProfiles.length > 1) {
      res.status(409).json({ message: 'Your account already has multiple managed profiles. Please contact admin before claiming another listing.' }); return
    }
    const existingProfile = ownedProfiles[0] ?? null
    if (existingProfile && String(existingProfile.id) === String(escortId)) {
      res.status(409).json({ message: 'You already manage this profile' }); return
    }
    if (existingProfile && Number(existingProfile.is_active) !== 1) {
      res.status(409).json({ message: 'Your current managed profile is inactive. Please contact admin before claiming another listing.' }); return
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
      "INSERT INTO profile_claims (escort_id, user_id, merge_into_escort_id, message, status) VALUES (?,?,?,?, 'pending')",
      [escortId, req.userId, existingProfile?.id ?? null, message || null]
    )

    res.json({
      success: true,
      message: existingProfile
        ? `Your duplicate listing request is under review. If approved, it will be merged into ${existingProfile.name}.`
        : 'Your claim has been submitted and is under review.',
      mergeTarget: existingProfile ? { id: String(existingProfile.id), name: existingProfile.name } : null,
    })
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
      `SELECT pc.status, pc.merge_into_escort_id, target.name AS merge_into_name
       FROM profile_claims pc
       LEFT JOIN escorts target ON target.id = pc.merge_into_escort_id
       WHERE pc.escort_id = ? AND pc.user_id = ?
       ORDER BY pc.created_at DESC LIMIT 1`,
      [req.params!.id, req.userId]
    )
    const [ownedProfiles] = await pool.query<any[]>(
      'SELECT id, name FROM escorts WHERE user_id = ? AND merged_into_id IS NULL ORDER BY id LIMIT 2',
      [req.userId],
    )
    const otherOwnedProfiles = ownedProfiles.filter((profile: any) => String(profile.id) !== String(req.params!.id))
    const mergeTarget = claim?.merge_into_escort_id
      ? { id: String(claim.merge_into_escort_id), name: claim.merge_into_name }
      : claim?.status !== 'approved' && otherOwnedProfiles.length === 1
        ? { id: String(otherOwnedProfiles[0].id), name: otherOwnedProfiles[0].name }
        : null
    res.json({ status: claim?.status ?? null, mergeTarget })
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
       SELECT pc.id, pc.escort_id, pc.user_id, pc.merge_into_escort_id, pc.message, pc.status, pc.created_at,
             e.name AS escort_name, e.city AS escort_city, e.phone AS escort_phone, e.image AS escort_image,
              target.name AS merge_into_name, target.city AS merge_into_city,
             u.display_name AS user_name, u.email AS user_email
      FROM profile_claims pc
      LEFT JOIN escorts e ON e.id = pc.escort_id
       LEFT JOIN escorts target ON target.id = pc.merge_into_escort_id
      LEFT JOIN users u ON u.id = pc.user_id
      ORDER BY pc.created_at DESC
      LIMIT 200
    `)
    res.json(rows.map((r: any) => ({
      ...r,
      id: String(r.id),
      escort_id: String(r.escort_id),
      merge_into_escort_id: r.merge_into_escort_id ? String(r.merge_into_escort_id) : null,
    })))
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
    const columns = await pool.getExistingColumns([
      'escorts',
      'profile_claims',
      'escort_gallery',
      'escort_services',
      'escort_languages',
      'bookings',
      'messages',
      'reviews',
      'favorites',
      'followers',
      'user_follows',
      'subscriptions',
      'escort_profile_events',
      'feed_likes',
      'feed_comments',
      'escort_videos',
      'adverts',
    ])
    if (!columns.has('escorts.merged_into_id') || !columns.has('profile_claims.merge_into_escort_id')) {
      res.status(503).json({ message: 'Claim merge schema is not ready. Please try again later.' }); return
    }

    const result = await pool.transaction(async query => {
      const [userRows] = await query('SELECT id FROM users WHERE id = ? FOR UPDATE', [req.userId])
      if (!Array.isArray(userRows) || userRows.length === 0) {
        const error: any = new Error('Claim owner no longer exists')
        error.statusCode = 404
        throw error
      }

      const [claimRows] = await query('SELECT * FROM profile_claims WHERE id = ? FOR UPDATE', [req.params!.id])
      const claim = Array.isArray(claimRows) ? claimRows[0] : null
      if (!claim) {
        const error: any = new Error('Claim not found')
        error.statusCode = 404
        throw error
      }
      if (claim.status !== 'pending') {
        const error: any = new Error('This claim has already been resolved')
        error.statusCode = 409
        throw error
      }

      const [ownedProfiles] = await query(
        'SELECT id, name, is_active FROM escorts WHERE user_id = ? AND merged_into_id IS NULL ORDER BY id LIMIT 2 FOR UPDATE',
        [claim.user_id],
      )
      const owned = Array.isArray(ownedProfiles) ? ownedProfiles : []
      if (owned.length > 1) {
        const error: any = new Error('This account has multiple managed profiles and needs manual review')
        error.statusCode = 409
        throw error
      }

      let mergeResult: { primaryId: string; primaryName: string; candidateId: string } | null = null
      const savedMergeTarget = claim.merge_into_escort_id
      if (savedMergeTarget) {
        if (!owned.length || String(owned[0].id) !== String(savedMergeTarget)) {
          const error: any = new Error('The existing profile selected for this merge is no longer managed by this account')
          error.statusCode = 409
          throw error
        }
        mergeResult = await mergeEscortProfiles(query, columns, {
          candidateId: claim.escort_id,
          primaryId: savedMergeTarget,
          userId: claim.user_id,
        })
      } else if (owned.length === 1) {
        // Another claim may have been approved after this request was filed.
        mergeResult = await mergeEscortProfiles(query, columns, {
          candidateId: claim.escort_id,
          primaryId: owned[0].id,
          userId: claim.user_id,
        })
      } else {
        const [candidateRows] = await query(
          'SELECT id, user_id, is_active, merged_into_id FROM escorts WHERE id = ? FOR UPDATE',
          [claim.escort_id],
        )
        const candidate = Array.isArray(candidateRows) ? candidateRows[0] : null
        if (!candidate) {
          const error: any = new Error('The listing no longer exists')
          error.statusCode = 404
          throw error
        }
        if (candidate.user_id !== null && candidate.user_id !== undefined) {
          const error: any = new Error('The listing has already been claimed')
          error.statusCode = 409
          throw error
        }
        if (Number(candidate.is_active) !== 1 || candidate.merged_into_id) {
          const error: any = new Error('The listing is no longer available to claim')
          error.statusCode = 409
          throw error
        }
        await query('UPDATE escorts SET user_id = ?, verified = 1 WHERE id = ?', [claim.user_id, claim.escort_id])
      }

      await query("UPDATE users SET role = 'escort' WHERE id = ? AND role = 'user'", [claim.user_id])
      await query("UPDATE profile_claims SET status = 'approved' WHERE id = ?", [claim.id])
      await query(
        "UPDATE profile_claims SET status = 'rejected' WHERE escort_id = ? AND id != ? AND status = 'pending'",
        [claim.escort_id, claim.id],
      )

      return mergeResult
    })

    res.json({
      success: true,
      merged: !!result,
      primaryProfile: result ? { id: result.primaryId, name: result.primaryName } : null,
    })
  } catch (err: any) {
    const statusCode = Number(err?.statusCode) || 500
    if (statusCode === 500) console.error('[claim approval]', err?.message ?? err)
    res.status(statusCode).json({
      message: statusCode === 500 ? 'Failed to approve claim' : err.message,
    })
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
