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

async function getSmtpConfig(pool: ReturnType<typeof getPool>): Promise<{ host?: string; port: number; user?: string; pass?: string }> {
  const cfg = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
  if ((!cfg.host || !cfg.user || !cfg.pass) && pool) {
    const [rows] = await pool.query<any[]>(
      "SELECT `key`, `value` FROM platform_settings WHERE `key` IN ('smtp_host','smtp_port','smtp_user','smtp_pass')"
    ).catch(() => [[]] as any)
    for (const r of rows as any[]) {
      if (r.key === 'smtp_host' && r.value) cfg.host = r.value
      if (r.key === 'smtp_port' && r.value) cfg.port = parseInt(r.value)
      if (r.key === 'smtp_user' && r.value) cfg.user = r.value
      if (r.key === 'smtp_pass' && r.value) cfg.pass = r.value
    }
  }
  return cfg
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
      'SELECT id, username, email, role, display_name, phone, is_active, created_at FROM users ORDER BY id DESC LIMIT ?',
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
    const status = (req.query as any).status
    let sql = `SELECT e.*,
      u.email AS user_email,
      COALESCE(u.display_name, u.username) AS user_display_name
      FROM escorts e
      LEFT JOIN users u ON u.id = e.user_id`
    if (status === 'pending') sql += ' WHERE e.is_active = 0 AND e.verified = 0'
    else if (status === 'active') sql += ' WHERE e.is_active = 1'
    sql += ' ORDER BY e.id DESC LIMIT ?'
    const [rows] = await pool.query<any[]>(sql, [limit])
    res.json(rows.map(e => ({ ...e, id: String(e.id) })))
  } catch (err: any) {
    console.error('[admin/escorts]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to fetch escorts' })
  }
})

router.post('/admin/escorts', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const {
      name, city, area, age, tier, bio, whatsapp, telegram, gender, image,
      price_incall, price_outcall,
      price_incall_overnight, price_outcall_overnight,
      price_video,
    } = req.body as Record<string, any>
    if (!name?.trim() || !city) { res.status(400).json({ message: 'Name and city are required' }); return }
    const [result] = await pool.query<any>(
      `INSERT INTO escorts
        (name, city, area, age, tier, bio, whatsapp, telegram, gender, image,
         price_incall, price_outcall,
         price_incall_overnight, price_outcall_overnight,
         price_video,
         is_active, verified, available, online, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,1,0,0,NOW())`,
      [
        name.trim(), city, area ?? '', age ? parseInt(age) : 0, tier ?? 'standard',
        bio ?? null, whatsapp ?? null, telegram ?? null, gender ?? 'Female', image ?? null,
        price_incall ? parseInt(price_incall) : 0,
        price_outcall ? parseInt(price_outcall) : 0,
        price_incall_overnight ? parseInt(price_incall_overnight) : 0,
        price_outcall_overnight ? parseInt(price_outcall_overnight) : 0,
        price_video ? parseInt(price_video) : 0,
      ]
    )
    const insertId = (result as any).insertId
    if (!insertId) { res.status(500).json({ message: 'Insert succeeded but no ID returned' }); return }
    const [[escort]] = await pool.query<any[]>('SELECT * FROM escorts WHERE id = ?', [insertId])
    if (!escort) { res.status(500).json({ message: 'Escort created but could not be fetched', insertId }); return }
    res.status(201).json({ ...escort, id: String(escort.id) })
  } catch (err: any) {
    console.error('[POST /admin/escorts]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to create escort', detail: err?.message ?? '' })
  }
})

