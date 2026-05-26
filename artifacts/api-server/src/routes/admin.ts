import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { setEscortOnline } from '../lib/online-store.js'

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
    if (!pool) { res.json({ users: 0, escorts: 0, bookings: 0, reviews: 0 }); return }
    const [[{ users }]] = await pool.query<any[]>('SELECT COUNT(*) as users FROM users')
    const [[{ escorts }]] = await pool.query<any[]>('SELECT COUNT(*) as escorts FROM escorts')
    const [[{ bookings }]] = await pool.query<any[]>('SELECT COUNT(*) as bookings FROM bookings').catch(() => [[{ bookings: 0 }]])
    const [[{ reviews }]] = await pool.query<any[]>('SELECT COUNT(*) as reviews FROM reviews').catch(() => [[{ reviews: 0 }]])
    res.json({ users, escorts, bookings, reviews })
  } catch {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

router.get('/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json([]); return }
    const [rows] = await pool.query<any[]>('SELECT id, username, email, role, display_name, created_at, is_active FROM users ORDER BY created_at DESC LIMIT 100')
    res.json(rows.map(u => ({ ...u, id: String(u.id) })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

router.get('/admin/escorts', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json([]); return }
    const [rows] = await pool.query<any[]>('SELECT * FROM escorts ORDER BY created_at DESC LIMIT 100')
    res.json(rows.map(e => ({ ...e, id: String(e.id) })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch escorts' })
  }
})

router.patch('/admin/escorts/:id/verify', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'No database' }); return }
    await pool.query('UPDATE escorts SET verified = 1, is_active = 1 WHERE id = ?', [req.params!.id])
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
    let affectedIds: number[] = []
    if (pool) {
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
    if (pool) {
      await pool.query('UPDATE escorts SET online = ? WHERE id = ?', [online ? 1 : 0, id])
    }
    setEscortOnline(id, online)
    res.json({ success: true, id, online })
  } catch {
    res.status(500).json({ message: 'Failed to update online status' })
  }
})

router.patch('/admin/escorts/:id/reject', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'No database' }); return }
    await pool.query('UPDATE escorts SET is_active = 0, verified = 0 WHERE id = ?', [req.params!.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to reject escort' })
  }
})

router.post('/admin/test-email', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  if (!smtpConfigured) {
    res.status(400).json({ success: false, message: 'SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to your .env file.' })
    return
  }
  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
    res.status(500).json({ success: false, message: `SMTP error: ${err.message}` })
  }
})

router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'No database' }); return }
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params!.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to deactivate user' })
  }
})

export default router
