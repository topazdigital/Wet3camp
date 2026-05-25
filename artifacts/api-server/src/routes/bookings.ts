import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

router.get('/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json([]); return }

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
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const [[escort]] = await pool.query<any[]>('SELECT id, price_hourly, price_overnight, price_video FROM escorts WHERE id = ?', [escortId])
    if (!escort) { res.status(404).json({ message: 'Escort not found' }); return }

    const priceMap: Record<string, number> = { hourly: escort.price_hourly * duration, overnight: escort.price_overnight, video: escort.price_video }
    const amount = priceMap[type] ?? escort.price_hourly

    const [result] = await pool.query<any>(
      'INSERT INTO bookings (user_id, escort_id, booking_date, start_time, duration_hrs, type, amount, notes, location, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [req.userId, escortId, date, time, duration, type, amount, notes ?? null, location ?? null, 'pending']
    )

    res.status(201).json({ id: (result as any).insertId, escortId: String(escortId), date, time, duration, type, amount, status: 'pending' })
  } catch {
    res.status(500).json({ message: 'Failed to create booking' })
  }
})

export default router
