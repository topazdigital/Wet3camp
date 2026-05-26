import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { setEscortOnline } from '../lib/online-store.js'

const router = Router()

router.get('/profile/escort', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
    const [[escort]] = await pool.query<any[]>(
      'SELECT e.*, GROUP_CONCAT(DISTINCT el.language ORDER BY el.language) AS languages_csv, GROUP_CONCAT(DISTINCT es.name ORDER BY es.name) AS services_csv FROM escorts e LEFT JOIN escort_languages el ON el.escort_id = e.id LEFT JOIN escort_services es ON es.escort_id = e.id WHERE e.user_id = ? GROUP BY e.id',
      [req.userId]
    )
    if (!escort) { res.status(404).json({ message: 'Escort profile not found' }); return }
    res.json({
      ...escort,
      id: String(escort.id),
      available: !!escort.available,
      verified: !!escort.verified,
      is_active: !!escort.is_active,
      languages: escort.languages_csv ? escort.languages_csv.split(',') : [],
      services: escort.services_csv ? escort.services_csv.split(',').map((n: string) => ({ name: n, available: true })) : [],
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch escort profile' })
  }
})

router.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
    const [[user]] = await pool.query<any[]>(
      'SELECT id, username, email, role, display_name, avatar, phone FROM users WHERE id = ?',
      [req.userId]
    )
    if (!user) { res.status(404).json({ message: 'User not found' }); return }
    res.json({ id: String(user.id), name: user.display_name ?? user.username, email: user.email, role: user.role, avatar: user.avatar, phone: user.phone })
  } catch {
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

router.patch('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const { name, phone, avatar } = req.body as Record<string, any>
    const updates: string[] = []
    const params: unknown[] = []

    if (name)   { updates.push('display_name = ?'); params.push(name) }
    if (phone)  { updates.push('phone = ?');        params.push(phone) }
    if (avatar) { updates.push('avatar = ?');       params.push(avatar) }

    if (updates.length) {
      params.push(req.userId)
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
    }

    const [[user]] = await pool.query<any[]>(
      'SELECT id, username, email, role, display_name, avatar, phone FROM users WHERE id = ?',
      [req.userId]
    )

    res.json({ id: String(user.id), name: user.display_name ?? user.username, email: user.email, role: user.role, avatar: user.avatar, phone: user.phone })
  } catch {
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

router.patch('/profile/escort', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const {
      bio, city, area, whatsapp, telegram,
      height, bodyType, ethnicity, hairColor,
      rateHourly, rateOvernight, rateVideo,
      available, languages, services,
    } = req.body as Record<string, any>

    const [[escort]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ?', [req.userId])
    if (!escort) { res.status(404).json({ message: 'Escort profile not found' }); return }

    const escortId = escort.id
    const updates: string[] = []
    const params: unknown[] = []

    if (bio !== undefined)          { updates.push('bio = ?');            params.push(bio) }
    if (city)                        { updates.push('city = ?');           params.push(city) }
    if (area)                        { updates.push('area = ?');           params.push(area) }
    if (whatsapp)                    { updates.push('whatsapp = ?');       params.push(whatsapp) }
    if (telegram)                    { updates.push('telegram = ?');       params.push(telegram) }
    if (height)                      { updates.push('height = ?');         params.push(height) }
    if (bodyType)                    { updates.push('body_type = ?');      params.push(bodyType) }
    if (ethnicity)                   { updates.push('ethnicity = ?');      params.push(ethnicity) }
    if (hairColor)                   { updates.push('hair_color = ?');     params.push(hairColor) }
    if (rateHourly !== undefined)    { updates.push('price_hourly = ?');   params.push(parseInt(rateHourly)) }
    if (rateOvernight !== undefined) { updates.push('price_overnight = ?');params.push(parseInt(rateOvernight)) }
    if (rateVideo !== undefined)     { updates.push('price_video = ?');    params.push(parseInt(rateVideo)) }
    if (available !== undefined)     { updates.push('available = ?');      params.push(available ? 1 : 0) }

    if (updates.length) {
      params.push(escortId)
      await pool.query(`UPDATE escorts SET ${updates.join(', ')} WHERE id = ?`, params)
    }

    if (Array.isArray(languages)) {
      await pool.query('DELETE FROM escort_languages WHERE escort_id = ?', [escortId])
      for (const lang of languages) {
        await pool.query('INSERT IGNORE INTO escort_languages (escort_id, language) VALUES (?,?)', [escortId, lang])
      }
    }

    if (Array.isArray(services)) {
      await pool.query('DELETE FROM escort_services WHERE escort_id = ?', [escortId])
      for (const svc of services) {
        await pool.query('INSERT INTO escort_services (escort_id, name, available) VALUES (?,?,1)', [escortId, svc])
      }
    }

    if (available !== undefined) setEscortOnline(escortId, !!available)

    const [[row]] = await pool.query<any[]>('SELECT * FROM escorts WHERE id = ?', [escortId])
    res.json({ ...row, id: String(row.id), available: !!row.available })
  } catch {
    res.status(500).json({ message: 'Failed to update escort profile' })
  }
})

export default router
