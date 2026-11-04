import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { hashPassword } from '../lib/crypto.js'
import { getPool } from '../lib/db.js'
import { signToken, verifyToken } from '../lib/jwt.js'
import { SignJWT, importPKCS8, decodeJwt } from 'jose'

const router = Router()

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getSettings(pool: any, keys: string[]): Promise<Record<string, string>> {
  if (!pool) return {}
  const [rows] = await pool.query(
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

function safeReturnPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return undefined
  }
  try {
    const url = new URL(value, 'https://wet3camp.invalid')
    if (
      url.origin !== 'https://wet3camp.invalid' ||
      ['/login', '/register', '/auth/callback', '/auth/choose-role'].includes(url.pathname) ||
      url.pathname.startsWith('/api/')
    ) {
      return undefined
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return undefined
  }
}

async function createOAuthState(returnTo?: string): Promise<string> {
  return signToken({
    purpose: 'oauth-state',
    nonce: randomUUID(),
    returnTo: returnTo ?? null,
  }, '10m')
}

function setOAuthStateCookie(res: any, state: string, origin: string, provider: string) {
  res.cookie('w3c_oauth_state', state, {
    httpOnly: true,
    secure: origin.startsWith('https://'),
    sameSite: provider === 'apple' ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth',
  })
}

function readCookie(req: any, name: string): string | undefined {
  const header = req.headers?.cookie
  if (typeof header !== 'string') return undefined
  const prefix = `${name}=`
  const item = header.split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith(prefix))
  return item ? decodeURIComponent(item.slice(prefix.length)) : undefined
}

async function readOAuthState(req: any, res: any, value: unknown, origin: string, provider: string): Promise<string | undefined> {
  const cookieState = readCookie(req, 'w3c_oauth_state')
  res.clearCookie('w3c_oauth_state', {
    httpOnly: true,
    secure: origin.startsWith('https://'),
    sameSite: provider === 'apple' ? 'none' : 'lax',
    path: '/api/auth',
  })
  if (!cookieState || typeof value !== 'string' || value !== cookieState) {
    throw new Error('OAuth state did not match this browser session')
  }
  if (typeof value !== 'string' || !value) throw new Error('Missing OAuth state')
  const payload = await verifyToken(value)
  if (payload.purpose !== 'oauth-state' || typeof payload.nonce !== 'string') {
    throw new Error('Invalid OAuth state')
  }
  return safeReturnPath(payload.returnTo)
}

function loginErrorUrl(origin: string, message: string, returnTo?: string): string {
  const url = new URL('/login', origin)
  url.searchParams.set('oauthError', message)
  if (returnTo) url.searchParams.set('redirect', returnTo)
  return url.toString()
}

function isClaimReturnPath(returnTo?: string): boolean {
  return !!returnTo && /^\/claim\/\d+\/?$/.test(returnTo)
}

async function findOrCreateUser(
  pool: any,
  email: string,
  name: string,
  picture: string | null,
): Promise<{ userId: number; userRole: string; displayName: string; isNew: boolean }> {
  const [[existing]] = await pool.query(
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
      isNew:       false,
    }
  }
  const base     = email.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 32) || 'user'
  const username = `${base}_${randomUUID().replace(/-/g, '').slice(0, 8)}`
  const passwordHash = await hashPassword(randomUUID())
  const [ins]    = await pool.query(
    'INSERT INTO users (username, email, password_hash, display_name, avatar, role, is_active, created_at) VALUES (?,?,?,?,?,?,1,NOW())',
    [username, email.toLowerCase(), passwordHash, name ?? username, picture ?? null, 'user']
  )
  return {
    userId:      ins.insertId ?? ins[0]?.id,
    userRole:    'user',
    displayName: name ?? username,
    isNew:       true,
  }
}

