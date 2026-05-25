import React, { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Flame, Mail, Lock, Eye, EyeOff, ShieldCheck, Star, AlertCircle } from 'lucide-react'
import { useAuth, tryLogin } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'

export default function LoginPage() {
  useSEO({
    title: 'Sign In',
    description: 'Sign in to your Wet3 Camp account to browse escorts, send messages, and manage your profile in Kenya.',
    noIndex: false,
    canonicalPath: '/login',
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const [, navigate] = useLocation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setTimeout(() => {
      const user = tryLogin(email, password)
      if (user) {
        login(user)
        navigate(user.role === 'admin' ? '/admin' : user.role === 'escort' ? '/my-profile' : '/')
      } else {
        setError('Invalid email or password.')
      }
      setLoading(false)
    }, 800)
  }

  const handleOAuth = (provider: string) => {
    setError(`${provider} OAuth is configured in the Admin Panel under API Keys. Contact your administrator to enable it.`)
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[45%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1a0000 0%, #0a0a0a 40%, #1a0a00 100%)' }}>
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
              Kenya's #1<br /><span className="text-[#FFD700]">Premium</span><br />Companion Platform
            </h1>
            <p className="mt-4 text-text-muted text-sm leading-relaxed">
              Verified escorts, discreet connections, and an unmatched experience. Join thousands across Nairobi, Mombasa, and beyond.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[['1,200+', 'Verified Escorts'], ['50K+', 'Happy Clients'], ['4.9★', 'Avg Rating']].map(([v, l]) => (
              <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-[#FFD700] font-bold text-lg leading-none">{v}</p>
                <p className="text-text-muted text-[10px] mt-1 leading-tight">{l}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {[
              [ShieldCheck, 'All profiles manually verified by our team'],
              [Lock, 'End-to-end encrypted messages'],
              [Star, 'Reviewed & rated by real clients only'],
            ].map(([Icon, text]) => (
              <div key={text as string} className="flex items-center gap-3">
                {React.createElement(Icon as any, { size: 15, className: 'text-[#FFD700] flex-shrink-0' })}
                <span className="text-text-muted text-xs">{text as string}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-text-muted text-[10px] relative z-10">© 2026 Wet3 Camp. For adults 18+ only.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col">
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
            <div className="mb-7">
              <h2 className="text-2xl font-black text-text-light">Welcome back</h2>
              <p className="text-text-muted text-sm mt-1">Sign in to your account to continue</p>
            </div>

            {/* Demo hint */}
            <div className="mb-5 p-3 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-xl">
              <p className="text-[10px] text-[#FFD700] font-bold mb-1">Demo Accounts</p>
              <p className="text-[10px] text-text-muted">Client: <span className="text-text-light">client@test.com</span> / Test1234!</p>
              <p className="text-[10px] text-text-muted">Escort: <span className="text-text-light">amara@wet3camp.com</span> / Test1234!</p>
              <p className="text-[10px] text-text-muted">Admin: <span className="text-text-light">admin@wet3camp.com</span> / Admin@Wet3Camp2024</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
                <AlertCircle size={14} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#EF4444]">{error}</p>
              </div>
            )}

            {/* Social OAuth */}
            <div className="space-y-2.5 mb-5">
              <button onClick={() => handleOAuth('Google')} className="w-full flex items-center gap-3 py-2.5 px-4 bg-card-bg border border-color rounded-xl text-sm text-text-light font-medium hover:border-text-muted transition-all">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button onClick={() => handleOAuth('Facebook')} className="w-full flex items-center gap-3 py-2.5 px-4 bg-[#1877F2]/10 border border-[#1877F2]/30 rounded-xl text-sm text-text-light font-medium hover:bg-[#1877F2]/20 transition-all">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>
              <button onClick={() => handleOAuth('Apple')} className="w-full flex items-center gap-3 py-2.5 px-4 bg-card-bg border border-color rounded-xl text-sm text-text-light font-medium hover:border-text-muted transition-all">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-color" />
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-color" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-widest">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[#FFD700] hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div onClick={() => setRemember(v => !v)} className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${remember ? 'bg-[#8B0000] border-[#8B0000]' : 'border-color bg-dark-bg'}`}>
                  {remember && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                <span className="text-xs text-text-muted">Remember me for 30 days</span>
              </label>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] hover:from-[#a00000] hover:to-[#8B0000] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 disabled:opacity-60 text-sm">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In →'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-color text-center space-y-2">
              <p className="text-xs text-text-muted">Don't have an account? <Link href="/register" className="text-[#FFD700] font-semibold hover:underline">Create one free →</Link></p>
              <Link href="/" className="block text-xs text-text-muted hover:text-text-light transition-colors">← Back to browsing</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