router.get('/admin/bookings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const limit = Math.min(parseInt((req.query as any).limit ?? '200', 10), 500)
    const [rows] = await pool.query<any[]>(
      `SELECT b.*, e.name AS escort_name,
        COALESCE(u.display_name, u.username) AS client_name,
        u.email AS client_email
       FROM bookings b
       LEFT JOIN escorts e ON e.id = b.escort_id
       LEFT JOIN users u ON u.id = b.user_id
       ORDER BY b.id DESC LIMIT ?`,
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
       ORDER BY rb.id DESC LIMIT 200`
    )
    res.json(rows.map(b => ({ ...b, id: b.id })))
  } catch {
    res.status(500).json({ message: 'Failed to fetch room bookings' })
  }
})

// ─── Toggle featured status ───────────────────────────────────────────────────
router.patch('/admin/escorts/:id/featured', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [[escort]] = await pool.query<any[]>('SELECT id, featured FROM escorts WHERE id = ?', [req.params!.id])
    if (!escort) { res.status(404).json({ message: 'Escort not found' }); return }
    const newFeatured = escort.featured ? 0 : 1
    await pool.query('UPDATE escorts SET featured = ? WHERE id = ?', [newFeatured, req.params!.id])
    res.json({ success: true, featured: !!newFeatured })
  } catch {
    res.status(500).json({ message: 'Failed to toggle featured status' })
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

router.patch('/admin/escorts/:id/toggle-verified', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [[row]] = await pool.query<any[]>('SELECT verified, name FROM escorts WHERE id = ? LIMIT 1', [req.params!.id])
    if (!row) { res.status(404).json({ message: 'Escort not found' }); return }
    const newVerified = row.verified ? 0 : 1
    await pool.query('UPDATE escorts SET verified = ? WHERE id = ?', [newVerified, req.params!.id])
    res.json({ success: true, verified: !!newVerified })
  } catch {
    res.status(500).json({ message: 'Failed to toggle verified' })
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
  const pool = getPool()
  const cfg = await getSmtpConfig(pool)
  if (!cfg.host || !cfg.user || !cfg.pass) {
    res.status(400).json({ success: false, message: 'SMTP not configured. Save SMTP Host, Username and Password in the API Keys tab first.' })
    return
  }
  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
    })
    await transporter.verify()
    await transporter.sendMail({
      from: `"Wet3 Camp Admin" <${cfg.user}>`,
      to: cfg.user,
      subject: '✓ Wet3 Camp SMTP Test',
      html: `<div style="font-family:sans-serif;max-width:500px"><h2 style="color:#8B0000">Wet3 Camp SMTP Test ✓</h2><p>Your SMTP configuration is working correctly!</p><p style="color:#999;font-size:12px">Sent: ${new Date().toISOString()}<br>Host: ${cfg.host}:${cfg.port}</p></div>`,
    })
    res.json({ success: true, message: `Test email sent to ${cfg.user}` })
  } catch (err: any) {
    res.status(500).json({ success: false, message: `SMTP error: ${err.message ?? err}` })
  }
})

router.post('/admin/test-connections', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  res.setHeader('Content-Type', 'application/json')
  const results: Record<string, { ok: boolean; message: string }> = {}
  const pool = getPool()

  if (pool) {
    try {
      await pool.query('SELECT 1')
      results.database = { ok: true, message: 'Database connected ✓' }
    } catch (e: any) {
      results.database = { ok: false, message: `DB error: ${e?.message ?? e}` }
    }
  } else {
    results.database = { ok: false, message: 'DATABASE_URL not set' }
  }

  const cfg = await getSmtpConfig(pool)
  if (!cfg.host || !cfg.user || !cfg.pass) {
    results.smtp = { ok: false, message: 'SMTP not configured — save credentials first' }
  } else {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.port === 465,
        auth: { user: cfg.user, pass: cfg.pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
      })
      await transporter.verify()
      results.smtp = { ok: true, message: `SMTP connected to ${cfg.host}:${cfg.port} ✓` }
    } catch (e: any) {
      results.smtp = { ok: false, message: `SMTP error: ${e?.message ?? e}` }
    }
  }

  if (pool) {
    const [rows] = await pool.query<any[]>(
      "SELECT value FROM platform_settings WHERE `key` = 'telegram_token'"
    ).catch(() => [[]] as any)
    const token = (rows as any[])?.[0]?.value
    if (token) {
      try {
        const r = await fetch(`https://api.telegram.org/bot${token}/getMe`)
        const d = await r.json() as any
        results.telegram = d.ok
          ? { ok: true, message: `Bot @${d.result.username} connected ✓` }
          : { ok: false, message: `Telegram: ${d.description}` }
      } catch (e: any) {
        results.telegram = { ok: false, message: `Telegram error: ${e?.message ?? e}` }
      }
    } else {
      results.telegram = { ok: false, message: 'Telegram token not configured' }
    }
  }

  res.json({ results })
})

router.get('/admin/settings', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.json({}); return }
    const [rows] = await pool.query<any[]>('SELECT `key`, `value` FROM platform_settings').catch(() => [[] as any[]])
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key] = row.value
    res.json(settings)
  } catch {
    res.json({})
  }
})

async function upsertSetting(pool: any, key: string, value: string) {
  try {
    await pool.query('INSERT INTO platform_settings (`key`, `value`) VALUES (?,?)', [key, value])
  } catch {
    await pool.query('UPDATE platform_settings SET `value` = ?, updated_at = NOW() WHERE `key` = ?', [value, key])
  }
}

