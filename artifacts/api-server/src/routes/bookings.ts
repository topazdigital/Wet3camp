import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { sendBookingNotification } from '../lib/mailer.js'

const router = Router()

router.get('/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const [rows] = await pool.query<any[]>(
      `SELECT b.*, e.name AS escort_name, e.image AS escort_image, e.area AS escort_area, e.city AS escort_city
       FROM bookings b
       JOIN escorts e ON e.id = b.escort_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [req.userId]
    )

    res.json(rows.map((r: any) => ({
      id:          r.id,
      escortId:    String(r.escort_id),
      escortName:  r.escort_name,
      escortImage: r.escort_image,
      escortArea:  `${r.escort_area}, ${r.escort_city}`,
      date:        r.booking_date,
      time:        r.start_time,
      duration:    r.duration_hrs,
      type:        r.type,
      amount:      r.amount,
      location:    r.location,
      notes:       r.notes,
      status:      r.status,
      createdAt:   r.created_at,
    })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch bookings' })
  }
})

router.post('/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { escortId, date, time, duration = 1, type = 'hourly', notes, location } = req.body as Record<string, any>
    if (!escortId || !date || !time) { res.status(400).json({ message: 'escortId, date and time are required' }); return }

    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const [[escort]] = await pool.query<any[]>('SELECT id, price_hourly, price_overnight, price_video FROM escorts WHERE id = ?', [escortId])
    if (!escort) { res.status(404).json({ message: 'Escort not found' }); return }

    const priceMap: Record<string, number> = { hourly: escort.price_hourly * duration, overnight: escort.price_overnight, video: escort.price_video }
    const amount = priceMap[type] ?? escort.price_hourly

    const [result] = await pool.query<any>(
      'INSERT INTO bookings (user_id, escort_id, booking_date, start_time, duration_hrs, type, amount, notes, location, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [req.userId, escortId, date, time, duration, type, amount, notes ?? null, location ?? null, 'pending']
    )

    const [[client]] = await pool.query<any[]>('SELECT name, email FROM users WHERE id = ?', [req.userId]).catch(() => [[null]])
    sendBookingNotification({
      escortName:  escort.name,
      escortEmail: escort.email ?? null,
      clientName:  client?.name ?? 'Client',
      clientEmail: client?.email ?? '',
      date,
      time,
      duration,
      type,
      amount,
      location:    location ?? null,
      notes:       notes ?? null,
    }).catch(() => {})

    res.status(201).json({ id: (result as any).insertId, escortId: String(escortId), date, time, duration, type, amount, status: 'pending' })
  } catch {
    res.status(500).json({ message: 'Failed to create booking' })
  }
})

// ─── Escort-side: incoming bookings ──────────────────────────────────────────
router.get('/bookings/incoming', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const [[escort]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ?', [req.userId])
    if (!escort) { res.status(404).json({ message: 'No escort profile found for this account' }); return }

    const [rows] = await pool.query<any[]>(
      `SELECT b.*,
        COALESCE(u.display_name, u.username, u.name) AS client_name,
        u.email AS client_email,
        u.phone AS client_phone
       FROM bookings b
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.escort_id = ?
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [escort.id]
    )

    res.json(rows.map((r: any) => ({
      id:          r.id,
      clientName:  r.client_name || 'Client',
      clientEmail: r.client_email || null,
      clientPhone: r.client_phone || null,
      date:        r.booking_date,
      time:        r.start_time,
      duration:    r.duration_hrs,
      type:        r.type,
      amount:      r.amount,
      location:    r.location,
      notes:       r.notes,
      status:      r.status,
      createdAt:   r.created_at,
    })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch incoming bookings' })
  }
})

// ─── Escort-side: update booking status (accept / decline / complete) ─────────
router.patch('/bookings/:id/status', requireAuth, async (req: AuthRequest, res) => {
  const { status } = req.body as { status: string }
  if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
    res.status(400).json({ message: 'status must be confirmed, cancelled, or completed' }); return
  }

  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const [[escort]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ?', [req.userId])
    if (!escort) { res.status(403).json({ message: 'No escort profile — access denied' }); return }

    const [[booking]] = await pool.query<any[]>(
      'SELECT id FROM bookings WHERE id = ? AND escort_id = ?',
      [req.params!.id, escort.id]
    )
    if (!booking) { res.status(404).json({ message: 'Booking not found or not yours' }); return }

    await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params!.id])
    res.json({ success: true, status })
  } catch {
    res.status(500).json({ message: 'Failed to update booking status' })
  }
})

export default router
