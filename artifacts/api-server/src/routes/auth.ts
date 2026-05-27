import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { hashPassword, verifyPassword } from '../lib/crypto.js'
import { signToken } from '../lib/jwt.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { sendWelcomeEmail, sendEscortWelcomeEmail, sendPasswordResetEmail } from '../lib/mailer.js'

const router = Router()

const otpStore = new Map<string, { code: string; expires: number }>()

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' }); return
    }

    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured. Please contact support.', code: 'NO_DB' }); return
    }

    const [[user]] = await pool.query<any[]>('SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1', [email.toLowerCase().trim()])
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' }); return
    }

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) {
      res.status(401).json({ message: 'Invalid email or password' }); return
    }

    const token = await signToken({ id: user.id, role: user.role, email: user.email })

    let approved = true
    if (user.role === 'escort') {
      const [[escRow]] = await pool.query<any[]>('SELECT is_active FROM escorts WHERE user_id = ? LIMIT 1', [user.id])
      approved = escRow ? !!escRow.is_active : false
    }

    res.json({
      token,
      user: {
        id:       String(user.id),
        name:     user.display_name ?? user.username,
        email:    user.email,
        role:     user.role,
        avatar:   user.avatar ?? null,
        phone:    user.phone ?? null,
        approved,
      },
    })
  } catch {
    res.status(500).json({ message: 'Login failed' })
  }
})

