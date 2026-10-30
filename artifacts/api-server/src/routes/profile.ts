import { Router } from 'express'
import { createHash } from 'crypto'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { setEscortOnline } from '../lib/online-store.js'

function hashPassword(p: string) { return createHash('sha256').update(p).digest('hex') }

const router = Router()
const analyticsEventTypes = new Set([
  'profile_view',
  'whatsapp_click',
  'telegram_click',
  'call_click',
  'sms_click',
  'share_click',
  'platform_message_click',
])
const analyticsSources = new Set(['site', 'search', 'google', 'social', 'direct', 'other'])
const analyticsCities = new Set([
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Nyeri',
  'Machakos',
  'Kitale',
])
const analyticsMetrics = [
  'views',
  'whatsappClicks',
  'telegramClicks',
  'callClicks',
  'smsClicks',
  'shareClicks',
  'platformMessageClicks',
  'bookingRequests',
] as const

function analyticsDateKey(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value ?? '').slice(0, 10)
}

function analyticsDayStart(days: number): { dateKey: string; sqlValue: string } {
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  const dateKey = start.toISOString().slice(0, 10)
  return { dateKey, sqlValue: `${dateKey} 00:00:00` }
}

router.get('/profile/escort', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
    const [[escort]] = await pool.query<any[]>(
      'SELECT e.*, GROUP_CONCAT(DISTINCT el.language ORDER BY el.language) AS languages_csv, GROUP_CONCAT(DISTINCT es.name ORDER BY es.name) AS services_csv FROM escorts e LEFT JOIN escort_languages el ON el.escort_id = e.id LEFT JOIN escort_services es ON es.escort_id = e.id WHERE e.user_id = ? GROUP BY e.id',
      [req.userId]
    )
    if (!escort) { res.status(404).json({ message: 'Escort profile not found' }); return }
    const [galleryRows] = await pool.query<any[]>(
      'SELECT image_url FROM escort_gallery WHERE escort_id = ? ORDER BY sort_order ASC, id ASC',
      [escort.id]
    ).catch(() => [[]])
    const gallery = Array.isArray(galleryRows) ? galleryRows.map((g: any) => g.image_url) : []
    res.json({
      ...escort,
      id: String(escort.id),
      available: !!escort.available,
      verified: !!escort.verified,
      is_active: !!escort.is_active,
      languages: escort.languages_csv ? escort.languages_csv.split(',') : [],
      services: escort.services_csv ? escort.services_csv.split(',').map((n: string) => ({ name: n, available: true })) : [],
      gallery,
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
      rateIncall, rateOutcall,
      rateIncallOvernight, rateOutcallOvernight,
      rateVideo,
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
    if (rateIncall !== undefined)          { updates.push('price_incall = ?');          params.push(parseInt(rateIncall)) }
    if (rateOutcall !== undefined)         { updates.push('price_outcall = ?');         params.push(parseInt(rateOutcall)) }
    if (rateIncallOvernight !== undefined) { updates.push('price_incall_overnight = ?'); params.push(parseInt(rateIncallOvernight)) }
    if (rateOutcallOvernight !== undefined){ updates.push('price_outcall_overnight = ?');params.push(parseInt(rateOutcallOvernight)) }
    if (rateVideo !== undefined)           { updates.push('price_video = ?');           params.push(parseInt(rateVideo)) }
    if (available !== undefined)     { updates.push('available = ?');       params.push(available ? 1 : 0) }

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

router.patch('/profile/password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const { currentPassword, newPassword } = req.body as Record<string, string>
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ message: 'New password must be at least 8 characters.' }); return
    }

    const [[user]] = await pool.query<any[]>('SELECT id, password FROM users WHERE id = ?', [req.userId])
    if (!user) { res.status(404).json({ message: 'User not found' }); return }

    // If the user has an existing password, verify it first
    if (user.password) {
      if (!currentPassword) {
        res.status(400).json({ message: 'Current password is required.' }); return
      }
      const hashed = hashPassword(currentPassword)
      if (hashed !== user.password) {
        res.status(400).json({ message: 'Current password is incorrect.' }); return
      }
    }

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashPassword(newPassword), req.userId])
    res.json({ message: 'Password updated successfully.' })
  } catch {
    res.status(500).json({ message: 'Failed to update password' })
  }
})

