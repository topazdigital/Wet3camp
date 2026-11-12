import { Router } from 'express'
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto'
import { hashPassword } from '../lib/crypto.js'
import { getPool } from '../lib/db.js'
import { signToken, verifyToken } from '../lib/jwt.js'
import { sendOtpEmail } from '../lib/mailer.js'
import { SignJWT, importPKCS8, decodeJwt, createRemoteJWKSet, jwtVerify } from 'jose'

const router = Router()

// ─── helpers ─────────────────────────────────────────────────────────────────

type OAuthSignupRole = 'client' | 'escort'
type OAuthStateOptions = { linkUserId?: number; codeVerifier?: string; nonce?: string }

const TELEGRAM_PENDING_COOKIE = 'w3c_telegram_pending'
const telegramOtpStore = new Map<string, {
  code: string
  expires: number
  sentAt: number
  attempts: number
}>()
const telegramJwks = createRemoteJWKSet(new URL('https://oauth.telegram.org/.well-known/jwks.json'))

function getOAuthSignupRole(value: unknown): OAuthSignupRole | undefined {
  return value === 'client' || value === 'escort' ? value : undefined
}

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

async function createOAuthState(
  returnTo?: string,
  signupRole?: OAuthSignupRole,
  options: OAuthStateOptions = {},
): Promise<string> {
  return signToken({
    purpose: 'oauth-state',
    nonce: options.nonce ?? randomUUID(),
    returnTo: returnTo ?? null,
    signupRole: signupRole ?? null,
    linkUserId: options.linkUserId ?? null,
    codeVerifier: options.codeVerifier ?? null,
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

async function readOAuthState(
  req: any, res: any, value: unknown, origin: string, provider: string,
): Promise<{ returnTo?: string; signupRole?: OAuthSignupRole; nonce: string; codeVerifier?: string; linkUserId?: number }> {
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
  const linkUserId = Number(payload.linkUserId)
  const codeVerifier = typeof payload.codeVerifier === 'string' ? payload.codeVerifier : undefined
  return {
    returnTo: safeReturnPath(payload.returnTo),
    signupRole: getOAuthSignupRole(payload.signupRole),
    nonce: payload.nonce,
    codeVerifier,
    linkUserId: Number.isSafeInteger(linkUserId) && linkUserId > 0 ? linkUserId : undefined,
  }
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
  signupRole?: OAuthSignupRole,
): Promise<{
  userId: number
  userRole: string
  displayName: string
  isNew: boolean
  requiresEscortSetup: boolean
  escortApproved: boolean
}> {
  const [[existing]] = await pool.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email.toLowerCase()]
  )
  if (existing) {
    if (picture && !existing.avatar) {
      await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [picture, existing.id]).catch(() => {})
    }
    let escortProfile: any = null
    if (existing.role === 'escort') {
      const [[profile]] = await pool.query(
        'SELECT id, is_active FROM escorts WHERE user_id = ? LIMIT 1',
        [existing.id]
      )
      escortProfile = profile
    }
    return {
      userId:      existing.id,
      userRole:    existing.role,
      displayName: existing.display_name ?? existing.username ?? name,
      isNew:       false,
      requiresEscortSetup: existing.role === 'escort' && !escortProfile,
      escortApproved: existing.role !== 'escort' || !!Number(escortProfile?.is_active),
    }
  }
  const base     = email.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 32) || 'user'
  const username = `${base}_${randomUUID().replace(/-/g, '').slice(0, 8)}`
  const passwordHash = await hashPassword(randomUUID())
  const role = signupRole === 'escort' ? 'escort' : 'user'
  const [ins]    = await pool.query(
    'INSERT INTO users (username, email, password_hash, display_name, avatar, role, is_active, created_at) VALUES (?,?,?,?,?,?,1,NOW())',
    [username, email.toLowerCase(), passwordHash, name ?? username, picture ?? null, role]
  )
  return {
    userId:      ins.insertId ?? ins[0]?.id,
    userRole:    role,
    displayName: name ?? username,
    isNew:       true,
    requiresEscortSetup: role === 'escort',
    escortApproved: role !== 'escort',
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
  isNew = false, returnTo?: string, signupRole?: OAuthSignupRole,
  requiresEscortSetup = false, escortApproved = true,
) {
  const qs = new URLSearchParams({ token, name: displayName, email })
  if (returnTo) qs.set('redirect', returnTo)
  if (role === 'escort' && requiresEscortSetup && !isClaimReturnPath(returnTo)) {
    qs.set('role', 'escort')
    qs.set('signupRole', 'escort')
    qs.set('approved', 'false')
    safeRedirect(res, `${origin}/auth/callback?${qs}`)
    return
  }
  if (role === 'escort' && !escortApproved) qs.set('approved', 'false')
  if (isNew && signupRole && !isClaimReturnPath(returnTo)) {
    qs.set('role', role)
    qs.set('signupRole', signupRole)
    if (signupRole === 'escort') qs.set('approved', 'false')
    safeRedirect(res, `${origin}/auth/callback?${qs}`)
  } else if (isNew && !isClaimReturnPath(returnTo)) {
    safeRedirect(res, `${origin}/auth/choose-role?${qs}`)
  } else {
    qs.set('role', role)
    safeRedirect(res, `${origin}/auth/callback?${qs}`)
  }
}

