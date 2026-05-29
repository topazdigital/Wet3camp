import { Router } from 'express'
import { getPool } from '../lib/db.js'

const router = Router()

router.post('/payments/payhero/callback', async (req, res) => {
  const pool = getPool()
  if (!pool) { res.sendStatus(200); return }

  try {
    const body = req.body as Record<string, any>
    const status: string  = (body.status ?? '').toUpperCase()
    const extRef: string  = body.external_reference ?? body.ExternalReference ?? ''
    const payheroRef: string = body.CheckoutRequestID ?? body.MerchantRequestID ?? body.reference ?? ''

    if (!extRef.startsWith('TIP-')) { res.sendStatus(200); return }

    const dbStatus = status === 'SUCCESS' ? 'success' : 'failed'
    await pool.query(
      'UPDATE tips SET status = ?, payhero_ref = ?, updated_at = NOW() WHERE external_ref = ?',
      [dbStatus, payheroRef || null, extRef]
    ).catch(() => {})

    res.sendStatus(200)
  } catch (err) {
    console.error('[payments] callback error:', err)
    res.sendStatus(200)
  }
})

export default router
