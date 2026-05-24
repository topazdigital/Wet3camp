import React, { useState, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { Flame, User, Mail, Phone, Lock, Eye, EyeOff, MapPin, Camera, CheckCircle2, ChevronRight, AlertCircle, Navigation } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { CITIES } from '@/data/escorts'

const SERVICES_LIST = ['Dinner Dates','Video Calls','Overnight','Out-Call','In-Call','Travel Companion','Events & Functions','Hotel Visits','Weekend Trips']

export default function RegisterPage() {
  const [role, setRole] = useState<'client'|'escort'|null>(null)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [age18, setAge18] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string|null>(null)
  const [bio, setBio] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState('3000')
  const fileRef = useRef<HTMLInputElement>(null)
  const { login } = useAuth()
  const [, navigate] = useLocation()

  const STEPS = role === 'escort' ? ['Role','Details','Profile','Confirm'] : ['Role','Details','Confirm']
  const cityData = CITIES.find(c => c.name === city)

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

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const toggleService = (s: string) =>
    setSelectedServices(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const validateStep = () => {
    setError('')
    if (step === 0 && !role) { setError('Please select your role.'); return false }
    if (step === 1) {
      if (!name || !email || !phone || !city || !area || !password || !confirmPass) { setError('Please fill in all fields.'); return false }
      if (password !== confirmPass) { setError('Passwords do not match.'); return false }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return false }
      if (!age18) { setError('You must confirm you are 18+.'); return false }
    }
    if (step === 2 && role === 'escort') {
      if (!photoPreview) { setError('Please upload your profile photo.'); return false }
      if (bio.length < 50) { setError('Bio must be at least 50 characters.'); return false }
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep(s => s + 1) }

  const handleSubmit = () => {
    if (!agreeTerms) { setError('Please agree to the Terms of Service.'); return }
    setLoading(true)
    setTimeout(() => {
      login({ id: `user-${Date.now()}`, name, email, role: role!, city, area, phone, profileId: role === 'escort' ? '1' : undefined })
      navigate(role === 'escort' ? '/my-profile' : '/')
    }, 1200)
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="sticky top-0 z-40 bg-card-bg border-b border-color px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center"><Flame size={15} className="text-white" /></div>
          <span className="text-sm font-black text-text-light">Wet3<span className="text-[#FFD700]">Camp</span></span>
        </Link>
        <Link href="/login" className="text-xs text-text-muted hover:text-[#FFD700] transition-colors">Have an account? <span className="text-[#FFD700]">Sign in</span></Link>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${i === step ? 'bg-[#8B0000] text-white' : i < step ? 'bg-[#28a745]/20 text-[#28a745]' : 'bg-card-bg text-text-muted border border-color'}`}>
                {i < step ? <CheckCircle2 size={9} /> : <span>{i+1}</span>} {s}
              </div>
              {i < STEPS.length - 1 && <div className={`h-px w-3 ${i < step ? 'bg-[#28a745]' : 'bg-color'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="w-full h-1 bg-card-bg rounded-full mb-7 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#8B0000] to-[#FFD700] rounded-full transition-all duration-500" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
            <AlertCircle size={14} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#EF4444]">{error}</p>
          </div>
        )}

        {/* Step 0: Role */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-black text-text-light mb-1">Join Wet3 Camp</h1>
            <p className="text-sm text-text-muted mb-6">Choose how you want to use the platform</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { r:'client', icon:'👤', title:"I'm a Client", desc:'Browse and book premium escorts', perks:['Access all profiles','Book instantly','Private messaging','Discreet billing'], color:'#2196F3' },
                { r:'escort', icon:'⭐', title:"I'm an Escort", desc:'List your profile and earn', perks:['Get verified badge','3× more bookings','Manage your schedule','Secure payments'], color:'#8B0000' },
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

        {/* Step 1: Details */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Your Details</h2>
            <p className="text-sm text-text-muted mb-5">Tell us about yourself</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Full Name *</label>
                  <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" /><input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Doe" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all" /></div>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Username *</label>
                  <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="jane_k" className="w-full px-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Email *</label>
                <div className="relative"><Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" /><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all" /></div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Phone *</label>
                <div className="relative"><Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" /><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254 700 000 000" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all" /></div>
              </div>

              {/* Location picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-text-muted uppercase tracking-widest">Location *</label>
                  <button type="button" onClick={detectLocation} disabled={geoLoading} className="flex items-center gap-1 text-[10px] text-[#2196F3] hover:underline disabled:opacity-50">
                    {geoLoading ? <div className="w-2.5 h-2.5 border border-[#2196F3]/40 border-t-[#2196F3] rounded-full animate-spin" /> : <Navigation size={10} />}
                    {geoLoading ? 'Detecting…' : 'Detect my location'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <select value={city} onChange={e=>{setCity(e.target.value);setArea('')}} className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all appearance-none">
                      <option value="">Select City</option>
                      {CITIES.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <select value={area} onChange={e=>setArea(e.target.value)} disabled={!city} className="w-full px-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] transition-all disabled:opacity-50 appearance-none">
                    <option value="">Select Area</option>
                    {cityData?.areas.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                {city && <p className="text-[10px] text-[#28a745] mt-1 flex items-center gap-1"><CheckCircle2 size={9} /> Location: {area || city}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Password *</label>
                  <div className="relative"><Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" /><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 8 chars" className="w-full pl-9 pr-8 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all" /><button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">{showPass?<EyeOff size={13}/>:<Eye size={13}/>}</button></div>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Confirm *</label>
                  <input type={showPass?'text':'password'} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Repeat password" className="w-full px-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all" />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div onClick={()=>setAge18(v=>!v)} className={`w-4 h-4 rounded border transition-all flex-shrink-0 flex items-center justify-center ${age18?'bg-[#8B0000] border-[#8B0000]':'border-color bg-dark-bg'}`}>{age18&&<div className="w-2 h-2 bg-white rounded-sm"/>}</div>
                <span className="text-xs text-text-muted">I confirm I am 18 years of age or older *</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Escort Profile */}
        {step === 2 && role === 'escort' && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Build Your Profile</h2>
            <p className="text-sm text-text-muted mb-5">Profiles with photos get 5× more bookings</p>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">Cover Photo *</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-28 h-36 rounded-2xl overflow-hidden border-2 border-dashed border-color flex-shrink-0 bg-card-bg">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <button onClick={()=>fileRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted">
                        <Camera size={24}/><span className="text-[10px]">Upload Photo</span>
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden"/>
                  </div>
                  <div className="flex-1 space-y-2">
                    <button onClick={()=>fileRef.current?.click()} className="w-full py-2.5 border-2 border-dashed border-[#8B0000]/40 bg-[#8B0000]/10 text-[#8B0000] text-xs font-semibold rounded-xl hover:border-[#8B0000] transition-all flex items-center justify-center gap-2">
                      <Camera size={14}/> {photoPreview?'Change Photo':'Choose Photo'}
                    </button>
                    <p className="text-[10px] text-text-muted leading-relaxed">Clear, high-quality photo. No watermarks. Face must be visible for verification.</p>
                    {photoPreview && <p className="text-[10px] text-[#28a745] flex items-center gap-1"><CheckCircle2 size={10}/> Photo ready!</p>}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Bio * (min 50 chars)</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} placeholder="Describe yourself, your personality, and what makes your service special…" className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all resize-none"/>
                <p className={`text-[10px] mt-1 ${bio.length>=50?'text-[#28a745]':'text-text-muted'}`}>{bio.length}/50 minimum</p>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Starting Rate (KES/hr)</label>
                <input type="number" value={hourlyRate} onChange={e=>setHourlyRate(e.target.value)} className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700] transition-all"/>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2">Services Offered</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES_LIST.map(s=>(
                    <button key={s} onClick={()=>toggleService(s)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${selectedServices.includes(s)?'bg-[#8B0000] border-[#8B0000] text-white':'bg-card-bg border-color text-text-muted hover:border-text-muted'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm step (last) */}
        {isLastStep && (
          <div>
            <h2 className="text-xl font-black text-text-light mb-1">Almost done!</h2>
            <p className="text-sm text-text-muted mb-5">Review and confirm your account</p>
            <div className="bg-card-bg border border-color rounded-2xl p-4 mb-5 space-y-0">
              {[['Name',name||'—'],['Email',email||'—'],['Phone',phone||'—'],['Location',area&&city?`${area}, ${city}`:'—'],['Role',role==='escort'?'⭐ Escort':'👤 Client']].map(([l,v])=>(
                <div key={l} className="flex items-center justify-between py-2.5 border-b border-color/40 last:border-0">
                  <span className="text-xs text-text-muted">{l}</span><span className="text-xs font-semibold text-text-light">{v}</span>
                </div>
              ))}
            </div>
            {role==='escort' && (
              <div className="bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-2xl p-4 mb-5">
                <p className="text-xs font-bold text-[#FFD700] mb-1">Escort Account Review</p>
                <p className="text-[11px] text-text-muted leading-relaxed">Your profile will be reviewed within 24 hours before going live. You can complete your profile in your dashboard while waiting.</p>
              </div>
            )}
            <label className="flex items-start gap-2.5 cursor-pointer mb-5">
              <div onClick={()=>setAgreeTerms(v=>!v)} className={`w-4 h-4 mt-0.5 rounded border transition-all flex-shrink-0 flex items-center justify-center ${agreeTerms?'bg-[#8B0000] border-[#8B0000]':'border-color bg-dark-bg'}`}>{agreeTerms&&<div className="w-2 h-2 bg-white rounded-sm"/>}</div>
              <span className="text-xs text-text-muted leading-relaxed">I agree to the <span className="text-[#FFD700]">Terms of Service</span> and <span className="text-[#FFD700]">Privacy Policy</span>. I confirm I am 18+ years old.</span>
            </label>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] hover:from-[#a00000] hover:to-[#8B0000] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:null}
              {loading?'Creating account…':`Create ${role==='escort'?'Escort':'Client'} Account →`}
            </button>
          </div>
        )}

        {!isLastStep && (
          <div className="flex items-center justify-between mt-8">
            <button onClick={()=>step>0?setStep(s=>s-1):null} className={`px-4 py-2.5 border border-color text-text-muted text-sm rounded-xl hover:border-text-muted transition-all ${step===0?'opacity-30 pointer-events-none':''}`}>← Back</button>
            <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all shadow-lg shadow-[#8B0000]/20">
              Continue <ChevronRight size={15}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
