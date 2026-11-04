import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { api } from '@/lib/api'
import { useSEO } from '@/lib/useSEO'

function getResetDetails() {
  const params = new URLSearchParams(window.location.search)
  return {
    token: params.get('token') ?? '',
    email: params.get('email') ?? '',
  }
}

export default function ResetPassword() {
  useSEO({
    title: 'Choose a New Password',
    description: 'Set a new password for your Wet3 Camp account.',
    noIndex: true,
    canonicalPath: '/reset-password',
  })

  const [resetDetails] = useState(getResetDetails)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // The reset token is needed only for this page's API request. Remove it
    // from the address bar so it is not left in browser history or copied URLs.
    if (window.location.search) {
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }
    if (!resetDetails.token || !resetDetails.email) {
      setError('This reset link is incomplete. Request a new one to continue.')
    }
  }, [resetDetails])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!resetDetails.token || !resetDetails.email) {
      setError('This reset link is incomplete. Request a new one to continue.')
      return
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await api.auth.resetPassword({ ...resetDetails, password })
      setComplete(true)
      setPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not reset your password. Request a new link and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12 pb-24 lg:pb-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" aria-label="Wet3Camp home" className="inline-flex justify-center mb-6">
            <img
              src="/wet3camp-wordmark.png"
              alt="Wet3Camp — Your time, your company, your way"
              className="w-56 max-w-full h-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-text-light mb-2">
            {complete ? 'Password updated' : 'Choose a new password'}
          </h1>
          <p className="text-sm text-text-muted">
            {complete
              ? 'Your password has been changed. You can now sign in.'
              : 'Create a new password for your Wet3 Camp account.'}
          </p>
        </div>

        <section className="bg-card-bg border border-color rounded-2xl p-7 shadow-2xl">
          {complete ? (
            <div className="text-center py-6 space-y-5">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#28a745]/20 flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-[#28a745]" />
                </div>
              </div>
              <Link href="/login" className="block w-full py-3 rounded-xl bg-[#8B0000] text-white font-bold text-sm text-center hover:bg-[#a00000] transition-colors">
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordInput
                id="new-password"
                label="New password"
                value={password}
                visible={showPassword}
                onChange={setPassword}
                onToggle={() => setShowPassword(value => !value)}
              />
              <PasswordInput
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                visible={showConfirmPassword}
                onChange={setConfirmPassword}
                onToggle={() => setShowConfirmPassword(value => !value)}
              />

              <p className="text-xs text-text-muted">Use at least 8 characters.</p>

              {error && (
                <div role="alert" className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !resetDetails.token || !resetDetails.email}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#8B0000,#c0392b)' }}
              >
                {loading ? 'Updating password…' : 'Update Password'}
              </button>

              <Link href="/forgot-password" className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-light transition-colors mt-2">
                <ArrowLeft size={12} />
                Request a new reset link
              </Link>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

function PasswordInput({
  id,
  label,
  value,
  visible,
  onChange,
  onToggle,
}: {
  id: string
  label: string
  value: string
  visible: boolean
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={event => onChange(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full pl-10 pr-11 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}
