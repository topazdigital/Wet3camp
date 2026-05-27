import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { sendRoomBookingEmail } from '../lib/mailer.js'

const router = Router()

router.get('/rooms', async (req, res) => {
  try {
    const { city, type } = req.query as Record<string, string>
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const conditions: string[] = ['available = 1']
    const params: unknown[] = []
    if (city && city !== 'All') { conditions.push('city = ?'); params.push(city) }
    if (type && type !== 'All') { conditions.push('type = ?'); params.push(type) }

    const where = conditions.join(' AND ')
    const [rows] = await pool.query<any[]>(
      `SELECT * FROM rooms WHERE ${where} ORDER BY rating DESC, created_at DESC`,
      params
    )

    res.json(rows.map((r: any) => ({
      ...r,
      id: r.id,
      amenities: r.amenities ? r.amenities.split(',').map((a: string) => a.trim()) : [],
      available: !!r.available,
    })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch rooms' })
  }
})

router.get('/rooms/all', async (_req, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [rows] = await pool.query<any[]>('SELECT * FROM rooms ORDER BY rating DESC')
    res.json(rows.map((r: any) => ({
      ...r,
      amenities: r.amenities ? r.amenities.split(',').map((a: string) => a.trim()) : [],
      available: !!r.available,
    })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch rooms' })
  }
})

router.post('/rooms/book', async (req, res) => {
  try {
    const { roomId, guestName, guestEmail, guestPhone, checkIn, checkOut, guests = 1, notes } = req.body as Record<string, any>
    if (!roomId || !guestName || !guestEmail || !checkIn || !checkOut) {
      res.status(400).json({ message: 'roomId, guestName, guestEmail, checkIn and checkOut are required' })
      return
    }

    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const [[room]] = await pool.query<any[]>('SELECT * FROM rooms WHERE id = ? AND available = 1', [roomId])
    if (!room) { res.status(404).json({ message: 'Room not found or not available' }); return }

    const checkInDate  = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      res.status(400).json({ message: 'Invalid check-in or check-out dates' }); return
    }
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000))
    const totalAmount = room.price_night * nights

    const [result] = await pool.query<any>(
      `INSERT INTO room_bookings (room_id, guest_name, guest_email, guest_phone, check_in, check_out, nights, guests, total_amount, notes, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [roomId, guestName, guestEmail, guestPhone ?? null, checkIn, checkOut, nights, guests, totalAmount, notes ?? null, 'pending']
    )

    sendRoomBookingEmail({
      roomName: room.name,
      hotel: room.hotel,
      city: room.city,
      guestName,
      guestEmail,
      checkIn,
      checkOut,
      nights,
      guests,
      totalAmount,
      notes: notes ?? null,
    }).catch(() => {})

    res.status(201).json({
      id: (result as any).insertId,
      roomId: String(roomId),
      roomName: room.name,
      hotel: room.hotel,
      guestName,
      guestEmail,
      checkIn,
      checkOut,
      nights,
      totalAmount,
      status: 'pending',
    })
  } catch (err: any) {
    console.error('[rooms/book]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to create room booking' })
  }
})

router.post('/admin/rooms', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const { name, hotel, city, area, type, price_night, price_hourly, rating, reviews_count, amenities, image, available } = req.body
    const amenitiesStr = Array.isArray(amenities) ? amenities.join(', ') : amenities ?? ''
    const [result] = await pool.query<any>(
      'INSERT INTO rooms (name, hotel, city, area, type, price_night, price_hourly, rating, reviews_count, amenities, image, available) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [name, hotel, city, area, type ?? 'Standard', price_night ?? 0, price_hourly ?? 0, rating ?? 0, reviews_count ?? 0, amenitiesStr, image ?? null, available !== false ? 1 : 0]
    )
    res.status(201).json({ id: (result as any).insertId, ...req.body })
  } catch {
    res.status(500).json({ message: 'Failed to create room' })
  }
})

router.patch('/admin/rooms/:id', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const updates: string[] = []
    const params: unknown[] = []
    const fields: Record<string, string> = {
      name: 'name', hotel: 'hotel', city: 'city', area: 'area', type: 'type',
      price_night: 'price_night', price_hourly: 'price_hourly', rating: 'rating',
      image: 'image', available: 'available',
    }
    for (const [key, col] of Object.entries(fields)) {
      if (req.body[key] !== undefined) {
        updates.push(`${col} = ?`)
        params.push(key === 'available' ? (req.body[key] ? 1 : 0) : req.body[key])
      }
    }
    if (req.body.amenities !== undefined) {
      updates.push('amenities = ?')
      params.push(Array.isArray(req.body.amenities) ? req.body.amenities.join(', ') : req.body.amenities)
    }
    if (!updates.length) { res.status(400).json({ message: 'No fields to update' }); return }
    params.push(req.params!.id)
    await pool.query(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`, params)
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Failed to update room' })
  }
})

// ─── My room bookings (by authenticated user's email) ────────────────────────
router.get('/bookings/my-rooms', async (req, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const auth = req.headers.authorization?.replace('Bearer ', '')
    if (!auth) { res.status(401).json({ message: 'Unauthorized' }); return }

    const { jwtVerify } = await import('jose')
    const { signKey } = await import('../lib/jwt.js')
    let userId: number
    try {
      const { payload } = await jwtVerify(auth, signKey)
      userId = (payload as any).id
    } catch {
      res.status(401).json({ message: 'Invalid token' }); return
    }

    const [[user]] = await pool.query<any[]>('SELECT email FROM users WHERE id = ?', [userId])
    if (!user) { res.status(404).json({ message: 'User not found' }); return }

    const [rows] = await pool.query<any[]>(
      `SELECT rb.*, r.name AS room_name, r.hotel, r.city, r.image
       FROM room_bookings rb
       LEFT JOIN rooms r ON r.id = rb.room_id
       WHERE rb.guest_email = ?
       ORDER BY rb.created_at DESC`,
      [user.email]
    )
    res.json(rows)
  } catch (err: any) {
    console.error('[bookings/my-rooms]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to fetch room bookings' })
  }
})

export default router
