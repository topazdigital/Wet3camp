import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

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

// ─── PayHero Webhook Callback (public — no auth) ──────────────────────────────
router.post('/payments/payhero/callback', async (req, res) => {
  try {
    const pool  = getPool()
    const body  = req.body as any

    console.log('[PayHero callback]', JSON.stringify(body))

    const status = String(body.status ?? body.Status ?? '').toUpperCase()
    const txRef  = String(body.external_reference ?? body.ExternalReference ?? body.CheckoutRequestID ?? '')
    const amount = Number(body.amount ?? body.Amount ?? 0)

    if (txRef && pool) {
      if (status === 'SUCCESS') {
        await pool.query(
          "UPDATE subscriptions SET status = 'paid', updated_at = NOW() WHERE tx_ref = ?",
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
      } else if (['FAILED', 'CANCELLED', 'REJECTED'].includes(status)) {
        await pool.query(
          "UPDATE subscriptions SET status = 'failed' WHERE tx_ref = ?",
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
// Used by: adverts, featured-upgrade, bookings, my-profile
router.post('/payments/initiate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const { phone, amount, type, description } = req.body as {
      phone?: string; amount?: number; type?: string; description?: string
    }

    if (!phone || !amount || !type) {
      res.status(400).json({ message: 'phone, amount, and type are required' }); return
    }

    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+/, '')
    if (cleanPhone.length < 9) { res.status(400).json({ message: 'Enter a valid M-Pesa number' }); return }

    const txRef = `${type.toUpperCase().slice(0, 4)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`

    // Get escort id if the user is an escort
    const [[escort]] = await pool.query<any[]>(
      'SELECT id FROM escorts WHERE user_id = ?', [req.userId]
    ).catch(() => [[undefined]])

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90) // generous window; real expiry set on confirmation

    await pool.query(
      `INSERT INTO subscriptions (user_id, escort_id, plan, amount, phone, tx_ref, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [req.userId, escort?.id ?? null, type, amount, cleanPhone, txRef, expiresAt]
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

// ─── Poll subscription payment status (kept for backwards compat) ─────────────
router.get('/payments/subscription/status/:txRef', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const [rows] = await pool.query<any[]>(
      'SELECT status, amount, plan, expires_at FROM subscriptions WHERE tx_ref = ? AND user_id = ?',
      [req.params!.txRef, req.userId]
    ).catch(() => [[]])

    const sub = (rows as any[])[0]
    if (!sub) { res.status(404).json({ message: 'Transaction not found' }); return }

    res.json({
      status:    sub.status,
      amount:    sub.amount,
      plan:      sub.plan,
      expiresAt: sub.expires_at,
      paid:      sub.status === 'paid',
      failed:    sub.status === 'failed' || sub.status === 'cancelled',
    })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to check status' })
  }
})

export default router
