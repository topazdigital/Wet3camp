import { Router } from 'express'
import { randomInt } from 'node:crypto'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { mergeEscortProfiles } from '../lib/escort-merge.js'
import {
  sendOtpEmail,
  sendProfileClaimDecisionEmail,
  sendProfileClaimSubmittedEmails,
  sendSmsOtp,
} from '../lib/mailer.js'

const router = Router()

type ClaimMethod = 'sms' | 'email' | 'video'
type ClaimOtpRecord = {
  code: string
  expires: number
  sentAt: number
  attempts: number
}

const CLAIM_OTP_TTL_MS = 10 * 60 * 1000
const CLAIM_OTP_RESEND_MS = 60 * 1000
const CLAIM_OTP_MAX_ATTEMPTS = 5
const MAX_CLAIM_VIDEO_BYTES = 8 * 1024 * 1024
const claimOtpStore = new Map<string, ClaimOtpRecord>()

function claimOtpKey(method: 'sms' | 'email', escortId: string, userId: number) {
  return `${method}:${escortId}:${userId}`
}

function settingValue(settings: Map<string, string>, key: string) {
  const value = settings.get(key)?.trim()
  return value && !['CHANGE_ME', 'your_smtp_password'].includes(value) && !value.startsWith('CHANGE_')
    ? value
    : ''
}

async function getClaimVerificationConfig(pool: NonNullable<ReturnType<typeof getPool>>) {
  const [rows] = await pool.query<any[]>(
    "SELECT `key`, value FROM platform_settings WHERE `key` IN ('at_api_key','at_username','at_sender_id','smtp_host','smtp_user','smtp_pass')"
  ).catch(() => [[]] as any)
  const settings = new Map((rows as any[]).map(row => [String(row.key), String(row.value ?? '')]))
  const columns = await pool.getExistingColumns(['profile_claims'])
  const schemaReady = columns.has('profile_claims.verification_method')
  const videoReady = schemaReady &&
    columns.has('profile_claims.verification_video_data') &&
    columns.has('profile_claims.verification_video_mime')
  const smsApiKey = settingValue(settings, 'at_api_key')
  const smsUsername = settingValue(settings, 'at_username')
  const smtpHost = settingValue(settings, 'smtp_host')
  const smtpUser = settingValue(settings, 'smtp_user')
  const smtpPass = settingValue(settings, 'smtp_pass')
  return {
    methods: {
      sms: schemaReady && Boolean(smsApiKey && smsUsername),
      email: schemaReady && Boolean(smtpHost && smtpUser && smtpPass),
      video: videoReady,
    },
    smsCredentials: {
      apiKey: smsApiKey,
      username: smsUsername,
      senderId: settingValue(settings, 'at_sender_id') || undefined,
    },
  }
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  return local && domain ? `${local.slice(0, 1)}***@${domain}` : 'your account email'
}

