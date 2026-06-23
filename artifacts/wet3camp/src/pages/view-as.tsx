import React, { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Eye, X } from 'lucide-react'

const TOKEN_KEY = 'w3c_token'
const SS_KEY    = 'w3c_ss_user'

export default function ViewAs() {
  const [, navigate] = useLocation()
  const [banner, setBanner] = useState<{ name: string; role: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token    = params.get('token')
    const name     = params.get('name')
    const role     = params.get('role') ?? 'escort'
    const uid      = params.get('uid')
    const redirect = params.get('redirect') ?? (role === 'escort' ? '/my-profile' : '/')

    if (!token || !name) {
      setError('Missing impersonation parameters. Close this tab.')
      return
    }

    try {
      sessionStorage.setItem(TOKEN_KEY, token)
      sessionStorage.setItem(SS_KEY, JSON.stringify({
        id: uid ?? '',
        name: decodeURIComponent(name),
        email: '',
        role: role === 'escort' ? 'escort' : 'client',
        approved: true,
      }))
    } catch {
      setError('Could not set session. Close this tab and try again.')
      return
    }

    window.history.replaceState({}, '', '/view-as')
    setBanner({ name: decodeURIComponent(name), role })

    const t = setTimeout(() => navigate(redirect), 600)
    return () => clearTimeout(t)
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
        <div className="bg-card-bg border border-[#EF4444]/30 rounded-2xl p-6 max-w-sm text-center">
          <p className="text-[#EF4444] text-sm font-bold mb-2">Impersonation Error</p>
          <p className="text-text-muted text-xs">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-12 h-12 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin" />
      {banner && (
        <p className="text-text-muted text-sm">
          Logging in as <span className="text-text-light font-bold">{banner.name}</span>…
        </p>
      )}
    </div>
  )
}

export function ImpersonationBanner() {
  const [info, setInfo] = useState<{ name: string; role: string } | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('w3c_ss_user')
      if (!raw) return
      const u = JSON.parse(raw)
      setInfo({ name: u.name ?? 'Unknown', role: u.role ?? 'user' })
    } catch {}
  }, [])

  if (!info) return null

  const exitImpersonation = () => {
    try {
      sessionStorage.removeItem('w3c_ss_user')
      sessionStorage.removeItem('w3c_token')
    } catch {}
    window.close()
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#8B0000] text-white text-xs font-bold flex items-center justify-between px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <Eye size={13} />
        <span>Admin View — Viewing as <span className="underline">{info.name}</span> ({info.role})</span>
      </div>
      <button
        onClick={exitImpersonation}
        className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
      >
        <X size={11} /> Exit
      </button>
    </div>
  )
}