function setTelegramPendingCookie(res: any, token: string, origin: string) {
  res.cookie(TELEGRAM_PENDING_COOKIE, token, {
    httpOnly: true,
    secure: origin.startsWith('https://'),
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth',
  })
}

function clearTelegramPendingCookie(res: any, origin: string) {
  res.clearCookie(TELEGRAM_PENDING_COOKIE, {
    httpOnly: true,
    secure: origin.startsWith('https://'),
    sameSite: 'lax',
    path: '/api/auth',
  })
}

async function readTelegramPending(req: any): Promise<Record<string, unknown>> {
  const token = readCookie(req, TELEGRAM_PENDING_COOKIE)
  if (!token) throw new Error('Telegram sign-in has expired. Start again.')
  const payload = await verifyToken(token)
  if (
    payload.purpose !== 'telegram-pending' ||
    typeof payload.nonce !== 'string' ||
    typeof payload.telegramUserId !== 'string' ||
    !payload.telegramUserId
  ) {
    throw new Error('Telegram sign-in is invalid. Start again.')
  }
  return payload
}

function telegramAuthorizationUrl(
  origin: string,
  clientId: string,
  state: string,
  nonce: string,
  codeVerifier: string,
): string {
  const challenge = createHash('sha256').update(codeVerifier).digest('base64url')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/telegram/callback`,
    response_type: 'code',
    scope: 'openid profile',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  return `https://oauth.telegram.org/auth?${params}`
}

async function getLinkedTelegramUser(pool: any, telegramUserId: string): Promise<any | null> {
  const [[user]] = await pool.query<any[]>(
    `SELECT u.* FROM user_auth_providers p
     JOIN users u ON u.id = p.user_id
     WHERE p.provider = 'telegram' AND p.provider_user_id = ?
     LIMIT 1`,
    [telegramUserId],
  )
  return user ?? null
}

function buildTelegramCompletionPath(input: {
  token: string
  name: string
  email: string
  role: string
  isNew: boolean
  signupRole?: OAuthSignupRole
  returnTo?: string
  requiresEscortSetup: boolean
  escortApproved: boolean
}): string {
  const { token, name, email, role, isNew, signupRole, returnTo, requiresEscortSetup, escortApproved } = input
  if (isNew && !signupRole && !isClaimReturnPath(returnTo)) {
    const params = new URLSearchParams({ token, name, email })
    if (returnTo) params.set('redirect', returnTo)
    return `/auth/choose-role?${params}`
  }

  const params = new URLSearchParams({ token, name, email, role })
  if (returnTo) params.set('redirect', returnTo)
  if (role === 'escort' && requiresEscortSetup && !isClaimReturnPath(returnTo)) {
    params.set('signupRole', 'escort')
    params.set('approved', 'false')
  } else if (isNew && signupRole && !isClaimReturnPath(returnTo)) {
    params.set('signupRole', signupRole)
    if (signupRole === 'escort') params.set('approved', 'false')
  } else if (role === 'escort' && !escortApproved) {
    params.set('approved', 'false')
  }
  return `/auth/callback?${params}`
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
      'telegram_client_id', 'telegram_client_secret',
    ])
    const isConfigured = (...values: Array<string | undefined>) =>
      values.every(value => typeof value === 'string' && value.trim().length > 0)
    const providers = {
      google: isConfigured(cfg.google_client_id, cfg.google_client_secret),
      facebook: isConfigured(cfg.facebook_app_id, cfg.facebook_app_secret),
      apple: isConfigured(cfg.apple_service_id, cfg.apple_team_id, cfg.apple_key_id, cfg.apple_private_key),
      telegram: isConfigured(cfg.telegram_client_id, cfg.telegram_client_secret),
    }
    res.json({
      googleClientId: providers.google ? cfg.google_client_id.trim() : null,
      providers,
    })
  } catch {
    res.json({
      googleClientId: null,
      providers: { google: false, facebook: false, apple: false, telegram: false },
    })
  }
})

