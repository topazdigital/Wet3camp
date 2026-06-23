import React, { useState, useEffect, useRef } from 'react'
import { useRoute, useLocation } from 'wouter'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Shield, Phone, Mail, Video, CheckCircle2, Clock, XCircle, ChevronRight, AlertTriangle, Camera } from 'lucide-react'
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

type Method = 'sms' | 'email' | 'video'
type Step = 'choose-method' | 'otp-sent' | 'email-sent' | 'video-record' | 'verified' | 'submitted' | 'status'

export default function ClaimProfile() {
  useSEO({ title: 'Claim Your Profile — Wet3Camp', canonicalPath: '/claim' })

  const [, params] = useRoute('/claim/:id')
  const escortId = params?.id
  const [, setLocation] = useLocation()
  const { user } = useAuth()

  const [escort, setEscort] = useState<any>(null)
  const [step, setStep] = useState<Step>('choose-method')
  const [method, setMethod] = useState<Method>('sms')
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!escortId) return
    apiFetch(`/escorts/${escortId}`)
      .then(d => setEscort(d))
      .catch(() => setError('Profile not found.'))
  }, [escortId])

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

  // ── SMS / OTP flow ──────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setLoading(true); setError('')
    try {
      await apiFetch(`/escorts/${escortId}/claim/send-otp`, { method: 'POST' })
      setStep('otp-sent')
      setInfo(`A verification code was sent to the phone number on this profile.`)
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

  // ── Email flow ──────────────────────────────────────────────────────────────
  const submitEmailClaim = async () => {
    if (!email.trim()) { setError('Enter your email address'); return }
    setLoading(true); setError('')
    try {
      await apiFetch(`/escorts/${escortId}/claim`, {
        method: 'POST',
        body: JSON.stringify({ message: `Email verification claim. Email: ${email}. ${message}`, otp_verified: false }),
      })
      setStep('submitted')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  // ── Video flow ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlob(blob)
        setVideoUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
        if (videoRef.current) videoRef.current.srcObject = null
      }
      recorder.start()
      setMediaRecorder(recorder)
      setRecording(true)
    } catch {
      setError('Camera access denied. Please allow camera permissions or upload a video instead.')
    }
  }

  const stopRecording = () => {
    mediaRecorder?.stop()
    setRecording(false)
    setMediaRecorder(null)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoBlob(file)
    setVideoUrl(URL.createObjectURL(file))
  }

  const submitVideoClaim = async () => {
    if (!videoBlob) { setError('Please record or upload a video first.'); return }
    setLoading(true); setError('')
    try {
      await apiFetch(`/escorts/${escortId}/claim`, {
        method: 'POST',
        body: JSON.stringify({ message: `Video verification claim submitted. ${message}`, otp_verified: false }),
      })
      setStep('submitted')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  // ── Final claim submit (after OTP verified) ─────────────────────────────────
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

  const hasPhone = !!escort?.phone
  const hasEmail = !!(escort as any)?.email

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

          {/* STEP: Choose verification method */}
          {step === 'choose-method' && !escort?.user_id && existingStatus === null && (
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={20} className="text-[#8B0000]" />
                  <h1 className="text-lg font-bold text-text-light">Claim This Profile</h1>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  This profile was imported from another directory. Choose how you'd like to verify your identity and claim it.
                </p>
              </div>

              <p className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Choose verification method</p>
              <div className="space-y-3 mb-6">

                {hasPhone && (
                  <button
                    onClick={() => setMethod('sms')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${method === 'sms' ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-color bg-card-bg hover:border-[#8B0000]/40'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'sms' ? 'bg-[#8B0000]' : 'bg-dark-bg'}`}>
                      <Phone size={18} className={method === 'sms' ? 'text-white' : 'text-text-muted'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-light">SMS / Phone</p>
                      <p className="text-xs text-text-muted">Receive a code on {escort?.phone ? escort.phone.replace(/(\+\d{3})\d+(\d{3})/, '$1****$2') : 'the profile phone'}</p>
                    </div>
                    {method === 'sms' && <CheckCircle2 size={18} className="text-[#8B0000] flex-shrink-0" />}
                  </button>
                )}

                <button
                  onClick={() => setMethod('email')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${method === 'email' ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-color bg-card-bg hover:border-[#8B0000]/40'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'email' ? 'bg-[#8B0000]' : 'bg-dark-bg'}`}>
                    <Mail size={18} className={method === 'email' ? 'text-white' : 'text-text-muted'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-light">Email Verification</p>
                    <p className="text-xs text-text-muted">{hasEmail ? `Send claim to email on this profile` : 'Submit your email — admin will verify'}</p>
                  </div>
                  {method === 'email' && <CheckCircle2 size={18} className="text-[#8B0000] flex-shrink-0" />}
                </button>

                <button
                  onClick={() => setMethod('video')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${method === 'video' ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-color bg-card-bg hover:border-[#8B0000]/40'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'video' ? 'bg-[#8B0000]' : 'bg-dark-bg'}`}>
                    <Video size={18} className={method === 'video' ? 'text-white' : 'text-text-muted'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-light">Live Video / Selfie</p>
                    <p className="text-xs text-text-muted">Record a short selfie video or upload a short clip — admin will verify your face</p>
                  </div>
                  {method === 'video' && <CheckCircle2 size={18} className="text-[#8B0000] flex-shrink-0" />}
                </button>
              </div>

              {error && <p className="text-sm text-red-400 mb-4 p-3 bg-red-400/10 rounded-xl">{error}</p>}

              <button
                onClick={() => {
                  setError('')
                  if (method === 'sms' && hasPhone) sendOtp()
                  else if (method === 'email') setStep('email-sent')
                  else if (method === 'video') setStep('video-record')
                  else setError('Please choose a verification method.')
                }}
                disabled={loading}
                className="w-full py-3.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={15} />}
                Continue with {method === 'sms' ? 'SMS' : method === 'email' ? 'Email' : 'Video'}
              </button>
            </div>
          )}

          {/* STEP: Enter OTP (SMS method) */}
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
              <button onClick={() => setStep('choose-method')} className="w-full py-2 text-xs text-text-muted hover:text-text-light transition-colors">
                ← Choose different method
              </button>
            </div>
          )}

          {/* STEP: Email method */}
          {step === 'email-sent' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail size={20} className="text-[#8B0000]" />
                <h1 className="text-lg font-bold text-text-light">Email Verification</h1>
              </div>
              <p className="text-sm text-text-muted mb-5 leading-relaxed">
                {hasEmail
                  ? `Enter your email address. If it matches the email on this profile, your claim will be fast-tracked for admin approval.`
                  : `Enter your email so admin can contact you to verify your identity.`}
              </p>

              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Your Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#8B0000] transition-all mb-4"
              />

              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Note to admin (optional)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. This is my old listing, here's additional info to verify my identity…"
                rows={3}
                className="w-full px-4 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#8B0000] transition-all resize-none mb-5"
              />

              {error && <p className="text-sm text-red-400 mb-4 p-3 bg-red-400/10 rounded-xl">{error}</p>}

              <button
                onClick={submitEmailClaim}
                disabled={loading || !email.trim()}
                className="w-full py-3.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={15} />}
                Submit Claim via Email
              </button>
              <button onClick={() => setStep('choose-method')} className="w-full py-2 text-xs text-text-muted hover:text-text-light transition-colors">
                ← Choose different method
              </button>
            </div>
          )}

          {/* STEP: Video method */}
          {step === 'video-record' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Video size={20} className="text-[#8B0000]" />
                <h1 className="text-lg font-bold text-text-light">Video Verification</h1>
              </div>
              <p className="text-sm text-text-muted mb-5 leading-relaxed">
                Record a short selfie video (5–15 seconds) holding a piece of paper with today's date and the name on this profile. Admin will review it to confirm your identity.
              </p>

              {!videoUrl ? (
                <div className="space-y-3 mb-5">
                  {!recording ? (
                    <>
                      <video ref={videoRef} className="w-full rounded-xl bg-dark-bg border border-color aspect-video object-cover hidden" muted playsInline />
                      <button
                        onClick={startRecording}
                        className="w-full py-4 bg-[#8B0000]/15 border-2 border-dashed border-[#8B0000]/40 hover:border-[#8B0000] rounded-2xl text-[#8B0000] font-bold text-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Camera size={18} /> Record Selfie Video
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-color" />
                        <span className="text-xs text-text-muted">or</span>
                        <div className="flex-1 h-px bg-color" />
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3.5 bg-dark-bg border border-color hover:border-[#8B0000]/50 rounded-xl text-text-muted font-bold text-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Video size={16} /> Upload a Video
                      </button>
                      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    </>
                  ) : (
                    <div className="space-y-3">
                      <video ref={videoRef} className="w-full rounded-xl bg-dark-bg border-2 border-[#8B0000]/50 aspect-video object-cover" muted playsInline />
                      <button
                        onClick={stopRecording}
                        className="w-full py-3.5 bg-[#EF4444] text-white font-bold rounded-xl transition-all animate-pulse flex items-center justify-center gap-2 text-sm"
                      >
                        <div className="w-3 h-3 rounded-sm bg-white" /> Stop Recording
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-5 space-y-3">
                  <video src={videoUrl} controls className="w-full rounded-xl border border-[#28a745]/40 aspect-video object-cover" />
                  <div className="flex items-center gap-2 p-3 bg-[#28a745]/10 border border-[#28a745]/30 rounded-xl">
                    <CheckCircle2 size={14} className="text-[#28a745] flex-shrink-0" />
                    <span className="text-xs text-[#28a745] font-semibold">Video ready — review it above before submitting</span>
                  </div>
                  <button onClick={() => { setVideoBlob(null); setVideoUrl(null) }} className="w-full py-2 text-xs text-text-muted hover:text-text-light transition-colors">
                    Record / upload again
                  </button>
                </div>
              )}

              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Note to admin (optional)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Any additional info to help admin verify…"
                rows={2}
                className="w-full px-4 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#8B0000] transition-all resize-none mb-5"
              />

              {error && <p className="text-sm text-red-400 mb-4 p-3 bg-red-400/10 rounded-xl">{error}</p>}

              <button
                onClick={submitVideoClaim}
                disabled={loading || !videoBlob}
                className="w-full py-3.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={15} />}
                Submit Video Claim
              </button>
              <button onClick={() => setStep('choose-method')} className="w-full py-2 text-xs text-text-muted hover:text-text-light transition-colors">
                ← Choose different method
              </button>
            </div>
          )}

          {/* STEP: Verified — add message + submit (SMS only) */}
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
