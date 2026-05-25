import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { hashPassword, verifyPassword } from '../lib/crypto.js'
import { signToken } from '../lib/jwt.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' }); return
    }

    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return
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

    res.json({
      token,
      user: {
        id:          String(user.id),
        name:        user.display_name ?? user.username,
        email:       user.email,
        role:        user.role,
        avatar:      user.avatar ?? null,
        phone:       user.phone ?? null,
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
      bodyType, ethnicity, height, hairColor,
      rateHourly, rateOvernight, rateVideo,
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
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return
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
      const [escResult] = await pool.query<any>(
        `INSERT INTO escorts
           (user_id, name, city, area, bio, tier, whatsapp, telegram,
            height, body_type, ethnicity, hair_color,
            price_hourly, price_overnight, price_video,
            available, verified, is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,0)`,
        [
          userId, name,
          city   ?? null, area    ?? null,
          bio    ?? null, 'standard',
          whatsapp ?? null, telegram ?? null,
          height ?? null,  bodyType ?? null,
          ethnicity ?? null, hairColor ?? null,
          rateHourly   ? parseInt(rateHourly)   : 3000,
          rateOvernight ? parseInt(rateOvernight) : 25000,
          rateVideo    ? parseInt(rateVideo)    : 1500,
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

    res.status(201).json({
      token,
      user: {
        id: String(userId), name,
        email: email.toLowerCase().trim(),
        role: dbRole, avatar: null, phone: phone ?? null,
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
      await pool.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?,?,?)', [email.toLowerCase().trim(), token, expires])
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch {
    res.json({ message: 'If that email exists, a reset link has been sent.' })
  }
})

router.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
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
    res.status(500).json({ message: 'Failed to fetch user' })
  }
})

export default router