// ─── Earnings: real data from bookings ────────────────────────────────────────
router.get('/profile/escort/earnings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
    const [[escort]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ?', [req.userId])
    if (!escort) { res.status(404).json({ message: 'Escort profile not found' }); return }
    const escortId = escort.id

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [allRows] = await pool.query<any[]>(
      `SELECT amount, booking_date, status FROM bookings WHERE escort_id = ? AND status IN ('confirmed','completed')`,
      [escortId]
    )

    const thisMonth = allRows.filter((r: any) => new Date(r.booking_date) >= firstOfMonth)
    const lastMonth = allRows.filter((r: any) => {
      const d = new Date(r.booking_date)
      return d >= firstOfLastMonth && d <= endOfLastMonth
    })

    // weekly breakdown (last 7 days by day-of-week)
    const weekly: number[] = [0, 0, 0, 0, 0, 0, 0]
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6)
    allRows.forEach((r: any) => {
      const d = new Date(r.booking_date)
      if (d >= sevenDaysAgo) {
        const dow = d.getDay() // 0=Sun
        weekly[dow] = (weekly[dow] || 0) + Number(r.amount)
      }
    })
    // reorder to Mon-Sun
    const weeklyMon = [weekly[1], weekly[2], weekly[3], weekly[4], weekly[5], weekly[6], weekly[0]]

    res.json({
      thisMonth:    { amount: thisMonth.reduce((s: number, r: any) => s + Number(r.amount), 0), contacts: thisMonth.length },
      lastMonth:    { amount: lastMonth.reduce((s: number, r: any) => s + Number(r.amount), 0), contacts: lastMonth.length },
      total:        { amount: allRows.reduce((s: number, r: any) => s + Number(r.amount), 0), contacts: allRows.length },
      weeklyChart:  weeklyMon,
      weeklyTotal:  weeklyMon.reduce((s, v) => s + v, 0),
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch earnings' })
  }
})