async function sendClaimOtp(req: AuthRequest, res: any, method: 'sms' | 'email') {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const escortId = String(req.params!.id)
    const userId = Number(req.userId)
    const config = await getClaimVerificationConfig(pool)
    if (!config.methods[method]) {
      res.status(503).json({ message: `${method === 'sms' ? 'SMS' : 'Email'} verification is not configured in Admin.` }); return
    }

    const [[escort]] = await pool.query<any[]>(
      'SELECT id, user_id, phone, name FROM escorts WHERE id = ? AND is_active = 1',
      [escortId],
    )
    if (!escort) { res.status(404).json({ message: 'Profile not found' }); return }
    if (escort.user_id) { res.status(409).json({ message: 'This profile has already been claimed' }); return }
    if (method === 'sms' && !escort.phone) {
      res.status(400).json({ message: 'This profile does not have a phone number for SMS verification.' }); return
    }

    const [[user]] = await pool.query<any[]>(
      'SELECT email, display_name, username FROM users WHERE id = ? LIMIT 1',
      [userId],
    )
    if (!user?.email) { res.status(400).json({ message: 'Your account needs an email address before email verification can be used.' }); return }

    const key = claimOtpKey(method, escortId, userId)
    const previous = claimOtpStore.get(key)
    const now = Date.now()
    if (previous && now - previous.sentAt < CLAIM_OTP_RESEND_MS) {
      res.status(429).json({ message: 'Please wait a minute before requesting another code.' }); return
    }

    const code = String(randomInt(100000, 1000000))
    const record = { code, expires: now + CLAIM_OTP_TTL_MS, sentAt: now, attempts: 0 }
    claimOtpStore.set(key, record)
    const sent = method === 'sms'
      ? await sendSmsOtp(String(escort.phone), code, String(escort.name ?? ''), config.smsCredentials)
      : await sendOtpEmail(String(user.email), code, String(user.display_name ?? user.username ?? ''), 'claim')

    if (!sent) {
      claimOtpStore.delete(key)
      res.status(502).json({ message: `We could not send the ${method === 'sms' ? 'SMS' : 'email'} code. Please try again later.` }); return
    }

    res.json({
      success: true,
      message: method === 'sms'
        ? `A verification code was sent to ${String(escort.phone).replace(/(\+\d{3})\d+(\d{3})/, '$1****$2')}.`
        : `A verification code was sent to ${maskEmail(String(user.email))}.`,
    })
  } catch (err: any) {
    console.error(`[claim/send-${method}-otp]`, err?.message ?? err)
    res.status(500).json({ message: 'Failed to send verification code' })
  }
}

async function verifyClaimOtp(req: AuthRequest, res: any, method: 'sms' | 'email') {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  const escortId = String(req.params!.id)
  const userId = Number(req.userId)
  const code = String(req.body?.code ?? '').trim()
  if (!/^\d{6}$/.test(code)) { res.status(400).json({ message: 'Enter the six-digit verification code.' }); return }

  const key = claimOtpKey(method, escortId, userId)
  const stored = claimOtpStore.get(key)
  if (!stored) { res.status(400).json({ message: 'No code was sent for this profile. Request a new one.' }); return }
  if (Date.now() > stored.expires) {
    claimOtpStore.delete(key)
    res.status(400).json({ message: 'The code expired. Request a new one.' }); return
  }
  if (stored.attempts >= CLAIM_OTP_MAX_ATTEMPTS) {
    claimOtpStore.delete(key)
    res.status(429).json({ message: 'Too many incorrect attempts. Request a new code.' }); return
  }
  if (stored.code !== code && stored.code !== `VERIFIED_${userId}`) {
    stored.attempts += 1
    if (stored.attempts >= CLAIM_OTP_MAX_ATTEMPTS) claimOtpStore.delete(key)
    else claimOtpStore.set(key, stored)
    res.status(400).json({ message: 'Incorrect code. Check it and try again.' }); return
  }
  claimOtpStore.set(key, { ...stored, code: `VERIFIED_${userId}` })
  res.json({ success: true, message: `${method === 'sms' ? 'Phone' : 'Email'} verified successfully.` })
}

router.get('/escorts/:id/claim-options', requireAuth, async (_req: AuthRequest, res) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const config = await getClaimVerificationConfig(pool)
    res.json({ methods: config.methods })
  } catch {
    res.status(503).json({ message: 'Claim verification settings are unavailable.' })
  }
})

router.post('/escorts/:id/claim/send-otp', requireAuth, async (req: AuthRequest, res) => {
  await sendClaimOtp(req, res, 'sms')
})
router.post('/escorts/:id/claim/verify-otp', requireAuth, async (req: AuthRequest, res) => {
  await verifyClaimOtp(req, res, 'sms')
})
router.post('/escorts/:id/claim/send-email-otp', requireAuth, async (req: AuthRequest, res) => {
  await sendClaimOtp(req, res, 'email')
})
router.post('/escorts/:id/claim/verify-email-otp', requireAuth, async (req: AuthRequest, res) => {
  await verifyClaimOtp(req, res, 'email')
})