// ─── Google redirect flow ─────────────────────────────────────────────────────

router.get('/auth/google', async (req, res) => {
  const returnTo = safeReturnPath(req.query.redirect)
  const signupRole = getOAuthSignupRole(req.query.role)
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['google_client_id'])
    if (!cfg.google_client_id) { safeRedirect(res, loginErrorUrl(getOrigin(req), 'Google login is not configured yet.', returnTo)); return }
    const state = await createOAuthState(returnTo, signupRole)
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
  let signupRole: OAuthSignupRole | undefined
  try {
    const oauthState = await readOAuthState(req, res, req.query.state, origin, 'google')
    returnTo = oauthState.returnTo
    signupRole = oauthState.signupRole
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
    const { userId, userRole, displayName, isNew, requiresEscortSetup, escortApproved } =
      await findOrCreateUser(pool, email, name, picture, signupRole)
    stage = 'create session'
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(
      res, origin, token, displayName, email.toLowerCase(), userRole, isNew, returnTo, signupRole,
      requiresEscortSetup, escortApproved
    )
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
    const { userId, userRole, displayName, requiresEscortSetup, escortApproved } =
      await findOrCreateUser(pool, email, name ?? email.split('@')[0], picture ?? null)
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    res.json({
      token,
      requiresEscortSetup,
      user: {
        id: String(userId),
        name: displayName,
        email: email.toLowerCase(),
        role: userRole,
        approved: escortApproved,
      },
    })
  } catch (err: any) {
    console.error('[oauth/google/one-tap]', err?.message ?? err)
    res.status(500).json({ message: 'Sign-in failed' })
  }
})

// ─── Facebook OAuth ───────────────────────────────────────────────────────────

router.get('/auth/facebook', async (req, res) => {
  const returnTo = safeReturnPath(req.query.redirect)
  const signupRole = getOAuthSignupRole(req.query.role)
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['facebook_app_id'])
    if (!cfg.facebook_app_id) { safeRedirect(res, loginErrorUrl(getOrigin(req), 'Facebook login is not configured yet.', returnTo)); return }
    const state = await createOAuthState(returnTo, signupRole)
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
  let signupRole: OAuthSignupRole | undefined
  try {
    const oauthState = await readOAuthState(req, res, req.query.state, origin, 'facebook')
    returnTo = oauthState.returnTo
    signupRole = oauthState.signupRole
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
    const { userId, userRole, displayName, isNew, requiresEscortSetup, escortApproved } = await findOrCreateUser(
      pool, email, fb.name ?? email.split('@')[0], picture, signupRole
    )
    stage = 'create session'
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(
      res, origin, token, displayName, email.toLowerCase(), userRole, isNew, returnTo, signupRole,
      requiresEscortSetup, escortApproved
    )
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
  const signupRole = getOAuthSignupRole(req.query.role)
  try {
    const pool = getPool()
    const cfg  = await getSettings(pool, ['apple_service_id'])
    if (!cfg.apple_service_id) {
      safeRedirect(res, loginErrorUrl(getOrigin(req), 'Apple Sign-In is not configured yet.', returnTo))
      return
    }
    const origin = getOrigin(req)
    const state = await createOAuthState(returnTo, signupRole)
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
  let signupRole: OAuthSignupRole | undefined
  try {
    const oauthState = await readOAuthState(req, res, req.body?.state, origin, 'apple')
    returnTo = oauthState.returnTo
    signupRole = oauthState.signupRole
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
        let escortProfile: any = null
        if (byApple.role === 'escort') {
          const [[profile]] = await pool.query<any[]>(
            'SELECT id, is_active FROM escorts WHERE user_id = ? LIMIT 1',
            [byApple.id]
          )
          escortProfile = profile
        }
        const token = await signToken({ id: byApple.id, role: byApple.role, email: byApple.email })
        redirectWithToken(
          res, origin, token, byApple.display_name ?? byApple.username, byApple.email, byApple.role,
          false, returnTo, undefined, byApple.role === 'escort' && !escortProfile,
          byApple.role !== 'escort' || !!Number(escortProfile?.is_active)
        )
        return
      }
      safeRedirect(res, loginErrorUrl(origin, 'Your Apple account has no visible email. Enable email sharing in your Apple ID settings.', returnTo))
      return
    }

    stage = 'find or create account'
    const { userId, userRole, displayName, isNew, requiresEscortSetup, escortApproved } = await findOrCreateUser(
      pool, email, name || email.split('@')[0], null, signupRole
    )
    stage = 'create session'
    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    redirectWithToken(
      res, origin, token, displayName, email.toLowerCase(), userRole, isNew, returnTo, signupRole,
      requiresEscortSetup, escortApproved
    )
  } catch (err: any) {
    console.error(`[oauth/apple/callback] stage=${stage}:`, err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Apple sign-in could not be completed. Please try again.', returnTo))
  }
})

