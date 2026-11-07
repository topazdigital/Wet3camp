import React, { useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const TOKEN_KEY = 'w3c_token'
const SS_KEY = 'w3c_ss_user'

type ViewAsUser = {
  id: string | number
  name: string
  email?: string
  role: string
  approved?: boolean
  hasEscortProfile?: boolean
}

export default function ViewAs() {
  const [error, setError] = useState('')

  useEffect(() => {
    const nonce = new URLSearchParams(window.location.search).get('nonce')
    const opener = window.opener as Window | null
    if (!nonce || !/^[a-zA-Z0-9-]{16,80}$/.test(nonce) || !opener) {
      setError('This view-as session could not be verified. Close this tab and start again from the admin panel.')
      return
    }

    let finished = false
    let timeoutId: number | undefined
    const fail = (message: string) => {
      if (finished) return
      finished = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      window.removeEventListener('message', onMessage)
      try { opener.postMessage({ type: 'w3c-view-as-error', nonce, message }, window.location.origin) } catch {}
      setError(message)
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== opener || event.data?.nonce !== nonce) return
      if (event.data?.type !== 'w3c-view-as-session') return

      const { token, user } = event.data as { token?: unknown; user?: ViewAsUser }
      if (finished || typeof token !== 'string' || !token || !user || user.id == null || typeof user.name !== 'string') {
        fail('The admin panel sent an invalid user session.')
        return
      }

      try {
        const role = user.role === 'user' ? 'client' : user.role
        if (role !== 'client' && role !== 'escort') throw new Error('This account cannot be viewed as.')
        sessionStorage.setItem(TOKEN_KEY, token)
        sessionStorage.setItem(SS_KEY, JSON.stringify({
          id: String(user.id),
          name: user.name,
          email: user.email ?? '',
          role,
          approved: user.approved === true,
          hasEscortProfile: user.hasEscortProfile,
        }))
        finished = true
        window.clearTimeout(timeoutId)
        window.removeEventListener('message', onMessage)
        window.history.replaceState({}, '', '/view-as')
        opener.postMessage({ type: 'w3c-view-as-started', nonce }, window.location.origin)
        window.location.replace(role === 'escort' ? '/my-profile' : '/account')
      } catch (err: any) {
        try {
          sessionStorage.removeItem(TOKEN_KEY)
          sessionStorage.removeItem(SS_KEY)
        } catch {}
        fail(err?.message || 'Could not start the user session.')
      }
    }

    timeoutId = window.setTimeout(() => fail('Timed out waiting for the admin session. Close this tab and try again.'), 20000)
    window.addEventListener('message', onMessage)
    opener.postMessage({ type: 'w3c-view-as-ready', nonce }, window.location.origin)
    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center gap-4 p-6">
      {error ? (
        <div role="alert" className="bg-card-bg border border-[#EF4444]/30 rounded-2xl p-6 max-w-sm text-center">
          <p className="text-[#EF4444] text-sm font-bold mb-2">Could not open user view</p>
          <p className="text-text-muted text-xs">{error}</p>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Starting secure user view…</p>
        </>
      )}
    </div>
  )
}

export function ImpersonationBanner() {
  const { user } = useAuth()
  const [active, setActive] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SS_KEY)
      const token = sessionStorage.getItem(TOKEN_KEY)
      if (raw && token) {
        setActive(true)
      } else if (raw) {
        sessionStorage.removeItem(SS_KEY)
      }
    } catch {}
  }, [])

  if (!active || !user) return null

  const exitImpersonation = () => {
    try {
      sessionStorage.removeItem(SS_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {}
    window.close()
    window.setTimeout(() => {
      if (!window.closed) window.location.assign('/admin')
    }, 50)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#8B0000] text-white text-xs font-bold flex items-center justify-between px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <Eye size={13} />
        <span>Admin View — Viewing as <span className="underline">{user.name}</span> ({user.role})</span>
      </div>
      <button
        onClick={exitImpersonation}
        data-testid="button-exit-impersonation"
        className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
      >
        <X size={11} /> Exit
      </button>
    </div>
  )
}
