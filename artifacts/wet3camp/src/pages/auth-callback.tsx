import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { setToken } from '@/lib/api'
import { safeInternalRedirect } from '@/lib/redirect'

export default function AuthCallback() {
  const { login } = useAuth()
  const [, navigate] = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')
    const redirectTo = safeInternalRedirect(params.get('redirect'))

    if (error || !token) {
      const msg = error === 'google_not_configured'
        ? 'Google login is not fully configured yet.'
        : error === 'oauth_cancelled'
        ? 'Sign-in was cancelled.'
        : error
        ? error.replace(/_/g, ' ')
        : 'Sign-in failed. Please try again.'
      const loginParams = new URLSearchParams({ oauthError: msg })
      if (redirectTo) loginParams.set('redirect', redirectTo)
      navigate(`/login?${loginParams}`)
      return
    }

    try {
      const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(payloadB64)) as { id?: number; role?: string; email?: string }
      const name     = params.get('name') ?? 'User'
      const email    = params.get('email') ?? payload.email ?? ''
      const role     = payload.role ?? params.get('role') ?? 'user'
      const signupRole = params.get('signupRole')
      const approved = params.get('approved') !== 'false'

      setToken(token)
      login({
        id:    String(payload.id ?? ''),
        name,
        email,
        role:     role === 'admin' ? 'admin' : role === 'escort' ? 'escort' : 'client',
        approved: role === 'escort' ? approved : true,
      })
      navigate(
        signupRole === 'escort' && role === 'escort'
          ? '/register?step=escort'
          : redirectTo ?? (role === 'admin' ? '/admin' : role === 'escort' ? '/my-profile' : '/')
      )
    } catch {
      const loginParams = new URLSearchParams({ oauthError: 'Unexpected error during sign-in.' })
      if (redirectTo) loginParams.set('redirect', redirectTo)
      navigate(`/login?${loginParams}`)
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center pb-24 lg:pb-0">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/wet3camp-wordmark.png"
          alt="Wet3Camp — Your time, your company, your way"
          data-testid="img-brand-wordmark"
          className="w-56 max-w-[80vw] h-auto object-contain"
        />
        <div className="w-7 h-7 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
