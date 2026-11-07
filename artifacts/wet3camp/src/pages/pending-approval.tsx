import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Clock, ShieldCheck, Bell, Mail, LogOut, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'

export default function PendingApproval() {
  const { user, logout } = useAuth()
  const [, navigate] = useLocation()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [hasEscortProfile, setHasEscortProfile] = useState<boolean | null>(user?.hasEscortProfile ?? null)
  const [statusUnavailable, setStatusUnavailable] = useState(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const me = await api.auth.me()
        if (me.approved) {
          navigate('/my-profile')
          return
        }
        if (typeof me.hasEscortProfile === 'boolean') {
          setHasEscortProfile(me.hasEscortProfile)
        }
        setStatusUnavailable(false)
      } catch {
        setStatusUnavailable(true)
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 20000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [navigate])

  const setupIncomplete = hasEscortProfile === false
  const checkingStatus = hasEscortProfile === null && !statusUnavailable

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12 pb-24 lg:pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" aria-label="Wet3Camp home" className="inline-flex justify-center mb-6">
            <img
              src="/wet3camp-wordmark.png"
              alt="Wet3Camp — Your time, your company, your way"
              data-testid="img-brand-wordmark"
              className="w-56 max-w-full h-auto object-contain"
            />
          </Link>
        </div>

        <div className="bg-card-bg border border-[#FFD700]/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-[#FFD700]/10 border-2 border-[#FFD700]/30 flex items-center justify-center mx-auto mb-5">
            <Clock size={36} className="text-[#FFD700]" />
          </div>

          <h1 className="text-2xl font-black text-text-light mb-2">
            {setupIncomplete ? 'Complete Your Escort Profile' : checkingStatus ? 'Checking Profile Status' : statusUnavailable ? 'Status Unavailable' : 'Profile Under Review'}
          </h1>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            Welcome, <span className="text-[#FFD700] font-semibold">{user?.name ?? 'there'}</span>!<br />
            {setupIncomplete
              ? 'Your escort account does not have a submitted profile yet. Complete setup before the admin team can review or approve it.'
              : checkingStatus
              ? 'We are checking whether your escort profile has been submitted.'
              : statusUnavailable
              ? 'We could not check your profile status right now. We will try again automatically.'
              : 'Your escort profile has been submitted and is pending admin approval.'}
          </p>

          {!setupIncomplete && !checkingStatus && !statusUnavailable && (
            <div className="space-y-3 mb-7 text-left">
              {[
                { icon: ShieldCheck, text: 'Admin will review your profile before it goes live', color: '#28a745' },
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
          )}

          <div className="p-4 bg-[#8B0000]/10 border border-[#8B0000]/20 rounded-xl mb-6">
            <div className="flex items-center gap-2 justify-center mb-1">
              <div className="w-2 h-2 rounded-full bg-[#28a745] animate-pulse" />
              <p className="text-xs font-semibold text-[#28a745]">
                {setupIncomplete ? 'Complete your profile to request review' : 'Checking approval status every 20 seconds…'}
              </p>
            </div>
            <p className="text-xs text-text-muted">
              {setupIncomplete
                ? 'Your profile will be sent for admin review after setup is complete.'
                : 'While waiting, you can browse the platform as a guest. Your profile will go live and you’ll gain full access once approved.'}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={setupIncomplete ? '/register?step=escort' : '/'}
              className="flex-1 py-3 bg-[#8B0000] text-white font-bold rounded-xl text-sm text-center hover:bg-[#a00000] transition-colors"
            >
              {setupIncomplete ? 'Complete Profile Setup' : 'Browse Platform'}
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
