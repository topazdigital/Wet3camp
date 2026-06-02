import React, { useState } from 'react'
import { useLocation } from 'wouter'
import { UserCircle2, Sparkles, ArrowRight, Flame, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { setToken } from '@/lib/api'
import { useSEO } from '@/lib/useSEO'

export default function ChooseRole() {
  useSEO({ title: 'Welcome — Choose Your Role', noIndex: true })
  const { login } = useAuth()
  const [, navigate] = useLocation()
  const [selected, setSelected] = useState<'client' | 'escort' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const params  = new URLSearchParams(window.location.search)
  const token   = params.get('token') ?? ''
  const name    = decodeURIComponent(params.get('name') ?? 'there')
  const email   = params.get('email') ?? ''

  const confirm = async () => {
    if (!selected) return
    if (!token) { navigate('/login'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setToken(data.token)
      login({
        id:    '',   // will be filled by auth-context from token
        name:  data.name ?? name,
        email: data.email ?? email,
        role:  data.role === 'escort' ? 'escort' : 'client',
      })
      navigate(data.role === 'escort' ? '/register?step=escort' : '/')
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const ROLES = [
    {
      id: 'client' as const,
      icon: UserCircle2,
      label: 'I\'m a Client',
      description: 'Browse escorts, make bookings, and enjoy premium experiences across Kenya.',
      gradient: 'from-[#8B0000]/30 to-[#8B0000]/5',
      border: 'border-[#8B0000]',
      iconColor: 'text-[#8B0000]',
      badge: 'Free to join',
    },
    {
      id: 'escort' as const,
      icon: Sparkles,
      label: 'I\'m an Escort',
      description: 'List your profile, set your rates, and connect with clients across the platform.',
      gradient: 'from-[#FFD700]/20 to-[#FFD700]/5',
      border: 'border-[#FFD700]/60',
      iconColor: 'text-[#FFD700]',
      badge: 'Earn with us',
    },
  ]

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
      {/* Brand mark */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center shadow-lg shadow-[#8B0000]/30">
          <Flame size={20} className="text-white" />
        </div>
        <span className="text-lg font-black text-text-light tracking-wide">WET3<span className="text-[#FFD700]">CAMP</span></span>
      </div>

      {/* Heading */}
      <div className="text-center mb-8 max-w-sm">
        <h1 className="text-2xl font-black text-text-light mb-2">
          Welcome, {name.split(' ')[0]}! 👋
        </h1>
        <p className="text-text-muted text-sm leading-relaxed">
          One last step — let us know how you'll be using Wet3 Camp so we can set up your account correctly.
        </p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-sm space-y-4 mb-6">
        {ROLES.map(role => {
          const Icon = role.icon
          const active = selected === role.id
          return (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 bg-gradient-to-br ${role.gradient} ${active ? role.border + ' shadow-lg' : 'border-color hover:border-text-muted'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-card-bg' : 'bg-dark-bg'} transition-colors`}>
                  <Icon size={22} className={role.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-text-light">{role.label}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-dark-bg text-text-muted">{role.badge}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{role.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${active ? role.border + ' bg-transparent' : 'border-color'}`}>
                  {active && <div className="w-2.5 h-2.5 rounded-full bg-current" style={{ color: active ? 'inherit' : '' }} />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="w-full max-w-sm mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2.5">
          <CheckCircle2 size={15} /> {error}
        </div>
      )}

      <button
        onClick={confirm}
        disabled={!selected || loading}
        className="w-full max-w-sm flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#8B0000] to-[#8B0000]/80 text-white font-bold text-sm shadow-lg shadow-[#8B0000]/30 hover:shadow-[#8B0000]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Setting up your account…</>
        ) : (
          <>Continue <ArrowRight size={16} /></>
        )}
      </button>

      <p className="mt-4 text-[11px] text-text-muted text-center max-w-xs">
        You can update this later in your account settings. By continuing you agree to our Terms of Service.
      </p>
    </div>
  )
}
