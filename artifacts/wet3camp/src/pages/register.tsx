import React, { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Eye, EyeOff, Flame, Users, Star, ArrowRight, ArrowLeft, Check, User, Mail, Lock, Phone, MapPin } from 'lucide-react'

type Role = 'client' | 'escort'

const STEPS = ['Role', 'Details', 'Confirm']

export default function RegisterPage() {
  const [, setLocation] = useLocation()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role | null>(null)
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', location: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const next = () => {
    if (step === 0 && !role) { setError('Please choose your account type.'); return }
    if (step === 1) {
      if (!form.name || !form.email || !form.password) { setError('Please fill in all required fields.'); return }
      if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    }
    setError('')
    setStep(s => s + 1)
  }

  const submit = () => {
    if (!agree) { setError('Please accept the terms to continue.'); return }
    setError('')
    setLoading(true)
    setTimeout(() => { setLoading(false); setLocation('/') }, 1500)
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-color">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center">
            <Flame size={15} className="text-white" />
          </div>
          <span className="font-bold text-text-light text-sm">Wet3<span className="text-[#FFD700]">Camp</span></span>
        </Link>
        <Link href="/login" className="text-xs text-text-muted hover:text-[#FFD700] transition-colors">Already have an account? Sign in →</Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < step ? 'bg-[#8B0000] border-[#8B0000] text-white' : i === step ? 'bg-transparent border-[#FFD700] text-[#FFD700]' : 'bg-transparent border-color text-text-muted'}`}>
                      {i < step ? <Check size={14} /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${i === step ? 'text-[#FFD700]' : i < step ? 'text-[#8B0000]' : 'text-text-muted'}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 mb-4 transition-colors ${i < step ? 'bg-[#8B0000]' : 'bg-color'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-[#8B0000]/15 border border-[#8B0000]/40 rounded-xl text-xs text-red-300">{error}</div>
          )}

          {/* Step 0: Choose role */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-black text-text-light mb-1">Join Wet3 Camp</h2>
              <p className="text-text-muted text-sm mb-6">Choose how you want to use the platform</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    key: 'client' as Role,
                    icon: Users,
                    title: 'I\'m a Client',
                    subtitle: 'Browse and book premium escorts',
                    perks: ['Access all profiles', 'Book instantly', 'Private messaging', 'Discreet billing'],
                    color: '#2196F3',
                  },
                  {
                    key: 'escort' as Role,
                    icon: Star,
                    title: 'I\'m an Escort',
                    subtitle: 'List your profile and earn',
                    perks: ['Get verified badge', '3× more bookings', 'Manage your schedule', 'Secure payments'],
                    color: '#8B0000',
                  },
                ].map(opt => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setRole(opt.key)}
                      className={`text-left p-5 rounded-2xl border-2 transition-all ${role === opt.key ? 'border-[#FFD700] bg-[#FFD700]/5' : 'border-color bg-card-bg hover:border-text-muted'}`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: opt.color + '20' }}>
                        <Icon size={20} style={{ color: opt.color }} />
                      </div>
                      <p className="font-bold text-text-light text-sm mb-1">{opt.title}</p>
                      <p className="text-text-muted text-xs mb-3">{opt.subtitle}</p>
                      <ul className="space-y-1.5">
                        {opt.perks.map(p => (
                          <li key={p} className="flex items-center gap-2 text-[11px] text-text-muted">
                            <Check size={10} className="text-[#28a745] flex-shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-black text-text-light mb-1">Your Details</h2>
              <p className="text-text-muted text-sm mb-6">Tell us a bit about yourself</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input value={form.name} onChange={set('name')} placeholder="Your name" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5">Username *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                      <input value={form.username} onChange={set('username')} placeholder="username" className="w-full pl-7 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5">Phone</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input value={form.phone} onChange={set('phone')} placeholder="+254 700..." className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5">City</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input value={form.location} onChange={set('location')} placeholder="Nairobi" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5">Password *</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 8 chars" className="w-full pl-9 pr-9 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                      <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light">
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5">Confirm *</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-black text-text-light mb-1">Almost there!</h2>
              <p className="text-text-muted text-sm mb-6">Review your details and confirm</p>
              <div className="bg-card-bg border border-color rounded-2xl p-5 space-y-3 mb-5">
                <div className="flex items-center justify-between py-1 border-b border-color/40">
                  <span className="text-xs text-text-muted">Account type</span>
                  <span className="text-xs font-bold text-[#FFD700] capitalize">{role}</span>
                </div>
                {[['Name', form.name], ['Username', '@' + form.username], ['Email', form.email], ['City', form.location || '—']].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between py-1 border-b border-color/40 last:border-0">
                    <span className="text-xs text-text-muted">{l}</span>
                    <span className="text-xs text-text-light font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-3 cursor-pointer select-none mb-5">
                <div onClick={() => setAgree(v => !v)} className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${agree ? 'bg-[#8B0000] border-[#8B0000]' : 'border-color bg-dark-bg'}`}>
                  {agree && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-xs text-text-muted leading-relaxed">
                  I am 18+ years of age and agree to the{' '}
                  <a href="#" className="text-[#FFD700] hover:underline">Terms of Service</a>,{' '}
                  <a href="#" className="text-[#FFD700] hover:underline">Privacy Policy</a>, and confirm I am accessing this platform legally in my jurisdiction.
                </span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-3 border border-color rounded-xl text-text-muted hover:text-text-light hover:border-text-muted transition-all text-sm font-medium">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            {step < 2 ? (
              <button onClick={next} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 text-sm hover:from-[#a00000] hover:to-[#8B0000]">
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button onClick={submit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 text-sm disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={15} /> Create Account</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
