import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import {
  featuredPriceForPaymentType,
  profileTierForPaymentType,
  profileTierPrice,
  readPlatformPricing,
} from '../lib/platform-pricing.js'

const router = Router()

// ─── PayHero helpers ──────────────────────────────────────────────────────────

async function getPayheroConfig(pool: ReturnType<typeof getPool>) {
  if (!pool) return null
  const [rows] = await pool.query<any[]>(
    "SELECT `key`, `value` FROM platform_settings WHERE `key` IN ('payhero_api_key','payhero_secret','payhero_channel_id')"
  ).catch(() => [[]] as any)
  const cfg: Record<string, string> = {}
  for (const r of rows as any[]) cfg[r.key] = r.value
  if (!cfg.payhero_api_key || !cfg.payhero_secret) return null
  return {
    apiKey:    cfg.payhero_api_key,
    secret:    cfg.payhero_secret,
    channelId: parseInt(cfg.payhero_channel_id ?? '5107', 10),
  }
}

export async function triggerStkPush(
  pool: ReturnType<typeof getPool>,
  opts: { phone: string; amount: number; txRef: string; callbackUrl: string }
): Promise<{ success: boolean; message: string; data?: any }> {
  const cfg = await getPayheroConfig(pool)
  if (!cfg) return { success: false, message: 'PayHero credentials not configured. Add them in Admin → API Keys.' }

  let cleanPhone = opts.phone.replace(/\s+/g, '').replace(/^\+/, '')
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '254' + cleanPhone.slice(1)
  } else if (cleanPhone.length === 9) {
    cleanPhone = '254' + cleanPhone
  }

  const basicAuth = Buffer.from(`${cfg.apiKey}:${cfg.secret}`).toString('base64')

  try {
    const response = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount:             opts.amount,
        phone_number:       cleanPhone,
        channel_id:         cfg.channelId,
        provider:           'm-pesa',
        external_reference: opts.txRef,
        callback_url:       opts.callbackUrl,
      }),
      signal: AbortSignal.timeout(15000),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('[PayHero STK push error]', response.status, data)
      return { success: false, message: (data as any).message ?? `PayHero API error (${response.status})`, data }
    }

    return { success: true, message: 'STK push sent — check your phone', data }
  } catch (err: any) {
    console.error('[PayHero STK push exception]', err?.message)
    return { success: false, message: err?.message ?? 'Network error contacting PayHero' }
  }
}