router.post('/auth/register', async (req, res) => {
  try {
    const {
      name, email, password, phone,
      role: rawRole,
      city, area, bio, whatsapp, telegram,
      bodyType, ethnicity, height, hairColor, gender,
      rateHourly, rateOvernight, rateVideo, rateIncall, rateOutcall,
      languages, services,
    } = req.body as Record<string, any>

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email and password are required' }); return
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' }); return
    }

    const dbRole = rawRole === 'escort' ? 'escort' : 'user'

    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured. Please contact support.', code: 'NO_DB' }); return
    }

    const [[existing]] = await pool.query<any[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()])
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists' }); return
    }

    const hash     = await hashPassword(password)
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 999)
    const [result] = await pool.query<any>(
      'INSERT INTO users (username, email, password_hash, display_name, phone, role) VALUES (?,?,?,?,?,?)',
      [username, email.toLowerCase().trim(), hash, name, phone ?? null, dbRole]
    )
    const userId = (result as any).insertId

    let escortId: string | null = null

    if (dbRole === 'escort') {
      // Check require_approval platform setting — default to requiring approval
      let requireApproval = true
      try {
        const [[setting]] = await pool.query<any[]>(
          "SELECT value FROM platform_settings WHERE `key` = 'require_approval' LIMIT 1"
        )
        requireApproval = !setting || setting.value !== '0'
      } catch { /* table may not exist yet, default to requiring approval */ }

      const autoActive = requireApproval ? 0 : 1

      const [escResult] = await pool.query<any>(
        `INSERT INTO escorts
           (user_id, name, age, city, area, bio, tier, whatsapp, telegram,
            height, body_type, ethnicity, hair_color, gender,
            price_hourly, price_overnight, price_video, price_incall, price_outcall,
            available, verified, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
        [
          userId, name,
          parseInt(req.body.age ?? '0') || 0,
          city   ?? null, area    ?? null,
          bio    ?? null, 'standard',
          whatsapp ?? null, telegram ?? null,
          height ?? null,  bodyType ?? null,
          ethnicity ?? null, hairColor ?? null,
          gender ?? 'Female',
          rateHourly    ? parseInt(rateHourly)    : 3000,
          rateOvernight ? parseInt(rateOvernight) : 25000,
          rateVideo     ? parseInt(rateVideo)     : 1500,
          rateIncall    ? parseInt(rateIncall)    : 0,
          rateOutcall   ? parseInt(rateOutcall)   : 0,
          autoActive, autoActive,
        ]
      )
      escortId = String((escResult as any).insertId)

      if (Array.isArray(languages) && languages.length > 0) {
        for (const lang of languages) {
          await pool.query('INSERT IGNORE INTO escort_languages (escort_id, language) VALUES (?,?)', [escortId, lang])
        }
      }

      if (Array.isArray(services) && services.length > 0) {
        for (const svc of services) {
          await pool.query('INSERT IGNORE INTO escort_services (escort_id, name, available) VALUES (?,?,1)', [escortId, svc])
        }
      }
    }

    const token = await signToken({ id: userId, role: dbRole, email })

    if (dbRole === 'escort') {
      sendEscortWelcomeEmail(name, email.toLowerCase().trim()).catch(() => {})
    } else {
      sendWelcomeEmail(name, email.toLowerCase().trim()).catch(() => {})
    }

    // approved = true when not an escort, or when require_approval is off
    let approved = dbRole !== 'escort'
    if (dbRole === 'escort' && escortId) {
      try {
        const [[setting]] = await pool.query<any[]>(
          "SELECT value FROM platform_settings WHERE `key` = 'require_approval' LIMIT 1"
        )
        approved = !setting || setting.value !== '1'
      } catch { approved = false }
    }

    res.status(201).json({
      token,
      user: {
        id: String(userId), name,
        email: email.toLowerCase().trim(),
        role: dbRole, avatar: null, phone: phone ?? null,
        approved,
      },
      escortId,
    })
  } catch (err) {
    console.error('[register]', err)
    res.status(500).json({ message: 'Registration failed' })
  }
})

router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body as { email?: string }
    if (!email) { res.status(400).json({ message: 'Email is required' }); return }

    const pool = getPool()
    if (pool) {
      const { randomBytes } = await import('crypto')
      const token = randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 3600_000)
      const normalEmail = email.toLowerCase().trim()
      await pool.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?,?,?)', [normalEmail, token, expires])
      sendPasswordResetEmail(normalEmail, token).catch(() => {})
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch {
    res.json({ message: 'If that email exists, a reset link has been sent.' })
  }
})

router.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const [[user]] = await pool.query<any[]>(
      'SELECT id, username, email, role, display_name, avatar, phone FROM users WHERE id = ?',
      [req.userId]
    )
    if (!user) { res.status(404).json({ message: 'User not found' }); return }

    let approved = true
    if (user.role === 'escort') {
      const [[escRow]] = await pool.query<any[]>('SELECT is_active FROM escorts WHERE user_id = ? LIMIT 1', [user.id])
      approved = escRow ? !!escRow.is_active : false
    }

    res.json({
      id: String(user.id), name: user.display_name ?? user.username,
      email: user.email, role: user.role, avatar: user.avatar, phone: user.phone,
      approved,
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch user' })
  }
})

router.get('/auth/check', async (req, res) => {
  const { type, value } = req.query as Record<string, string>
  if (!type || !value || !['email', 'username'].includes(type)) {
    res.status(400).json({ message: 'type (email|username) and value are required' }); return
  }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
  try {
    const field = type === 'email' ? 'email' : 'username'
    const [[row]] = await pool.query<any[]>(`SELECT id FROM users WHERE ${field} = ? LIMIT 1`, [value.toLowerCase().trim()])
    res.json({ available: !row, type, value })
  } catch {
    res.status(500).json({ message: 'Check failed' })
  }
})

router.post('/auth/send-otp', async (req, res) => {
  const { email } = req.body as { email?: string }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'Valid email is required' }); return
  }
  const emailKey = email.toLowerCase().trim()
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expires = Date.now() + 10 * 60 * 1000
  otpStore.set(emailKey, { code, expires })
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  if (smtpConfigured) {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transporter.sendMail({
        from: `"Wet3 Camp" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Wet3 Camp verification code',
        html: `<p>Your verification code is: <strong style="font-size:24px;letter-spacing:4px">${code}</strong></p><p>Valid for 10 minutes.</p>`,
      })
    } catch (err) {
      console.error('[send-otp] Email send failed:', err)
    }
  } else {
    console.log(`[OTP] Demo mode — code for ${emailKey}: ${code}`)
  }
  if (!smtpConfigured) {
    res.status(503).json({ message: 'Email service is not configured on this server. Please contact support to enable OTP verification.' }); return
  }
  res.json({ message: 'Verification code sent to your email.' })
})

