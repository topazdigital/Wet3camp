import React, { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Eye, EyeOff, Flame, ShieldCheck, Star, ArrowRight, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [, setLocation] = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    setTimeout(() => { setLoading(false); setLocation('/') }, 1200)
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Left Panel — brand */}
      <div className="hidden lg:flex w-[45%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1a0000 0%, #0a0a0a 40%, #1a0a00 100%)' }}>
        {/* Glow */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#8B0000' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#FFD700' }} />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center shadow-lg">
            <Flame size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-light">Wet3<span className="text-[#FFD700]">Camp</span></p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Premium Platform</p>
          </div>
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-black text-text-light leading-tight">
              Kenya's #1<br />
              <span className="text-[#FFD700]">Premium</span><br />
              Companion Platform
            </h1>
            <p className="mt-4 text-text-muted text-sm leading-relaxed">
              Verified escorts, discreet bookings, and an unmatched experience. Join thousands of satisfied clients across Nairobi, Mombasa, and beyond.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[['1,200+','Verified Escorts'],['50K+','Happy Clients'],['4.9★','Avg Rating']].map(([v, l]) => (
              <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[#FFD700] font-bold text-lg leading-none">{v}</p>
                <p className="text-text-muted text-[10px] mt-1 leading-tight">{l}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {[
              { icon: ShieldCheck, text: 'All profiles manually verified by our team' },
              { icon: Lock,        text: 'End-to-end encrypted messages & payments' },
              { icon: Star,        text: 'Reviewed & rated by real clients only' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon size={15} className="text-[#FFD700] flex-shrink-0" />
                <span className="text-text-muted text-xs">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-text-muted text-[10px] relative z-10">
          © 2026 Wet3 Camp. For adults 18+ only. By using this platform you confirm you are of legal age.
        </p>
      </div>

      {/* Right Panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-color">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center">
              <Flame size={15} className="text-white" />
            </div>
            <span className="font-bold text-text-light text-sm">Wet3<span className="text-[#FFD700]">Camp</span></span>
          </Link>
          <Link href="/register" className="text-xs text-[#FFD700] font-semibold">Sign up →</Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-text-light">Welcome back</h2>
              <p className="text-text-muted text-sm mt-1">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-[#8B0000]/15 border border-[#8B0000]/40 rounded-xl text-xs text-red-300">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 focus:bg-[#1a1a1a] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-widest">Password</label>
                  <button type="button" className="text-xs text-[#FFD700] hover:underline">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 focus:bg-[#1a1a1a] transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setRemember(v => !v)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${remember ? 'bg-[#8B0000] border-[#8B0000]' : 'border-color bg-dark-bg'}`}
                >
                  {remember && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-xs text-text-muted">Remember me for 30 days</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] hover:from-[#a00000] hover:to-[#8B0000] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-color text-center">
              <p className="text-xs text-text-muted">
                Don't have an account?{' '}
                <Link href="/register" className="text-[#FFD700] font-semibold hover:underline">Create one free →</Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-xs text-text-muted hover:text-text-light transition-colors">← Back to browsing</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
