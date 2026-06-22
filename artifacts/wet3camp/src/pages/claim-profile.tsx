import React, { useState, useEffect } from 'react'
import { useRoute, useLocation } from 'wouter'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Shield, Phone, CheckCircle2, Clock, XCircle, ChevronRight, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('w3c_token') || localStorage.getItem('auth_token')
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)
  return data
}

type Step = 'info' | 'otp-sent' | 'verified' | 'submitted' | 'status'

export default function ClaimProfile() {
  useSEO({ title: 'Claim Your Profile — Wet3Camp', canonicalPath: '/claim' })

  const [, params] = useRoute('/claim/:id')
  const escortId = params?.id
  const [, setLocation] = useLocation()
  const { user } = useAuth()

  const [escort, setEscort] = useState<any>(null)
  const [step, setStep]     = useState<Step>('info')
  const [otp, setOtp]       = useState('')
  const [message, setMessage] = useState('')
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [info, setInfo]     = useState('')

  // Load escort profile
  useEffect(() => {
    if (!escortId) return
    apiFetch(`/escorts/${escortId}`)
      .then(d => setEscort(d))
      .catch(() => setError('Profile not found.'))
  }, [escortId])

  // Check existing claim status
  useEffect(() => {
    if (!escortId || !user) return
    apiFetch(`/escorts/${escortId}/claim-status`)
      .then(d => { if (d.status) { setExistingStatus(d.status); setStep('status') } })
      .catch(() => {})
  }, [escortId, user])

  if (!user) {
    return (
      <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 w-full overflow-x-hidden">
          <Header />
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <Shield size={48} className="text-[#8B0000] mb-4" />
            <h1 className="text-xl font-bold text-text-light mb-2">Sign in to claim this profile</h1>
            <p className="text-sm text-text-muted mb-6 max-w-sm">
              Create a free account or sign in, then come back to verify this is your profile.
            </p>
            <button
              onClick={() => setLocation(`/register?redirect=/claim/${escortId}&role=escort`)}
              className="px-6 py-3 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors"
            >
              Create Free Account
            </button>
            <button
              onClick={() => setLocation(`/login?redirect=/claim/${escortId}`)}
              className="mt-3 text-sm text-[#8B0000] hover:underline"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </main>
    )
  }

  const sendOtp = async () => {
    setLoading(true); setError('')
    try {
      await apiFetch(`/escorts/${escortId}/claim/send-otp`, { method: 'POST' })
      setStep('otp-sent')
      setInfo(`A verification code was sent to the phone number on this profile. Enter it below to prove this is you.`)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (!otp.trim()) { setError('Enter the verification code'); return }
    setLoading(true); setError('')
    try {
      await apiFetch(`/escorts/${escortId}/claim/verify-otp`, { method: 'POST', body: JSON.stringify({ code: otp }) })
      setStep('verified')
      setInfo('')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const submitClaim = async () => {
    setLoading(true); setError('')
    try {
      await apiFetch(`/escorts/${escortId}/claim`, { method: 'POST', body: JSON.stringify({ message, otp_verified: true }) })
      setStep('submitted')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const statusColor: Record<string, string> = {
    pending:  '#FF9800',
    approved: '#28a745',
    rejected: '#8B0000',
  }
  const statusIcon = {
    pending:  <Clock size={36} className="text-[#FF9800]" />,
    approved: <CheckCircle2 size={36} className="text-[#28a745]" />,
    rejected: <XCircle size={36} className="text-[#8B0000]" />,
  }

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24">
        <Header />

        <div className="max-w-lg mx-auto px-4 py-10">

          {/* Profile preview */}
          {escort && (
            <div className="flex items-center gap-4 mb-8 p-4 bg-card-bg border border-color rounded-2xl">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-dark-bg">
                {escort.image
                  ? <img src={escort.image} alt={escort.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[#8B0000]/40">{(escort.name || '?')[0]}</div>
                }
              </div>
              <div>
                <h2 className="font-bold text-text-light text-base">{escort.name}</h2>
                <p className="text-xs text-text-muted">{escort.area}, {escort.city}</p>
                {escort.user_id && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 bg-[#28a74520] text-[#28a745] rounded-full font-bold">
                    <CheckCircle2 size={9} /> Already claimed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Already claimed notice */}
          {escort?.user_id && (
            <div className="p-4 bg-[#FF980010] border border-[#FF980030] rounded-xl mb-6 text-sm text-text-muted">
              <AlertTriangle size={16} className="inline text-[#FF9800] mr-2" />
              This profile has already been claimed by its owner. If you believe this is your profile and was claimed incorrectly, please contact admin.
            </div>
          )}

          {/* STEP: Existing status */}
          {step === 'status' && !escort?.user_id && (
            <div className="text-center py-8">
              {statusIcon[existingStatus as keyof typeof statusIcon] || <Clock size={36} className="text-[#FF9800] mx-auto" />}
              <h2 className="text-lg font-bold text-text-light mt-4 mb-2">
                Claim {existingStatus === 'pending' ? 'Under Review' : existingStatus === 'approved' ? 'Approved!' : 'Rejected'}
              </h2>
              <p className="text-sm text-text-muted mb-6">
                {existingStatus === 'pending' && "Your claim is being reviewed by our team. We'll notify you once it's processed."}
                {existingStatus === 'approved' && "Your claim was approved! You can now edit and manage this profile."}
                {existingStatus === 'rejected' && "Your claim was not approved. Contact support if you believe this is a mistake."}
              </p>
              {existingStatus === 'approved' && (
                <button
                  onClick={() => setLocation(`/profile/${escortId}`)}
                  className="px-6 py-3 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors"
                >
                  View My Profile
                </button>
              )}
            </div>
          )}

          {/* STEP: Info / Start */}
          {step === 'info' && !escort?.user_id && existingStatus === null && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={20} className="text-[#8B0000]" />
                  <h1 className="text-lg font-bold text-text-light">Claim This Profile</h1>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  If this is your profile that was imported from another directory, you can claim it and take full ownership.
                  We'll send a one-time code to the phone number listed on the profile to verify your identity.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Receive an OTP on the profile phone number',
                  'Enter the code to verify your identity',
                  'Submit your claim for admin review',
                  'Get full access to edit and manage your profile',
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-text-muted">
                    <div className="w-6 h-6 rounded-full bg-[#8B0000]/20 text-[#8B0000] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    {s}
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-400 mb-4 p-3 bg-red-400/10 rounded-xl">{error}</p>}

              <button
                onClick={sendOtp}
                disabled={loading || !!escort?.user_id}
                className="w-full py-3.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Phone size={15} />}
                Send Verification Code
              </button>
            </div>
          )}

          {/* STEP: Enter OTP */}
          {step === 'otp-sent' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Phone size={20} className="text-[#8B0000]" />
                <h1 className="text-lg font-bold text-text-light">Enter Verification Code</h1>
              </div>
              {info && <p className="text-sm text-text-muted mb-6 p-3 bg-card-bg border border-color rounded-xl">{info}</p>}

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className="w-full px-4 py-3.5 bg-dark-bg border border-color rounded-xl text-center text-2xl font-bold text-text-light tracking-[0.5em] placeholder-text-muted/40 focus:outline-none focus:border-[#8B0000] transition-all mb-4"
              />

              {error && <p className="text-sm text-red-400 mb-4 p-3 bg-red-400/10 rounded-xl">{error}</p>}

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full py-3.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={15} />}
                Verify Code
              </button>
              <button onClick={sendOtp} className="w-full py-2 text-xs text-text-muted hover:text-text-light transition-colors">
                Didn't receive a code? Resend
              </button>
            </div>
          )}

          {/* STEP: Verified — add message + submit */}
          {step === 'verified' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-[#28a745]" />
                <h1 className="text-lg font-bold text-text-light">Identity Verified</h1>
              </div>
              <p className="text-sm text-text-muted mb-6">
                Your phone number matched the profile. Add an optional note for the admin reviewing your claim.
              </p>

              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Note to admin (optional)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. This is my old listing from nairobiraha, I moved to wet3.camp…"
                rows={4}
                className="w-full px-4 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#8B0000] transition-all resize-none mb-5"
              />

              {error && <p className="text-sm text-red-400 mb-4 p-3 bg-red-400/10 rounded-xl">{error}</p>}

              <button
                onClick={submitClaim}
                disabled={loading}
                className="w-full py-3.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={15} />}
                Submit Claim Request
              </button>
            </div>
          )}

          {/* STEP: Submitted */}
          {step === 'submitted' && (
            <div className="text-center py-8">
              <Clock size={48} className="text-[#FF9800] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-light mb-2">Claim Submitted!</h2>
              <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
                Your profile claim is under review. Our team typically responds within 24 hours.
                We'll notify you by email when it's approved.
              </p>
              <button
                onClick={() => setLocation(`/profile/${escortId}`)}
                className="px-6 py-3 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors"
              >
                Back to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
