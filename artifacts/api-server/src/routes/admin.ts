import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { setEscortOnline } from '../lib/online-store.js'
import { sendEscortApprovedEmail, sendEscortRejectedEmail } from '../lib/mailer.js'

const router = Router()

function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (req.userRole !== 'admin') {
    res.status(403).json({ message: 'Admin access required' }); return
  }
  next()
}

router.get('/admin/stats', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [[{ users }]] = await pool.query<any[]>('SELECT COUNT(*) as users FROM users')
    const [[{ escorts }]] = await pool.query<any[]>('SELECT COUNT(*) as escorts FROM escorts')
    const [[{ pending }]] = await pool.query<any[]>('SELECT COUNT(*) as pending FROM escorts WHERE is_active = 0 AND verified = 0').catch(() => [[{ pending: 0 }]])
    const [[{ bookings }]] = await pool.query<any[]>('SELECT COUNT(*) as bookings FROM bookings').catch(() => [[{ bookings: 0 }]])
    const [[{ reviews }]] = await pool.query<any[]>('SELECT COUNT(*) as reviews FROM reviews').catch(() => [[{ reviews: 0 }]])
    const [[{ room_bookings }]] = await pool.query<any[]>('SELECT COUNT(*) as room_bookings FROM room_bookings').catch(() => [[{ room_bookings: 0 }]])
    res.json({ users, escorts, pending, bookings, reviews, room_bookings })
  } catch {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

router.get('/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const limit = Math.min(parseInt((req.query as any).limit ?? '200', 10), 500)
    const [rows] = await pool.query<any[]>(
      'SELECT id, username, email, role, display_name, phone, created_at, is_active FROM users ORDER BY created_at DESC LIMIT ?',
      [limit]
    )
    res.json(rows.map(u => ({ ...u, id: String(u.id) })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

router.get('/admin/escorts', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const limit = Math.min(parseInt((req.query as any).limit ?? '200', 10), 500)
    const [rows] = await pool.query<any[]>(
      'SELECT e.*, u.email as user_email, u.display_name as user_display_name FROM escorts e LEFT JOIN users u ON u.id = e.user_id ORDER BY e.created_at DESC LIMIT ?',
      [limit]
    )
    res.json(rows.map(e => ({ ...e, id: String(e.id) })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch escorts' })
  }
})

router.get('/admin/bookings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const limit = Math.min(parseInt((req.query as any).limit ?? '200', 10), 500)
    const [rows] = await pool.query<any[]>(
      `SELECT b.*, e.name AS escort_name, u.display_name AS client_name, u.email AS client_email
       FROM bookings b
       LEFT JOIN escorts e ON e.id = b.escort_id
       LEFT JOIN users u ON u.id = b.user_id
       ORDER BY b.created_at DESC LIMIT ?`,
      [limit]
    )
    res.json(rows.map(b => ({
      id: b.id,
      escortId: String(b.escort_id),
      escortName: b.escort_name ?? 'Unknown',
      clientName: b.client_name ?? 'Guest',
      clientEmail: b.client_email ?? '',
      date: b.booking_date,
      time: b.start_time,
      duration: b.duration_hrs,
      type: b.type,
      amount: b.amount,
      location: b.location,
      status: b.status,
      createdAt: b.created_at,
    })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch bookings' })
  }
})

router.get('/admin/room-bookings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [rows] = await pool.query<any[]>(
      `SELECT rb.*, r.name AS room_name, r.hotel
       FROM room_bookings rb
       LEFT JOIN rooms r ON r.id = rb.room_id
       ORDER BY rb.created_at DESC LIMIT 200`
    )
    res.json(rows.map(b => ({ ...b, id: b.id })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch room bookings' })
  }
})

router.patch('/admin/escorts/:id/verify', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [[escort]] = await pool.query<any[]>(
      'SELECT e.name, u.email FROM escorts e LEFT JOIN users u ON u.id = e.user_id WHERE e.id = ? LIMIT 1',
      [req.params!.id]
    ).catch(() => [[null]])
    await pool.query('UPDATE escorts SET verified = 1, is_active = 1 WHERE id = ?', [req.params!.id])
    if (escort?.email) sendEscortApprovedEmail(escort.name, escort.email).catch(() => {})
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to verify escort' })
  }
})

router.patch('/admin/escorts/bulk-online', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const online = req.body.online === true || req.body.online === 1
    const city: string | undefined = req.body.city
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    let affectedIds: number[] = []
    if (city) {
      const [rows] = await pool.query<any[]>('SELECT id FROM escorts WHERE city = ?', [city])
      affectedIds = rows.map((r: any) => Number(r.id))
      if (affectedIds.length > 0) {
        await pool.query('UPDATE escorts SET online = ? WHERE city = ?', [online ? 1 : 0, city])
      }
    } else {
      const [rows] = await pool.query<any[]>('SELECT id FROM escorts')
      affectedIds = rows.map((r: any) => Number(r.id))
      await pool.query('UPDATE escorts SET online = ?', [online ? 1 : 0])
    }

    for (const id of affectedIds) {
      setEscortOnline(id, online)
    }
    res.json({ success: true, affected: affectedIds.length, city: city ?? 'all', online })
  } catch {
    res.status(500).json({ message: 'Failed to bulk update online status' })
  }
})

