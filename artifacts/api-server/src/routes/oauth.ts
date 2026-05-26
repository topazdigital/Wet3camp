import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { signToken } from '../lib/jwt.js'
import { SignJWT, importPKCS8, decodeJwt } from 'jose'

const router = Router()

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getSettings(pool: any, keys: string[]): Promise<Record<string, string>> {
  if (!pool) return {}
  const [rows] = await pool.query<any[]>(
    `SELECT \`key\`, \`value\` FROM platform_settings WHERE \`key\` IN (${keys.map(() => '?').join(',')})`,
    keys
  ).catch(() => [[]])
  const m: Record<string, string> = {}
  for (const r of rows as any[]) m[r.key] = r.value
  return m
}

function getOrigin(req: any): string {
  const base = process.env.APP_URL || process.env.SITE_URL
  if (base) return base.replace(/\/$/, '')
  const fwdProto = req.headers['x-forwarded-proto'] as string | undefined
  const fwdHost  = (req.headers['x-forwarded-host'] as string | undefined)
               || (req.headers['x-forwarded-server'] as string | undefined)
  if (fwdProto && fwdHost) return `${fwdProto}://${fwdHost}`
  const host = req.headers.host as string || 'localhost'
  const isLocal = host.startsWith('localhost') || host.startsWith('127.') || host.includes(':')
  return `${isLocal ? (req.protocol || 'http') : 'https'}://${host}`
}

async function findOrCreateUser(
  pool: any,
  email: string,
  name: string,
  picture: string | null,
): Promise<{ userId: number; userRole: string; displayName: string }> {
  const [[existing]] = await pool.query<any[]>(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email.toLowerCase()]
  )
  if (existing) {
    if (picture && !existing.avatar) {
      await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [picture, existing.id]).catch(() => {})
    }
    return {
      userId:      existing.id,
      userRole:    existing.role,
      displayName: existing.display_name ?? existing.username ?? name,
    }
  }
  const base     = email.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const username = `${base}_${Math.random().toString(36).slice(2, 6)}`
  const [ins]    = await pool.query<any>(
    'INSERT INTO users (username, email, display_name, avatar, role, is_active, created_at) VALUES (?,?,?,?,?,1,NOW())',
    [username, email.toLowerCase(), name ?? username, picture ?? null, 'user']
  )
  return {
    userId:      ins.insertId ?? ins[0]?.id,
    userRole:    'user',
    displayName: name ?? username,
  }
}

function redirectWithToken(res: any, origin: string, token: string, displayName: string, email: string, role: string) {
  const qs = new URLSearchParams({ token, name: displayName, email, role })
  res.redirect(`${origin}/auth/callback?${qs}`)
}

// ─── Public config (client IDs only — no secrets) ────────────────────────────

router.get('/auth/oauth-config', async (_req, res) => {
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['google_client_id', 'facebook_app_id'])
    res.json({
      googleClientId:  cfg.google_client_id  || null,
      facebookAppId:   cfg.facebook_app_id   || null,
    })
  } catch {
    res.json({ googleClientId: null, facebookAppId: null })
  }
})

// ─── Google redirect flow ─────────────────────────────────────────────────────

router.get('/auth/google', async (req, res) => {
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['google_client_id'])
    if (!cfg.google_client_id) { res.redirect('/login?oauthError=Google+login+is+not+configured+yet.'); return }
    const params = new URLSearchParams({
      client_id:     cfg.google_client_id,
      redirect_uri:  `${getOrigin(req)}/api/auth/google/callback`,
      response_type: 'code',
      scope:         'openid email profile',
      access_type:   'offline',
      prompt:        'select_account',
    })
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  } catch (err: any) {
    console.error('[oauth/google]', err?.message ?? err)
    res.redirect('/login?oauthError=OAuth+error.+Please+try+again.')
  }
})

router.get('/auth/google/callback', async (req, res) => {
  const origin = getOrigin(req)
  try {
    const { code, error: oauthErr } = req.query as Record<string, string>
    if (oauthErr || !code) {
      res.redirect(`${origin}/login?oauthError=${encodeURIComponent(oauthErr === 'access_denied' ? 'Sign-in was cancelled.' : 'Google sign-in failed.')}`)
      return
    }
    const pool = getPool()
    if (!pool) { res.redirect(`${origin}/login?oauthError=Database+unavailable.`); return }
    const cfg = await getSettings(pool, ['google_client_id', 'google_client_secret'])
    if (!cfg.google_client_id || !cfg.google_client_secret) {
      res.redirect(`${origin}/login?oauthError=Google+login+is+not+configured+yet.`); return
    }
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     cfg.google_client_id,
        client_secret: cfg.google_client_secret,
        redirect_uri:  `${origin}/api/auth/google/callback`,
        grant_type:    'authorization_code',
      }),
    })
    if (!tokenRes.ok) {
      console.error('[oauth/google] token exchange:', await tokenRes.text())
      res.redirect(`${origin}/login?oauthError=Google+sign-in+failed.`); return
    }
    const { access_token } = await tokenRes.json() as any
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!profileRes.ok) { res.redirect(`${origin}/login?oauthError=Could+not+fetch+profile.`); return }
    const { email, name, picture } = await profileRes.json() as any
    if (!email) { res.redirect(`${origin}/login?oauthError=No+email+on+Google+account.`); return }
    const { userId, userRole, displayName } = await findOrCreateUser(pool, email, name, picture)
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(res, origin, token, displayName, email.toLowerCase(), userRole)
  } catch (err: any) {
    console.error('[oauth/google/callback]', err?.message ?? err)
    res.redirect(`${origin}/login?oauthError=Unexpected+error.+Please+try+again.`)
  }
})

