import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { AlertCircle, CheckCircle2, Mail, Send } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

type TelegramPending = { name: string; username: string | null }

export default function TelegramContinue() {
  useSEO({ title: 'Finish Telegram Sign-In', noIndex: true })
  const [, navigate] = useLocation()
  const [pending, setPending] = useState<TelegramPending | null>(null)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/telegram/pending', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Telegram sign-in expired. Start again.')
        return data as TelegramPending
      })
      .then(data => { if (!cancelled) setPending(data) })
      .catch((cause: unknown) => {
        if (cancelled) return
        const text = cause instanceof Error ? cause.message : 'Telegram sign-in expired. Start again.'
        navigate(`/login?oauthError=${encodeURIComponent(text)}`)
      })
    return () => { cancelled = true }
  }, [navigate])

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/telegram/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Could not send the code.')
      setCodeSent(true)
      setMessage('We sent a six-digit code. Enter it below to finish sign-in.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not send the code.')
    } finally {
      setLoading(false)
    }
  }

  const completeSignIn = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/telegram/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Could not finish Telegram sign-in.')
      if (typeof data.nextPath !== 'string' || !data.nextPath.startsWith('/')) {
        throw new Error('The sign-in response was invalid. Please start again.')
      }
      window.location.replace(data.nextPath)
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not finish Telegram sign-in.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg px-4 py-10 text-text-light">
      <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 flex justify-center" aria-label="Wet3Camp home">
          <img
            src="/wet3camp-wordmark.png"
            alt="Wet3Camp"
            className="h-auto w-52 max-w-full object-contain"
          />
        </Link>

        <section className="rounded-2xl border border-color bg-card-bg p-5 shadow-xl sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#229ED9]/15 text-[#229ED9]">
              <Send size={19} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#229ED9]">Telegram sign-in</p>
              <h1 className="mt-1 text-xl font-bold">Verify your email</h1>
            </div>
          </div>

          {pending && (
            <div className="mb-5 rounded-xl border border-white/10 bg-dark-bg/70 p-3">
              <p className="text-sm font-semibold">{pending.name}</p>
              {pending.username && <p className="mt-0.5 text-xs text-text-muted">@{pending.username}</p>}
            </div>
          )}

          <div className="mb-5 rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/5 p-3.5">
            <p className="text-xs leading-relaxed text-text-muted">
              Telegram does not share your email. Enter the email already on your Wet3Camp account to link Telegram to that account. We’ll send a one-time verification code; if it’s a new email, we’ll create one account for you.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
              <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
          {message && (
            <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> {message}
            </div>
          )}

          {!codeSent ? (
            <form onSubmit={requestCode} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-muted">Email address</span>
                <span className="relative block">
                  <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="The email on your existing account"
                    className="w-full rounded-xl border border-color bg-dark-bg py-3 pl-10 pr-3 text-sm text-text-light outline-none transition placeholder:text-text-muted/70 focus:border-[#229ED9]"
                  />
                </span>
              </label>
              <button disabled={!pending || loading} className="w-full rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#168ac1] disabled:cursor-wait disabled:opacity-50">
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={completeSignIn} className="space-y-4">
              <p className="text-xs text-text-muted">Code sent to <strong className="text-text-light">{email}</strong></p>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-muted">Six-digit code</span>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-color bg-dark-bg px-4 py-3 text-center font-mono text-lg tracking-[.35em] text-text-light outline-none transition placeholder:text-text-muted/50 focus:border-[#229ED9]"
                />
              </label>
              <button disabled={loading || code.length !== 6} className="w-full rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#168ac1] disabled:cursor-wait disabled:opacity-50">
                {loading ? 'Verifying…' : 'Verify and continue'}
              </button>
              <button type="button" disabled={loading} onClick={() => { setCodeSent(false); setCode(''); setMessage('') }} className="w-full rounded-xl border border-color px-4 py-3 text-xs font-semibold text-text-muted transition hover:text-text-light disabled:opacity-50">
                Use a different email
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-text-muted">
            <Link href="/login" className="text-[#FFD700] hover:underline">Back to sign in</Link>
          </p>
        </section>
      </div>
    </main>
  )
}