// ─── Telegram OIDC sign-in ───────────────────────────────────────────────────

router.get('/auth/telegram', async (req, res) => {
  const origin = getOrigin(req)
  const returnTo = safeReturnPath(req.query.redirect)
  const signupRole = getOAuthSignupRole(req.query.role)
  try {
    const pool = getPool()
    const cfg = await getSettings(pool, ['telegram_client_id', 'telegram_client_secret'])
    if (!cfg.telegram_client_id || !cfg.telegram_client_secret) {
      safeRedirect(res, loginErrorUrl(origin, 'Telegram login is not configured yet.', returnTo))
      return
    }
    const nonce = randomUUID()
    const codeVerifier = randomBytes(32).toString('base64url')
    const state = await createOAuthState(returnTo, signupRole, { nonce, codeVerifier })
    setOAuthStateCookie(res, state, origin, 'telegram')
    res.redirect(telegramAuthorizationUrl(origin, cfg.telegram_client_id, state, nonce, codeVerifier))
  } catch (err: any) {
    console.error('[oauth/telegram]', err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Telegram sign-in could not be started. Please try again.', returnTo))
  }
})

router.get('/auth/telegram/callback', async (req, res) => {
  const origin = getOrigin(req)
  let oauthState: Awaited<ReturnType<typeof readOAuthState>>
  try {
    oauthState = await readOAuthState(req, res, req.query.state, origin, 'telegram')
  } catch (err: any) {
    console.warn('[oauth/telegram/callback] state validation failed:', err?.message ?? err)
    safeRedirect(res, loginErrorUrl(origin, 'Your Telegram sign-in session expired. Please try again.'))
    return
  }

  let stage = 'read callback'
  try {
    const { code, error: oauthError } = req.query as Record<string, string>
    if (oauthError || !code) {
      safeRedirect(res, loginErrorUrl(
        origin,
        oauthError === 'access_denied' ? 'Telegram sign-in was cancelled.' : 'Telegram sign-in failed.',
        oauthState.returnTo,
      ))
      return
    }
    if (!oauthState.codeVerifier) throw new Error('Missing Telegram PKCE verifier')

    stage = 'load database'
    const pool = getPool()
    if (!pool) {
      safeRedirect(res, loginErrorUrl(origin, 'Database unavailable.', oauthState.returnTo))
      return
    }

    stage = 'load Telegram credentials'
    const cfg = await getSettings(pool, ['telegram_client_id', 'telegram_client_secret'])
    if (!cfg.telegram_client_id || !cfg.telegram_client_secret) {
      safeRedirect(res, loginErrorUrl(origin, 'Telegram login is not configured yet.', oauthState.returnTo))
      return
    }

    stage = 'exchange authorization code'
    const tokenRes = await fetch('https://oauth.telegram.org/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.telegram_client_id,
        client_secret: cfg.telegram_client_secret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${origin}/api/auth/telegram/callback`,
        code_verifier: oauthState.codeVerifier,
      }),
    })
    if (!tokenRes.ok) {
      console.error('[oauth/telegram] token exchange:', await tokenRes.text())
      safeRedirect(res, loginErrorUrl(origin, 'Telegram sign-in failed. Please try again.', oauthState.returnTo))
      return
    }
    const tokens = await tokenRes.json() as { id_token?: string }
    if (!tokens.id_token) throw new Error('Telegram did not return an identity token')

    stage = 'verify Telegram identity'
    const { payload } = await jwtVerify(tokens.id_token, telegramJwks, {
      issuer: 'https://oauth.telegram.org',
      audience: cfg.telegram_client_id,
      nonce: oauthState.nonce,
    })
    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error('Telegram identity has no subject')
    }
    const telegramUserId = payload.sub
    const telegramName = typeof payload.name === 'string' && payload.name.trim()
      ? payload.name.trim().slice(0, 150)
      : typeof payload.preferred_username === 'string' && payload.preferred_username.trim()
        ? payload.preferred_username.trim().slice(0, 150)
        : 'Telegram user'
    const telegramUsername = typeof payload.preferred_username === 'string'
      ? payload.preferred_username.trim().slice(0, 191)
      : null
    let telegramPicture: string | null = null
    if (typeof payload.picture === 'string') {
      try {
        const pictureUrl = new URL(payload.picture)
        if (pictureUrl.protocol === 'https:') telegramPicture = pictureUrl.toString()
      } catch {}
    }

    stage = 'resolve linked account'
    const linkedUser = await getLinkedTelegramUser(pool, telegramUserId)
    if (linkedUser) {
      if (!Number(linkedUser.is_active)) {
        safeRedirect(res, loginErrorUrl(origin, 'This Wet3Camp account is inactive. Contact support.', oauthState.returnTo))
        return
      }
      let escortProfile: any = null
      if (linkedUser.role === 'escort') {
        const [[profile]] = await pool.query<any[]>(
          'SELECT id, is_active FROM escorts WHERE user_id = ? ORDER BY id DESC LIMIT 1',
          [linkedUser.id],
        )
        escortProfile = profile
      }
      const token = await signToken({
        id: linkedUser.id,
        role: linkedUser.role,
        email: linkedUser.email,
      })
      clearTelegramPendingCookie(res, origin)
      redirectWithToken(
        res, origin, token, linkedUser.display_name ?? linkedUser.username,
        linkedUser.email, linkedUser.role, false, oauthState.returnTo, undefined,
        linkedUser.role === 'escort' && !escortProfile,
        linkedUser.role !== 'escort' || !!Number(escortProfile?.is_active),
      )
      return
    }

    stage = 'start verified email linking'
    const pendingTicket = await signToken({
      purpose: 'telegram-pending',
      nonce: randomUUID(),
      telegramUserId,
      telegramName,
      telegramUsername,
      telegramPicture,
      returnTo: oauthState.returnTo ?? null,
      signupRole: oauthState.signupRole ?? null,
    }, '10m')
    setTelegramPendingCookie(res, pendingTicket, origin)
    safeRedirect(res, `${origin}/auth/telegram/continue`)
  } catch (err: any) {
    console.error(`[oauth/telegram/callback] stage=${stage}:`, err?.message ?? err)
    safeRedirect(res, loginErrorUrl(
      origin,
      'Telegram sign-in could not be completed. Please try again or use email.',
      oauthState.returnTo,
    ))
  }
})

router.get('/auth/telegram/pending', async (req, res) => {
  try {
    const pending = await readTelegramPending(req)
    res.setHeader('Cache-Control', 'no-store')
    res.json({
      name: typeof pending.telegramName === 'string' ? pending.telegramName : 'Telegram user',
      username: typeof pending.telegramUsername === 'string' ? pending.telegramUsername : null,
    })
  } catch (err: any) {
    res.status(401).json({ message: err?.message ?? 'Telegram sign-in has expired. Start again.' })
  }
})

router.post('/auth/telegram/send-code', async (req, res) => {
  try {
    const pending = await readTelegramPending(req)
    const rawEmail = (req.body as { email?: string })?.email
    const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      res.status(400).json({ message: 'Enter a valid email address.' })
      return
    }

    const nonce = String(pending.nonce)
    const otpKey = `${nonce}:${email}`
    const now = Date.now()
    for (const [key, value] of telegramOtpStore) {
      if (value.expires <= now) telegramOtpStore.delete(key)
    }
    const previous = telegramOtpStore.get(otpKey)
    if (previous && now - previous.sentAt < 60_000) {
      res.status(429).json({ message: 'Wait one minute before requesting another code.' })
      return
    }

    const code = String(randomInt(100000, 1000000))
    telegramOtpStore.set(otpKey, {
      code,
      expires: now + 10 * 60 * 1000,
      sentAt: now,
      attempts: 0,
    })
    try {
      await sendOtpEmail(
        email,
        code,
        typeof pending.telegramName === 'string' ? pending.telegramName : undefined,
        'telegram',
      )
    } catch (err: any) {
      telegramOtpStore.delete(otpKey)
      console.error('[oauth/telegram/send-code] email delivery failed:', err?.message ?? err)
      res.status(503).json({ message: 'Could not send the verification email. Please try again later.' })
      return
    }
    res.json({ message: 'A verification code has been sent to your email.' })
  } catch (err: any) {
    res.status(401).json({ message: err?.message ?? 'Telegram sign-in has expired. Start again.' })
  }
})

router.post('/auth/telegram/complete', async (req, res) => {
  let pending: Record<string, unknown>
  try {
    pending = await readTelegramPending(req)
  } catch (err: any) {
    res.status(401).json({ message: err?.message ?? 'Telegram sign-in has expired. Start again.' })
    return
  }

  const rawEmail = (req.body as { email?: string })?.email
  const rawCode = (req.body as { code?: string })?.code
  const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : ''
  const code = typeof rawCode === 'string' ? rawCode.trim() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 || !/^\d{6}$/.test(code)) {
    res.status(400).json({ message: 'Enter the email address and six-digit code.' })
    return
  }

  const otpKey = `${String(pending.nonce)}:${email}`
  const stored = telegramOtpStore.get(otpKey)
  if (!stored) {
    res.status(400).json({ message: 'Request a verification code for this email first.' })
    return
  }
  if (stored.expires <= Date.now()) {
    telegramOtpStore.delete(otpKey)
    res.status(400).json({ message: 'That code expired. Request a new one.' })
    return
  }
  if (stored.code !== code) {
    stored.attempts += 1
    if (stored.attempts >= 5) telegramOtpStore.delete(otpKey)
    res.status(400).json({
      message: stored.attempts >= 5
        ? 'Too many incorrect attempts. Request a new code.'
        : 'That code is incorrect. Check it and try again.',
    })
    return
  }
  telegramOtpStore.delete(otpKey)

  const pool = getPool()
  if (!pool) {
    res.status(503).json({ message: 'Database unavailable. Please try again later.' })
    return
  }

  let account: any
  let isNew = false
  try {
    const telegramUserId = String(pending.telegramUserId)
    const telegramUsername = typeof pending.telegramUsername === 'string' ? pending.telegramUsername : null
    const telegramPicture = typeof pending.telegramPicture === 'string' ? pending.telegramPicture : null
    const telegramName = typeof pending.telegramName === 'string' && pending.telegramName.trim()
      ? pending.telegramName.trim().slice(0, 150)
      : email.split('@')[0]
    const signupRole = getOAuthSignupRole(pending.signupRole)
    const usernameBase = email.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 32) || 'user'
    const username = `${usernameBase}_${randomUUID().replace(/-/g, '').slice(0, 8)}`
    const passwordHash = await hashPassword(randomUUID())
    const desiredRole = signupRole === 'escort' ? 'escort' : 'user'

    const result = await pool.transaction(async query => {
      const [identityRows] = await query(
        `SELECT user_id FROM user_auth_providers
         WHERE provider = 'telegram' AND provider_user_id = ?
         LIMIT 1 FOR UPDATE`,
        [telegramUserId],
      )
      const linked = (identityRows as any[])[0]
      if (linked) {
        const [userRows] = await query('SELECT * FROM users WHERE id = ? LIMIT 1 FOR UPDATE', [linked.user_id])
        const existing = (userRows as any[])[0]
        if (!existing || !Number(existing.is_active)) throw new Error('ACCOUNT_INACTIVE')
        return { user: existing, isNew: false }
      }

      const [emailRows] = await query(
        'SELECT * FROM users WHERE email = ? LIMIT 1 FOR UPDATE',
        [email],
      )
      let user = (emailRows as any[])[0]
      let created = false
      if (!user) {
        await query(
          `INSERT INTO users
             (username, email, password_hash, display_name, avatar, role, is_active, created_at)
           VALUES (?,?,?,?,?,?,1,NOW())`,
          [username, email, passwordHash, telegramName, telegramPicture, desiredRole],
        )
        const [createdRows] = await query('SELECT * FROM users WHERE email = ? LIMIT 1 FOR UPDATE', [email])
        user = (createdRows as any[])[0]
        if (!user) throw new Error('ACCOUNT_CREATE_FAILED')
        created = true
      }
      if (!Number(user.is_active)) throw new Error('ACCOUNT_INACTIVE')

      const [userIdentityRows] = await query(
        `SELECT provider_user_id FROM user_auth_providers
         WHERE provider = 'telegram' AND user_id = ?
         LIMIT 1 FOR UPDATE`,
        [user.id],
      )
      const existingIdentity = (userIdentityRows as any[])[0]
      if (existingIdentity && String(existingIdentity.provider_user_id) !== telegramUserId) {
        throw new Error('ACCOUNT_HAS_TELEGRAM')
      }
      if (!existingIdentity) {
        await query(
          `INSERT INTO user_auth_providers
             (user_id, provider, provider_user_id, provider_username, created_at)
           VALUES (?, 'telegram', ?, ?, NOW())`,
          [user.id, telegramUserId, telegramUsername],
        )
      }
      if (telegramPicture && !user.avatar) {
        await query('UPDATE users SET avatar = ? WHERE id = ?', [telegramPicture, user.id])
        user.avatar = telegramPicture
      }
      if (!user.display_name && telegramName) {
        await query('UPDATE users SET display_name = ? WHERE id = ?', [telegramName, user.id])
        user.display_name = telegramName
      }
      return { user, isNew: created }
    })
    account = result.user
    isNew = result.isNew
  } catch (err: any) {
    console.error('[oauth/telegram/complete] account link failed:', err?.message ?? err)
    const message = err?.message === 'ACCOUNT_INACTIVE'
      ? 'This Wet3Camp account is inactive. Contact support.'
      : err?.message === 'ACCOUNT_HAS_TELEGRAM'
        ? 'This Wet3Camp account already has a different Telegram account linked.'
        : 'Could not link Telegram to this account. Please try again.'
    res.status(err?.message === 'ACCOUNT_INACTIVE' ? 403 : 409).json({ message })
    return
  }

  try {
    let escortProfile: any = null
    if (account.role === 'escort') {
      const [[profile]] = await pool.query<any[]>(
        'SELECT id, is_active FROM escorts WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [account.id],
      )
      escortProfile = profile
    }
    const displayName = account.display_name ?? account.username ?? email.split('@')[0]
    const token = await signToken({ id: account.id, role: account.role, email: account.email })
    const requiresEscortSetup = account.role === 'escort' && !escortProfile
    const escortApproved = account.role !== 'escort' || !!Number(escortProfile?.is_active)
    const returnTo = safeReturnPath(pending.returnTo)
    const nextPath = buildTelegramCompletionPath({
      token,
      name: displayName,
      email: account.email,
      role: account.role,
      isNew,
      signupRole: getOAuthSignupRole(pending.signupRole),
      returnTo,
      requiresEscortSetup,
      escortApproved,
    })
    clearTelegramPendingCookie(res, getOrigin(req))
    res.setHeader('Cache-Control', 'no-store')
    res.json({ nextPath })
  } catch (err: any) {
    console.error('[oauth/telegram/complete] session creation failed:', err?.message ?? err)
    res.status(500).json({ message: 'Could not finish Telegram sign-in. Please try again.' })
  }
})

export default router