// ─── Google One Tap (ID token verification) ──────────────────────────────────

router.post('/auth/google/one-tap', async (req, res) => {
  try {
    const { credential } = req.body as { credential?: string }
    if (!credential) { res.status(400).json({ message: 'credential is required' }); return }
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database unavailable' }); return }
    const cfg = await getSettings(pool, ['google_client_id'])
    if (!cfg.google_client_id) { res.status(400).json({ message: 'Google login not configured' }); return }
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
    if (!tokenInfoRes.ok) { res.status(401).json({ message: 'Invalid Google credential' }); return }
    const info = await tokenInfoRes.json() as any
    if (info.aud !== cfg.google_client_id) { res.status(401).json({ message: 'Token audience mismatch' }); return }
    const { email, name, picture } = info
    if (!email) { res.status(400).json({ message: 'No email on Google account' }); return }
    const { userId, userRole, displayName } = await findOrCreateUser(pool, email, name ?? email.split('@')[0], picture ?? null)
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    res.json({ token, user: { id: String(userId), name: displayName, email: email.toLowerCase(), role: userRole } })
  } catch (err: any) {
    console.error('[oauth/google/one-tap]', err?.message ?? err)
    res.status(500).json({ message: 'Sign-in failed' })
  }
})

// ─── Facebook OAuth ───────────────────────────────────────────────────────────

router.get('/auth/facebook', async (req, res) => {
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['facebook_app_id'])
    if (!cfg.facebook_app_id) { res.redirect('/login?oauthError=Facebook+login+is+not+configured+yet.'); return }
    const params = new URLSearchParams({
      client_id:     cfg.facebook_app_id,
      redirect_uri:  `${getOrigin(req)}/api/auth/facebook/callback`,
      response_type: 'code',
      scope:         'email,public_profile',
    })
    res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`)
  } catch (err: any) {
    console.error('[oauth/facebook]', err?.message ?? err)
    res.redirect('/login?oauthError=OAuth+error.+Please+try+again.')
  }
})

router.get('/auth/facebook/callback', async (req, res) => {
  const origin = getOrigin(req)
  try {
    const { code, error: oauthErr } = req.query as Record<string, string>
    if (oauthErr || !code) {
      res.redirect(`${origin}/login?oauthError=${encodeURIComponent('Facebook sign-in was cancelled.')}`)
      return
    }
    const pool = getPool()
    if (!pool) { res.redirect(`${origin}/login?oauthError=Database+unavailable.`); return }
    const cfg = await getSettings(pool, ['facebook_app_id', 'facebook_app_secret'])
    if (!cfg.facebook_app_id || !cfg.facebook_app_secret) {
      res.redirect(`${origin}/login?oauthError=Facebook+login+is+not+configured+yet.`); return
    }
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` + new URLSearchParams({
        client_id:     cfg.facebook_app_id,
        client_secret: cfg.facebook_app_secret,
        redirect_uri:  `${origin}/api/auth/facebook/callback`,
        code,
      })
    )
    if (!tokenRes.ok) {
      console.error('[oauth/facebook] token exchange:', await tokenRes.text())
      res.redirect(`${origin}/login?oauthError=Facebook+sign-in+failed.`); return
    }
    const { access_token } = await tokenRes.json() as any
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${access_token}`
    )
    if (!profileRes.ok) { res.redirect(`${origin}/login?oauthError=Could+not+fetch+profile.`); return }
    const fb = await profileRes.json() as any
    const email = fb.email
    if (!email) {
      res.redirect(`${origin}/login?oauthError=${encodeURIComponent('Your Facebook account has no email address. Please use a different sign-in method.')}`)
      return
    }
    const picture = fb.picture?.data?.url ?? null
    const { userId, userRole, displayName } = await findOrCreateUser(pool, email, fb.name ?? email.split('@')[0], picture)
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(res, origin, token, displayName, email.toLowerCase(), userRole)
  } catch (err: any) {
    console.error('[oauth/facebook/callback]', err?.message ?? err)
    res.redirect(`${origin}/login?oauthError=Unexpected+error.+Please+try+again.`)
  }
})

// ─── Apple Sign-In ────────────────────────────────────────────────────────────

async function buildAppleClientSecret(cfg: Record<string, string>): Promise<string> {
  const { apple_team_id, apple_key_id, apple_service_id, apple_private_key } = cfg
  const privateKey = await importPKCS8(apple_private_key.replace(/\\n/g, '\n'), 'ES256')
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: apple_key_id })
    .setIssuedAt()
    .setExpirationTime('180d')
    .setIssuer(apple_team_id)
    .setAudience('https://appleid.apple.com')
    .setSubject(apple_service_id)
    .sign(privateKey)
}

router.get('/auth/apple', async (req, res) => {
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['apple_service_id'])
    if (!cfg.apple_service_id) {
      res.redirect('/login?oauthError=Apple+Sign-In+is+not+configured+yet.')
      return
    }
    const origin = getOrigin(req)
    const params = new URLSearchParams({
      client_id:     cfg.apple_service_id,
      redirect_uri:  `${origin}/api/auth/apple/callback`,
      response_type: 'code',
      scope:         'name email',
      response_mode: 'form_post',
    })
    res.redirect(`https://appleid.apple.com/auth/authorize?${params}`)
  } catch (err: any) {
    console.error('[oauth/apple]', err?.message ?? err)
    res.redirect('/login?oauthError=OAuth+error.+Please+try+again.')
  }
})