async function verifyPayheroTransaction(
  pool: ReturnType<typeof getPool>,
  providerRef: string,
  expectedAmount: number,
): Promise<boolean> {
  const cfg = await getPayheroConfig(pool)
  if (!cfg || !providerRef) return false

  try {
    const response = await fetch(
      `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(providerRef)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${cfg.apiKey}:${cfg.secret}`).toString('base64')}`,
        },
        signal: AbortSignal.timeout(12000),
      },
    )
    if (!response.ok) return false

    const data = await response.json().catch(() => ({})) as Record<string, unknown>
    if (String(data.status ?? '').toUpperCase() !== 'SUCCESS') return false
    if (data.reference && String(data.reference) !== providerRef) return false
    const rawAmount = data.amount ?? data.Amount
    if (rawAmount === undefined || rawAmount === null) return true
    const verifiedAmount = Number(rawAmount)
    return Number.isSafeInteger(verifiedAmount) && verifiedAmount === expectedAmount
  } catch (err: any) {
    console.error('[PayHero transaction verification error]', err?.message)
    return false
  }
}

async function activatePaidProfileTier(
  pool: NonNullable<ReturnType<typeof getPool>>,
  txRef: string,
  callbackAmount: number,
): Promise<'activated' | 'ignored' | 'unverified'> {
  const [[candidate]] = await pool.query<any[]>(
    `SELECT id, user_id, escort_id, plan, amount, provider_ref, status
       FROM subscriptions
      WHERE tx_ref = ?
      LIMIT 1`,
    [txRef],
  )
  if (!candidate || candidate.status !== 'pending') return 'ignored'

  const tier = profileTierForPaymentType(String(candidate.plan ?? ''))
  if (!tier) return 'ignored'

  const amount = Number(candidate.amount)
  if (!Number.isSafeInteger(callbackAmount) || callbackAmount !== amount) {
    return 'unverified'
  }
  if (!candidate.provider_ref || !(await verifyPayheroTransaction(pool, String(candidate.provider_ref), amount))) {
    return 'unverified'
  }

  return pool.transaction(async query => {
    const [paymentRows] = await query(
      `SELECT id, user_id, escort_id, plan, amount, status
         FROM subscriptions
        WHERE tx_ref = ?
        LIMIT 1
        FOR UPDATE`,
      [txRef],
    )
    const payment = (paymentRows as any[])[0]
    if (!payment || payment.status !== 'pending' || Number(payment.amount) !== amount) return 'ignored'

    const [escortRows] = await query(
      `SELECT id, tier, tier_expires_at
         FROM escorts
        WHERE id = ? AND user_id = ?
        LIMIT 1
        FOR UPDATE`,
      [payment.escort_id, payment.user_id],
    )
    const escort = (escortRows as any[])[0]
    if (!escort) {
      console.warn(`[PayHero] Verified profile tier payment ${txRef} has no matching escort profile`)
      return 'unverified'
    }

    const now = new Date()
    const currentExpiry = escort.tier_expires_at ? new Date(escort.tier_expires_at) : null
    const extendCurrentTier = String(escort.tier).toLowerCase() === tier
      && currentExpiry !== null
      && Number.isFinite(currentExpiry.getTime())
      && currentExpiry.getTime() > now.getTime()
    const expiresAt = new Date(
      (extendCurrentTier ? currentExpiry!.getTime() : now.getTime()) + 30 * 24 * 60 * 60 * 1000,
    )

    await query(
      `UPDATE subscriptions
          SET status = 'paid', expires_at = ?, updated_at = NOW()
        WHERE id = ? AND status = 'pending'`,
      [expiresAt, payment.id],
    )
    await query(
      `UPDATE escorts
          SET tier = ?, tier_expires_at = ?, updated_at = NOW()
        WHERE id = ? AND user_id = ?`,
      [tier, expiresAt, escort.id, payment.user_id],
    )
    return 'activated'
  })
}

// ─── PayHero Webhook Callback (public — no auth) ──────────────────────────────
router.post('/payments/payhero/callback', async (req, res) => {
  try {
    const pool  = getPool()
    const body  = req.body as any
    const callback = body?.response && typeof body.response === 'object' ? body.response : body

    console.log('[PayHero callback]', JSON.stringify(body))

    const rawStatus = callback?.Status ?? callback?.status ?? body?.Status
    const resultCode = callback?.ResultCode ?? callback?.result_code ?? body?.ResultCode
    const status = String(rawStatus ?? '').toUpperCase()
    const succeeded = resultCode !== undefined
      ? Number(resultCode) === 0
      : ['SUCCESS', 'SUCCEEDED'].includes(status)
    const failed = resultCode !== undefined
      ? Number(resultCode) !== 0
      : ['FAILED', 'CANCELLED', 'REJECTED'].includes(status)
    const txRef  = String(
      callback?.ExternalReference
      ?? callback?.external_reference
      ?? body?.external_reference
      ?? body?.ExternalReference
      ?? callback?.CheckoutRequestID
      ?? body?.CheckoutRequestID
      ?? '',
    )
    const amount = Number(callback?.Amount ?? callback?.amount ?? body?.amount ?? body?.Amount ?? 0)

    if (txRef && pool) {
      if (succeeded) {
        const [[payment]] = await pool.query<any[]>(
          'SELECT plan FROM subscriptions WHERE tx_ref = ? LIMIT 1',
          [txRef],
        )
        if (profileTierForPaymentType(String(payment?.plan ?? ''))) {
          const result = await activatePaidProfileTier(pool, txRef, amount)
          if (result === 'activated') {
            console.log(`[PayHero] Profile tier activated for ${txRef} — KES ${amount}`)
          } else if (result === 'unverified') {
            console.warn(`[PayHero] Profile tier payment not activated for ${txRef}: callback/provider verification did not match`)
          }
          res.status(200).json({ ok: true })
          return
        }

        await pool.query(
          "UPDATE subscriptions SET status = 'paid', updated_at = NOW() WHERE tx_ref = ? AND status = 'pending'",
          [txRef]
        ).catch(() => {})
        await pool.query(
          `UPDATE escorts e
             INNER JOIN subscriptions s ON s.escort_id = e.id
           SET e.is_active = 1
           WHERE s.tx_ref = ?`,
          [txRef]
        ).catch(() => {})
        console.log(`[PayHero] Payment SUCCESS for ${txRef} — KES ${amount}`)
      } else if (failed) {
        await pool.query(
          "UPDATE subscriptions SET status = 'failed' WHERE tx_ref = ? AND status = 'pending'",
          [txRef]
        ).catch(() => {})
        console.log(`[PayHero] Payment ${status} for ${txRef}`)
      }
    }

    res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('[PayHero callback error]', err?.message)
    res.status(200).json({ ok: true })
  }
})

router.get('/payments/profile-tier', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'escort') {
    res.status(403).json({ message: 'Monthly profile tiers are available to escort accounts only.' })
    return
  }
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const [[escort]] = await pool.query<any[]>(
      `SELECT id, tier, tier_expires_at
         FROM escorts
        WHERE user_id = ?
        LIMIT 1`,
      [req.userId],
    )
    if (!escort) {
      res.status(404).json({ message: 'No escort profile is linked to this account.' })
      return
    }

    let tier = String(escort.tier ?? 'standard').toLowerCase()
    let expiresAt: Date | null = escort.tier_expires_at ? new Date(escort.tier_expires_at) : null
    if (!['premium', 'vip', 'elite'].includes(tier)) {
      tier = 'standard'
      expiresAt = null
    } else if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() <= Date.now()) {
      await pool.query(
        `UPDATE escorts
            SET tier = 'standard', tier_expires_at = NULL, updated_at = NOW()
          WHERE id = ? AND tier_expires_at <= NOW()`,
        [escort.id],
      )
      tier = 'standard'
      expiresAt = null
    }

    res.json({ tier, expiresAt })
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? 'Failed to load profile tier' })
  }
})

// ─── Admin: Test PayHero STK Push ─────────────────────────────────────────────
router.post('/admin/payments/payhero/test', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin only' }); return }
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const { phone } = req.body as { phone?: string }
    if (!phone) { res.status(400).json({ message: 'phone is required (e.g. 0712345678)' }); return }

    const txRef = 'TEST-' + Date.now().toString(36).toUpperCase()
    const siteUrl = process.env.SITE_URL
      ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://wet3.camp')

    const result = await triggerStkPush(pool, {
      phone,
      amount:      1,
      txRef,
      callbackUrl: `${siteUrl}/api/payments/payhero/callback`,
    })

    if (result.success) {
      res.json({ success: true, message: `KES 1 STK push sent to ${phone}. Check your phone for the M-Pesa prompt.`, txRef })
    } else {
      res.status(400).json(result)
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? 'Test failed' })
  }
})

// ─── Universal payment initiation ─────────────────────────────────────────────
// Used by: adverts, featured-upgrade, bookings
router.post('/payments/initiate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const { phone, amount: requestedAmount, type } = req.body as {
      phone?: string; amount?: number; type?: string; description?: string
    }

    if (!phone || requestedAmount === undefined || !type) {
      res.status(400).json({ message: 'phone, amount, and type are required' }); return
    }

    const normalizedType = type.trim().toLowerCase()
    const requestedTier = profileTierForPaymentType(normalizedType)
    if (normalizedType.startsWith('tier_') && !requestedTier) {
      res.status(400).json({ message: 'Unknown monthly profile tier' }); return
    }

    if (['monthly', 'quarterly', 'annual', 'subscription'].includes(normalizedType)) {
      res.status(410).json({ message: 'Escort platform subscriptions are no longer offered. Standard profiles are free.' })
      return
    }

    const parsedAmount = Number(requestedAmount)
    if (!Number.isSafeInteger(parsedAmount) || parsedAmount < 1) {
      res.status(400).json({ message: 'Enter a valid payment amount' }); return
    }

    let amount = parsedAmount
    let paymentType = type.trim()
    let escortId: number | null = null
    if (requestedTier) {
      if (req.userRole !== 'escort') {
        res.status(403).json({ message: 'Monthly profile tiers are available to escort accounts only.' }); return
      }
      const [[escort]] = await pool.query<any[]>(
        'SELECT id FROM escorts WHERE user_id = ? AND is_active = 1 LIMIT 1',
        [req.userId],
      )
      if (!escort) {
        res.status(403).json({ message: 'An approved active escort profile is required to buy a monthly tier.' }); return
      }
      escortId = Number(escort.id)
      paymentType = `tier_${requestedTier}`
      const pricing = await readPlatformPricing(pool)
      const currentTierPrice = profileTierPrice(requestedTier, pricing)
      if (parsedAmount !== currentTierPrice) {
        res.status(409).json({
          message: 'The monthly tier price changed. Review the current price and try again.',
          amount: currentTierPrice,
        })
        return
      }
      amount = currentTierPrice
    } else if (paymentType.startsWith('featured_')) {
      const pricing = await readPlatformPricing(pool)
      const currentFeaturedPrice = featuredPriceForPaymentType(paymentType, pricing)
      if (currentFeaturedPrice === null) {
        res.status(400).json({ message: 'Unknown featured placement option' }); return
      }
      if (parsedAmount !== currentFeaturedPrice) {
        res.status(409).json({
          message: 'The featured price changed. Review the current price and try again.',
          amount: currentFeaturedPrice,
        })
        return
      }
      amount = currentFeaturedPrice
    }

    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+/, '')
    if (cleanPhone.length < 9) { res.status(400).json({ message: 'Enter a valid M-Pesa number' }); return }

    const txRef = `${paymentType.toUpperCase().slice(0, 4)}-${randomBytes(16).toString('hex').toUpperCase()}`

    if (escortId === null) {
      const [[escort]] = await pool.query<any[]>(
        'SELECT id FROM escorts WHERE user_id = ? LIMIT 1', [req.userId]
      ).catch(() => [[undefined]])
      escortId = escort?.id ? Number(escort.id) : null
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90) // generous window; real expiry set on confirmation

    await pool.query(
      `INSERT INTO subscriptions (user_id, escort_id, plan, amount, phone, tx_ref, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [req.userId, escortId, paymentType, amount, cleanPhone, txRef, requestedTier ? null : expiresAt]
    )

    const siteUrl = process.env.SITE_URL
      ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://wet3.camp')

    const stkResult = await triggerStkPush(pool, {
      phone:       cleanPhone,
      amount,
      txRef,
      callbackUrl: `${siteUrl}/api/payments/payhero/callback`,
    })

    if (!stkResult.success) {
      // Mark as failed so polling doesn't hang
      await pool.query(
        "UPDATE subscriptions SET status = 'failed' WHERE tx_ref = ?", [txRef]
      ).catch(() => {})
      res.status(400).json({ success: false, message: stkResult.message }); return
    }

    const providerRef = String(stkResult.data?.reference ?? '')
    if (requestedTier && !providerRef) {
      res.status(502).json({ success: false, message: 'M-Pesa accepted the request but did not return a verification reference. Contact support before retrying.' })
      return
    }
    if (providerRef) {
      await pool.query(
        "UPDATE subscriptions SET provider_ref = ?, updated_at = NOW() WHERE tx_ref = ? AND user_id = ? AND status = 'pending'",
        [providerRef, txRef, req.userId],
      )
    }

    res.json({ success: true, txRef, message: 'M-Pesa prompt sent — enter your PIN to complete payment.' })
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? 'Failed to initiate payment' })
  }
})

