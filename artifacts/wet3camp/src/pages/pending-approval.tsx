import React, { useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { Flame, Clock, ShieldCheck, Bell, Mail, LogOut, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'

export default function PendingApproval() {
  const { user, logout, approved } = useAuth()
  const [, navigate] = useLocation()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (approved) {
      navigate('/my-profile')
      return
    }

    const poll = async () => {
      try {
        const me = await api.auth.me()
        if (me.approved) {
          navigate('/my-profile')
        }
      } catch {}
    }

    poll()
    intervalRef.current = setInterval(poll, 20000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [approved, navigate])

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B0000,#FF4500)' }}>
              <Flame size={20} className="text-[#FFD700]" />
            </div>
            <span className="text-xl font-black text-text-light">Wet3<span className="text-[#8B0000]">Camp</span></span>
          </Link>
        </div>

        <div className="bg-card-bg border border-[#FFD700]/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-[#FFD700]/10 border-2 border-[#FFD700]/30 flex items-center justify-center mx-auto mb-5">
            <Clock size={36} className="text-[#FFD700]" />
          </div>

          <h1 className="text-2xl font-black text-text-light mb-2">Profile Under Review</h1>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            Welcome, <span className="text-[#FFD700] font-semibold">{user?.name ?? 'there'}</span>!<br />
            Your escort profile has been submitted and is pending admin approval.
          </p>

          <div className="space-y-3 mb-7 text-left">
            {[
              { icon: ShieldCheck, text: 'Admin will verify your profile and selfie',           color: '#28a745' },
              { icon: Bell,        text: "You'll be notified by email when approved",            color: '#2196F3' },
              { icon: Clock,       text: 'Review typically takes up to 24 hours',               color: '#FFD700' },
              { icon: Mail,        text: `Confirmation sent to ${user?.email ?? 'your email'}`, color: '#8B0000' },
              { icon: CheckCircle, text: 'This page will automatically redirect once approved', color: '#28a745' },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-start gap-3 p-3 bg-dark-bg rounded-xl border border-color/50">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#8B0000]/10 border border-[#8B0000]/20 rounded-xl mb-6">
            <div className="flex items-center gap-2 justify-center mb-1">
              <div className="w-2 h-2 rounded-full bg-[#28a745] animate-pulse" />
              <p className="text-xs font-semibold text-[#28a745]">Checking approval status every 20 seconds…</p>
            </div>
            <p className="text-xs text-text-muted">
              While waiting, you can browse the platform as a guest. Your profile will go live and you'll gain full access once approved.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/" className="flex-1 py-3 bg-[#8B0000] text-white font-bold rounded-xl text-sm text-center hover:bg-[#a00000] transition-colors">
              Browse Platform
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border border-color text-text-muted text-sm rounded-xl hover:border-[#EF4444]/40 hover:text-[#EF4444] transition-all"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