function safeRedirect(res: any, url: string) {
  const escaped = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).end(
    `<!DOCTYPE html><html><head>`
    + `<meta http-equiv="refresh" content="0;url=${escaped}">`
    + `<script>window.location.replace(${JSON.stringify(url)})</script>`
    + `</head><body>Redirecting&#8230;</body></html>`
  )
}

function redirectWithToken(
  res: any, origin: string, token: string,
  displayName: string, email: string, role: string,
  isNew = false, returnTo?: string,
) {
  const qs = new URLSearchParams({ token, name: displayName, email })
  if (returnTo) qs.set('redirect', returnTo)
  if (isNew && !isClaimReturnPath(returnTo)) {
    safeRedirect(res, `${origin}/auth/choose-role?${qs}`)
  } else {
    qs.set('role', role)
    safeRedirect(res, `${origin}/auth/callback?${qs}`)
  }
}

// ─── Public config (client IDs only — no secrets) ────────────────────────────

router.get('/auth/oauth-config', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, [
      'google_client_id', 'google_client_secret',
      'facebook_app_id', 'facebook_app_secret',
      'apple_service_id', 'apple_team_id', 'apple_key_id', 'apple_private_key',
    ])
    const isConfigured = (...values: Array<string | undefined>) =>
      values.every(value => typeof value === 'string' && value.trim().length > 0)
    const providers = {
      google: isConfigured(cfg.google_client_id, cfg.google_client_secret),
      facebook: isConfigured(cfg.facebook_app_id, cfg.facebook_app_secret),
      apple: isConfigured(cfg.apple_service_id, cfg.apple_team_id, cfg.apple_key_id, cfg.apple_private_key),
    }
    res.json({
      googleClientId: providers.google ? cfg.google_client_id.trim() : null,
      providers,
    })
  } catch {
    res.json({
      googleClientId: null,
      providers: { google: false, facebook: false, apple: false },
    })
  }
})

// ─── Google redirect flow ─────────────────────────────────────────────────────

router.get('/auth/google', async (req, res) => {
  const returnTo = safeReturnPath(req.query.redirect)
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['google_client_id'])
    if (!cfg.google_client_id) { safeRedirect(res, loginErrorUrl(getOrigin(req), 'Google login is not configured yet.', returnTo)); return }
    const state = await createOAuthState(returnTo)
    setOAuthStateCookie(res, state, getOrigin(req), 'google')
    const params = new URLSearchParams({
      client_id:     cfg.google_client_id,
      redirect_uri:  `${getOrigin(req)}/api/auth/google/callback`,
      response_type: 'code',
      scope:         'openid email profile',
      access_type:   'offline',
      prompt:        'select_account',
      state,
    })
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  } catch (err: any) {
    console.error('[oauth/google]', err?.message ?? err)
    safeRedirect(res, loginErrorUrl(getOrigin(req), 'Google sign-in could not be started. Please try again.', returnTo))
  }
})