// ─── Universal payment status poll ────────────────────────────────────────────
router.get('/payments/status/:txRef', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const [rows] = await pool.query<any[]>(
      'SELECT status, amount, plan FROM subscriptions WHERE tx_ref = ? AND user_id = ?',
      [req.params!.txRef, req.userId]
    ).catch(() => [[]])

    const sub = (rows as any[])[0]
    if (!sub) { res.status(404).json({ message: 'Transaction not found' }); return }

    res.json({
      status: sub.status,
      amount: sub.amount,
      plan:   sub.plan,
      paid:   sub.status === 'paid',
      failed: sub.status === 'failed' || sub.status === 'cancelled',
    })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to check status' })
  }
})

// ─── Payment history for logged-in user ───────────────────────────────────────
router.get('/payments/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ payments: [] }); return }

    const [rows] = await pool.query<any[]>(
      `SELECT s.id, s.plan, s.amount, s.phone, s.status, s.tx_ref,
              s.expires_at, s.created_at, e.name AS escort_name
         FROM subscriptions s
         LEFT JOIN escorts e ON e.id = s.escort_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT 100`,
      [req.userId]
    ).catch(() => [[]])

    res.json({ payments: rows as any[] })
  } catch (err: any) {
    res.status(500).json({ payments: [], message: 'Failed to load history' })
  }
})

export default router