// ─── Followers: real data ──────────────────────────────────────────────────────
router.get('/profile/escort/followers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
    const [[escort]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ?', [req.userId])
    if (!escort) { res.status(404).json({ message: 'Escort profile not found' }); return }
    const escortId = escort.id

    const [[{ total }]] = await pool.query<any[]>(
      'SELECT COUNT(*) AS total FROM followers WHERE escort_id = ?', [escortId]
    )

    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const [[{ thisWeek }]] = await pool.query<any[]>(
      'SELECT COUNT(*) AS thisWeek FROM followers WHERE escort_id = ? AND created_at >= ?',
      [escortId, sevenDaysAgo]
    ).catch(() => [[{ thisWeek: 0 }]])

    const [recent] = await pool.query<any[]>(
      `SELECT u.display_name AS name, u.username, u.avatar, f.created_at
       FROM followers f
       JOIN users u ON u.id = f.user_id
       WHERE f.escort_id = ?
       ORDER BY f.created_at DESC LIMIT 10`,
      [escortId]
    )

    res.json({
      total:    total ?? 0,
      thisWeek: thisWeek ?? 0,
      recent:   recent.map((r: any) => ({
        name:      r.name || r.username || 'User',
        avatar:    r.avatar || null,
        followedAt: r.created_at,
      })),
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch followers' })
  }
})

// Public, anonymous event ingestion. Only claimed profiles are tracked.
router.post('/profile/escort/analytics/events', async (req, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const body = req.body as Record<string, unknown>
    const escortId = Number(body.escortId)
    const eventType = String(body.eventType ?? '')
    const sessionKey = String(body.sessionKey ?? '')
    if (!Number.isInteger(escortId) || escortId < 1
      || !analyticsEventTypes.has(eventType)
      || sessionKey.length < 16 || sessionKey.length > 128) {
      res.status(400).json({ message: 'Invalid analytics event' }); return
    }

    const userAgent = String(req.headers['user-agent'] ?? '')
    if (/\b(bot|crawler|spider|slurp|preview|headless)\b/i.test(userAgent)) {
      res.status(204).end(); return
    }

    const [[escort]] = await pool.query<any[]>(
      'SELECT id FROM escorts WHERE id = ? AND is_active = 1 AND user_id IS NOT NULL',
      [escortId]
    )
    if (!escort) { res.status(204).end(); return }

    const visitorHash = createHash('sha256').update(sessionKey).digest('hex')
    const sourceCandidate = String(body.source ?? 'direct')
    const source = analyticsSources.has(sourceCandidate) ? sourceCandidate : 'other'
    const cityCandidate = String(body.cityContext ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim()
    const cityContext = analyticsCities.has(cityCandidate) ? cityCandidate : null

    if (eventType === 'profile_view') {
      const dedupeSince = new Date(Date.now() - 30 * 60 * 1000)
      const [[priorView]] = await pool.query<any[]>(
        `SELECT id FROM escort_profile_events
         WHERE escort_id = ? AND event_type = ? AND visitor_hash = ? AND created_at >= ?
         LIMIT 1`,
        [escortId, eventType, visitorHash, dedupeSince]
      )
      if (priorView) { res.status(204).end(); return }
    }

    await pool.query(
      `INSERT INTO escort_profile_events
       (escort_id, event_type, visitor_hash, source, city_context, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [escortId, eventType, visitorHash, source, cityContext, new Date()]
    )
    res.status(204).end()
  } catch {
    res.status(500).json({ message: 'Failed to record profile analytics' })
  }
})

// Owner-only performance summary. The escort ID is always resolved from auth.
router.get('/profile/escort/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
    if (req.userRole !== 'escort') { res.status(403).json({ message: 'Escort account required' }); return }

    const rangeParam = String(req.query.range ?? '30d')
    const range = rangeParam === '7d' || rangeParam === '90d' ? rangeParam : '30d'
    const days = Number.parseInt(range, 10)
    const { dateKey: startDate, sqlValue: since } = analyticsDayStart(days)

    const [[escort]] = await pool.query<any[]>(
      'SELECT id FROM escorts WHERE user_id = ?',
      [req.userId]
    )
    if (!escort) { res.status(404).json({ message: 'Escort profile not found' }); return }
    const escortId = escort.id

    const [eventTotals] = await pool.query<any[]>(
      `SELECT event_type, COUNT(*) AS total
       FROM escort_profile_events
       WHERE escort_id = ? AND created_at >= ?
       GROUP BY event_type`,
      [escortId, since]
    )
    const [dailyEvents] = await pool.query<any[]>(
      `SELECT DATE(created_at) AS event_day, event_type, COUNT(*) AS total
       FROM escort_profile_events
       WHERE escort_id = ? AND created_at >= ?
       GROUP BY DATE(created_at), event_type
       ORDER BY event_day ASC`,
      [escortId, since]
    )
    const [bookingRows] = await pool.query<any[]>(
      `SELECT DATE(created_at) AS event_day, COUNT(*) AS total
       FROM bookings
       WHERE escort_id = ? AND created_at >= ?
       GROUP BY DATE(created_at)
       ORDER BY event_day ASC`,
      [escortId, since]
    )
    const [sourceRows] = await pool.query<any[]>(
      `SELECT source AS name, COUNT(*) AS views
       FROM escort_profile_events
       WHERE escort_id = ? AND event_type = 'profile_view' AND created_at >= ?
       GROUP BY source
       ORDER BY views DESC
       LIMIT 6`,
      [escortId, since]
    )
    const [cityRows] = await pool.query<any[]>(
      `SELECT city_context AS name, COUNT(*) AS views
       FROM escort_profile_events
       WHERE escort_id = ? AND event_type = 'profile_view'
         AND city_context IS NOT NULL AND created_at >= ?
       GROUP BY city_context
       ORDER BY views DESC
       LIMIT 6`,
      [escortId, since]
    )

    const eventToMetric: Record<string, typeof analyticsMetrics[number]> = {
      profile_view: 'views',
      whatsapp_click: 'whatsappClicks',
      telegram_click: 'telegramClicks',
      call_click: 'callClicks',
      sms_click: 'smsClicks',
      share_click: 'shareClicks',
      platform_message_click: 'platformMessageClicks',
    }
    const totals = Object.fromEntries(analyticsMetrics.map(metric => [metric, 0])) as Record<typeof analyticsMetrics[number], number>
    for (const row of eventTotals as any[]) {
      const metric = eventToMetric[String(row.event_type)]
      if (metric) totals[metric] = Number(row.total) || 0
    }

    const dailyByDate = new Map<string, Record<typeof analyticsMetrics[number], number>>()
    for (let offset = 0; offset < days; offset++) {
      const date = new Date(`${startDate}T00:00:00.000Z`)
      date.setUTCDate(date.getUTCDate() + offset)
      const key = date.toISOString().slice(0, 10)
      dailyByDate.set(key, Object.fromEntries(analyticsMetrics.map(metric => [metric, 0])) as Record<typeof analyticsMetrics[number], number>)
    }
    for (const row of dailyEvents as any[]) {
      const metric = eventToMetric[String(row.event_type)]
      const day = dailyByDate.get(analyticsDateKey(row.event_day))
      if (metric && day) day[metric] = Number(row.total) || 0
    }
    for (const row of bookingRows as any[]) {
      const day = dailyByDate.get(analyticsDateKey(row.event_day))
      if (day) day.bookingRequests = Number(row.total) || 0
      totals.bookingRequests += Number(row.total) || 0
    }

    res.json({
      range,
      totals,
      daily: [...dailyByDate.entries()].map(([date, metrics]) => ({ date, ...metrics })),
      sources: (sourceRows as any[]).map(row => ({ name: String(row.name || 'direct'), views: Number(row.views) || 0 })),
      cities: (cityRows as any[]).map(row => ({ name: String(row.name), views: Number(row.views) || 0 })),
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch profile analytics' })
  }
})

export default router
