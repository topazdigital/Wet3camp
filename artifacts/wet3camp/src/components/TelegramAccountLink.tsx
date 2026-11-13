import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Send, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'

type TelegramStatus = { available: boolean; linked: boolean; username: string | null }
type Notice = { ok: boolean; text: string } | null

export default function TelegramAccountLink() {
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get('telegramLink')
    const linkError = params.get('telegramLinkError')
    if (result === 'success') setNotice({ ok: true, text: 'Telegram is now linked to this account.' })
    if (linkError) setNotice({ ok: false, text: linkError })
    if (result || linkError) {
      params.delete('telegramLink')
      params.delete('telegramLinkError')
      const query = params.toString()
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
      )
    }
  }, [])

  useEffect(() => {
    let active = true
    api.auth.telegramStatus()
      .then(data => { if (active) setStatus(data) })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load Telegram status.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const startLink = async () => {
    setError('')
    setNotice(null)
    setLinking(true)
    try {
      const returnTo = `${window.location.pathname}${window.location.search}`
      const data = await api.auth.startTelegramLink(returnTo)
      const authorizationUrl = new URL(data.authorizationUrl)
      if (authorizationUrl.origin !== 'https://oauth.telegram.org' || authorizationUrl.pathname !== '/auth') {
        throw new Error('Telegram returned an invalid sign-in address.')
      }
      window.location.assign(authorizationUrl.toString())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start Telegram linking.')
      setLinking(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[#ffffff12] bg-[#191919] p-5 sm:p-6" data-testid="telegram-account-link">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#229ED9]">Sign-in options</p>
          <h2 className="mt-1 text-xl font-semibold">Telegram</h2>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#229ED9]/15 text-[#229ED9]">
          <Send size={18} />
        </span>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-[#a7a19a]">
        Link Telegram to this Wet3Camp account. Your email, Google sign-in, account type, and profile stay the same. After linking, you can use Telegram to sign in next time.
      </p>

      {loading ? (
        <p className="flex items-center gap-2 text-xs text-[#8f8981]" role="status">
          <Loader2 size={14} className="animate-spin" /> Checking linked accounts…
        </p>
      ) : status?.linked ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-3 text-xs text-emerald-200" role="status">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <span>
            Telegram is linked to this account{status.username ? ` as @${status.username}` : ''}. You can use it the next time you sign in.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {status?.available ? (
            <button
              type="button"
              onClick={startLink}
              disabled={linking}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#168ac1] disabled:cursor-wait disabled:opacity-55"
              data-testid="button-link-telegram"
            >
              {linking ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              {linking ? 'Opening Telegram…' : 'Link Telegram to this account'}
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#111111] p-3 text-xs leading-relaxed text-[#8f8981]">
              Telegram sign-in is not available yet. An administrator needs to finish its setup first.
            </div>
          )}
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#77716a]">
            <ShieldCheck size={13} className="mt-0.5 shrink-0" />
            Only a Telegram account you verify can be linked. A Telegram account already linked elsewhere cannot be moved automatically.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-300/15 bg-rose-300/5 p-3 text-xs text-rose-200" role="alert">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
      {notice && (
        <p className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs ${notice.ok ? 'border-emerald-300/15 bg-emerald-300/5 text-emerald-200' : 'border-rose-300/15 bg-rose-300/5 text-rose-200'}`} role={notice.ok ? 'status' : 'alert'}>
          {notice.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
          {notice.text}
        </p>
      )}
    </section>
  )
}
