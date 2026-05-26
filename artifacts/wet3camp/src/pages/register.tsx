import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import {
  Flame, User, Mail, Phone, Lock, Eye, EyeOff, MapPin, Camera,
  CheckCircle2, ChevronRight, AlertCircle, Navigation, Calendar,
  MessageCircle, Globe, DollarSign, ShieldCheck, Loader2, RefreshCw,
  Instagram, Facebook
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { api, setToken } from '@/lib/api'
import { CITIES } from '@/data/escorts'
import { useSEO } from '@/lib/useSEO'

const BODY_TYPES   = ['Slim', 'Athletic', 'Curvy', 'Petite', 'BBW', 'Average', 'Muscular']
const ETHNICITIES  = ['Kenyan', 'African', 'Asian', 'Mixed Race', 'European', 'Middle Eastern', 'Latin', 'Other']
const HEIGHTS      = ["4'10\"","4'11\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\"","6'3\""]
const HAIR_COLORS  = ['Black', 'Dark Brown', 'Brown', 'Auburn', 'Blonde', 'Red', 'Natural', 'Braids', 'Locs', 'Coloured / Dyed']
const LANGUAGES    = ['English','Swahili','French','Arabic','Hindi','Luo','Kikuyu','Kalenjin','Kamba','German','Spanish','Italian','Somali','Oromo','Luganda']
const SERVICE_CATEGORIES: Record<string, string[]> = {
  'Companion':   ['Dinner Dates', 'Travel Companion', 'Events & Functions', 'Hotel Visits', 'Weekend Trips', 'Dancing Partner', 'Virtual Companion', 'Video Calls'],
  'Physical':    ['In-Call', 'Out-Call', 'Overnight', 'Erotic Massage', 'Body Rub', 'Tantric Massage', 'Body Slide', 'Strip Tease', 'Lap Dance'],
  'Experience':  ['GFE (Girlfriend Experience)', 'PSE (Porn Star Experience)', 'Role Play', 'Fantasy / Cosplay', 'Couples Welcome', 'Threesome (FFM)', 'Threesome (MMF)', 'Group / Orgy'],
  'BDSM & Kink': ['BDSM', 'Dominatrix', 'Submissive', 'Bondage', 'Foot Fetish', 'Spanking', 'Fetish Services', 'Golden Shower', 'Pegging'],
  'Online':      ['Webcam / Camgirl', 'Sexting', 'Custom Videos', 'OnlyFans Management'],
}
const SERVICES = Object.values(SERVICE_CATEGORIES).flat()

const STEP_LABELS: Record<string, string> = {
  role: 'Role', method: 'Sign Up', details: 'Details', otp: 'Verify',
  physical: 'Physique', contact: 'Contact', services: 'Services',
  rates: 'Rates', photos: 'Photos', pose: 'Pose', confirm: 'Confirm',
}

const getMax18YearsAgo = () => {
  const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]
}

function calcAge(dob: string): number | null {
  if (!dob) return null
  const b = new Date(dob), t = new Date()
  let a = t.getFullYear() - b.getFullYear()
  const m = t.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--
  return a
}

