import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { signToken } from '../lib/jwt.js'

const router = Router()

async function getGoogleCreds(pool: any): Promise<{ clientId?: string; clientSecret?: string }> {
  if (!pool) return {}
  const [rows] = await pool.query<any[]>(
    "SELECT `key`, `value` FROM platform_settings WHERE `key` IN ('google_client_id','google_client_secret')"
  ).catch(() => [[]])
  const m: Record<string, string> = {}
  for (const r of rows as any[]) m[r.key] = r.value
  return { clientId: m.google_client_id, clientSecret: m.google_client_secret }
}

function getCallbackUrl(req: any): string {
  // Prefer explicit env var — always set APP_URL=https://wet3.camp on the live server
  const base = process.env.APP_URL || process.env.SITE_URL
  if (base) return `${base.replace(/\/$/, '')}/api/auth/google/callback`

  // Try forwarded headers (set by nginx/Apache with mod_proxy)
  const fwdProto = req.headers['x-forwarded-proto'] as string | undefined
  const fwdHost  = (req.headers['x-forwarded-host'] as string | undefined)
               || (req.headers['x-forwarded-server'] as string | undefined)
  if (fwdProto && fwdHost) return `${fwdProto}://${fwdHost}/api/auth/google/callback`

  // Fallback: if host looks like a real domain (no port, not localhost) assume https
  const host = req.headers.host as string || 'localhost'
  const isLocal = host.startsWith('localhost') || host.startsWith('127.') || host.includes(':')
  const proto = isLocal ? (req.protocol || 'http') : 'https'
  return `${proto}://${host}/api/auth/google/callback`
}

router.get('/auth/google', async (req, res) => {
  try {
    const pool = getPool()
    const { clientId } = await getGoogleCreds(pool)
    if (!clientId) {
      res.redirect('/login?error=google_not_configured')
      return
    }
    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  getCallbackUrl(req),
      response_type: 'code',
      scope:         'openid email profile',
      access_type:   'offline',
      prompt:        'select_account',
    })
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  } catch (err: any) {
    console.error('[oauth/google]', err?.message ?? err)
    res.redirect('/login?error=oauth_error')
  }
})

router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, error: oauthErr } = req.query as Record<string, string>
    if (oauthErr || !code) {
      res.redirect(`/login?error=${encodeURIComponent(oauthErr ?? 'oauth_cancelled')}`)
      return
    }

    const pool = getPool()
    if (!pool) { res.redirect('/login?error=db_unavailable'); return }

    const { clientId, clientSecret } = await getGoogleCreds(pool)
    if (!clientId || !clientSecret) {
      res.redirect('/login?error=google_not_configured')
      return
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  getCallbackUrl(req),
        grant_type:    'authorization_code',
      }),
    })
    if (!tokenRes.ok) {
      console.error('[oauth/google] token exchange failed:', await tokenRes.text())
      res.redirect('/login?error=oauth_token_failed')
      return
    }
    const { access_token } = await tokenRes.json() as any

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!profileRes.ok) { res.redirect('/login?error=profile_fetch_failed'); return }

    const { email, name, picture } = await profileRes.json() as any
    if (!email) { res.redirect('/login?error=no_email'); return }

    const [[existing]] = await pool.query<any[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase()]
    )

    let userId: number
    let userRole: string
    let displayName: string

    if (existing) {
      if (picture && !existing.avatar) {
        await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [picture, existing.id]).catch(() => {})
      }
      userId      = existing.id
      userRole    = existing.role
      displayName = existing.display_name ?? existing.username ?? name
    } else {
      const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const username = `${base}_${Math.random().toString(36).slice(2, 6)}`
      const [ins] = await pool.query<any>(
        'INSERT INTO users (username, email, display_name, avatar, role, is_active, created_at) VALUES (?,?,?,?,?,1,NOW())',
        [username, email.toLowerCase(), name ?? username, picture ?? null, 'user']
      )
      userId      = ins.insertId ?? ins[0]?.id
      userRole    = 'user'
      displayName = name ?? username
    }

    const token = await signToken({ id: userId, role: userRole, email: email.toLowerCase() })
    const base  = process.env.FRONTEND_URL ?? ''
    const qs    = new URLSearchParams({ token, name: displayName, email: email.toLowerCase(), role: userRole })
    res.redirect(`${base}/auth/callback?${qs}`)
  } catch (err: any) {
    console.error('[oauth/google/callback]', err?.message ?? err)
    res.redirect('/login?error=oauth_internal')
  }
})

export default router
