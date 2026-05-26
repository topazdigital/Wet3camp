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