router.post('/admin/settings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { key, value } = req.body as { key?: string; value?: string }
    if (!key) { res.status(400).json({ message: 'key is required' }); return }
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    await upsertSetting(pool, key, value ?? '')
    res.json({ success: true, key, value })
  } catch (err: any) {
    console.error('[admin/settings POST]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to save setting — run the migration SQL to create platform_settings table.' })
  }
})

router.post('/admin/settings/bulk', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = req.body as Record<string, string>
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    for (const [key, value] of Object.entries(settings)) {
      if (key) await upsertSetting(pool, key, value ?? '')
    }
    res.json({ success: true, count: Object.keys(settings).length })
  } catch (err: any) {
    console.error('[admin/settings/bulk]', err?.message ?? err)
    res.status(500).json({ message: 'Failed to save settings — run the migration SQL to create platform_settings table.' })
  }
})

router.delete('/admin/cleanup-seed-escorts', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
    const [[{ cnt }]] = await pool.query<any[]>('SELECT COUNT(*) as cnt FROM escorts WHERE user_id IS NULL')
    if (Number(cnt) === 0) { res.json({ success: true, deleted: 0, message: 'No fake escorts found.' }); return }
    const [fakeRows] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id IS NULL')
    const fakeIds = fakeRows.map((r: any) => r.id)
    if (fakeIds.length > 0) {
      const ids = fakeIds.join(',')
      await pool.query(`DELETE FROM escort_gallery   WHERE escort_id IN (${ids})`).catch(() => {})
      await pool.query(`DELETE FROM escort_languages WHERE escort_id IN (${ids})`).catch(() => {})
      await pool.query(`DELETE FROM escort_services  WHERE escort_id IN (${ids})`).catch(() => {})
      await pool.query(`DELETE FROM favorites  WHERE escort_id IN (${ids})`).catch(() => {})
      await pool.query(`DELETE FROM followers  WHERE escort_id IN (${ids})`).catch(() => {})
      await pool.query(`DELETE FROM reviews    WHERE escort_id IN (${ids})`).catch(() => {})
      await pool.query(`DELETE FROM bookings   WHERE escort_id IN (${ids})`).catch(() => {})
      await pool.query('SET FOREIGN_KEY_CHECKS=0').catch(() => {})
      await pool.query('DELETE FROM escorts WHERE user_id IS NULL')
      await pool.query('SET FOREIGN_KEY_CHECKS=1').catch(() => {})
    }
    res.json({ success: true, deleted: Number(cnt) })
  } catch (err: any) {
    console.error('[cleanup-seed-escorts]', err)
    res.status(500).json({ message: 'Failed to delete seed escorts', detail: err?.message ?? '' })
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

router.post('/admin/seed-escorts', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [[{ cnt }]] = await pool.query<any[]>('SELECT COUNT(*) as cnt FROM escorts WHERE user_id IS NULL')
    if (Number(cnt) >= 5) {
      res.json({ success: true, seeded: 0, message: `Already have ${cnt} seed escorts — skipping.` })
      return
    }
    const escorts = [
      [1,'Amara K.',24,'Nairobi','Nairobi CBD',-1.2921,36.8219,'elite',4.9,156,'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled.','5\'6"','Slim/Athletic','Kenyan','Black',8000,50000,3000,'254712345001','amarak_wet3camp',1,1,1],
      [2,'Zara M.',26,'Nairobi','Westlands',-1.2679,36.8082,'vip',4.8,142,'VIP escort in Westlands. Fluent in 3 languages, world-traveller.','5\'7"','Athletic','Kenyan','Natural',6500,40000,2500,'254712345002','zaram_wet3camp',1,1,1],
      [3,'Luna K.',23,'Nairobi','Karen',-1.3176,36.7063,'vip',4.7,128,'Karen-based VIP escort. Known for my intelligence, elegance and impeccable style.','5\'5"','Slim','Kenyan','Dark Brown',5000,35000,2000,'254712345003','lunak_wet3camp',0,1,1],
      [4,'Sophia N.',27,'Nairobi','Kilimani',-1.2903,36.7855,'premium',4.6,115,'Premium Kilimani escort with a warm personality and stunning looks.','5\'4"','Curvy','Kenyan','Black',4000,25000,1500,'254712345004','sophian_wet3camp',1,1,1],
      [5,'Priya S.',25,'Nairobi','Lavington',-1.282,36.7726,'premium',4.8,189,'Half-Kenyan, half-Indian beauty residing in Lavington. Exotic, educated.','5\'5"','Slim/Toned','Mixed','Black',5500,38000,2200,'254712345005','priyas_wet3camp',1,1,1],
      [6,'Fatuma H.',22,'Nairobi','Parklands',-1.2575,36.8205,'elite',4.9,203,'Top-rated elite escort in Parklands. Coastal beauty.','5\'6"','Slim','Swahili','Black',9000,55000,3500,'254712345006','fatumah_wet3camp',1,1,1],
      [7,'Grace W.',28,'Nairobi','Upperhill',-1.3,36.8192,'premium',4.5,97,'Professional escort based in Upperhill, Nairobi\'s business district.','5\'7"','Athletic','Kenyan','Black',4500,28000,1800,'254712345007','gracew_wet3camp',1,1,1],
      [8,'Naomi J.',24,'Nairobi','Gigiri',-1.228,36.8032,'vip',4.7,134,'Upscale escort in Gigiri. Multilingual, sophisticated.','5\'8"','Slim/Tall','Kenyan','Natural',7000,45000,3000,'254712345008','naomij_wet3camp',0,1,1],
      [9,'Aisha O.',21,'Nairobi','South B',-1.3171,36.8396,'standard',4.4,62,'Young, vibrant and fun-loving escort in South B.','5\'4"','Petite/Curvy','Kenyan','Black',2500,15000,1000,'254712345009','aishao_wet3camp',1,1,1],
      [10,'Cynthia M.',29,'Nairobi','Runda',-1.2102,36.8104,'elite',4.9,178,'Nairobi\'s finest escort — Runda based, world-class service.','5\'9"','Slim/Tall','Kenyan','Relaxed/Dark',12000,75000,4500,'254712345010','cyntham_wet3camp',1,1,1],
      [11,'Brenda A.',23,'Nairobi','Langata',-1.338,36.7518,'premium',4.6,88,'Langata beauty with a playful spirit. Always punctual and perfectly presented.','5\'5"','Curvy','Kenyan','Black',3500,22000,1500,'254712345011','brendaa_wet3camp',1,0,1],
      [12,'Diana V.',26,'Nairobi','Eastleigh',-1.2726,36.8478,'standard',4.3,54,'Vibrant Eastleigh escort. Somali heritage with a warm personality.','5\'6"','Slim','Somali-Kenyan','Black',2000,12000,800,'254712345012','dianav_wet3camp',1,1,1],
      [13,'Sharon K.',25,'Nairobi','Embakasi',-1.3211,36.9009,'standard',4.2,47,'Embakasi based escort offering great value and genuine connections.','5\'3"','Average','Kenyan','Black',1800,10000,700,'254712345013','sharonk_wet3camp',0,0,1],
      [14,'Kezia N.',22,'Nairobi','Ngong Road',-1.3028,36.7677,'premium',4.7,103,'Slim and elegant escort along Ngong Road. University-educated.','5\'6"','Slim/Toned','Kenyan','Black',3800,24000,1600,'254712345014','kezian_wet3camp',1,1,1],
      [15,'Mercy T.',27,'Nairobi','Thika Road',-1.2253,36.8944,'vip',4.6,121,'Thika Road VIP escort with a bubbly personality and killer looks.','5\'5"','Curvy','Kenyan','Black',5000,30000,2000,'254712345015','mercyt_wet3camp',1,1,1],
      [16,'Wanjiku G.',30,'Mombasa','Nyali',-4.0165,39.7057,'elite',4.9,231,'The queen of the Kenyan coast — Nyali\'s finest. Bilingual, stunning.','5\'8"','Slim/Curvy','Kenyan','Black',10000,60000,4000,'254712345016','wanjikug_wet3camp',1,1,1],
      [17,'Akinyi B.',23,'Mombasa','Bamburi',-3.9835,39.7287,'premium',4.5,76,'Beach babe from Bamburi, Mombasa. Sun-kissed, carefree.','5\'5"','Athletic','Luo-Kenyan','Natural',4000,25000,1500,'254712345017','akinyib_wet3camp',1,1,1],
      [18,'Amina S.',25,'Mombasa','Mombasa CBD',-4.0435,39.6682,'vip',4.7,145,'Mombasa CBD beauty with coastal charm.','5\'6"','Slim','Swahili','Black',5500,35000,2200,'254712345018','aminas_wet3camp',0,1,1],
      [19,'Stella R.',24,'Mombasa','Diani',-4.2792,39.5915,'vip',4.8,163,'Diani beach escort — your ultimate coastal fantasy.','5\'7"','Toned','Kenyan','Dark Brown',6000,40000,2500,'254712345019','stellar_wet3camp',1,1,1],
      [20,'Janet L.',29,'Mombasa','Mtwapa',-3.9405,39.7345,'premium',4.4,83,'Mtwapa escort offering premium coastal experiences.','5\'4"','Curvy','Kenyan','Black',3500,22000,1400,'254712345020','janetl_wet3camp',1,0,1],
    ]

    let inserted = 0
    for (const e of escorts) {
      await pool.query(
        `INSERT INTO escorts (id,name,age,city,area,lat,lng,tier,rating,reviews_count,bio,height,body_type,ethnicity,hair_color,price_hourly,price_overnight,price_video,whatsapp,telegram,available,verified,is_active,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'2026-05-25 14:14:35','2026-05-25 14:14:35')`,
        e
      ).catch(() => {})
      inserted++
    }
    res.json({ success: true, seeded: inserted })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to seed escorts', detail: err?.message ?? '' })
  }
})


