import React, { useState } from 'react'
import { Link } from 'wouter'
import { Flame, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

export default function ForgotPassword() {
  useSEO({
    title: 'Reset Password',
    description: 'Reset your Wet3 Camp account password.',
    noIndex: true,
    canonicalPath: '/forgot-password',
  })
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email address.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B0000,#FF4500)' }}>
              <Flame size={20} className="text-[#FFD700]" />
            </div>
            <span className="text-xl font-black text-text-light group-hover:text-[#FFD700] transition-colors">
              Wet3<span className="text-[#8B0000]">Camp</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-text-light mb-2">Reset your password</h1>
          <p className="text-sm text-text-muted">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-card-bg border border-color rounded-2xl p-7 shadow-2xl">
          {sent ? (
            <div className="text-center py-6 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#28a745]/20 flex items-center justify-center">
                  <CheckCircle size={32} className="text-[#28a745]" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-text-light">Check your inbox</h2>
              <p className="text-sm text-text-muted leading-relaxed">
                If <span className="text-text-light font-medium">{email}</span> matches an account, you'll receive a password reset link shortly.
              </p>
              <p className="text-xs text-text-muted">
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-[#FFD700] hover:underline">try again</button>.
              </p>
              <Link href="/login" className="block mt-4 w-full py-3 rounded-xl bg-[#8B0000] text-white font-bold text-sm text-center hover:bg-[#a00000] transition-colors">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#8B0000,#c0392b)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : 'Send Reset Link'}
              </button>

              <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-light transition-colors mt-2">
                <ArrowLeft size={12} />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
