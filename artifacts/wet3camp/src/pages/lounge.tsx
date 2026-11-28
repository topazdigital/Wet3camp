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
    <div aria-label={`${name}'s avatar`} data-testid={`img-avatar-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className={`${small ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'} flex shrink-0 items-center justify-center rounded-full border border-[#d4ad70]/20 bg-[#30251f] font-bold text-[#e6c89b]`}>
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
    <article data-testid={`card-message-${message.id}`} className="group relative rounded-xl border border-[#41352f] bg-[#211c19] p-3.5 transition-colors hover:border-[#715c4d] sm:p-4">
      <div className="flex items-start gap-3">
        <Avatar name={message.authorName} src={message.authorAvatar} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span data-testid={`text-author-${message.id}`} className="text-sm font-semibold text-[#f4ede4]">{message.authorName}</span>
            <span className="text-[#76665d]" aria-hidden="true">·</span>
            <time data-testid={`text-time-${message.id}`} dateTime={message.createdAt} title={new Date(message.createdAt).toLocaleString()} className="inline-flex items-center gap-1 text-[11px] text-[#a6978d]">
              <Clock3 size={11} /> {relativeTime(message.createdAt)}
            </time>
            <span data-testid={`badge-category-${message.id}`} className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${looking ? 'border-[#b9845c]/30 bg-[#b9845c]/10 text-[#d9a97c]' : 'border-[#8e9b8a]/25 bg-[#8e9b8a]/10 text-[#bac4b3]'}`}>
              <Hash size={10} /> {looking ? 'Looking for' : 'General'}
            </span>
          </div>
          <p data-testid={`text-message-${message.id}`} className="mt-2.5 whitespace-pre-wrap break-words text-[13px] leading-[1.65] text-[#e2d8ce]">{message.body}</p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#3a302a] pt-2">
            <span className="text-[10px] text-[#897a70]">Public Lounge post</span>
            {own ? (
              <button
                type="button"
                data-testid={`button-delete-message-${message.id}`}
                onClick={() => onRemove(message.id)}
                disabled={removing}
                aria-label={`Delete your message from ${relativeTime(message.createdAt)}`}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-medium text-[#a6978d] transition-colors hover:bg-[#a84c43]/10 hover:text-[#e48a7e] disabled:cursor-wait disabled:opacity-50"
              >
                <Trash2 size={12} /> {removing ? 'Removing…' : 'Delete'}
              </button>
            ) : canMessage ? (
              <button
                type="button"
                onClick={() => onContact(message)}
                disabled={contacting}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-[#d7b17c] transition-colors hover:bg-[#d7b17c]/10 hover:text-[#f0d0a5] disabled:cursor-wait disabled:opacity-50"
              >
                <MessageCircle size={12} /> {contacting ? 'Opening…' : 'Message privately'}
              </button>
            ) : (
              <Link href="/login?redirect=%2Flounge" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-[#d7b17c] transition-colors hover:bg-[#d7b17c]/10 hover:text-[#f0d0a5]">
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
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#211c19] bg-[#7ca681]" aria-label="Online" />
      </div>
      <div className="min-w-0 flex-1">
        <p data-testid={`text-online-member-${member.id}`} className="truncate text-xs font-medium text-[#e4d9ce]">{member.name}</p>
        <p className="text-[10px] text-[#8f8178]">Active {relativeTime(member.lastSeen).toLowerCase()}</p>
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
    <main className="min-h-[100dvh] bg-[#171412] text-[#f4ede4] flex flex-col lg:flex-row">
      <Sidebar />
      <div className="min-w-0 w-full flex-1 overflow-x-hidden pb-24 lg:pb-0">
        <Header />
        <div className="relative overflow-hidden border-b border-[#40342d] bg-[#211b17]">
          <div className="absolute inset-0 opacity-30" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at 12% 15%, rgba(174,117,75,.24), transparent 40%), radial-gradient(ellipse at 90% 85%, rgba(109,84,67,.2), transparent 42%)' }} />
          <div className="relative mx-auto max-w-[1220px] px-3 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c69a74]">
                  <span className="h-px w-6 bg-[#a87d5d]" /> Public community / 01
                </div>
                <h1 className="text-2xl font-black tracking-tight text-[#f6eee5] sm:text-3xl">The Lounge</h1>
                <p className="mt-1.5 max-w-xl text-xs leading-5 text-[#b7a89c] sm:text-sm">Public conversations for the Wet3Camp community. Sign in to post or contact an author privately.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isLoggedIn && (
                  <button
                    type="button"
                    data-testid="button-lounge-inbox"
                    onClick={() => { setInitialConversationId(null); setInboxOpen(true) }}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#4b4038] bg-[#191613]/75 px-3 text-xs font-semibold text-[#e8d8c7] transition-colors hover:border-[#987555] hover:bg-[#241e1a]"
                  >
                    <MessageCircle size={14} className="text-[#d3a67d]" /> Private inbox
                  </button>
                )}
                <div data-testid="status-lounge-presence-summary" className="flex items-center gap-3 rounded-xl border border-[#4b4038] bg-[#191613]/75 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#778a72]/15 text-[#a9c0a0]"><Users size={15} /></div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#97877b]">{isLoggedIn ? 'In the room' : 'Access'}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#f1e8df]">{isLoggedIn ? (onlineLoading ? 'Checking…' : `${onlineCount} online`) : 'Open to everyone'}</p>
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
                <h2 className="text-sm font-bold text-[#f0e7de]">Public conversations</h2>
                <p className="mt-1 text-[11px] text-[#95877d]">Anyone can read posts. Sign in to post or message an author privately.</p>
              </div>
              <span data-testid="status-message-refresh" className="inline-flex items-center gap-1.5 text-[10px] text-[#96877b]">
                <RefreshCw size={11} className={polling ? 'animate-spin' : ''} />
                {polling ? 'Checking for updates' : lastUpdated ? `Updated ${relativeTime(lastUpdated.toISOString()).toLowerCase()}` : 'Waiting for updates'}
              </span>
            </div>

            <div className="mb-4 flex gap-2 rounded-2xl border border-[#3c322c] bg-[#201b18] p-1.5" role="tablist" aria-label="Lounge categories">
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
                    className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors ${active ? 'bg-[#554337] text-[#f3dfca] shadow-sm' : 'text-[#a39489] hover:bg-white/[0.04] hover:text-[#e9ded4]'}`}
                  >
                    {item === 'looking' ? <ShieldCheck size={14} /> : <MessageCircle size={14} />}
                    {item === 'looking' ? 'Looking for' : 'General chat'}
                    {active && <span className="h-1 w-1 rounded-full bg-[#d2a77f]" />}
                  </button>
                )
              })}
            </div>

            <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#76563b]/50 bg-[#392a20]/50 px-3 py-2.5">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#d0a778]" />
              <p className="text-[10px] leading-4 text-[#cbb8a5]"><strong className="font-semibold text-[#ecd7bf]">Privacy reminder:</strong> posts are public. Don’t include phone numbers, email addresses, or other private contact details. Use private messages to contact another member.</p>
            </div>

            <form onSubmit={sendMessage} className="mb-5 rounded-2xl border border-[#4a3a30] bg-[#241e1a] p-3.5 shadow-[0_12px_40px_rgba(0,0,0,.12)] sm:p-4">
              <label htmlFor="lounge-composer" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#b99b80]">
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
                className="w-full resize-y rounded-xl border border-[#4a3d34] bg-[#191613] px-3.5 py-3 text-sm leading-6 text-[#eee4da] placeholder:text-[#776a61] outline-none transition-colors focus:border-[#a77e5c] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-h-5 text-[11px]" aria-live="polite">
                  {submitError && <span data-testid="status-submit-error" className="inline-flex items-center gap-1.5 text-[#e18d80]"><AlertCircle size={13} /> {submitError}</span>}
                  {!submitError && submitSuccess && <span data-testid="status-submit-success" className="inline-flex items-center gap-1.5 text-[#9fbd92]"><Check size={13} /> {submitSuccess}</span>}
                  {!submitError && !submitSuccess && !isAuthReady && <span className="text-[#9b8c81]">Checking your membership…</span>}
                  {!submitError && !submitSuccess && isAuthReady && !isLoggedIn && <Link data-testid="link-lounge-login" href="/login?redirect=%2Flounge" className="font-semibold text-[#d5ab83] hover:text-[#f0c79f]">Sign in to post</Link>}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span data-testid="text-character-count" className={`font-mono text-[10px] ${body.length >= 780 ? 'text-[#d6a179]' : 'text-[#88796e]'}`}>{body.length}/800</span>
                  <button
                    type="submit"
                    data-testid="button-send-message"
                    disabled={!body.trim() || submitting || !isLoggedIn}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#a77e5c] px-4 text-xs font-bold text-[#1e1712] transition-colors hover:bg-[#bd9674] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {submitting ? <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#1e1712]/35" /> : <ArrowUp size={15} />}
                    {submitting ? 'Posting…' : 'Post'}
                  </button>
                </div>
              </div>
            </form>

            <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#3c322c] bg-[#1e1916] px-3 py-2">
              <Search size={13} className="shrink-0 text-[#95867b]" />
              <input
                data-testid="input-lounge-search"
                aria-label="Search public posts"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search posts"
                className="min-w-0 flex-1 bg-transparent text-[11px] text-[#e9dfd6] outline-none placeholder:text-[#796e65]"
              />
              <span className="hidden text-[9px] text-[#766a60] sm:inline">Newest first</span>
            </div>

            {messageError && !messageLoading && messages.length > 0 && (
              <div data-testid="status-poll-error" className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#795047]/40 bg-[#6a3f36]/10 px-3 py-2.5 text-[11px] text-[#d9a096]">
                <span className="inline-flex items-center gap-2"><AlertCircle size={13} /> {messageError}</span>
                <button data-testid="button-retry-poll" onClick={retry} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
              </div>
            )}
            {deleteError && <p data-testid="status-delete-error" role="alert" className="mb-3 rounded-xl border border-[#795047]/40 bg-[#6a3f36]/10 px-3 py-2 text-xs text-[#d9a096]">{deleteError}</p>}
            {contactError && <p data-testid="status-contact-error" role="alert" className="mb-3 rounded-xl border border-[#795047]/40 bg-[#6a3f36]/10 px-3 py-2 text-xs text-[#d9a096]">{contactError}</p>}

            {messageLoading ? (
              <div data-testid="status-messages-loading" className="space-y-3" aria-label="Loading Lounge messages">
                {[0, 1, 2].map(index => <div key={index} className="animate-pulse rounded-2xl border border-[#3d332d] bg-[#211c19] p-5"><div className="flex gap-3"><div className="h-10 w-10 rounded-full bg-[#352c26]" /><div className="flex-1 space-y-3 py-1"><div className="h-3 w-32 rounded bg-[#352c26]" /><div className="h-3 w-full rounded bg-[#302822]" /><div className="h-3 w-2/3 rounded bg-[#302822]" /></div></div></div>)}
              </div>
            ) : messageError && messages.length === 0 ? (
              <div data-testid="status-messages-error" className="rounded-2xl border border-[#6e443c]/40 bg-[#241e1a] px-5 py-10 text-center">
                <AlertCircle size={22} className="mx-auto mb-3 text-[#d28b7c]" />
                <p className="text-sm font-semibold text-[#eee4da]">The Lounge is taking a moment.</p>
                <p className="mt-1 text-xs text-[#a6978d]">{messageError}</p>
                <button data-testid="button-retry-messages" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#725b49] px-3 py-2 text-xs font-semibold text-[#e1c5a9] hover:bg-white/[0.04]"><RefreshCw size={12} /> Try again</button>
              </div>
            ) : visibleMessages.length === 0 ? (
              <div data-testid="status-messages-empty" className="rounded-2xl border border-dashed border-[#514137] bg-[#211c19]/60 px-5 py-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#75583e]/30 bg-[#b9845c]/10 text-[#c69a74]"><MessageCircle size={20} /></div>
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
            <section className="rounded-2xl border border-[#40352e] bg-[#211c19] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-[#f0e7de]">Members here</h2>
                  <p className="mt-1 text-[10px] text-[#918278]">Active in the Lounge now</p>
                </div>
                <span data-testid="text-online-count" className="rounded-full border border-[#728a6e]/30 bg-[#728a6e]/10 px-2 py-1 font-mono text-[10px] text-[#b3c7ac]">{isLoggedIn ? onlineCount : '—'}</span>
              </div>
              <div className="mb-3 flex items-center gap-2 border-b border-[#3b312b] pb-3 text-[10px] text-[#9f9186]">
                <Wifi size={12} className="text-[#8fa786]" /> Presence refreshes automatically
              </div>
              {!isLoggedIn ? (
                <div className="py-3 text-center">
                  <p className="text-[11px] leading-5 text-[#a6978d]">Sign in to see which members are active.</p>
                  <Link href="/login?redirect=%2Flounge" className="mt-2 inline-flex text-[10px] font-semibold text-[#d5ab83] hover:text-[#f0c79f]">Sign in</Link>
                </div>
              ) : onlineLoading ? (
                <div data-testid="status-presence-loading" className="space-y-2" aria-label="Loading online members">{[0, 1, 2].map(index => <div key={index} className="flex items-center gap-3 px-2 py-2"><div className="h-8 w-8 animate-pulse rounded-full bg-[#352c26]" /><div className="h-3 w-24 animate-pulse rounded bg-[#352c26]" /></div>)}</div>
              ) : onlineError ? (
                <div data-testid="status-presence-error" className="flex items-start gap-2 py-3 text-[11px] leading-5 text-[#b59a8e]"><AlertCircle size={13} className="mt-0.5 shrink-0 text-[#c38a79]" />{onlineError}</div>
              ) : onlineMembers.length === 0 ? (
                <p data-testid="status-presence-empty" className="py-5 text-center text-xs leading-5 text-[#9c8d82]">No members are showing as online just yet.</p>
              ) : (
                <div data-testid="list-online-members" className="max-h-[360px] space-y-0.5 overflow-y-auto">{onlineMembers.map(member => <MemberRow key={member.id} member={member} />)}</div>
              )}
            </section>

            <section className="rounded-2xl border border-[#4b3a30] bg-[#28211c] p-4">
              <div className="mb-3 flex items-center gap-2 text-[#c8a17d]"><ShieldCheck size={15} /><h2 className="text-xs font-bold text-[#f1e7dd]">A good room for everyone</h2></div>
              <ul data-testid="list-lounge-guidelines" className="space-y-2.5 text-[11px] leading-5 text-[#b3a499]">
                <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#c49a73]" />Respect members and keep conversation considerate.</li>
                <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#c49a73]" />Posts are public; do not include private contact details.</li>
                <li className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#c49a73]" />Anyone can read. Every signed-in role can post.</li>
              </ul>
            </section>
            <p data-testid="text-lounge-member-note" className="flex items-start gap-2 px-2 text-[10px] leading-5 text-[#81756c]"><LockKeyhole size={11} className="mt-0.5 shrink-0" />Private messages are visible only to their participants.</p>
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
