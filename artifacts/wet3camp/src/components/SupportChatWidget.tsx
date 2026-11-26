import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { Check, ChevronDown, LoaderCircle, MessageCircle, Send, X } from 'lucide-react'
import { api, type SupportConversation, type SupportChatMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

const GUEST_STORAGE_KEY = 'wet3camp:support:guest-conversation:v1'
const SUPPORT_CATEGORIES = [
  { value: 'listings', label: 'Listings' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'account access', label: 'Account access' },
  { value: 'payments', label: 'Payments' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
]
const SUPPORT_PRIMARY_BUTTON =
  'border border-[#FFD700]/45 bg-gradient-to-r from-[#8B0000] to-[#5F0000] text-white shadow-[0_6px_18px_rgba(90,0,0,.28)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] disabled:cursor-not-allowed disabled:opacity-45'
const SUPPORT_SECONDARY_BUTTON =
  'border border-[#FFD700]/35 bg-[#8B0000]/15 text-[#FFD700] transition hover:bg-[#8B0000]/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]'
const SUPPORT_BRAND_ICON = '/icon-192.png'

type GuestSession = { conversationId: string; accessToken: string }

function readGuestSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.conversationId === 'string' && typeof parsed?.accessToken === 'string') return parsed
  } catch {}
  return null
}

function timeLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function SupportChatWidget() {
  const { user, isLoggedIn, isAuthReady } = useAuth()
  const [location] = useLocation()
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState<SupportConversation | null>(null)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [category, setCategory] = useState(SUPPORT_CATEGORIES[0].value)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isAdminRoute = location === '/admin' || location.startsWith('/admin/')

  useEffect(() => {
    setGuestSession(readGuestSession())
  }, [])

  useEffect(() => {
    if (!open || !isAuthReady) return
    let active = true
    setLoading(true)
    setError('')
    const load = async () => {
      try {
        if (isLoggedIn) {
          const result = await api.support.current()
          if (!active) return
          if (result.conversation) {
            const full = await api.support.get(result.conversation.id)
            if (active) setConversation(full.conversation)
          } else {
            setConversation(null)
          }
        } else if (guestSession) {
          const result = await api.support.getGuest(guestSession.conversationId, guestSession.accessToken)
          if (active) setConversation(result.conversation)
        } else {
          setConversation(null)
        }
      } catch (err: any) {
        if (!isLoggedIn && err?.status === 404) {
          try { localStorage.removeItem(GUEST_STORAGE_KEY) } catch {}
          if (active) {
            setGuestSession(null)
            setConversation(null)
            setError('That previous conversation is unavailable. Start a new chat below.')
          }
        } else if (active) {
          setError('We could not load your conversation. Please try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [open, isLoggedIn, isAuthReady, guestSession])

  useEffect(() => {
    if (!open || !conversation) return
    const id = window.setInterval(async () => {
      try {
        const result = isLoggedIn
          ? await api.support.get(conversation.id)
          : guestSession
            ? await api.support.getGuest(conversation.id, guestSession.accessToken)
            : null
        if (result) setConversation(result.conversation)
      } catch {
        // Keep the last readable conversation; the next poll can recover.
      }
    }, 12000)
    return () => window.clearInterval(id)
  }, [open, conversation?.id, conversation?.status, isLoggedIn, guestSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [conversation?.messages.length, open])

  if (isAdminRoute) return null

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = message.trim()
    if (!content || sending) return
    setSending(true)
    setError('')
    try {
      if (!isLoggedIn && !guestSession) {
        const result = await api.support.startGuest({
          name: name.trim(),
          email: email.trim(),
          category,
          content,
        })
        const session = { conversationId: result.conversation.id, accessToken: result.accessToken }
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session))
        setGuestSession(session)
        setConversation(result.conversation)
      } else if (conversation) {
        const result = isLoggedIn
          ? await api.support.send(conversation.id, content)
          : await api.support.sendGuest(conversation.id, guestSession!.accessToken, content)
        setConversation(result.conversation)
      } else if (isLoggedIn) {
        const result = await api.support.create({ category, content })
        setConversation(result.conversation)
      }
      setMessage('')
    } catch (err: any) {
      setError(err?.message || 'Your message did not send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const startNewConversation = () => {
    setConversation(null)
    if (!isLoggedIn) {
      try { localStorage.removeItem(GUEST_STORAGE_KEY) } catch {}
      setGuestSession(null)
      setName('')
      setEmail('')
    }
    setMessage('')
    setError('')
  }

  const isNewGuest = !isLoggedIn && !guestSession && !conversation
  const canReply = true

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-3 z-[70] flex flex-col items-end sm:right-6 lg:bottom-6" data-testid="support-widget">
      {open && (
        <section
          className="mb-2 flex h-[min(34rem,calc(100dvh-7rem))] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[#333] bg-[#0a0a0a] text-[#e0e0e0] shadow-[0_24px_80px_rgba(0,0,0,.65)] animate-in fade-in slide-in-from-bottom-3 duration-200 sm:mb-3 sm:rounded-[1.35rem] sm:h-[min(34rem,calc(100dvh-6.5rem))]"
          aria-label="Wet3Camp support conversation"
          data-testid="support-panel"
        >
          <header className="relative overflow-hidden border-b border-[#333] bg-[#1a1a1a] px-4 pb-3 pt-3.5 sm:px-5 sm:pb-4 sm:pt-4">
            <div className="absolute -right-7 -top-12 h-32 w-32 rounded-full border border-[#FFD700]/15" />
            <div className="absolute -right-1 -top-6 h-20 w-20 rounded-full border border-[#FFD700]/10" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-[#FFD700]/30 bg-white sm:size-10 sm:rounded-xl">
                  <img src={SUPPORT_BRAND_ICON} alt="" className="size-full object-cover" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#FFD700] sm:text-[10px] sm:tracking-[.2em]">Wet3Camp support</p>
                  <h2 className="mt-0.5 text-sm font-semibold tracking-tight sm:mt-1 sm:text-base">How can we help?</h2>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close support chat" data-testid="button-close-support" className={`rounded-lg p-1.5 sm:p-2 ${SUPPORT_SECONDARY_BUTTON}`}>
                <X size={16} />
              </button>
            </div>
            <p className="relative mt-2 pl-11 text-[11px] leading-relaxed text-[#999] sm:mt-3 sm:pl-[3.25rem] sm:text-xs">Send an enquiry about listings, bookings, your account or anything else. Our team will reply here.</p>
          </header>

          {loading ? (
            <div className="flex flex-1 flex-col gap-3 p-5" role="status" aria-label="Loading conversation">
              <div className="h-14 w-4/5 animate-pulse rounded-2xl bg-white/[.06]" />
              <div className="ml-auto h-16 w-3/5 animate-pulse rounded-2xl bg-[#8B0000]/40" />
              <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-white/[.06]" />
            </div>
          ) : conversation ? (
            <>
              <div className="flex items-center justify-between border-b border-[#333] px-4 py-2.5 sm:px-5 sm:py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#e0e0e0]">{conversation.category} support</p>
                  <p className="mt-0.5 text-[9px] text-[#999] sm:text-[10px]">{conversation.status === 'open' ? 'Conversation open' : 'Resolved · send a message to reopen'}</p>
                </div>
                {conversation.status === 'resolved' && (
                  <button type="button" onClick={startNewConversation} data-testid="button-new-support-thread" className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold sm:px-3 sm:text-[11px] ${SUPPORT_SECONDARY_BUTTON}`}>New message</button>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4" aria-live="polite" data-testid="support-message-list">
                {conversation.messages.map((item: SupportChatMessage) => {
                  const mine = item.senderType === 'customer'
                  return (
                    <article key={item.id} data-testid={`support-message-${item.id}`} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {!mine && (
                        <img
                          src={SUPPORT_BRAND_ICON}
                          alt=""
                          className="size-6 shrink-0 rounded-full border border-[#FFD700]/35 bg-white object-cover sm:size-7"
                        />
                      )}
                      <div className={`max-w-[86%] rounded-xl px-3 py-2 sm:rounded-2xl sm:px-3.5 sm:py-2.5 ${mine ? 'rounded-br-md bg-[#8B0000] text-white' : 'rounded-bl-md border border-[#333] bg-[#1a1a1a] text-[#e0e0e0]'}`}>
                        <p className="mb-1 text-[9px] font-semibold text-[#FFD700] sm:text-[10px]">{mine ? 'You' : item.senderName || 'Wet3Camp team'}</p>
                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-[13px]">{item.content}</p>
                        <p className="mt-1 text-right text-[9px] text-[#999]">{timeLabel(item.createdAt)}</p>
                      </div>
                    </article>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
              {canReply ? (
                <form onSubmit={submit} className="border-t border-[#333] bg-[#1a1a1a] p-3 sm:p-3.5">
                  {error && <p role="alert" className="mb-2 rounded-lg border border-[#EF4444]/30 bg-[#8B0000]/20 px-3 py-2 text-xs text-[#ffb4b4]" data-testid="support-error">{error}</p>}
                  <label className="sr-only" htmlFor="support-reply">Write a message</label>
                  <div className="flex items-end gap-2 rounded-xl border border-[#333] bg-[#0a0a0a] p-2 focus-within:border-[#FFD700]/60">
                    <textarea id="support-reply" value={message} onChange={event => setMessage(event.target.value)} maxLength={3000} rows={2} placeholder="Write your message…" data-testid="input-support-reply" className="max-h-24 min-h-9 flex-1 resize-y bg-transparent px-1 py-1.5 text-xs leading-relaxed text-[#e0e0e0] outline-none placeholder:text-[#999] sm:min-h-10 sm:text-sm" />
                    <button type="submit" disabled={!message.trim() || sending} aria-label="Send message" data-testid="button-send-support" className={`flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10 ${SUPPORT_PRIMARY_BUTTON}`}>
                      {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[9px] text-[#999] sm:mt-2 sm:text-[10px]">Replies stay in this conversation.</p>
                </form>
              ) : (
                <div className="border-t border-white/[.08] p-4 text-center text-xs text-[#bfb1a6]">This conversation is resolved. Start a new one if you need anything else.</div>
              )}
            </>
          ) : (
            <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5">
              <div className="mb-3 rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/[.05] px-3 py-2.5 sm:mb-4 sm:px-3.5 sm:py-3">
                <p className="text-xs font-medium text-[#FFD700]">Send us your enquiry.</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#999] sm:text-[11px]">Our support team will reply in this chat.</p>
              </div>
              {isNewGuest && (
                <div className="mb-3 grid grid-cols-1 gap-2.5 sm:mb-4 sm:grid-cols-2 sm:gap-3">
                  <label className="text-[10px] font-medium text-[#e0e0e0] sm:text-[11px]">Your name
                    <input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} maxLength={100} data-testid="input-support-name" className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-[#FFD700]/70 sm:mt-1.5 sm:py-2.5" placeholder="Name" />
                  </label>
                  <label className="text-[10px] font-medium text-[#e0e0e0] sm:text-[11px]">Email address
                    <input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} data-testid="input-support-email" className="mt-1 w-full rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-[#FFD700]/70 sm:mt-1.5 sm:py-2.5" placeholder="you@example.com" />
                  </label>
                </div>
              )}
              <label className="mb-3 text-[10px] font-medium text-[#e0e0e0] sm:mb-4 sm:text-[11px]">What can we help with?
                <span className="relative mt-1.5 block">
                  <select value={category} onChange={event => setCategory(event.target.value)} data-testid="select-support-category" className="w-full appearance-none rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 pr-9 text-sm text-[#e0e0e0] outline-none focus:border-[#FFD700]/70 sm:py-2.5">
                    {SUPPORT_CATEGORIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#999]" />
                </span>
              </label>
              <label className="mb-3 flex-1 text-[10px] font-medium text-[#e0e0e0] sm:text-[11px]">Your message
                <textarea required value={message} onChange={event => setMessage(event.target.value)} maxLength={3000} rows={4} data-testid="input-support-first-message" className="mt-1 min-h-24 w-full resize-y rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm leading-relaxed text-white outline-none focus:border-[#FFD700]/70 sm:mt-1.5 sm:min-h-28 sm:py-2.5" placeholder="Share a few details so we can help…" />
              </label>
              {error && <p role="alert" className="mb-3 rounded-lg border border-[#EF4444]/30 bg-[#8B0000]/20 px-3 py-2 text-xs text-[#ffb4b4]" data-testid="support-error">{error}</p>}
              <button type="submit" disabled={!message.trim() || (!isLoggedIn && (!name.trim() || !email.trim())) || sending || !isAuthReady} data-testid="button-start-support" className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ${SUPPORT_PRIMARY_BUTTON}`}>
                {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending…' : 'Send to support'}
              </button>
              <p className="mt-2 text-center text-[9px] leading-relaxed text-[#999] sm:mt-3 sm:text-[10px]">We’ll keep your conversation here so it’s easy to follow up.</p>
            </form>
          )}
          <div className="flex items-center justify-center gap-1.5 border-t border-[#333] py-2 text-[9px] tracking-wide text-[#999]">
            <Check size={11} className="text-[#FFD700]" /> Messages are private to you and our support team
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Close support chat' : 'Open Wet3Camp support chat'} data-testid="button-toggle-support" className={`group flex size-11 items-center justify-center rounded-full p-0 text-sm font-semibold sm:size-auto sm:gap-2.5 sm:px-4 sm:py-3 ${SUPPORT_PRIMARY_BUTTON} border-[#FFD700]/50 shadow-[0_8px_28px_rgba(90,0,0,.42)] hover:-translate-y-0.5`}>
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        <span className="sr-only sm:not-sr-only">{open ? 'Close' : 'Talk to support'}</span>
      </button>
    </div>
  )
}
