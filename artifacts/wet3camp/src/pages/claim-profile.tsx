import React, { useState, useEffect, useRef } from 'react'
import { useRoute, useLocation } from 'wouter'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Shield, Phone, Mail, Video, CheckCircle2, Clock, XCircle, ChevronRight, AlertTriangle, Camera, Send } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'
import { useOAuthConfig } from '@/lib/oauth-config'

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
type Step = 'choose-method' | 'otp-sent' | 'email-otp-sent' | 'video-record' | 'verified' | 'submitted' | 'status'
type ClaimMethods = { sms: boolean; email: boolean; video: boolean }

const CLAIM_ACCOUNT_NOTICE = 'Creating an account won’t create another escort listing. If you already manage a profile, additional claims are reviewed as possible duplicates and approved duplicates are merged into your existing profile.'

export default function ClaimProfile() {
  useSEO({ title: 'Claim Your Profile — Wet3Camp', canonicalPath: '/claim' })

  const [, params] = useRoute('/claim/:id')
  const escortId = params?.id
  const [, setLocation] = useLocation()
  const { user } = useAuth()
  const oauthConfig = useOAuthConfig()

  const [escort, setEscort] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [step, setStep] = useState<Step>('choose-method')
  const [method, setMethod] = useState<Method>('video')
  const [otp, setOtp] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailDestination, setEmailDestination] = useState('')
  const [claimMethods, setClaimMethods] = useState<ClaimMethods | null>(null)
  const [methodsError, setMethodsError] = useState('')
  const [message, setMessage] = useState('')
  const [existingStatus, setExistingStatus] = useState<string | null>(null)
  const [mergeTarget, setMergeTarget] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submissionInfo, setSubmissionInfo] = useState('')
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!escortId) {
      setProfileError('This profile could not be found.')
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    setProfileError('')
    apiFetch(`/escorts/${escortId}`)
      .then(d => {
        if (d.mergedRedirect && d.id) {
          window.location.replace(`/profile/${d.id}`)
          return
        }
        setEscort(d)
      })
      .catch(() => setProfileError('This profile could not be found.'))
      .finally(() => setProfileLoading(false))
  }, [escortId])

  useEffect(() => {
    if (!escortId || !user) return
    apiFetch(`/escorts/${escortId}/claim-status`)
      .then(d => {
        setMergeTarget(d.mergeTarget ?? null)
        if (d.status) { setExistingStatus(d.status); setStep('status') }
      })
      .catch(() => {})
  }, [escortId, user])

  useEffect(() => {
    if (!escortId || !user) return
    let cancelled = false
    setClaimMethods(null)
    setMethodsError('')
    apiFetch(`/escorts/${escortId}/claim-options`)
      .then(d => {
        if (cancelled) return
        const methods = d.methods as ClaimMethods
        if (!methods || typeof methods.video !== 'boolean') throw new Error('Invalid verification settings')
        setClaimMethods(methods)
        setMethod(methods.email ? 'email' : methods.sms && escort?.phone ? 'sms' : 'video')
      })
      .catch(() => {
        if (!cancelled) setMethodsError('Available verification options could not be loaded. Please retry.')
      })
    return () => { cancelled = true }
  }, [escortId, user, escort?.phone])

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
  }, [videoUrl])

  if (!user) {
    const claimPath = `/claim/${encodeURIComponent(escortId ?? '')}`
    const alreadyClaimed = !!escort?.user_id
    return (
      <main className="min-h-screen bg-dark-bg">
        <Header />
        <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
          {profileLoading ? (
            <p className="text-sm text-text-muted mb-6">Loading profile…</p>
          ) : escort ? (
            <div className="flex items-center gap-4 mb-6 p-4 bg-card-bg border border-color rounded-2xl">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-dark-bg">
                {escort.image
                  ? <img src={escort.image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[#8B0000]/50">{(escort.name || '?')[0]}</div>
                }
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Profile to claim</p>
                <h2 className="font-bold text-text-light truncate">{escort.name}</h2>
                <p className="text-xs text-text-muted">{escort.area}, {escort.city}</p>
              </div>
            </div>
          ) : (
            <p role="status" className="text-sm text-red-300 mb-6 p-3 bg-red-400/10 rounded-xl">
              {profileError || 'This profile could not be loaded.'}
            </p>
          )}

          <section className="p-5 sm:p-7 bg-card-bg border border-color rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={20} className="text-[#8B0000]" />
              <span className="text-xs uppercase tracking-widest font-bold text-text-muted">Claim a profile</span>
            </div>
            <h1 className="text-2xl font-black text-text-light mb-2">
              {escort?.name ? `Claim ${escort.name}’s profile` : 'Claim this profile'}
            </h1>
            {!alreadyClaimed && escort && (
              <p data-testid="status-unclaimed-profile" className="text-sm text-text-muted leading-relaxed mb-4">
                This profile was imported from another directory and hasn’t been verified on Wet3Camp, so no account here manages it yet. If it belongs to you, continue to verify and manage it.
              </p>
            )}
            <p className="text-sm text-text-muted leading-relaxed mb-6">
              Sign in or create a free account, then verify that this profile belongs to you. We’ll bring you back here after sign-in.
            </p>
            <div data-testid="notice-claim-no-duplicate" className="mb-6 rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-3.5">
              <p className="text-xs text-text-muted leading-relaxed">{CLAIM_ACCOUNT_NOTICE}</p>
            </div>

            <ol className="space-y-3 mb-7">
              {[
                ['1', 'Sign in or create an account', oauthConfig.providers.google || oauthConfig.providers.telegram ? 'Google or Telegram can create your account automatically the first time.' : 'Use email to sign in or create your account.'],
                ['2', 'Verify your connection', 'Choose an available verification option.'],
                ['3', 'Wait for review', 'Our team reviews your request and lets you know the result.'],
              ].map(([number, title, detail]) => (
                <li key={number} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-[#8B0000]/15 text-[#8B0000] flex items-center justify-center text-xs font-black flex-shrink-0">{number}</span>
                  <div>
                    <p className="text-sm font-bold text-text-light">{title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            {!escort ? (
              <button
                data-testid="button-claim-back"
                onClick={() => setLocation('/')}
                className="w-full py-3.5 px-4 bg-dark-bg border border-color text-text-light font-bold text-sm rounded-xl hover:border-[#8B0000]/50 transition-colors"
              >
                Back to browsing
              </button>
            ) : alreadyClaimed ? (
              <p className="p-3 text-sm text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                This profile has already been claimed. Please contact support if you believe it belongs to you.
              </p>
            ) : (
              <div className="space-y-3">
                {oauthConfig.providers.google && <button
                  data-testid="button-claim-google"
                  onClick={() => window.location.assign(`/api/auth/google?redirect=${encodeURIComponent(claimPath)}`)}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white text-gray-800 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>}
                {oauthConfig.providers.telegram && <button
                  data-testid="button-claim-telegram"
                  onClick={() => window.location.assign(`/api/auth/telegram?redirect=${encodeURIComponent(claimPath)}`)}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#229ED9]/10 border border-[#229ED9]/30 text-text-light font-bold text-sm rounded-xl hover:bg-[#229ED9]/20 transition-colors"
                >
                  <Send size={17} className="text-[#229ED9]" />
                  Continue with Telegram
                </button>}
                <button
                  data-testid="button-claim-email"
                  onClick={() => setLocation(`/login?redirect=${encodeURIComponent(claimPath)}&intent=claim`)}
                  className="w-full py-3.5 px-4 bg-dark-bg border border-color text-text-light font-bold text-sm rounded-xl hover:border-[#8B0000]/50 transition-colors"
                >
                  Continue with email
                </button>
                <p className="text-[11px] text-center text-text-muted">
                  {oauthConfig.providers.google || oauthConfig.providers.telegram
                    ? 'Use the same verified email to connect Telegram to an existing account without creating a duplicate.'
                    : 'Email works for existing accounts and lets new users create a free account.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    )
  }

  // ── SMS / OTP flow ──────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setLoading(true); setError('')
    try {
      const response = await apiFetch(`/escorts/${escortId}/claim/send-otp`, { method: 'POST' })
      setStep('otp-sent')
      setInfo(response.message || 'A verification code was sent to the phone number on this profile.')
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
  const sendEmailOtp = async () => {
    setLoading(true); setError('')
    try {
      const response = await apiFetch(`/escorts/${escortId}/claim/send-email-otp`, { method: 'POST' })
      setEmailDestination(response.message || 'A verification code was sent to your account email.')
      setEmailOtp('')
      setStep('email-otp-sent')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const verifyEmailOtp = async () => {
    if (!emailOtp.trim()) { setError('Enter the verification code'); return }
    setLoading(true); setError('')
    try {
      await apiFetch(`/escorts/${escortId}/claim/verify-email-otp`, {
        method: 'POST',
        body: JSON.stringify({ code: emailOtp }),
      })
      setStep('verified')
      setInfo('')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  // ── Video flow ──────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setError('')
    let stream: MediaStream | null = null
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      stream = cameraStream
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream
        void videoRef.current.play().catch(() => {})
      }
      const recorder = new MediaRecorder(cameraStream)
      const chunks: Blob[] = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setVideoBlob(blob)
        setVideoUrl(URL.createObjectURL(blob))
        cameraStream.getTracks().forEach(t => t.stop())
        if (videoRef.current) videoRef.current.srcObject = null
      }
      recorder.start()
      setMediaRecorder(recorder)
      setRecording(true)
    } catch {
      stream?.getTracks().forEach(track => track.stop())
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
    if (!['video/webm', 'video/mp4', 'video/quicktime'].includes(file.type)) {
      setError('Choose a WebM, MP4, or QuickTime video.')
      e.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('The verification video must be no larger than 8 MB.')
      e.target.value = ''
      return
    }
    setError('')
    setVideoBlob(file)
    setVideoUrl(URL.createObjectURL(file))
  }

  const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the verification video.'))
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not read the verification video.'))
    reader.readAsDataURL(blob)
  })

  const submitVideoClaim = async () => {
    if (!videoBlob) { setError('Please record or upload a video first.'); return }
    if (videoBlob.size > 8 * 1024 * 1024) { setError('The verification video must be no larger than 8 MB.'); return }
    setLoading(true); setError('')
    try {
      const videoData = await blobToDataUrl(videoBlob)
      const response = await apiFetch(`/escorts/${escortId}/claim`, {
        method: 'POST',
        body: JSON.stringify({
          verification_method: 'video',
          verification_video: videoData,
          message,
        }),
      })
      setSubmissionInfo(response.emailNotifications?.claimantSent
        ? 'A confirmation email was sent to your account address.'
        : 'Your request is saved. No email confirmation was sent, so check this page for updates.')
      if (response.mergeTarget) setMergeTarget(response.mergeTarget)
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
      const response = await apiFetch(`/escorts/${escortId}/claim`, {
        method: 'POST',
        body: JSON.stringify({ message, verification_method: method }),
      })
      setSubmissionInfo(response.emailNotifications?.claimantSent
        ? 'A confirmation email was sent to your account address.'
        : 'Your request is saved. No email confirmation was sent, so check this page for updates.')
      if (response.mergeTarget) setMergeTarget(response.mergeTarget)
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
                {existingStatus === 'pending' && (mergeTarget
                  ? `Your duplicate claim is being reviewed. If approved, this listing will be merged into ${mergeTarget.name}.`
                  : 'Your claim is being reviewed by our team. Check this page for updates. If email delivery is available, we’ll also send the result to your account address.')}
                {existingStatus === 'approved' && (mergeTarget
                  ? `Your claim was approved and this listing was merged into ${mergeTarget.name}.`
                  : "Your claim was approved! You can now edit and manage this profile.")}
                {existingStatus === 'rejected' && "Your claim was not approved. Contact support if you believe this is a mistake."}
              </p>
              {existingStatus === 'approved' && (
                <button
                  onClick={() => setLocation(`/profile/${mergeTarget?.id ?? escortId}`)}
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
                  This profile was imported from another directory and hasn’t been verified on Wet3Camp, so no account here manages it yet. Choose how you’d like to verify your identity and claim it.
                </p>
                <div data-testid="notice-claim-no-duplicate" className="mt-3 rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-3.5">
                  <p className="text-xs text-text-muted leading-relaxed">{CLAIM_ACCOUNT_NOTICE}</p>
                </div>
                {mergeTarget && (
                  <div className="mt-3 rounded-xl border border-[#8B0000]/30 bg-[#8B0000]/10 p-3.5">
                    <p className="text-xs text-text-light leading-relaxed">
                      You already manage <strong>{mergeTarget.name}</strong>. If this listing is yours too, your request will be reviewed as a duplicate and, if approved, merged into that profile. It won’t create a second managed listing.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Choose verification method</p>
              {methodsError && (
                <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300" role="alert">
                  <p>{methodsError}</p>
                  <button
                    onClick={() => {
                      setMethodsError('')
                      setClaimMethods(null)
                      apiFetch(`/escorts/${escortId}/claim-options`)
                        .then(d => {
                          setClaimMethods(d.methods)
                          setMethod(d.methods.email ? 'email' : d.methods.sms && hasPhone ? 'sms' : 'video')
                        })
                        .catch(() => setMethodsError('Available verification options could not be loaded. Please retry.'))
                    }}
                    className="mt-2 text-xs font-bold underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!claimMethods && !methodsError && (
                <p className="mb-4 text-xs text-text-muted" role="status">Loading verification options…</p>
              )}
              <div className="space-y-3 mb-6">

                {claimMethods?.sms && hasPhone && (
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

                {claimMethods?.email && <button
                  onClick={() => setMethod('email')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${method === 'email' ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-color bg-card-bg hover:border-[#8B0000]/40'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'email' ? 'bg-[#8B0000]' : 'bg-dark-bg'}`}>
                    <Mail size={18} className={method === 'email' ? 'text-white' : 'text-text-muted'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-light">Email Verification</p>
                    <p className="text-xs text-text-muted">Send a one-time code to your account email</p>
                  </div>
                  {method === 'email' && <CheckCircle2 size={18} className="text-[#8B0000] flex-shrink-0" />}
                </button>}

                {claimMethods?.video && <button
                  onClick={() => setMethod('video')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${method === 'video' ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-color bg-card-bg hover:border-[#8B0000]/40'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method === 'video' ? 'bg-[#8B0000]' : 'bg-dark-bg'}`}>
                    <Video size={18} className={method === 'video' ? 'text-white' : 'text-text-muted'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-light">Live Video / Selfie</p>
                    <p className="text-xs text-text-muted">Record or upload a short selfie video for private admin review</p>
                  </div>
                  {method === 'video' && <CheckCircle2 size={18} className="text-[#8B0000] flex-shrink-0" />}
                </button>}
              </div>
              {claimMethods && !claimMethods.email && !claimMethods.video && !(claimMethods.sms && hasPhone) && (
                <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">
                  No claim verification methods are ready. Please contact support.
                </p>
              )}

              {error && <p className="text-sm text-red-400 mb-4 p-3 bg-red-400/10 rounded-xl">{error}</p>}

              <button
                onClick={() => {
                  setError('')
                  if (method === 'sms' && claimMethods?.sms && hasPhone) sendOtp()
                  else if (method === 'email' && claimMethods?.email) sendEmailOtp()
                  else if (method === 'video' && claimMethods?.video) setStep('video-record')
                  else setError('Please choose a verification method.')
                }}
                disabled={loading || !claimMethods || !!methodsError ||
                  (!claimMethods.email && !claimMethods.video && !(claimMethods.sms && hasPhone))}
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
                disabled={loading || otp.length !== 6}
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

          {/* STEP: Email OTP */}
          {step === 'email-otp-sent' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail size={20} className="text-[#8B0000]" />
                <h1 className="text-lg font-bold text-text-light">Enter Email Code</h1>
              </div>
              <p className="text-sm text-text-muted mb-5 leading-relaxed" role="status">
                {emailDestination || 'A verification code was sent to your account email.'} The code expires in 10 minutes.
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={emailOtp}
                onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className="w-full px-4 py-3.5 bg-dark-bg border border-color rounded-xl text-center text-2xl font-bold text-text-light tracking-[0.5em] placeholder-text-muted/40 focus:outline-none focus:border-[#8B0000] transition-all mb-4"
              />

              {error && <p className="text-sm text-red-400 mb-4 p-3 bg-red-400/10 rounded-xl">{error}</p>}

              <button
                onClick={verifyEmailOtp}
                disabled={loading || emailOtp.length !== 6}
                className="w-full py-3.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={15} />}
                Verify Email
              </button>
              <button onClick={sendEmailOtp} disabled={loading} className="w-full py-2 text-xs text-text-muted hover:text-text-light transition-colors disabled:opacity-50">
                Didn't receive a code? Resend
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
                Record a short selfie video (5–15 seconds) holding a piece of paper with today’s date and the name on this profile. The clip is stored privately with your claim and only admins can view it.
              </p>

              <video
                ref={videoRef}
                className={`w-full rounded-xl bg-dark-bg border-2 border-[#8B0000]/50 aspect-video object-cover ${recording ? 'block' : 'hidden'}`}
                muted
                playsInline
              />

              {!videoUrl ? (
                <div className="space-y-3 mb-5">
                  {!recording ? (
                    <>
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
                      <input ref={fileInputRef} type="file" accept="video/webm,video/mp4,video/quicktime" className="hidden" onChange={handleVideoUpload} />
                    </>
                  ) : (
                    <div className="space-y-3">
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
                Your {method === 'email' ? 'email address' : 'phone number'} is verified. Add an optional note for the admin reviewing your claim.
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
                {mergeTarget
                  ? `Your request is under review. If approved, this listing will be merged into ${mergeTarget.name}; it won’t create a second managed profile.`
                  : 'Your profile claim is under review. Our team typically responds within 24 hours.'}
                {' '}{submissionInfo}
              </p>
              <button
                onClick={() => setLocation(`/profile/${mergeTarget?.id ?? escortId}`)}
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
