import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { setToken } from '@/lib/api'
import { Flame } from 'lucide-react'

export default function AuthCallback() {
  const { login } = useAuth()
  const [, navigate] = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (error || !token) {
      const msg = error === 'google_not_configured'
        ? 'Google login is not fully configured yet.'
        : error === 'oauth_cancelled'
        ? 'Sign-in was cancelled.'
        : error
        ? error.replace(/_/g, ' ')
        : 'Sign-in failed. Please try again.'
      navigate(`/login?oauthError=${encodeURIComponent(msg)}`)
      return
    }

    try {
      const payloadB64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(payloadB64)) as { id?: number; role?: string; email?: string }
      const name     = decodeURIComponent(params.get('name') ?? 'User')
      const email    = params.get('email') ?? payload.email ?? ''
      const role     = payload.role ?? params.get('role') ?? 'user'
      const approved = params.get('approved') !== 'false'

      setToken(token)
      login({
        id:    String(payload.id ?? ''),
        name,
        email,
        role:     role === 'admin' ? 'admin' : role === 'escort' ? 'escort' : 'client',
        approved: role === 'escort' ? approved : true,
      })
      navigate(role === 'admin' ? '/admin' : role === 'escort' ? '/my-profile' : '/')
    } catch {
      navigate('/login?oauthError=Unexpected+error+during+sign-in.')
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center shadow-lg">
          <Flame size={22} className="text-white" />
        </div>
        <div className="w-7 h-7 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