router.post('/auth/verify-otp', (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string }
  if (!email || !code) {
    res.status(400).json({ message: 'Email and code are required' }); return
  }
  const emailKey = email.toLowerCase().trim()
  const stored = otpStore.get(emailKey)
  if (!stored) {
    res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' }); return
  }
  if (Date.now() > stored.expires) {
    otpStore.delete(emailKey)
    res.status(400).json({ message: 'This code has expired. Please request a new one.' }); return
  }
  if (stored.code !== code.trim()) {
    res.status(400).json({ message: 'Incorrect code. Please try again.' }); return
  }
  otpStore.delete(emailKey)
  res.json({ verified: true, message: 'Email verified successfully.' })
})

router.post('/auth/admin-reset', async (req, res) => {
  try {
    const resetSecret = process.env.ADMIN_RESET_SECRET
    if (!resetSecret) {
      res.status(403).json({ message: 'Admin reset is not enabled on this server. Set ADMIN_RESET_SECRET in the env file.' }); return
    }
    const { secret, email, password, name } = req.body as { secret?: string; email?: string; password?: string; name?: string }
    if (!secret || secret !== resetSecret) {
      res.status(403).json({ message: 'Invalid reset secret.' }); return
    }
    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' }); return
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' }); return
    }
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured' }); return
    }
    const hash = await hashPassword(password)
    const [[existing]] = await pool.query<any[]>('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin'])
    if (existing) {
      await pool.query(
        'UPDATE users SET email = ?, password_hash = ?, display_name = ?, is_active = 1 WHERE id = ?',
        [email.toLowerCase().trim(), hash, name ?? 'Platform Admin', existing.id]
      )
      res.json({ message: `Admin credentials updated. Email: ${email}` })
    } else {
      const username = 'admin_' + Math.floor(Math.random() * 9999)
      await pool.query(
        'INSERT INTO users (username, email, password_hash, display_name, role, is_active) VALUES (?,?,?,?,?,1)',
        [username, email.toLowerCase().trim(), hash, name ?? 'Platform Admin', 'admin']
      )
      res.status(201).json({ message: `Admin created. Email: ${email}` })
    }
  } catch (err) {
    console.error('[admin-reset]', err)
    res.status(500).json({ message: 'Reset failed' })
  }
})

router.post('/auth/setup-admin', async (req, res) => {
  try {
    const { email, password, name } = req.body as { email?: string; password?: string; name?: string }
    if (!email || !password || !name) {
      res.status(400).json({ message: 'email, password and name are required' }); return
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' }); return
    }
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return
    }
    const [[existing]] = await pool.query<any[]>('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin'])
    if (existing) {
      res.status(409).json({ message: 'An admin user already exists. Setup is disabled.' }); return
    }
    const hash = await hashPassword(password)
    const username = 'admin_' + Math.floor(Math.random() * 9999)
    await pool.query(
      'INSERT INTO users (username, email, password_hash, display_name, role, is_active) VALUES (?,?,?,?,?,1)',
      [username, email.toLowerCase().trim(), hash, name, 'admin']
    )
    res.status(201).json({ message: 'Admin user created successfully. You can now log in to the admin panel.' })
  } catch (err) {
    console.error('[setup-admin]', err)
    res.status(500).json({ message: 'Setup failed' })
  }
})