// ─── Moderators ───────────────────────────────────────────────────────────────

router.get('/admin/moderators', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT id, display_name AS name, email, role, is_active, created_at FROM users WHERE role IN ('admin','moderator') ORDER BY role DESC, created_at ASC`
    )
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to load moderators', detail: err?.message })
  }
})

router.post('/admin/moderators', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  const { name, email, role = 'moderator', password } = req.body ?? {}
  if (!name || !email || !password) { res.status(400).json({ message: 'name, email and password are required' }); return }
  try {
    const { hashPassword } = await import('../lib/crypto.js')
    const hash = await hashPassword(password)
    const id = require('crypto').randomUUID()
    await pool.query(
      `INSERT INTO users (id, display_name, username, email, password_hash, role, is_active, email_verified, created_at, updated_at) VALUES (?,?,?,?,?,?,1,1,NOW(),NOW())`,
      [id, name, email.split('@')[0], email, hash, role]
    )
    res.json({ success: true, id })
  } catch (err: any) {
    if (err?.message?.includes('Duplicate') || err?.code === '23505') {
      res.status(409).json({ message: 'A user with this email already exists' }); return
    }
    res.status(500).json({ message: 'Failed to create moderator', detail: err?.message })
  }
})

router.patch('/admin/users/:id/toggle-active', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    await pool.query('UPDATE users SET is_active = 1 - is_active WHERE id = ?', [req.params!.id])
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to toggle user', detail: err?.message })
  }
})

router.get('/admin/health', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  const pool = getPool()
  const status: Record<string, { ok: boolean; detail: string }> = {}

  // Database
  if (pool) {
    try {
      await pool.query('SELECT 1')
      status.database = { ok: true, detail: 'Connected ✓' }

      // Check key tables
      const tables = ['users', 'escorts', 'platform_settings', 'rooms', 'bookings']
      const missing: string[] = []
      for (const t of tables) {
        try {
          await pool.query(`SELECT 1 FROM ${t} LIMIT 1`)
        } catch {
          missing.push(t)
        }
      }
      if (missing.length > 0) {
        status.tables = { ok: false, detail: `Missing tables: ${missing.join(', ')}` }
      } else {
        status.tables = { ok: true, detail: 'All required tables exist ✓' }
      }

      // Row counts
      const [[{ users }]]    = await pool.query<any[]>('SELECT COUNT(*) as users FROM users').catch(() => [[{ users: '?' }]])
      const [[{ escorts }]]  = await pool.query<any[]>('SELECT COUNT(*) as escorts FROM escorts').catch(() => [[{ escorts: '?' }]])
      const [[{ settings }]] = await pool.query<any[]>('SELECT COUNT(*) as settings FROM platform_settings').catch(() => [[{ settings: '?' }]])
      status.counts = { ok: true, detail: `users=${users} escorts=${escorts} settings=${settings}` }
    } catch (e: any) {
      status.database = { ok: false, detail: e?.message ?? String(e) }
    }
  } else {
    status.database = { ok: false, detail: 'DATABASE_URL not set — no pool' }
  }

  // Env vars (safe keys only)
  const envKeys = ['DATABASE_URL', 'DB_HOST', 'DB_USER', 'DB_NAME', 'NODE_ENV', 'PORT', 'JWT_SECRET', 'SMTP_HOST']
  const envStatus: Record<string, string> = {}
  for (const k of envKeys) {
    const v = process.env[k]
    if (!v) { envStatus[k] = 'NOT SET' }
    else if (k === 'DATABASE_URL') { envStatus[k] = v.replace(/:([^@]+)@/, ':***@') }
    else if (k === 'JWT_SECRET') { envStatus[k] = v.slice(0, 6) + '...' }
    else { envStatus[k] = v }
  }
  status.env = { ok: !envStatus['DATABASE_URL']?.includes('NOT SET'), detail: JSON.stringify(envStatus) }

  const allOk = Object.values(status).every(s => s.ok)
  res.status(allOk ? 200 : 207).json({ ok: allOk, status, ts: new Date().toISOString() })
})

export default router