// ── POST /api/escorts/:id/claim ───────────────────────────────────────────────
// Submit a claim (requires OTP to have been verified first)
router.post('/escorts/:id/claim', requireAuth, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const escortId = String(req.params!.id)
    const method = String(req.body?.verification_method ?? '') as ClaimMethod
    const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 3000) : ''
    if (!['sms', 'email', 'video'].includes(method)) {
      res.status(400).json({ message: 'Choose a supported verification method.' }); return
    }

    const [[escort]] = await pool.query<any[]>(
      'SELECT id, user_id, phone, name FROM escorts WHERE id = ? AND is_active = 1',
      [escortId]
    )
    if (!escort) { res.status(404).json({ message: 'Profile not found' }); return }
    if (escort.user_id) { res.status(409).json({ message: 'This profile has already been claimed' }); return }

    let verificationVideo: Buffer | null = null
    let verificationVideoMime: string | null = null
    const config = await getClaimVerificationConfig(pool)
    if (!config.methods[method]) {
      res.status(503).json({ message: `${method === 'sms' ? 'SMS' : method === 'email' ? 'Email' : 'Video'} verification is not configured or the claim schema is not ready.` }); return
    }

    if (method === 'sms' || method === 'email') {
      const key = claimOtpKey(method, escortId, Number(req.userId))
      const stored = claimOtpStore.get(key)
      if (!stored || stored.code !== `VERIFIED_${req.userId}` || Date.now() > stored.expires) {
        res.status(403).json({ message: `${method === 'sms' ? 'Phone' : 'Email'} verification is required before submitting this claim.` }); return
      }
    } else {
      const dataUrl = String(req.body?.verification_video ?? '')
      const match = dataUrl.match(/^data:(video\/(?:webm|mp4|quicktime));base64,([A-Za-z0-9+/]+={0,2})$/)
      if (!match) { res.status(400).json({ message: 'Upload a WebM, MP4, or QuickTime video to submit this claim.' }); return }
      verificationVideoMime = match[1]
      verificationVideo = Buffer.from(match[2], 'base64')
      if (!verificationVideo.length || verificationVideo.length > MAX_CLAIM_VIDEO_BYTES) {
        res.status(413).json({ message: 'The verification video must be no larger than 8 MB.' }); return
      }
    }

    const schemaColumns = await pool.getExistingColumns(['escorts', 'profile_claims'])
    if (!schemaColumns.has('escorts.merged_into_id') ||
        !schemaColumns.has('profile_claims.merge_into_escort_id') ||
        !schemaColumns.has('profile_claims.verification_method')) {
      res.status(503).json({ message: 'Claim schema is not ready. Please apply the profile claim migration and try again.' }); return
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
      `INSERT INTO profile_claims
        (escort_id, user_id, merge_into_escort_id, message, status, verification_method, verification_video_data, verification_video_mime)
       VALUES (?,?,?,?, 'pending', ?, ?, ?)`,
      [escortId, req.userId, existingProfile?.id ?? null, message || null, method, verificationVideo, verificationVideoMime]
    )

    if (method === 'sms' || method === 'email') {
      claimOtpStore.delete(claimOtpKey(method, escortId, Number(req.userId)))
    }

    let emailNotifications = { claimantSent: false, adminsSent: false }
    try {
      const [[claimant]] = await pool.query<any[]>(
        'SELECT email, display_name, username FROM users WHERE id = ? LIMIT 1',
        [req.userId],
      )
      const [adminRows] = await pool.query<any[]>(
        "SELECT email FROM users WHERE role = 'admin' AND is_active = 1 AND email IS NOT NULL AND email <> ''",
      ).catch(() => [[]] as any)
      const [[supportRow]] = await pool.query<any[]>(
        "SELECT value FROM platform_settings WHERE `key` = 'support_email' LIMIT 1",
      ).catch(() => [[null]])
      const adminEmails = (adminRows as any[]).map(row => String(row.email))
      if (supportRow?.value) adminEmails.push(String(supportRow.value))
      if (claimant?.email) {
        emailNotifications = await sendProfileClaimSubmittedEmails({
          claimantEmail: String(claimant.email),
          claimantName: String(claimant.display_name ?? claimant.username ?? ''),
          adminEmails,
          escortName: String(escort.name ?? 'profile'),
          escortId,
          verificationMethod: method,
          mergeTargetName: existingProfile?.name ?? null,
        })
      }
    } catch (notificationError: any) {
      console.warn('[claim notification]', notificationError?.message ?? notificationError)
    }

    res.json({
      success: true,
      message: existingProfile
        ? `Your duplicate listing request is under review. If approved, it will be merged into ${existingProfile.name}.`
        : 'Your claim has been submitted and is under review.',
      mergeTarget: existingProfile ? { id: String(existingProfile.id), name: existingProfile.name } : null,
      emailNotifications,
    })
  } catch (err: any) {
    console.error('[claim]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to submit claim' })
  }
})