router.get('/auth/google/callback', async (req, res) => {
  const origin = getOrigin(req)
  let returnTo: string | undefined
  try {
    returnTo = await readOAuthState(req, res, req.query.state, origin, 'google')
  } catch (err: any) {
    console.warn('[oauth/google/callback] state validation failed:', err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Your sign-in session expired. Please try again.'))
    return
  }
  let stage = 'read callback'
  try {
    const { code, error: oauthErr } = req.query as Record<string, string>
    if (oauthErr || !code) {
      safeRedirect(res, loginErrorUrl(origin, oauthErr === 'access_denied' ? 'Sign-in was cancelled.' : 'Google sign-in failed.', returnTo))
      return
    }
    stage = 'load database'
    const pool = getPool()
    if (!pool) { safeRedirect(res, loginErrorUrl(origin, 'Database unavailable.', returnTo)); return }
    stage = 'load Google credentials'
    const cfg = await getSettings(pool, ['google_client_id', 'google_client_secret'])
    if (!cfg.google_client_id || !cfg.google_client_secret) {
      safeRedirect(res, loginErrorUrl(origin, 'Google login is not configured yet.', returnTo)); return
    }
    stage = 'exchange authorization code'
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
      safeRedirect(res, loginErrorUrl(origin, 'Google sign-in failed.', returnTo)); return
    }
    const { access_token } = await tokenRes.json() as any
    stage = 'fetch Google profile'
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!profileRes.ok) { safeRedirect(res, loginErrorUrl(origin, 'Could not fetch your Google profile.', returnTo)); return }
    const { email, name, picture } = await profileRes.json() as any
    if (!email) { safeRedirect(res, loginErrorUrl(origin, 'No email was shared by your Google account.', returnTo)); return }
    stage = 'find or create account'
    const { userId, userRole, displayName, isNew } = await findOrCreateUser(pool, email, name, picture)
    stage = 'create session'
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(res, origin, token, displayName, email.toLowerCase(), userRole, isNew, returnTo)
  } catch (err: any) {
    console.error(`[oauth/google/callback] stage=${stage}:`, err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Google sign-in could not be completed. Please try again or use email.', returnTo))
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
  const returnTo = safeReturnPath(req.query.redirect)
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['facebook_app_id'])
    if (!cfg.facebook_app_id) { safeRedirect(res, loginErrorUrl(getOrigin(req), 'Facebook login is not configured yet.', returnTo)); return }
    const state = await createOAuthState(returnTo)
    setOAuthStateCookie(res, state, getOrigin(req), 'facebook')
    const params = new URLSearchParams({
      client_id:     cfg.facebook_app_id,
      redirect_uri:  `${getOrigin(req)}/api/auth/facebook/callback`,
      response_type: 'code',
      scope:         'email,public_profile',
      state,
    })
    res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`)
  } catch (err: any) {
    console.error('[oauth/facebook]', err?.message ?? err)
    safeRedirect(res, loginErrorUrl(getOrigin(req), 'Facebook sign-in could not be started. Please try again.', returnTo))
  }
})

router.get('/auth/facebook/callback', async (req, res) => {
  const origin = getOrigin(req)
  let returnTo: string | undefined
  try {
    returnTo = await readOAuthState(req, res, req.query.state, origin, 'facebook')
  } catch (err: any) {
    console.warn('[oauth/facebook/callback] state validation failed:', err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Your sign-in session expired. Please try again.'))
    return
  }
  let stage = 'read callback'
  try {
    const { code, error: oauthErr } = req.query as Record<string, string>
    if (oauthErr || !code) {
      safeRedirect(res, loginErrorUrl(origin, 'Facebook sign-in was cancelled.', returnTo))
      return
    }
    stage = 'load database'
    const pool = getPool()
    if (!pool) { safeRedirect(res, loginErrorUrl(origin, 'Database unavailable.', returnTo)); return }
    stage = 'load Facebook credentials'
    const cfg = await getSettings(pool, ['facebook_app_id', 'facebook_app_secret'])
    if (!cfg.facebook_app_id || !cfg.facebook_app_secret) {
      safeRedirect(res, loginErrorUrl(origin, 'Facebook login is not configured yet.', returnTo)); return
    }
    stage = 'exchange authorization code'
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
      safeRedirect(res, loginErrorUrl(origin, 'Facebook sign-in failed.', returnTo)); return
    }
    const { access_token } = await tokenRes.json() as any
    stage = 'fetch Facebook profile'
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${access_token}`
    )
    if (!profileRes.ok) { safeRedirect(res, loginErrorUrl(origin, 'Could not fetch your Facebook profile.', returnTo)); return }
    const fb = await profileRes.json() as any
    const email = fb.email
    if (!email) {
      safeRedirect(res, loginErrorUrl(origin, 'Your Facebook account has no email address. Please use a different sign-in method.', returnTo))
      return
    }
    const picture = fb.picture?.data?.url ?? null
    stage = 'find or create account'
    const { userId, userRole, displayName, isNew } = await findOrCreateUser(pool, email, fb.name ?? email.split('@')[0], picture)
    stage = 'create session'
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(res, origin, token, displayName, email.toLowerCase(), userRole, isNew, returnTo)
  } catch (err: any) {
    console.error(`[oauth/facebook/callback] stage=${stage}:`, err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Facebook sign-in could not be completed. Please try again.', returnTo))
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
  const returnTo = safeReturnPath(req.query.redirect)
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['apple_service_id'])
    if (!cfg.apple_service_id) {
      safeRedirect(res, loginErrorUrl(getOrigin(req), 'Apple Sign-In is not configured yet.', returnTo))
      return
    }
    const origin = getOrigin(req)
    const state = await createOAuthState(returnTo)
    setOAuthStateCookie(res, state, origin, 'apple')
    const params = new URLSearchParams({
      client_id:     cfg.apple_service_id,
      redirect_uri:  `${origin}/api/auth/apple/callback`,
      response_type: 'code',
      scope:         'name email',
      response_mode: 'form_post',
      state,
    })
    res.redirect(`https://appleid.apple.com/auth/authorize?${params}`)
  } catch (err: any) {
    console.error('[oauth/apple]', err?.message ?? err)
    safeRedirect(res, loginErrorUrl(getOrigin(req), 'Apple sign-in could not be started. Please try again.', returnTo))
  }
})