// Apple sends a POST with form-encoded body (response_mode=form_post)
router.post('/auth/apple/callback', async (req, res) => {
  const origin = getOrigin(req)
  try {
    const { code, error: appleErr, id_token, user: userJson } = req.body as Record<string, string>
    if (appleErr || !code) {
      res.redirect(`${origin}/login?oauthError=${encodeURIComponent('Apple sign-in was cancelled.')}`)
      return
    }

    const pool = getPool()
    if (!pool) { res.redirect(`${origin}/login?oauthError=Database+unavailable.`); return }

    const cfg = await getSettings(pool, ['apple_service_id', 'apple_team_id', 'apple_key_id', 'apple_private_key'])
    if (!cfg.apple_service_id || !cfg.apple_team_id || !cfg.apple_key_id || !cfg.apple_private_key) {
      res.redirect(`${origin}/login?oauthError=Apple+Sign-In+is+not+fully+configured.`); return
    }

    // Build the client secret JWT and exchange the code for tokens
    const clientSecret = await buildAppleClientSecret(cfg)
    const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     cfg.apple_service_id,
        client_secret: clientSecret,
        redirect_uri:  `${origin}/api/auth/apple/callback`,
        grant_type:    'authorization_code',
        code,
      }),
    })
    if (!tokenRes.ok) {
      console.error('[oauth/apple] token exchange:', await tokenRes.text())
      res.redirect(`${origin}/login?oauthError=Apple+sign-in+failed.`); return
    }
    const tokens = await tokenRes.json() as any

    // Decode the id_token — contains sub (Apple User ID) and email
    const rawToken = tokens.id_token ?? id_token
    if (!rawToken) { res.redirect(`${origin}/login?oauthError=No+identity+token+from+Apple.`); return }
    const claims = decodeJwt(rawToken) as any
    const appleUserId = claims.sub as string

    // Email: from id_token claims OR from the user JSON Apple sends on first sign-in
    let email = claims.email as string | undefined
    let name  = ''
    if (!email && userJson) {
      try {
        const parsed = JSON.parse(userJson)
        email = parsed.email
        if (parsed.name) {
          name = [parsed.name.firstName, parsed.name.lastName].filter(Boolean).join(' ')
        }
      } catch {}
    }

    if (!email) {
      // Try to find existing user by Apple sub stored in a notes/username field
      const [[byApple]] = await pool.query<any[]>(
        "SELECT * FROM users WHERE username LIKE ? LIMIT 1",
        [`apple_${appleUserId}%`]
      ).catch(() => [[undefined]])
      if (byApple) {
        const token = await signToken({ id: byApple.id, role: byApple.role, email: byApple.email })
        redirectWithToken(res, origin, token, byApple.display_name ?? byApple.username, byApple.email, byApple.role)
        return
      }
      res.redirect(`${origin}/login?oauthError=${encodeURIComponent('Your Apple account has no visible email. Enable email sharing in your Apple ID settings.')}`)
      return
    }

    const { userId, userRole, displayName } = await findOrCreateUser(
      pool, email, name || email.split('@')[0], null
    )
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(res, origin, token, displayName, email.toLowerCase(), userRole)
  } catch (err: any) {
    console.error('[oauth/apple/callback]', err?.message ?? err)
    res.redirect(`${origin}/login?oauthError=Unexpected+error.+Please+try+again.`)
  }
})

export default router