// ── GET /api/escorts/:id/claim-status ─────────────────────────────────────────
router.get('/escorts/:id/claim-status', requireAuth, async (req: AuthRequest, res) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
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
    const claimColumns = await pool.getExistingColumns(['profile_claims'])
    const methodExpr = claimColumns.has('profile_claims.verification_method')
      ? 'pc.verification_method'
      : "'manual'"
    const hasVideoExpr = claimColumns.has('profile_claims.verification_video_data')
      ? '(pc.verification_video_data IS NOT NULL)'
      : '0'
    const [rows] = await pool.query<any[]>(`
       SELECT pc.id, pc.escort_id, pc.user_id, pc.merge_into_escort_id, pc.message, pc.status, pc.created_at,
             ${methodExpr} AS verification_method, ${hasVideoExpr} AS has_video,
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

// Verification videos are stored in the claim row, never in the public uploads directory.
router.get('/admin/claims/:id/video', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const columns = await pool.getExistingColumns(['profile_claims'])
    if (!columns.has('profile_claims.verification_video_data') ||
        !columns.has('profile_claims.verification_video_mime')) {
      res.status(503).json({ message: 'Private claim video storage is not ready.' }); return
    }
    const [[claim]] = await pool.query<any[]>(
      'SELECT verification_video_data, verification_video_mime FROM profile_claims WHERE id = ? LIMIT 1',
      [req.params!.id],
    )
    if (!claim?.verification_video_data) { res.status(404).json({ message: 'No verification video is attached to this claim.' }); return }
    const allowedTypes = new Set(['video/webm', 'video/mp4', 'video/quicktime'])
    const mime = allowedTypes.has(String(claim.verification_video_mime))
      ? String(claim.verification_video_mime)
      : 'application/octet-stream'
    const extension = mime === 'video/webm' ? 'webm' : mime === 'video/mp4' ? 'mp4' : 'mov'
    const video = Buffer.isBuffer(claim.verification_video_data)
      ? claim.verification_video_data
      : Buffer.from(claim.verification_video_data)
    res.setHeader('Content-Type', mime)
    res.setHeader('Content-Length', String(video.length))
    res.setHeader('Content-Disposition', `inline; filename="claim-verification.${extension}"`)
    res.setHeader('Cache-Control', 'private, no-store, max-age=0')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.send(video)
  } catch (err: any) {
    console.error('[claim video]', err?.message ?? err)
    res.status(500).json({ message: 'Could not load the verification video.' })
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
      // Lock the claimant rather than the admin performing this action. This
      // serializes approvals for separate claims from the same account, so two
      // first-time claims cannot both become independent managed profiles.
      const [claimOwnerRows] = await query(
        'SELECT user_id FROM profile_claims WHERE id = ?',
        [req.params!.id],
      )
      const claimOwner = Array.isArray(claimOwnerRows) ? claimOwnerRows[0] : null
      if (!claimOwner) {
        const error: any = new Error('Claim not found')
        error.statusCode = 404
        throw error
      }

      const [userRows] = await query('SELECT id FROM users WHERE id = ? FOR UPDATE', [claimOwner.user_id])
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
        await query("UPDATE escorts SET user_id = ?, verified = 1, approval_status = 'approved' WHERE id = ?", [claim.user_id, claim.escort_id])
      }

      await query("UPDATE users SET role = 'escort' WHERE id = ? AND role = 'user'", [claim.user_id])
      await query("UPDATE profile_claims SET status = 'approved' WHERE id = ?", [claim.id])
      await query(
        "UPDATE profile_claims SET status = 'rejected' WHERE escort_id = ? AND id != ? AND status = 'pending'",
        [claim.escort_id, claim.id],
      )

      return mergeResult
    })

    let emailSent = false
    try {
      const [[claimant]] = await pool.query<any[]>(
        `SELECT u.email, u.display_name, u.username, e.name AS escort_name
         FROM profile_claims pc
         LEFT JOIN users u ON u.id = pc.user_id
         LEFT JOIN escorts e ON e.id = pc.escort_id
         WHERE pc.id = ? LIMIT 1`,
        [req.params!.id],
      )
      if (claimant?.email) {
        emailSent = await sendProfileClaimDecisionEmail({
          claimantEmail: String(claimant.email),
          claimantName: String(claimant.display_name ?? claimant.username ?? ''),
          escortName: String(claimant.escort_name ?? 'profile'),
          status: 'approved',
          mergeTargetName: result?.primaryName ?? null,
        })
      }
    } catch (notificationError: any) {
      console.warn('[claim approval notification]', notificationError?.message ?? notificationError)
    }

    res.json({
      success: true,
      merged: !!result,
      primaryProfile: result ? { id: result.primaryId, name: result.primaryName } : null,
      emailSent,
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
    await pool.transaction(async query => {
      const [claimOwnerRows] = await query(
        'SELECT user_id FROM profile_claims WHERE id = ?',
        [req.params!.id],
      )
      const claimOwner = Array.isArray(claimOwnerRows) ? claimOwnerRows[0] : null
      if (!claimOwner) {
        const error: any = new Error('Claim not found')
        error.statusCode = 404
        throw error
      }

      // Use the same claimant-then-claim lock order as approval to prevent a
      // reject racing an approval and changing the final status after a merge.
      await query('SELECT id FROM users WHERE id = ? FOR UPDATE', [claimOwner.user_id])
      const [claimRows] = await query('SELECT status FROM profile_claims WHERE id = ? FOR UPDATE', [req.params!.id])
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

      await query("UPDATE profile_claims SET status = 'rejected' WHERE id = ?", [req.params!.id])
    })
    let emailSent = false
    try {
      const [[claimant]] = await pool.query<any[]>(
        `SELECT u.email, u.display_name, u.username, e.name AS escort_name
         FROM profile_claims pc
         LEFT JOIN users u ON u.id = pc.user_id
         LEFT JOIN escorts e ON e.id = pc.escort_id
         WHERE pc.id = ? LIMIT 1`,
        [req.params!.id],
      )
      if (claimant?.email) {
        emailSent = await sendProfileClaimDecisionEmail({
          claimantEmail: String(claimant.email),
          claimantName: String(claimant.display_name ?? claimant.username ?? ''),
          escortName: String(claimant.escort_name ?? 'profile'),
          status: 'rejected',
        })
      }
    } catch (notificationError: any) {
      console.warn('[claim rejection notification]', notificationError?.message ?? notificationError)
    }
    res.json({ success: true, emailSent })
  } catch (err: any) {
    const statusCode = Number(err?.statusCode) || 500
    if (statusCode === 500) console.error('[claim rejection]', err?.message ?? err)
    res.status(statusCode).json({
      message: statusCode === 500 ? 'Failed to reject claim' : err.message,
    })
  }
})

export default router