// Apple sends a POST with form-encoded body (response_mode=form_post)
router.post('/auth/apple/callback', async (req, res) => {
  const origin = getOrigin(req)
  let returnTo: string | undefined
  try {
    returnTo = await readOAuthState(req, res, req.body?.state, origin, 'apple')
  } catch (err: any) {
    console.warn('[oauth/apple/callback] state validation failed:', err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Your sign-in session expired. Please try again.'))
    return
  }
  let stage = 'read callback'
  try {
    const { code, error: appleErr, id_token, user: userJson } = req.body as Record<string, string>
    if (appleErr || !code) {
      safeRedirect(res, loginErrorUrl(origin, 'Apple sign-in was cancelled.', returnTo))
      return
    }

    stage = 'load database'
    const pool = getPool()
    if (!pool) { safeRedirect(res, loginErrorUrl(origin, 'Database unavailable.', returnTo)); return }

    stage = 'load Apple credentials'
    const cfg = await getSettings(pool, ['apple_service_id', 'apple_team_id', 'apple_key_id', 'apple_private_key'])
    if (!cfg.apple_service_id || !cfg.apple_team_id || !cfg.apple_key_id || !cfg.apple_private_key) {
      safeRedirect(res, loginErrorUrl(origin, 'Apple Sign-In is not fully configured.', returnTo)); return
    }

    // Build the client secret JWT and exchange the code for tokens
    stage = 'exchange authorization code'
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
      safeRedirect(res, loginErrorUrl(origin, 'Apple sign-in failed.', returnTo)); return
    }
    const tokens = await tokenRes.json() as any

    // Decode the id_token — contains sub (Apple User ID) and email
    const rawToken = tokens.id_token ?? id_token
    if (!rawToken) { safeRedirect(res, loginErrorUrl(origin, 'No identity token was returned by Apple.', returnTo)); return }
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
        redirectWithToken(res, origin, token, byApple.display_name ?? byApple.username, byApple.email, byApple.role, false, returnTo)
        return
      }
      safeRedirect(res, loginErrorUrl(origin, 'Your Apple account has no visible email. Enable email sharing in your Apple ID settings.', returnTo))
      return
    }

    stage = 'find or create account'
    const { userId, userRole, displayName, isNew } = await findOrCreateUser(
      pool, email, name || email.split('@')[0], null
    )
    stage = 'create session'
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(res, origin, token, displayName, email.toLowerCase(), userRole, isNew, returnTo)
  } catch (err: any) {
    console.error(`[oauth/apple/callback] stage=${stage}:`, err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Apple sign-in could not be completed. Please try again.', returnTo))
  }
})

export default router