function ServicesStep({ selServices, toggleService }: { selServices: string[]; toggleService: (s: string) => void }) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const cats = ['All', ...Object.keys(SERVICE_CATEGORIES)]
  const filtered = Object.entries(SERVICE_CATEGORIES)
    .filter(([c]) => cat === 'All' || c === cat)
    .flatMap(([, svcs]) => svcs)
    .filter(s => s.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <h2 className="text-xl font-black text-text-light mb-1">Services Offered</h2>
      <p className="text-sm text-text-muted mb-4">Select all you provide <span className="text-[#FFD700] font-bold">({selServices.length} selected)</span></p>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search services…"
        className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] mb-3 transition-all"
      />
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex-shrink-0 transition-all ${cat === c ? 'bg-[#8B0000] text-white' : 'bg-dark-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>
        ))}
      </div>
      {search && filtered.length === 0 && (
        <p className="text-sm text-text-muted text-center py-4">No services match "{search}"</p>
      )}
      <div className="flex flex-wrap gap-2">
        {filtered.map(s => (
          <button key={s} onClick={() => toggleService(s)} className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${selServices.includes(s) ? 'bg-[#8B0000] border-[#8B0000] text-white shadow-lg shadow-[#8B0000]/20' : 'bg-dark-bg border-color text-text-muted hover:border-[#8B0000]/40'}`}>
            {selServices.includes(s) ? '✓ ' : ''}{s}
          </button>
        ))}
      </div>
      {selServices.length > 0 && (
        <div className="mt-4 p-4 bg-card-bg border border-[#8B0000]/30 rounded-2xl">
          <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-2">{selServices.length} services selected</p>
          <div className="flex flex-wrap gap-1.5">
            {selServices.map(s => <span key={s} className="text-[10px] bg-[#8B0000]/20 text-[#8B0000] px-2 py-1 rounded-lg font-semibold">{s}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RegisterPage() {
  useSEO({
    title: 'Join Wet3 Camp — Register Free',
    description: 'Create your free account on Wet3 Camp. Register as a client to browse escorts, or as an escort to list your profile and earn in Kenya.',
    keywords: 'register escort Kenya, join escort platform Kenya, escort account Nairobi, companion sign up',
    canonicalPath: '/register',
  })
  const { login } = useAuth()
  const [, navigate] = useLocation()

  // Step management
  const [role, setRole]             = useState<'client'|'escort'|null>(null)
  const [authMethod, setAuthMethod] = useState<'manual'|'oauth'|null>(null)
  const [oauthProvider, setOauthProvider] = useState<string|null>(null)
  const [stepIdx, setStepIdx]       = useState(0)

  // Basic details
  const [name, setName]             = useState('')
  const [username, setUsername]     = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [dob, setDob]               = useState('')
  const [city, setCity]             = useState('')
  const [area, setArea]             = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  // OTP
  const [otpDigits, setOtpDigits]   = useState(['','','','','',''])
  const [otpSent, setOtpSent]       = useState(false)
  const [otpTimer, setOtpTimer]     = useState(60)
  const [otpVerified, setOtpVerified] = useState(false)
  const otpRefs = useRef<(HTMLInputElement|null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Physical (escort)
  const [bodyType, setBodyType]     = useState('')
  const [ethnicity, setEthnicity]   = useState('')
  const [height, setHeight]         = useState('')
  const [hairColor, setHairColor]   = useState('')

  // Contact (escort)
  const [bio, setBio]               = useState('')
  const [whatsapp, setWhatsapp]     = useState('')
  const [telegram, setTelegram]     = useState('')
  const [selLangs, setSelLangs]     = useState<string[]>([])

  // Services & rates (escort)
  const [selServices, setSelServices] = useState<string[]>([])
  const [rateHourly, setRateHourly]   = useState('3000')
  const [rateOvernight, setRateOvernight] = useState('25000')
  const [rateVideo, setRateVideo]     = useState('1500')

  // Photos & pose (escort)
  const [photos, setPhotos]         = useState<string[]>([])
  const [poseSelfie, setPoseSelfie] = useState<string|null>(null)
  const photosRef = useRef<HTMLInputElement>(null)
  const poseRef   = useRef<HTMLInputElement>(null)

  // UI
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  // Compute steps
  const STEPS: string[] = (() => {
    const base = ['role', 'method']
    if (!role || !authMethod) return base
    const manual = authMethod === 'manual'
    if (role === 'client') {
      return manual ? [...base, 'details', 'otp', 'confirm'] : [...base, 'confirm']
    }
    const escortExtra = ['physical', 'contact', 'services', 'rates', 'photos', 'pose', 'confirm']
    return manual ? [...base, 'details', 'otp', ...escortExtra] : [...base, ...escortExtra]
  })()

  const currentStep = STEPS[stepIdx] ?? 'role'
  const isLastStep  = stepIdx === STEPS.length - 1
  const progress    = STEPS.length > 1 ? Math.round((stepIdx / (STEPS.length - 1)) * 100) : 0
  const cityData    = CITIES.find(c => c.name === city)
  const age         = calcAge(dob)

  // OTP timer
  useEffect(() => {
    if (!otpSent || otpTimer <= 0) return
    timerRef.current = setInterval(() => setOtpTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0 } return t - 1 }), 1000)
    return () => clearInterval(timerRef.current)
  }, [otpSent])

  const [usernameAvail, setUsernameAvail] = useState<boolean | null>(null)
  const [emailAvail, setEmailAvail]       = useState<boolean | null>(null)

  useEffect(() => {
    if (!username || username.length < 3) { setUsernameAvail(null); return }
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/auth/check?username=${encodeURIComponent(username)}`); const d = await r.json(); setUsernameAvail(!!d.available) } catch { setUsernameAvail(null) }
    }, 500)
    return () => clearTimeout(t)
  }, [username])

  useEffect(() => {
    if (!email || !email.includes('@')) { setEmailAvail(null); return }
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/auth/check?email=${encodeURIComponent(email)}`); const d = await r.json(); setEmailAvail(!!d.available) } catch { setEmailAvail(null) }
    }, 500)
    return () => clearTimeout(t)
  }, [email])

  const sendOtp = async () => {
    if (!email) { setError('Enter your email address first.'); return }
    if (!email.includes('@')) { setError('Enter a valid email address.'); return }
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {}
    setOtpSent(true); setOtpTimer(60); setOtpDigits(['','','','','',''])
    setError('')
  }

  const handleOtpKey = (i: number, val: string, key?: string) => {
    if (key === 'Backspace' && !val) {
      otpRefs.current[i - 1]?.focus(); return
    }
    if (!/^\d?$/.test(val)) return
    const next = [...otpDigits]; next[i] = val; setOtpDigits(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
    if (next.every(d => d)) {
      const code = next.join('')
      if (code === '123456') { setOtpVerified(true); return }
      fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      }).then(r => r.json()).then(data => {
        if (data.verified) setOtpVerified(true)
        else setError('Invalid code. Please try again.')
      }).catch(() => { if (code === '123456') setOtpVerified(true) })
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        let nearest = CITIES[0], minD = Infinity
        CITIES.forEach(c => { const d = Math.hypot(c.lat - lat, c.lng - lng); if (d < minD) { minD = d; nearest = c } })
        setCity(nearest.name); setArea(nearest.areas[0]); setGeoLoading(false)
      },
      () => { setError('Could not detect location. Select manually.'); setGeoLoading(false) }
    )
  }

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPhotos(p => [...p, ev.target?.result as string].slice(0, 8))
      reader.readAsDataURL(file)
    })
  }

  const handlePoseSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPoseSelfie(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const toggleLang    = (l: string) => setSelLangs(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l])
  const toggleService = (s: string) => setSelServices(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const validate = (): boolean => {
    setError('')
    if (currentStep === 'role'     && !role)       { setError('Choose your role.'); return false }
    if (currentStep === 'method'   && !authMethod) { setError('Choose a sign-up method.'); return false }
    if (currentStep === 'details') {
      if (!name || !email || !dob || !city || !area || !password || !confirmPass)
        { setError('Please fill in all required fields.'); return false }
      if (!email.includes('@')) { setError('Enter a valid email.'); return false }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return false }
      if (password !== confirmPass) { setError('Passwords do not match.'); return false }
      if (!age || age < 18) { setError('You must be 18 or older to register.'); return false }
    }
    if (currentStep === 'otp') {
      if (!otpSent) { setError('Send the verification code to your email first.'); return false }
      if (otpDigits.join('').length < 6) { setError('Enter the 6-digit code sent to your email.'); return false }
      if (!otpVerified) { setError('Please verify your email by entering the code.'); return false }
    }
    if (currentStep === 'physical') {
      if (!bodyType || !ethnicity || !height || !hairColor) { setError('Fill in all physical attributes.'); return false }
    }
    if (currentStep === 'contact') {
      if (bio.length < 50) { setError('Bio must be at least 50 characters.'); return false }
      if (selLangs.length === 0) { setError('Select at least one language.'); return false }
    }
    if (currentStep === 'services') {
      if (selServices.length === 0) { setError('Select at least one service.'); return false }
    }
    if (currentStep === 'photos') {
      if (photos.length < 3) { setError('Upload at least 3 photos.'); return false }
    }
    if (currentStep === 'pose') {
      if (!poseSelfie) { setError('Upload your verification selfie in the required pose.'); return false }
    }
    return true
  }

  const next = () => {
    if (!validate()) return
    if (currentStep === 'method' && authMethod === 'oauth') {
      setName('User via ' + (oauthProvider ?? 'OAuth'))
      setEmail(oauthProvider + '@oauth.placeholder')
    }
    if (currentStep === 'method' && authMethod === 'manual' && currentStep === 'method') {
      // advance normally
    }
    setStepIdx(s => s + 1)
  }

  const back = () => { setError(''); setStepIdx(s => Math.max(0, s - 1)) }

  const handleOAuthClick = (provider: string) => {
    setOauthProvider(provider); setAuthMethod('oauth')
  }

  const handleSubmit = async () => {
    if (!agreeTerms) { setError('Please agree to the Terms of Service.'); return }
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, any> = {
        name, email, password,
        phone: phone || undefined,
        role: role === 'escort' ? 'escort' : 'user',
        city, area,
      }
      if (role === 'escort') {
        Object.assign(payload, {
          bio, whatsapp, telegram,
          bodyType, ethnicity, height, hairColor,
          languages: selLangs,
          services: selServices,
          rateHourly:   parseInt(rateHourly)   || 3000,
          rateOvernight: parseInt(rateOvernight) || 25000,
          rateVideo:    parseInt(rateVideo)    || 1500,
        })
      }
      const res = await api.auth.register(payload as any)
      setToken(res.token)
      login({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role === 'user' ? 'client' : (res.user.role as any),
        phone: res.user.phone ?? undefined,
        profileId: res.escortId ?? undefined,
      })
      navigate(role === 'escort' ? '/my-profile' : '/')
    } catch (err: any) {
      if ((err?.code === 'NO_DB' || err?.status === 503) && import.meta.env.DEV) {
        login({ id: `user-${Date.now()}`, name: name || 'New User', email, role: role!, city, area, phone })
        navigate(role === 'escort' ? '/my-profile' : '/')
        return
      }
      setError(err?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all"
  const selectCls = inputCls + " appearance-none"
  const labelCls = "text-[10px] text-text-muted uppercase tracking-widest block mb-1.5"

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-card-bg border-b border-color px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center">
            <Flame size={15} className="text-white" />
          </div>
          <span className="text-sm font-black text-text-light">Wet3<span className="text-[#FFD700]">Camp</span></span>
        </Link>
        <Link href="/login" className="text-xs text-text-muted hover:text-[#FFD700] transition-colors">
          Have an account? <span className="text-[#FFD700]">Sign in</span>
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-light capitalize">
              Step {stepIdx + 1} of {STEPS.length}: {STEP_LABELS[currentStep] ?? currentStep}
            </span>
            <span className="text-xs text-text-muted">{progress}% complete</span>
          </div>
          <div className="w-full h-1.5 bg-card-bg rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#8B0000] to-[#FFD700] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
            <AlertCircle size={14} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#EF4444]">{error}</p>
          </div>
        )}

        {/* ── STEP: ROLE ── */}
        {currentStep === 'role' && (
          <div>
            <h1 className="text-2xl font-black text-text-light mb-1">Join Wet3 Camp</h1>
            <p className="text-sm text-text-muted mb-6">Choose how you'd like to use the platform</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { r:'client', icon:'👤', title:"I'm a Client", desc:'Browse and connect with companions', perks:['Access all profiles','Private messaging','Discreet billing','Rate escorts'], color:'#2196F3' },
                { r:'escort', icon:'⭐', title:"I'm an Escort", desc:'List your profile and earn', perks:['Get verified badge','More bookings','Manage schedule','Secure payments'], color:'#8B0000' },
              ].map(({ r, icon, title, desc, perks, color }) => (
                <button key={r} onClick={() => setRole(r as 'client'|'escort')} className={`p-5 rounded-2xl border-2 text-left transition-all ${role === r ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-color bg-card-bg hover:border-[#8B0000]/40'}`}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: color + '20' }}>{icon}</div>
                  <p className="font-bold text-text-light text-sm mb-1">{title}</p>
                  <p className="text-[11px] text-text-muted mb-3">{desc}</p>
                  <div className="space-y-1">
                    {perks.map(p => <div key={p} className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-[#28a745]" /><span className="text-[10px] text-text-muted">{p}</span></div>)}
                  </div>
                  {role === r && <div className="mt-3 text-[10px] text-[#8B0000] font-bold flex items-center gap-1"><CheckCircle2 size={10} fill="#8B0000" className="text-white" /> Selected</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: METHOD ── */}
        {currentStep === 'method' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">How to sign up</h2>
            <p className="text-sm text-text-muted mb-6">Choose a quick social login or register manually</p>
            <div className="space-y-3 mb-6">
              <button onClick={() => handleOAuthClick('google')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all font-semibold text-sm ${authMethod==='oauth'&&oauthProvider==='google'?'border-[#8B0000] bg-[#8B0000]/10 text-text-light':'bg-dark-bg border-color text-text-light hover:border-[#8B0000]/40'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <button onClick={() => handleOAuthClick('facebook')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all font-semibold text-sm ${authMethod==='oauth'&&oauthProvider==='facebook'?'border-[#8B0000] bg-[#8B0000]/10 text-text-light':'bg-[#1877F2]/10 border-[#1877F2]/30 text-text-light hover:border-[#1877F2]/60'}`}>
                <Facebook size={18} className="text-[#1877F2]" />
                Continue with Facebook
              </button>
              <button onClick={() => handleOAuthClick('apple')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all font-semibold text-sm ${authMethod==='oauth'&&oauthProvider==='apple'?'border-[#8B0000] bg-[#8B0000]/10 text-text-light':'bg-dark-bg border-color text-text-light hover:border-color/80'}`}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Continue with Apple
              </button>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-color" />
              <span className="text-xs text-text-muted">OR</span>
              <div className="flex-1 h-px bg-color" />
            </div>
            <button onClick={() => setAuthMethod('manual')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all font-semibold text-sm ${authMethod==='manual'?'border-[#8B0000] bg-[#8B0000]/10 text-text-light':'bg-card-bg border-color text-text-muted hover:border-[#8B0000]/40 hover:text-text-light'}`}>
              <Mail size={18} />
              Register with Email (OTP Verification)
              {role === 'escort' && <span className="ml-auto text-[10px] bg-[#28a745]/20 text-[#28a745] px-2 py-0.5 rounded-full">Recommended</span>}
            </button>
            {role === 'escort' && (
              <p className="text-[11px] text-text-muted mt-3 text-center">
                Escorts must verify their email address. A code will be sent to your inbox.
              </p>
            )}
          </div>
        )}

        {/* ── STEP: DETAILS ── */}
        {currentStep === 'details' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Your Details</h2>
            <p className="text-sm text-text-muted mb-5">Basic information about you</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" /><input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Doe" className={inputCls} style={{paddingLeft:'2.25rem'}}/></div>
                </div>
                <div>
                  <label className={labelCls}>Username *</label>
                  <div className="relative">
                    <input value={username} onChange={e=>{setUsername(e.target.value.toLowerCase().replace(/\s/g,''));setUsernameAvail(null)}} placeholder="jane_k" className={inputCls + (usernameAvail===true?' border-[#28a745]':usernameAvail===false?' border-[#EF4444]':'')} style={{paddingRight:'5.5rem'}}/>
                    {usernameAvail!==null && <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold ${usernameAvail?'text-[#28a745]':'text-[#EF4444]'}`}>{usernameAvail?'✓ Free':'✗ Taken'}</span>}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10" />
                  <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setEmailAvail(null)}} placeholder="you@example.com" className={inputCls + (emailAvail===true?' border-[#28a745]':emailAvail===false?' border-[#EF4444]':'')} style={{paddingLeft:'2.25rem',paddingRight:'5.5rem'}}/>
                  {emailAvail!==null && <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold ${emailAvail?'text-[#28a745]':'text-[#EF4444]'}`}>{emailAvail?'✓ Free':'✗ Taken'}</span>}
                </div>
              </div>
              <div>
                <label className={labelCls}>Phone <span className="text-[9px] text-text-muted">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇪</span>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254 700 000 000" className={inputCls} style={{paddingLeft:'2.25rem'}}/>
                </div>
              </div>
              <div>
                <label className={labelCls}>Date of Birth * <span className="text-[9px] ml-1">(must be 18+)</span></label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="date" value={dob} onChange={e=>setDob(e.target.value)}
                    max={getMax18YearsAgo()}
                    className={inputCls + " [color-scheme:dark]"} style={{paddingLeft:'2.25rem'}}
                  />
                </div>
                {age !== null && (
                  <p className={`text-[11px] mt-1 flex items-center gap-1 ${age >= 18 ? 'text-[#28a745]' : 'text-[#EF4444]'}`}>
                    <CheckCircle2 size={10} /> Age: {age} years old {age < 18 ? '— must be 18+' : ''}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls} style={{margin:0}}>Location *</label>
                  <button type="button" onClick={detectLocation} disabled={geoLoading} className="flex items-center gap-1 text-[10px] text-[#2196F3] hover:underline disabled:opacity-50">
                    {geoLoading ? <div className="w-2.5 h-2.5 border border-[#2196F3]/40 border-t-[#2196F3] rounded-full animate-spin" /> : <Navigation size={10} />}
                    {geoLoading ? 'Detecting…' : 'Detect my location'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <select value={city} onChange={e=>{setCity(e.target.value);setArea('')}} className={selectCls} style={{paddingLeft:'2.25rem'}}>
                      <option value="">City</option>
                      {CITIES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <select value={area} onChange={e=>setArea(e.target.value)} disabled={!city} className={selectCls + " disabled:opacity-50"}>
                    <option value="">Area</option>
                    {cityData?.areas.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Password *</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 8 chars" className={inputCls} style={{paddingLeft:'2.25rem',paddingRight:'2rem'}}/>
                    <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">{showPass?<EyeOff size={13}/>:<Eye size={13}/>}</button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Confirm *</label>
                  <input type={showPass?'text':'password'} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Repeat password" className={inputCls}/>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: OTP ── */}
        {currentStep === 'otp' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#8B0000]/20 flex items-center justify-center mx-auto mb-3">
                <Mail size={28} className="text-[#8B0000]" />
              </div>
              <h2 className="text-xl font-black text-text-light mb-1">Verify Your Email</h2>
              <p className="text-sm text-text-muted">We'll send a 6-digit code to <span className="text-[#FFD700] font-semibold">{email || 'your@email.com'}</span></p>
            </div>

            {!otpSent ? (
              <button onClick={sendOtp} className="w-full py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Mail size={15} /> Send verification code to my email
              </button>
            ) : (
              <div>
                <div className="flex justify-center gap-2 mb-4">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleOtpKey(i, e.target.value)}
                      onKeyDown={e => e.key === 'Backspace' && handleOtpKey(i, d, 'Backspace')}
                      className={`w-12 h-14 text-center text-xl font-black rounded-xl border-2 bg-dark-bg text-text-light focus:outline-none transition-all ${d ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-color focus:border-[#8B0000]'}`}
                    />
                  ))}
                </div>
                {otpVerified ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-[#28a745]/10 border border-[#28a745]/30 rounded-xl mb-4">
                    <CheckCircle2 size={16} className="text-[#28a745]" fill="#28a745" />
                    <span className="text-sm font-bold text-[#28a745]">Phone verified!</span>
                  </div>
                ) : (
                  <p className="text-center text-xs text-text-muted mb-4">
                    {otpTimer > 0 ? `Resend in ${otpTimer}s` : (
                      <button onClick={sendOtp} className="text-[#2196F3] hover:underline flex items-center gap-1 mx-auto">
                        <RefreshCw size={11} /> Resend OTP
                      </button>
                    )}
                  </p>
                )}
                <p className="text-center text-[10px] text-text-muted">Demo: enter <span className="text-[#FFD700] font-mono">123456</span> to verify</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: PHYSICAL (escort) ── */}
        {currentStep === 'physical' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Physical Attributes</h2>
            <p className="text-sm text-text-muted mb-5">This information is shown on your public profile</p>
            {dob && age !== null && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-xl">
                <Calendar size={13} className="text-[#FFD700]" />
                <span className="text-xs text-text-muted">Your age from DOB: <span className="text-[#FFD700] font-bold">{age} years old</span> — shown on your profile</span>
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Body Type *</label>
                  <select value={bodyType} onChange={e=>setBodyType(e.target.value)} className={selectCls}>
                    <option value="">Select…</option>
                    {BODY_TYPES.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Ethnicity *</label>
                  <select value={ethnicity} onChange={e=>setEthnicity(e.target.value)} className={selectCls}>
                    <option value="">Select…</option>
                    {ETHNICITIES.map(e=><option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Height *</label>
                  <select value={height} onChange={e=>setHeight(e.target.value)} className={selectCls}>
                    <option value="">Select…</option>
                    {HEIGHTS.map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Hair Color *</label>
                  <select value={hairColor} onChange={e=>setHairColor(e.target.value)} className={selectCls}>
                    <option value="">Select…</option>
                    {HAIR_COLORS.map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              {bodyType && ethnicity && height && hairColor && (
                <div className="p-3 bg-[#28a745]/10 border border-[#28a745]/20 rounded-xl">
                  <p className="text-[11px] text-[#28a745] font-semibold mb-1">Profile preview</p>
                  <p className="text-[11px] text-text-muted">{height} · {bodyType} · {ethnicity} · {hairColor} hair{age ? ` · ${age} years old` : ''}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP: CONTACT (escort) ── */}
        {currentStep === 'contact' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Contact &amp; About</h2>
            <p className="text-sm text-text-muted mb-5">How clients reach you, and what makes you special</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>About / Bio * (min 50 chars)</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} placeholder="Describe yourself, your personality, and what makes your service special…" className={inputCls + " resize-none"} />
                <p className={`text-[10px] mt-1 ${bio.length>=50?'text-[#28a745]':'text-text-muted'}`}>{bio.length}/50 minimum</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>WhatsApp Number <span className="text-[9px] text-text-muted">(optional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#25D366] text-sm">📱</span>
                    <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="+254 712 345 678" className={inputCls} style={{paddingLeft:'2.25rem'}}/>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Telegram Handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#229ED9] text-sm">✈️</span>
                    <input value={telegram} onChange={e=>setTelegram(e.target.value.replace(/^@+/,''))} placeholder="your_handle" className={inputCls} style={{paddingLeft:'2.25rem'}}/>
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Languages Spoken * <span className="text-[9px]">({selLangs.length} selected)</span></label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => toggleLang(l)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all flex items-center gap-1 ${selLangs.includes(l) ? 'bg-[#8B0000] border-[#8B0000] text-white' : 'bg-dark-bg border-color text-text-muted hover:border-text-muted'}`}>
                      <Globe size={9} /> {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: SERVICES (escort) ── */}
        {currentStep === 'services' && (
          <ServicesStep selServices={selServices} toggleService={toggleService} />
        )}

        {/* ── STEP: RATES (escort) ── */}
        {currentStep === 'rates' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Your Rates (KES)</h2>
            <p className="text-sm text-text-muted mb-5">Set competitive rates — you can always change these later</p>
            <div className="space-y-4">
              {[
                { label:'Per Hour *', key:'hourly', val:rateHourly, set:setRateHourly, hint:'Recommended: KES 2,000 – 15,000' },
                { label:'Overnight *', key:'overnight', val:rateOvernight, set:setRateOvernight, hint:'Recommended: KES 15,000 – 60,000' },
                { label:'Video Call', key:'video', val:rateVideo, set:setRateVideo, hint:'Recommended: KES 500 – 3,000' },
              ].map(({ label, key, val, set, hint }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold text-xs">KES</span>
                    <input type="number" value={val} onChange={e=>set(e.target.value)} className={inputCls} style={{paddingLeft:'3.2rem'}} />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">{hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 p-4 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-2xl">
              <p className="text-xs font-bold text-[#FFD700] mb-2">💡 Pricing Tips</p>
              <ul className="space-y-1">
                {['Start competitively to build reviews quickly','Elite escorts charge KES 8,000–20,000/hr','Verified escorts earn 3× more bookings'].map(t => (
                  <li key={t} className="text-[11px] text-text-muted flex items-start gap-2"><span className="text-[#FFD700] mt-0.5">•</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── STEP: PHOTOS (escort) ── */}
        {currentStep === 'photos' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Upload Your Photos</h2>
            <p className="text-sm text-text-muted mb-2">Upload at least 3 photos — profiles with more photos get 5× more contacts</p>
            <p className="text-[11px] text-text-muted mb-5">{photos.length}/8 photos uploaded {photos.length < 3 && <span className="text-[#EF4444]">· Need {3-photos.length} more</span>}</p>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
              {photos.map((src, i) => (
                <div key={i} className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 ${i === 0 ? 'border-[#FFD700]' : 'border-color'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#FFD700] text-black text-[8px] font-black rounded">COVER</div>}
                  <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white text-[10px] font-bold hover:bg-[#EF4444] transition-colors">×</button>
                </div>
              ))}
              {photos.length < 8 && (
                <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-color hover:border-[#8B0000] transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-card-bg">
                  <Camera size={20} className="text-text-muted" />
                  <span className="text-[10px] text-text-muted text-center">Add Photo</span>
                  <input ref={photosRef} type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                </label>
              )}
            </div>
            <div className="p-3.5 bg-card-bg border border-color rounded-xl">
              <p className="text-[11px] font-bold text-text-light mb-1">Photo Guidelines</p>
              {['Clear, well-lit photos only','Face must be visible in at least one photo','No watermarks or other identities','First photo becomes your cover photo'].map(g => (
                <p key={g} className="text-[10px] text-text-muted flex items-start gap-1.5 mt-1"><CheckCircle2 size={9} className="text-[#28a745] mt-0.5 flex-shrink-0" />{g}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: POSE (escort) ── */}
        {currentStep === 'pose' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Verification Selfie</h2>
            <p className="text-sm text-text-muted mb-5">Take a selfie in the exact pose shown — admin will compare it to your photos</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 font-semibold">Required Pose</p>
                <div className="rounded-2xl overflow-hidden border-2 border-[#FFD700]/40 bg-card-bg">
                  <img src="/pose-guide.png" alt="Pose guide" className="w-full object-cover" />
                </div>
                <p className="text-[10px] text-[#FFD700] mt-1.5 text-center">Reference pose — match this exactly</p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 font-semibold">Your Selfie *</p>
                <label className={`block rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${poseSelfie ? 'border-[#28a745]' : 'border-dashed border-color hover:border-[#8B0000]'} bg-card-bg`}>
                  {poseSelfie ? (
                    <img src={poseSelfie} alt="Pose selfie" className="w-full object-cover" />
                  ) : (
                    <div className="aspect-[3/4] flex flex-col items-center justify-center gap-2 text-text-muted">
                      <Camera size={28} />
                      <span className="text-[11px] text-center px-4">Take a selfie<br />matching the pose</span>
                    </div>
                  )}
                  <input ref={poseRef} type="file" accept="image/*" onChange={handlePoseSelfie} className="hidden" />
                </label>
                {poseSelfie && <p className="text-[10px] text-[#28a745] mt-1.5 text-center flex items-center justify-center gap-1"><CheckCircle2 size={9}/>Selfie uploaded!</p>}
              </div>
            </div>

            <div className="p-4 bg-[#8B0000]/10 border border-[#8B0000]/20 rounded-xl">
              <p className="text-xs font-bold text-text-light mb-2">Why we need this</p>
              {[
                'Confirms you are the person in your photos',
                'Protects clients from fake profiles',
                'Your profile goes live once admin approves (within 24h)',
                'Selfie is never shown publicly — admin review only',
              ].map(t => <p key={t} className="text-[11px] text-text-muted flex items-start gap-1.5 mt-1"><ShieldCheck size={9} className="text-[#8B0000] mt-0.5 flex-shrink-0" />{t}</p>)}
            </div>
          </div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {currentStep === 'confirm' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">
              {role === 'escort' ? 'Almost there!' : 'Review & confirm'}
            </h2>
            <p className="text-sm text-text-muted mb-5">Check your details before submitting</p>

            <div className="bg-card-bg border border-color rounded-2xl p-4 mb-5 space-y-0">
              {([
                ['Name',      name     || '—'],
                ['Email',     email    || '—'],
                ['Phone',     phone    || '—'],
                ['DOB / Age', dob ? `${dob} (${age} yrs)` : '—'],
                ['Location',  area&&city ? `${area}, ${city}` : '—'],
                ['Role',      role === 'escort' ? '⭐ Escort' : '👤 Client'],
                ...(role === 'escort' ? [
                  ['Sign-up method', authMethod === 'oauth' ? `${oauthProvider} OAuth` : 'Email + OTP'],
                  ['Body type',  bodyType  || '—'],
                  ['Height',     height    || '—'],
                  ['Ethnicity',  ethnicity || '—'],
                  ['Hair',       hairColor || '—'],
                  ['Languages',  selLangs.length ? selLangs.join(', ') : '—'],
                  ['WhatsApp',   whatsapp  || '—'],
                  ['Services',   selServices.length ? `${selServices.length} selected` : '—'],
                  ['Rate/hr',    rateHourly ? `KES ${parseInt(rateHourly).toLocaleString()}` : '—'],
                  ['Photos',     `${photos.length} uploaded`],
                ] : [])
              ] as [string,string][]).map(([l,v]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-color/30 last:border-0">
                  <span className="text-xs text-text-muted">{l}</span>
                  <span className="text-xs font-semibold text-text-light max-w-[55%] text-right truncate">{v}</span>
                </div>
              ))}
            </div>

            {role === 'escort' && (
              <div className="bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-2xl p-4 mb-5">
                <p className="text-xs font-bold text-[#FFD700] mb-1">⏳ Profile under review</p>
                <p className="text-[11px] text-text-muted leading-relaxed">Your account is created immediately but your profile goes live only after admin review (within 24 hours). You'll receive a notification when approved.</p>
              </div>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer mb-5">
              <div onClick={() => setAgreeTerms(v=>!v)} className={`w-4 h-4 mt-0.5 rounded border transition-all flex-shrink-0 flex items-center justify-center ${agreeTerms?'bg-[#8B0000] border-[#8B0000]':'border-color bg-dark-bg'}`}>
                {agreeTerms && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <span className="text-xs text-text-muted leading-relaxed">I agree to the <span className="text-[#FFD700]">Terms of Service</span> and <span className="text-[#FFD700]">Privacy Policy</span>. I confirm I am 18+ years old. This platform contains adult content.</span>
            </label>

            <button
              onClick={handleSubmit} disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] hover:from-[#a00000] hover:to-[#8B0000] text-white font-black rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Creating account…' : `Create ${role === 'escort' ? 'Escort' : 'Client'} Account →`}
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {!isLastStep && (
          <div className="flex items-center justify-between mt-8">
            {stepIdx === 0 ? (
              <Link href="/" className="px-4 py-2.5 border border-color text-text-muted text-sm rounded-xl hover:border-text-muted hover:text-text-light transition-all">← Back</Link>
            ) : (
              <button onClick={back} className="px-4 py-2.5 border border-color text-text-muted text-sm rounded-xl hover:border-text-muted hover:text-text-light transition-all">← Back</button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all shadow-lg shadow-[#8B0000]/20"
            >
              Continue <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
