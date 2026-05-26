import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

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

export default router