// ─── OAuth role selection (new social sign-up users) ─────────────────────────
// OAuth users who chose "escort" role submit their full profile here
router.post('/auth/setup-escort', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const {
      name, city, area, bio, whatsapp, telegram, phone,
      bodyType, ethnicity, height, hairColor, gender,
      rateHourly, rateOvernight, rateVideo, rateIncall, rateOutcall,
      languages, services,
    } = req.body as Record<string, any>

    if (!city || !bio || !bodyType) {
      res.status(400).json({ message: 'City, bio, and physical details are required' }); return
    }

    // Ensure user role is escort
    await pool.query('UPDATE users SET role = ?, display_name = COALESCE(NULLIF(?,\'\'), display_name), phone = COALESCE(NULLIF(?,\'\'), phone) WHERE id = ?',
      ['escort', name ?? null, phone ?? null, req.userId])

    // Check require_approval setting
    let requireApproval = true
    try {
      const [[setting]] = await pool.query<any[]>(
        "SELECT value FROM platform_settings WHERE `key` = 'require_approval' LIMIT 1"
      )
      requireApproval = !setting || setting.value !== '0'
    } catch { /* default to requiring approval */ }
    const autoActive = requireApproval ? 0 : 1

    // Fetch display name for escort record
    const [[user]] = await pool.query<any[]>('SELECT display_name, username, email FROM users WHERE id = ?', [req.userId])
    const displayName = name || user?.display_name || user?.username || 'Unknown'

    // Check if escort record already exists
    const [[existing]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ? LIMIT 1', [req.userId])
    let escortId: string

    if (existing) {
      escortId = String(existing.id)
      await pool.query(
        `UPDATE escorts SET name=?, city=?, area=?, bio=?, whatsapp=?, telegram=?,
         height=?, body_type=?, ethnicity=?, hair_color=?, gender=?,
         price_hourly=?, price_overnight=?, price_video=?, price_incall=?, price_outcall=?,
         is_active=?, verified=? WHERE id=?`,
        [
          displayName, city ?? null, area ?? null, bio ?? null,
          whatsapp ?? null, telegram ?? null,
          height ?? null, bodyType ?? null, ethnicity ?? null, hairColor ?? null, gender ?? 'Female',
          parseInt(rateHourly) || 3000, parseInt(rateOvernight) || 25000,
          parseInt(rateVideo) || 1500, parseInt(rateIncall) || 0, parseInt(rateOutcall) || 0,
          autoActive, autoActive,
          escortId,
        ]
      )
    } else {
      const [escResult] = await pool.query<any>(
        `INSERT INTO escorts
           (user_id, name, city, area, bio, tier, whatsapp, telegram,
            height, body_type, ethnicity, hair_color, gender,
            price_hourly, price_overnight, price_video, price_incall, price_outcall,
            available, verified, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
        [
          req.userId, displayName,
          city ?? null, area ?? null, bio ?? null, 'standard',
          whatsapp ?? null, telegram ?? null,
          height ?? null, bodyType ?? null, ethnicity ?? null, hairColor ?? null, gender ?? 'Female',
          parseInt(rateHourly) || 3000, parseInt(rateOvernight) || 25000,
          parseInt(rateVideo) || 1500, parseInt(rateIncall) || 0, parseInt(rateOutcall) || 0,
          autoActive, autoActive,
        ]
      )
      escortId = String((escResult as any).insertId)
    }

    // Replace languages
    await pool.query('DELETE FROM escort_languages WHERE escort_id = ?', [escortId])
    if (Array.isArray(languages) && languages.length > 0) {
      for (const lang of languages) {
        await pool.query('INSERT IGNORE INTO escort_languages (escort_id, language) VALUES (?,?)', [escortId, lang])
      }
    }

    // Replace services
    await pool.query('DELETE FROM escort_services WHERE escort_id = ?', [escortId])
    if (Array.isArray(services) && services.length > 0) {
      for (const svc of services) {
        await pool.query('INSERT IGNORE INTO escort_services (escort_id, name, available) VALUES (?,?,1)', [escortId, svc])
      }
    }

    const token = await signToken({ id: req.userId!, role: 'escort', email: user?.email ?? '' })
    res.json({
      token,
      escortId,
      approved: !!autoActive,
      user: { id: String(req.userId), name: displayName, email: user?.email ?? '', role: 'escort', approved: !!autoActive },
    })
  } catch (err) {
    console.error('[setup-escort]', err)
    res.status(500).json({ message: 'Failed to set up escort profile' })
  }
})

router.post('/auth/set-role', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { role } = req.body as { role?: string }
    if (role !== 'client' && role !== 'escort') {
      res.status(400).json({ message: 'Role must be "client" or "escort"' }); return
    }
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

    const dbRole = role === 'escort' ? 'escort' : 'user'
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [dbRole, req.userId])

    const [[user]] = await pool.query<any[]>(
      'SELECT id, email, display_name, username, role FROM users WHERE id = ?', [req.userId]
    )
    const token = await signToken({ id: user.id, role: dbRole, email: user.email })
    res.json({
      token,
      role: dbRole,
      name: user.display_name ?? user.username,
      email: user.email,
    })
  } catch {
    res.status(500).json({ message: 'Failed to set role' })
  }
})

export default router
