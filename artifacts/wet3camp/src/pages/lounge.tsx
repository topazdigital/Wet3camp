import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'wouter'
import { AlertCircle, ArrowUp, Check, Clock3, Hash, LockKeyhole, MessageCircle, RefreshCw, Search, ShieldCheck, Trash2, Users, Wifi } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import LoungeInbox from '@/components/lounge/LoungeInbox'
import { useAuth } from '@/lib/auth-context'
import { api, type LoungeCategory, type LoungeMember, type LoungeMessage } from '@/lib/api'
import { useSEO } from '@/lib/useSEO'

const MESSAGE_POLL_MS = 8_000
const PRESENCE_POLL_MS = 15_000
const HEARTBEAT_MS = 45_000
const RECENT_MESSAGE_TTL_MS = 3 * 60_000

function relativeTime(value: string): string {
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return 'Just now'
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase() || 'M'
}

function Avatar({ name, src, small = false }: { name: string; src: string | null; small?: boolean }) {
  return src ? (
    <img
      src={src}
      alt={`${name}'s avatar`}
      data-testid={`img-avatar-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      className={`${small ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 rounded-full border border-white/10 object-cover`}
    />
  ) : (
    <div aria-label={`${name}'s avatar`} data-testid={`img-avatar-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className={`${small ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'} flex shrink-0 items-center justify-center rounded-full border border-[#FFD700]/20 bg-[#1a1a1a] font-bold text-[#FFD700]`}>
      {initials(name)}
    </div>
  )
}

function MessageCard({ message, own, onRemove, removing, canMessage, onContact, contacting }: {
  message: LoungeMessage
  own: boolean
  onRemove: (id: string) => void
  removing: boolean
  canMessage: boolean
  onContact: (message: LoungeMessage) => void
  contacting: boolean
}) {
  const looking = message.category === 'looking'
  return (
    <article data-testid={`card-message-${message.id}`} className="group relative rounded-xl border border-[#333] bg-[#1a1a1a] p-3.5 transition-colors hover:border-[#8B0000] sm:p-4">
      <div className="flex items-start gap-3">
        <Avatar name={message.authorName} src={message.authorAvatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span data-testid={`text-author-${message.id}`} className="text-sm font-semibold text-[#f4ede4]">{message.authorName}</span>
            <span className="text-[#777]" aria-hidden="true">·</span>
            <time data-testid={`text-time-${message.id}`} dateTime={message.createdAt} title={new Date(message.createdAt).toLocaleString()} className="inline-flex items-center gap-1 text-[11px] text-[#999]">
              <Clock3 size={11} /> {relativeTime(message.createdAt)}
            </time>
            <span data-testid={`badge-category-${message.id}`} className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${looking ? 'border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700]' : 'border-[#999]/25 bg-[#999]/10 text-[#c4c4c4]'}`}>
              <Hash size={10} /> {looking ? 'Looking for' : 'General'}
            </span>
          </div>
          <p data-testid={`text-message-${message.id}`} className="mt-2.5 whitespace-pre-wrap break-words text-[13px] leading-[1.65] text-[#e0e0e0]">{message.body}</p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#333] pt-2">
            <span className="text-[10px] text-[#888]">Public Lounge post</span>
            {own ? (
              <button
                type="button"
                data-testid={`button-delete-message-${message.id}`}
                onClick={() => onRemove(message.id)}
                disabled={removing}
                aria-label={`Delete your message from ${relativeTime(message.createdAt)}`}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-medium text-[#a0a0a0] transition-colors hover:bg-[#8B0000]/20 hover:text-[#ffb3b3] disabled:cursor-wait disabled:opacity-50"
              >
                <Trash2 size={12} /> {removing ? 'Removing…' : 'Delete'}
              </button>
            ) : canMessage ? (
              <button
                type="button"
                onClick={() => onContact(message)}
                disabled={contacting}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-[#FFD700] transition-colors hover:bg-[#FFD700]/10 hover:text-[#ffe766] disabled:cursor-wait disabled:opacity-50"
              >
                <MessageCircle size={12} /> {contacting ? 'Opening…' : 'Message privately'}
              </button>
            ) : (
              <Link href="/login?redirect=%2Flounge" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-[#FFD700] transition-colors hover:bg-[#FFD700]/10 hover:text-[#ffe766]">
                <MessageCircle size={12} /> Sign in to message
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function MemberRow({ member }: { member: LoungeMember }) {
  return (
    <div data-testid={`row-online-member-${member.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]">
      <div className="relative">
        <Avatar name={member.name} src={member.avatar} small />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#1a1a1a] bg-[#28a745]" aria-label="Online" />
      </div>
      <div className="min-w-0 flex-1">
        <p data-testid={`text-online-member-${member.id}`} className="truncate text-xs font-medium text-[#e0e0e0]">{member.name}</p>
        <p className="text-[10px] text-[#999]">Active {relativeTime(member.lastSeen).toLowerCase()}</p>
      </div>
      <span className="h-1.5 w-1.5 rounded-full bg-[#7ca681]" aria-hidden="true" />
    </div>
  )
}

export default function LoungePage() {
  useSEO({
    title: 'The Lounge — Wet3Camp Members',
    description: 'A public conversation space for the Wet3Camp community. Sign in to post or message another member privately.',
    keywords: 'Wet3Camp lounge, member community, escort services discussion',
    canonicalPath: '/lounge',
    noIndex: true,
  })

  const { user, isAuthReady, isLoggedIn } = useAuth()
  const [category, setCategory] = useState<LoungeCategory>('looking')
  const [messages, setMessages] = useState<LoungeMessage[]>([])
  const [messageLoading, setMessageLoading] = useState(true)
  const [messageError, setMessageError] = useState('')
  const [polling, setPolling] = useState(false)
  const [onlineMembers, setOnlineMembers] = useState<LoungeMember[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [onlineLoading, setOnlineLoading] = useState(true)
  const [onlineError, setOnlineError] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inboxOpen, setInboxOpen] = useState(false)
  const [initialConversationId, setInitialConversationId] = useState<string | null>(null)
  const [contactingMessageId, setContactingMessageId] = useState<string | null>(null)
  const [contactError, setContactError] = useState('')
  const requestLock = useRef(new Set<LoungeCategory>())
  const recentSent = useRef(new Map<string, number>())
  const categoryRef = useRef(category)
  categoryRef.current = category

  const refreshMessages = useCallback(async (initial = false) => {
    if (requestLock.current.has(category)) return
    requestLock.current.add(category)
    if (initial) {
      setMessageLoading(true)
      setMessageError('')
    } else {
      setPolling(true)
    }
    try {
      const latest = await api.lounge.list(category)
      if (categoryRef.current !== category) return
      const now = Date.now()
      for (const [id, stamp] of recentSent.current) if (now - stamp > RECENT_MESSAGE_TTL_MS) recentSent.current.delete(id)
      const known = new Set(latest.map(message => message.id))
      setMessages(current => {
        const localRecent = current.filter(message => recentSent.current.has(message.id) && !known.has(message.id))
        return [...localRecent, ...latest].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100)
      })
      setMessageError('')
      setLastUpdated(new Date())
    } catch (error) {
      if (categoryRef.current === category) {
        const reason = error instanceof Error ? error.message : 'Unable to load the Lounge right now.'
        if (initial) setMessageError(reason)
        else setMessageError('Messages could not refresh. Retrying automatically.')
      }
    } finally {
      requestLock.current.delete(category)
      if (categoryRef.current === category) {
        setMessageLoading(false)
        setPolling(false)
      }
    }
  }, [category, messages])

  useEffect(() => {
    let active = true
    let inFlight = false
    setMessages([])
    setMessageLoading(true)
    setMessageError('')
    const load = async (initial: boolean) => {
      if (inFlight || requestLock.current.has(category)) return
      inFlight = true
      requestLock.current.add(category)
      if (initial) setMessageLoading(true)
      else setPolling(true)
      try {
        const latest = await api.lounge.list(category)
        if (!active) return
        const now = Date.now()
        for (const [id, stamp] of recentSent.current) if (now - stamp > RECENT_MESSAGE_TTL_MS) recentSent.current.delete(id)
        const known = new Set(latest.map(message => message.id))
        setMessages(current => {
          const localRecent = current.filter(message => recentSent.current.has(message.id) && !known.has(message.id) && message.category === category)
          return [...localRecent, ...latest].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 100)
        })
        setMessageError('')
        setLastUpdated(new Date())
      } catch (error) {
        if (active) setMessageError(error instanceof Error ? error.message : 'Unable to load the Lounge right now.')
      } finally {
        inFlight = false
        requestLock.current.delete(category)
        if (active) {
          setMessageLoading(false)
          setPolling(false)
        }
      }
    }
    void load(true)
    const timer = window.setInterval(() => { void load(false) }, MESSAGE_POLL_MS)
    return () => { active = false; window.clearInterval(timer) }
  }, [category])

  const refreshOnline = useCallback(async () => {
    try {
      const response = await api.lounge.online()
      setOnlineCount(response.count)
      setOnlineMembers(response.members)
      setOnlineError('')
    } catch {
      setOnlineError('Presence is temporarily unavailable.')
    } finally {
      setOnlineLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn || !user?.id) return
    let active = true
    const heartbeat = () => { void api.lounge.heartbeat().catch(() => undefined) }
    heartbeat()
    const heartbeatTimer = window.setInterval(heartbeat, HEARTBEAT_MS)
    const onlineTimer = window.setInterval(() => { if (active) void refreshOnline() }, PRESENCE_POLL_MS)
    void refreshOnline()
    return () => {
      active = false
      window.clearInterval(heartbeatTimer)
      window.clearInterval(onlineTimer)
    }
  }, [isAuthReady, isLoggedIn, user?.id, refreshOnline])

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const clean = body.trim()
    if (!clean || submitting || clean.length > 800) return
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')
    try {
      const created = await api.lounge.send(category, clean)
      recentSent.current.set(created.id, Date.now())
      setMessages(current => [created, ...current.filter(message => message.id !== created.id)].slice(0, 100))
      setBody('')
      setSubmitSuccess('Your message is live in the Lounge.')
      setLastUpdated(new Date())
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your message could not be sent. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const removeMessage = async (id: string) => {
    const target = messages.find(message => message.id === id)
    if (!target?.isOwn || removingId) return
    setRemovingId(id)
    setDeleteError('')
    try {
      const result = await api.lounge.remove(id)
      if (!result.success) throw new Error('This message could not be removed.')
      recentSent.current.delete(id)
      setMessages(current => current.filter(message => message.id !== id))
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'This message could not be removed. Try again.')
    } finally {
      setRemovingId(null)
    }
  }

  const retry = () => { setMessageError(''); void refreshMessages(true) }
  const openPrivateConversation = async (message: LoungeMessage) => {
    if (!isLoggedIn || contactingMessageId) return
    setContactingMessageId(message.id)
    setContactError('')
    try {
      const conversation = await api.lounge.openConversation(message.id)
      setInitialConversationId(conversation.id)
      setInboxOpen(true)
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Could not open a private conversation.')
    } finally {
      setContactingMessageId(null)
    }
  }
  const visibleMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query
      ? messages.filter(message => `${message.authorName} ${message.body}`.toLowerCase().includes(query))
      : messages
  }, [messages, searchQuery])

  return (
    <>
    <main className="min-h-[100dvh] bg-[#0a0a0a] text-[#e0e0e0] flex flex-col lg:flex-row">
      <Sidebar />
      <div className="min-w-0 w-full flex-1 overflow-x-hidden pb-24 lg:pb-0">
        <Header />
        <div className="relative overflow-hidden border-b border-[#333] bg-[#111]">
          <div className="absolute inset-0 opacity-20" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at 12% 15%, rgba(139,0,0,.48), transparent 40%), radial-gradient(ellipse at 90% 85%, rgba(255,215,0,.16), transparent 42%)' }} />
          <div className="relative mx-auto max-w-[1220px] px-3 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFD700]">
                  <span className="h-px w-6 bg-[#8B0000]" /> Public community / 01
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[#f5f5f5] sm:text-3xl">The Lounge</h1>
                <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#b0b0b0] sm:text-sm">Public conversations for the Wet3Camp community. Sign in to post or contact an author privately.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isLoggedIn && (
                  <button
                    type="button"
                    data-testid="button-lounge-inbox"
                    onClick={() => { setInitialConversationId(null); setInboxOpen(true) }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#333] bg-[#0a0a0a]/75 px-3 text-xs font-semibold text-[#e0e0e0] transition-colors hover:border-[#FFD700] hover:bg-[#1a1a1a]"
                  >
                    <MessageCircle size={14} className="text-[#FFD700]" /> Private inbox
                  </button>
                )}
                <div data-testid="status-lounge-presence-summary" className="flex items-center gap-3 rounded-xl border border-[#333] bg-[#0a0a0a]/75 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B0000]/20 text-[#FFD700]"><Users size={15} /></div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#999]">{isLoggedIn ? 'In the room' : 'Access'}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#f1f1f1]">{isLoggedIn ? (onlineLoading ? 'Checking…' : `${onlineCount} online`) : 'Open to everyone'}</p>
                  </div>
                  {isLoggedIn && <span className="ml-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[#9fb495]"><span className="h-1.5 w-1.5 rounded-full bg-[#89a87e]" /> Live</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1220px] grid-cols-1 items-start gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-4 lg:px-6 lg:py-5">
          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#f5f5f5]">Public conversations</h2>
                <p className="mt-1 text-[11px] text-[#999]">Anyone can read posts. Sign in to post or message an author privately.</p>
              </div>
              <span data-testid="status-message-refresh" className="inline-flex items-center gap-1.5 text-[10px] text-[#999]">
                <RefreshCw size={11} className={polling ? 'animate-spin' : ''} />
                {polling ? 'Checking for updates' : lastUpdated ? `Updated ${relativeTime(lastUpdated.toISOString()).toLowerCase()}` : 'Waiting for updates'}
              </span>
            </div>

            <div className="mb-4 flex gap-2 rounded-2xl border border-[#333] bg-[#141414] p-1.5" role="tablist" aria-label="Lounge categories">
              {(['looking', 'general'] as LoungeCategory[]).map(item => {
                const active = category === item
                return (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-testid={`tab-${item}`}
                    onClick={() => { if (category !== item) { setCategory(item); setSubmitError(''); setSubmitSuccess('') } }}
                    className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors ${active ? 'bg-[#8B0000] text-white shadow-sm' : 'text-[#a0a0a0] hover:bg-white/[0.04] hover:text-[#e0e0e0]'}`}
                  >
                    {item === 'looking' ? <ShieldCheck size={14} /> : <MessageCircle size={14} />}
                    {item === 'looking' ? 'Looking for' : 'General chat'}
                    {active && <span className="h-1 w-1 rounded-full bg-[#FFD700]" />}
                  </button>
                )
              })}
            </div>

            <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#FFD700]/25 bg-[#FFD700]/[0.04] px-3 py-2.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#FFD700]" />
              <p className="text-[10px] leading-4 text-[#c4c4c4]"><strong className="font-semibold text-[#FFD700]">Privacy reminder:</strong> posts are public. Don’t include phone numbers, email addresses, or other private contact details. Use private messages to contact another member.</p>
            </div>

            <form onSubmit={sendMessage} className="mb-5 rounded-2xl border border-[#333] bg-[#1a1a1a] p-3.5 shadow-[0_12px_40px_rgba(0,0,0,.28)] sm:p-4">
              <label htmlFor="lounge-composer" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#FFD700]">
                {category === 'looking' ? 'What are you looking for?' : 'Start a conversation'}
              </label>
              <textarea
                id="lounge-composer"
                data-testid="input-lounge-message"
                value={body}
                onChange={event => { setBody(event.target.value.slice(0, 800)); setSubmitError(''); setSubmitSuccess('') }}
                maxLength={800}
                rows={3}
                placeholder={category === 'looking' ? 'Ask the community for a recommendation…' : 'Share a thought with the community…'}
                disabled={!isAuthReady || !isLoggedIn || submitting}
                className="w-full resize-y rounded-xl border border-[#333] bg-[#111] px-3.5 py-3 text-sm leading-6 text-[#e0e0e0] placeholder:text-[#777] outline-none transition-colors focus:border-[#FFD700] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-h-5 text-[11px]" aria-live="polite">
                  {submitError && <span data-testid="status-submit-error" className="inline-flex items-center gap-1.5 text-[#e18d80]"><AlertCircle size={13} /> {submitError}</span>}
                  {!submitError && submitSuccess && <span data-testid="status-submit-success" className="inline-flex items-center gap-1.5 text-[#9fbd92]"><Check size={13} /> {submitSuccess}</span>}
                  {!submitError && !submitSuccess && !isAuthReady && <span className="text-[#999]">Checking your membership…</span>}
                  {!submitError && !submitSuccess && isAuthReady && !isLoggedIn && <Link data-testid="link-lounge-login" href="/login?redirect=%2Flounge" className="font-semibold text-[#FFD700] hover:text-[#ffe766]">Sign in to post</Link>}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span data-testid="text-character-count" className={`font-mono text-[10px] ${body.length >= 780 ? 'text-[#FFD700]' : 'text-[#888]'}`}>{body.length}/800</span>
                  <button
                    type="submit"
                    data-testid="button-send-message"
                    disabled={!body.trim() || submitting || !isLoggedIn}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#8B0000] px-4 text-xs font-bold text-white transition-colors hover:bg-[#a30000] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {submitting ? <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-white/35" /> : <ArrowUp size={15} />}
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </form>

            <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#333] bg-[#111] px-3 py-2">
              <Search size={13} className="shrink-0 text-[#999]" />
              <input
                data-testid="input-lounge-search"
                aria-label="Search public posts"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search posts"
                className="min-w-0 flex-1 bg-transparent text-[11px] text-[#e0e0e0] outline-none placeholder:text-[#777]"
              />
              <span className="hidden text-[9px] text-[#888] sm:inline">Newest first</span>
            </div>

            {messageError && !messageLoading && messages.length > 0 && (
              <div data-testid="status-poll-error" className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#8B0000]/50 bg-[#8B0000]/10 px-3 py-2.5 text-[11px] text-[#ffb3b3]">
                <span className="inline-flex items-center gap-2"><AlertCircle size={13} /> {messageError}</span>
                <button data-testid="button-retry-poll" onClick={retry} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
              </div>
            )}
            {deleteError && <p data-testid="status-delete-error" role="alert" className="mb-3 rounded-xl border border-[#8B0000]/50 bg-[#8B0000]/10 px-3 py-2 text-xs text-[#ffb3b3]">{deleteError}</p>}
            {contactError && <p data-testid="status-contact-error" role="alert" className="mb-3 rounded-xl border border-[#8B0000]/50 bg-[#8B0000]/10 px-3 py-2 text-xs text-[#ffb3b3]">{contactError}</p>}

            {messageLoading ? (
              <div data-testid="status-messages-loading" className="space-y-3" aria-label="Loading Lounge messages">
                {[0, 1, 2].map(index => <div key={index} className="animate-pulse rounded-2xl border border-[#333] bg-[#1a1a1a] p-5"><div className="flex gap-3"><div className="h-10 w-10 rounded-full bg-[#262626]" /><div className="flex-1 space-y-3 py-1"><div className="h-3 w-32 rounded bg-[#262626]" /><div className="h-3 w-full rounded bg-[#222]" /><div className="h-3 w-2/3 rounded bg-[#222]" /></div></div></div>)}
              </div>
            ) : messageError && messages.length === 0 ? (
              <div data-testid="status-messages-error" className="rounded-2xl border border-[#8B0000]/40 bg-[#1a1a1a] px-5 py-10 text-center">
                <AlertCircle size={22} className="mx-auto mb-3 text-[#d28b7c]" />
                <p className="text-sm font-semibold text-[#eee4da]">The Lounge is taking a moment.</p>
                <p className="mt-1 text-xs text-[#a6978d]">{messageError}</p>
                <button data-testid="button-retry-messages" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#333] px-3 py-2 text-xs font-semibold text-[#FFD700] hover:bg-white/[0.04]"><RefreshCw size={12} /> Try again</button>
              </div>
            ) : visibleMessages.length === 0 ? (
              <div data-testid="status-messages-empty" className="rounded-2xl border border-dashed border-[#444] bg-[#1a1a1a]/60 px-5 py-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700]"><MessageCircle size={20} /></div>
                <p className="text-sm font-semibold text-[#eee4da]">{searchQuery.trim() ? 'No posts match that search.' : 'A quiet room, for now.'}</p>
                {!searchQuery.trim() && <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#a6978d]">Be the first to share something in {category === 'looking' ? 'Looking for' : 'General chat'}.</p>}
              </div>
            ) : (
              <div data-testid="list-lounge-messages" className="space-y-2.5">
                {visibleMessages.map(message => (
                  <MessageCard
                    key={message.id}
                    message={message}
                    own={message.isOwn}
                    canMessage={isLoggedIn}
                    onContact={openPrivateConversation}
                    contacting={contactingMessageId === message.id}
                    onRemove={removeMessage}
                    removing={removingId === message.id}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-[76px]">
            <section className="rounded-2xl border border-[#333] bg-[#1a1a1a] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-[#f5f5f5]">Members here</h2>
                  <p className="mt-1 text-[10px] text-[#999]">Active in the Lounge now</p>
                </div>
                <span data-testid="text-online-count" className="rounded-full border border-[#28a745]/30 bg-[#28a745]/10 px-2 py-1 font-mono text-[10px] text-[#8fd19e]">{isLoggedIn ? onlineCount : '—'}</span>
              </div>
              <div className="mb-3 flex items-center gap-2 border-b border-[#333] pb-3 text-[10px] text-[#999]">
                <Wifi size={12} className="text-[#28a745]" /> Presence refreshes automatically
              </div>
              {!isLoggedIn ? (
                <div className="py-3 text-center">
                  <p className="text-[11px] leading-5 text-[#a6978d]">Sign in to see which members are active.</p>
                  <Link href="/login?redirect=%2Flounge" className="mt-2 inline-flex text-[10px] font-semibold text-[#FFD700] hover:text-[#ffe766]">Sign in</Link>
                </div>
              ) : onlineLoading ? (
                <div data-testid="status-presence-loading" className="space-y-2" aria-label="Loading online members">{[0, 1, 2].map(index => <div key={index} className="flex items-center gap-3 px-2 py-2"><div className="h-8 w-8 animate-pulse rounded-full bg-[#262626]" /><div className="h-3 w-24 animate-pulse rounded bg-[#262626]" /></div>)}</div>
              ) : onlineError ? (
                <div data-testid="status-presence-error" className="flex items-start gap-2 py-3 text-[11px] leading-5 text-[#b0b0b0]"><AlertCircle size={13} className="mt-0.5 shrink-0 text-[#8B0000]" />{onlineError}</div>
              ) : onlineMembers.length === 0 ? (
                <p data-testid="status-presence-empty" className="py-5 text-center text-xs leading-5 text-[#999]">No members are showing as online just yet.</p>
              ) : (
                <div data-testid="list-online-members" className="max-h-[360px] space-y-0.5 overflow-y-auto">{onlineMembers.map(member => <MemberRow key={member.id} member={member} />)}</div>
              )}
            </section>

            <section className="rounded-2xl border border-[#333] bg-[#1a1a1a] p-4">
              <div className="mb-3 flex items-center gap-2 text-[#FFD700]"><ShieldCheck size={15} /><h2 className="text-xs font-bold text-[#f1f1f1]">A good room for everyone</h2></div>
              <ul data-testid="list-lounge-guidelines" className="space-y-2.5 text-[11px] leading-5 text-[#b0b0b0]">
                <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8B0000]" />Respect members and keep conversation considerate.</li>
                <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8B0000]" />Posts are public; do not include private contact details.</li>
                <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8B0000]" />Anyone can read. Every signed-in role can post.</li>
              </ul>
            </section>
            <p data-testid="text-lounge-member-note" className="flex items-start gap-2 px-2 text-[10px] leading-5 text-[#888]"><LockKeyhole size={11} className="mt-0.5 shrink-0" />Private messages are visible only to their participants.</p>
          </aside>
        </div>
      </div>
    </main>
    <LoungeInbox
      open={inboxOpen}
      onOpenChange={open => {
        setInboxOpen(open)
        if (!open) setInitialConversationId(null)
      }}
      initialConversationId={initialConversationId}
    />
    </>
  )
}