router.patch('/admin/escorts/:id/online', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const online = req.body.online === true || req.body.online === 1
    const id = Number(req.params!.id)
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    await pool.query('UPDATE escorts SET online = ? WHERE id = ?', [online ? 1 : 0, id])
    setEscortOnline(id, online)
    res.json({ success: true, id, online })
  } catch {
    res.status(500).json({ message: 'Failed to update online status' })
  }
})

router.patch('/admin/escorts/:id/reject', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [[escort]] = await pool.query<any[]>(
      'SELECT e.name, u.email FROM escorts e LEFT JOIN users u ON u.id = e.user_id WHERE e.id = ? LIMIT 1',
      [req.params!.id]
    ).catch(() => [[null]])
    await pool.query('UPDATE escorts SET is_active = 0, verified = 0 WHERE id = ?', [req.params!.id])
    if (escort?.email) sendEscortRejectedEmail(escort.name, escort.email).catch(() => {})
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to reject escort' })
  }
})

router.delete('/admin/escorts/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    await pool.query('DELETE FROM escort_gallery WHERE escort_id = ?', [req.params!.id]).catch(() => {})
    await pool.query('DELETE FROM escort_languages WHERE escort_id = ?', [req.params!.id]).catch(() => {})
    await pool.query('DELETE FROM escort_services WHERE escort_id = ?', [req.params!.id]).catch(() => {})
    await pool.query('DELETE FROM escorts WHERE id = ?', [req.params!.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to delete escort' })
  }
})

router.post('/admin/test-email', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  res.setHeader('Content-Type', 'application/json')
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  if (!smtpConfigured) {
    res.status(400).json({ success: false, message: 'SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to your .env file and restart the server.' })
    return
  }
  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: false },
    })
    await transporter.verify()
    await transporter.sendMail({
      from: `"Wet3 Camp Admin" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: '✓ Wet3 Camp SMTP Test',
      html: `<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#8B0000">Wet3 Camp SMTP Test ✓</h2><p>Your SMTP configuration is working correctly!</p><p style="color:#999;font-size:12px">Sent: ${new Date().toISOString()}<br>Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587}</p></div>`,
    })
    res.json({ success: true, message: `Test email sent to ${process.env.SMTP_USER}` })
  } catch (err: any) {
    res.status(500).json({ success: false, message: `SMTP error: ${err.message ?? err}` })
  }
})

router.get('/admin/settings', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [rows] = await pool.query<any[]>('SELECT `key`, `value` FROM platform_settings').catch(() => [[] as any[]])
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key] = row.value
    res.json(settings)
  } catch {
    res.json({})
  }
})

router.post('/admin/settings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { key, value } = req.body as { key?: string; value?: string }
    if (!key) { res.status(400).json({ message: 'key is required' }); return }
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    await pool.query(
      'INSERT INTO platform_settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()',
      [key, value ?? '']
    )
    res.json({ success: true, key, value })
  } catch {
    res.status(500).json({ message: 'Failed to save setting' })
  }
})

router.post('/admin/settings/bulk', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = req.body as Record<string, string>
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    for (const [key, value] of Object.entries(settings)) {
      if (key) {
        await pool.query(
          'INSERT INTO platform_settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()',
          [key, value ?? '']
        )
      }
    }
    res.json({ success: true, count: Object.keys(settings).length })
  } catch {
    res.status(500).json({ message: 'Failed to save settings' })
  }
})

router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params!.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to deactivate user' })
  }
})

export default router
