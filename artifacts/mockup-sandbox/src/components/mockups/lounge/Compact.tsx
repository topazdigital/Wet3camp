import './_group.css'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, ArrowUpRight, Check, Clock3, Hash, LockKeyhole, MessageCircle, RefreshCw, Search, Send, ShieldCheck, Trash2, Users, Wifi } from 'lucide-react'
import BottomNav from './shell/BottomNav'
import Header from './shell/Header'
import Sidebar from './shell/Sidebar'
import { api, type LoungeCategory, type LoungeMember, type LoungeMessage, Link, SidebarProvider, useAuth } from './preview-runtime'

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000))
  if (!Number.isFinite(minutes) || minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h ago`
  return `${Math.floor(minutes / 1_440)}d ago`
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase() || 'M'
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <div aria-hidden="true" className={`${small ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'} flex shrink-0 items-center justify-center rounded-full border border-[#d7b17c]/25 bg-[#382820] font-bold tracking-wide text-[#edc994]`}>
      {getInitials(name)}
    </div>
  )
}

function PostCard({
  message,
  own,
  canMessage,
  onContact,
  onRemove,
}: {
  message: LoungeMessage
  own: boolean
  canMessage: boolean
  onContact: (message: LoungeMessage) => void
  onRemove: (id: string) => void
}) {
  const isLooking = message.category === 'looking'
  return (
    <article className="rounded-xl border border-[#40332c] bg-[#211b18] p-3.5 transition-colors hover:border-[#70533e] sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar name={message.authorName} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[13px] font-semibold text-[#f2e9df]">{message.authorName}</span>
            <span className="text-[#75665b]">·</span>
            <time dateTime={message.createdAt} className="inline-flex items-center gap-1 text-[10px] text-[#a8998d]">
              <Clock3 size={10} /> {timeAgo(message.createdAt)}
            </time>
            <span className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${isLooking ? 'border-[#c39360]/25 bg-[#c39360]/10 text-[#dfb586]' : 'border-[#94a589]/25 bg-[#94a589]/10 text-[#bcc8b2]'}`}>
              <Hash size={9} /> {isLooking ? 'Looking for' : 'General'}
            </span>
          </div>
          <p className="mt-2.5 whitespace-pre-wrap break-words text-[13px] leading-[1.65] text-[#dfd4ca]">{message.body}</p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#3a302a] pt-2.5">
            <span className="text-[10px] text-[#897a70]">Community post</span>
            {own ? (
              <button type="button" onClick={() => onRemove(message.id)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-medium text-[#a8998d] transition-colors hover:bg-[#943f35]/15 hover:text-[#e99a8d]">
                <Trash2 size={12} /> Remove
              </button>
            ) : canMessage ? (
              <button type="button" onClick={() => onContact(message)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-[#d7b17c] transition-colors hover:bg-[#d7b17c]/10 hover:text-[#f0d0a5]">
                <MessageCircle size={12} /> Message privately
              </button>
            ) : (
              <Link href="/login" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-[#d7b17c] transition-colors hover:bg-[#d7b17c]/10 hover:text-[#f0d0a5]">
                <MessageCircle size={12} /> Sign in to message
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function PrivateMessageDialog({
  author,
  messages,
  onClose,
  onSend,
}: {
  author: string
  messages: string[]
  onClose: () => void
  onSend: (body: string) => void
}) {
  const [body, setBody] = useState('')
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!body.trim()) return
    onSend(body.trim())
    setBody('')
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="private-message-title" className="flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[#594537] bg-[#211b18] shadow-2xl sm:rounded-2xl">
        <header className="flex items-center gap-3 border-b border-[#40332c] px-4 py-3.5">
          <Avatar name={author} small />
          <div className="min-w-0 flex-1">
            <h2 id="private-message-title" className="text-sm font-semibold text-[#f2e9df]">Message {author}</h2>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#9fae96]"><LockKeyhole size={10} /> Private conversation</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close private conversation" className="rounded-lg px-2 py-1 text-xs text-[#aa9a8e] hover:bg-white/5 hover:text-[#f2e9df]">Close</button>
        </header>
        <div className="min-h-36 flex-1 space-y-2 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-[270px] rounded-lg border border-[#4d4138] bg-[#191613] px-3 py-2 text-center text-[10px] leading-5 text-[#a8998d]">
            Only you and {author} can see this conversation. It is separate from public Lounge posts.
          </div>
          {messages.map((message, index) => (
            <div key={`${index}-${message}`} className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-[#684c37] px-3 py-2 text-xs leading-5 text-[#f7ebdd]">{message}</div>
          ))}
          {messages.length === 0 && <p className="pt-3 text-center text-xs text-[#86776b]">Start a private conversation with {author}.</p>}
        </div>
        <form onSubmit={submit} className="flex items-end gap-2 border-t border-[#40332c] p-3">
          <label className="sr-only" htmlFor="private-message-input">Write a private message</label>
          <textarea id="private-message-input" rows={2} value={body} onChange={event => setBody(event.target.value)} placeholder="Write a private message…" className="min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-[#4b3e34] bg-[#191613] px-3 py-2.5 text-xs leading-5 text-[#eee4da] outline-none placeholder:text-[#76695f] focus:border-[#b2865e]" />
          <button type="submit" disabled={!body.trim()} aria-label="Send private message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#bd9369] text-[#211811] transition-colors hover:bg-[#d0a77e] disabled:cursor-not-allowed disabled:opacity-40"><Send size={15} /></button>
        </form>
      </section>
    </div>
  )
}

function LoungeContent() {
  const { user, isAuthReady, isLoggedIn } = useAuth()
  const [category, setCategory] = useState<LoungeCategory>('looking')
  const [messages, setMessages] = useState<LoungeMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [onlineMembers, setOnlineMembers] = useState<LoungeMember[]>([])
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [privateAuthor, setPrivateAuthor] = useState<string | null>(null)
  const [privateThreads, setPrivateThreads] = useState<Record<string, string[]>>({})

  const loadPosts = async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const result = await api.lounge.list(category)
      setMessages([...result].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)))
      setError('')
    } catch {
      setError('Posts could not be loaded. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadPosts()
    const timer = window.setInterval(() => { void loadPosts(true) }, 8_000)
    return () => window.clearInterval(timer)
  }, [category])

  useEffect(() => {
    let active = true
    api.lounge.online().then(result => { if (active) setOnlineMembers(result.members) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  const visibleMessages = useMemo(() => messages.filter(message => {
    const value = query.trim().toLowerCase()
    return !value || `${message.authorName} ${message.body}`.toLowerCase().includes(value)
  }), [messages, query])

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const clean = body.trim()
    if (!clean || !isLoggedIn || posting || clean.length > 800) return
    setPosting(true)
    setNotice('')
    try {
      const created = await api.lounge.send(category, clean)
      setMessages(current => [created, ...current.filter(item => item.id !== created.id)])
      setBody('')
      setNotice('Your post is now public in the Lounge.')
    } catch {
      setNotice('Your post could not be shared. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const removePost = async (id: string) => {
    if (!window.confirm('Remove this Lounge post?')) return
    const result = await api.lounge.remove(id)
    if (result.success) setMessages(current => current.filter(message => message.id !== id))
  }

  const sendPrivate = (text: string) => {
    if (!privateAuthor) return
    setPrivateThreads(current => ({ ...current, [privateAuthor]: [...(current[privateAuthor] ?? []), text] }))
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-[#171412] text-[#f2e9df] lg:flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden pb-24 lg:pb-0">
        <Header />
        <div className="mx-auto w-full max-w-[1220px] px-3 pb-6 pt-4 sm:px-5 sm:pt-5 lg:px-7">
          <section className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#3d312b] pb-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#c29a72]">
                <span className="h-px w-5 bg-[#b58b63]" /> Wet3Camp community
              </div>
              <h1 className="text-[26px] font-black leading-none tracking-[-0.04em] text-[#f4ece3] sm:text-[30px]">The Lounge</h1>
              <p className="mt-2 max-w-lg text-[11px] leading-5 text-[#a99a8f] sm:text-xs">A public conversation space to find a connection and share local knowledge.</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#43382f] bg-[#211b18] px-3 py-2">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9aaa8c] opacity-35" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#9aaa8c]" /></span>
              <Users size={14} className="text-[#b5c1a9]" />
              <span className="text-[10px] font-medium text-[#e3d8cc]">{onlineMembers.length + 1} here now</span>
            </div>
          </section>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
            <section className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-bold text-[#f0e7de]">Community conversations</h2>
                  <p className="mt-1 text-[10px] text-[#928378]">Read freely. Join in when you’re ready.</p>
                </div>
                <button type="button" onClick={() => void loadPosts(true)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] text-[#a99a8f] hover:bg-white/5 hover:text-[#ebdfd3]">
                  <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>

              <div role="tablist" aria-label="Lounge topics" className="mb-3 flex rounded-lg border border-[#3c322c] bg-[#201b18] p-1">
                {(['looking', 'general'] as LoungeCategory[]).map(item => (
                  <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => { setCategory(item); setNotice('') }} className={`min-h-9 flex-1 rounded-md px-3 text-[11px] font-semibold transition-colors ${category === item ? 'bg-[#604936] text-[#f2dfca]' : 'text-[#a3968b] hover:bg-white/[0.04]'}`}>
                    {item === 'looking' ? 'Looking for' : 'General chat'}
                  </button>
                ))}
              </div>

              <form onSubmit={submitPost} className="mb-3 rounded-xl border border-[#4b3b30] bg-[#241e1a] p-3 sm:p-3.5">
                <label htmlFor="lounge-post" className="mb-2 block text-[9px] font-bold uppercase tracking-[0.16em] text-[#c2a07f]">{category === 'looking' ? 'What are you looking for?' : 'Add to the conversation'}</label>
                <textarea id="lounge-post" value={body} onChange={event => { setBody(event.target.value.slice(0, 800)); setNotice('') }} maxLength={800} rows={2} disabled={!isAuthReady || !isLoggedIn || posting} placeholder={category === 'looking' ? 'Ask the community for a recommendation…' : 'Share a thought with the community…'} className="w-full resize-y rounded-lg border border-[#4a3d34] bg-[#191613] px-3 py-2.5 text-xs leading-5 text-[#eee4da] outline-none placeholder:text-[#776a61] focus:border-[#a77e5c] disabled:cursor-not-allowed disabled:opacity-60" />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p aria-live="polite" className="min-h-4 text-[10px] text-[#9f9186]">
                    {notice && <span className="inline-flex items-center gap-1.5 text-[#b6c7a9]"><Check size={11} />{notice}</span>}
                    {!notice && !isAuthReady && 'Checking your sign-in…'}
                    {!notice && isAuthReady && !isLoggedIn && <Link href="/login" className="font-semibold text-[#d6b082] underline-offset-2 hover:underline">Sign in to post</Link>}
                  </p>
                  <div className="ml-auto flex items-center gap-2.5">
                    <span className={`font-mono text-[9px] ${body.length > 760 ? 'text-[#d6a179]' : 'text-[#80746a]'}`}>{body.length}/800</span>
                    <button type="submit" disabled={!body.trim() || !isLoggedIn || posting} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#bd9369] px-3 text-[10px] font-bold text-[#211811] transition-colors hover:bg-[#d0a77e] disabled:cursor-not-allowed disabled:opacity-40">
                      <ArrowUpRight size={13} /> {posting ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#76563b]/50 bg-[#392a20]/60 px-3 py-2.5">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#d0a778]" />
                <p className="text-[10px] leading-4 text-[#cbb8a5]"><strong className="font-semibold text-[#ecd7bf]">A quick privacy note:</strong> Lounge posts are public. Please don’t include phone numbers, email addresses, or other private contact details. Use private messages to contact another member.</p>
              </div>

              <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#3c322c] bg-[#1e1916] px-3 py-2">
                <Search size={13} className="shrink-0 text-[#95867b]" />
                <input aria-label="Search posts" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search these conversations" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#e9dfd6] outline-none placeholder:text-[#796e65]" />
                <span className="hidden text-[9px] text-[#766a60] sm:inline">Newest first</span>
              </div>

              {error && !loading && (
                <div role="alert" className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-[#795047]/40 bg-[#6a3f36]/10 px-3 py-2.5 text-[10px] text-[#d9a096]">
                  <span className="inline-flex items-center gap-1.5"><AlertCircle size={12} /> {error}</span>
                  <button type="button" onClick={() => void loadPosts()} className="font-semibold underline underline-offset-2">Retry</button>
                </div>
              )}

              {loading ? (
                <div aria-label="Loading posts" className="space-y-2.5">
                  {[0, 1, 2].map(index => <div key={index} className="animate-pulse rounded-xl border border-[#3d332d] bg-[#211c19] p-4"><div className="flex gap-3"><div className="h-10 w-10 rounded-full bg-[#352c26]" /><div className="flex-1 space-y-3 py-1"><div className="h-3 w-28 rounded bg-[#352c26]" /><div className="h-3 w-full rounded bg-[#302822]" /><div className="h-3 w-2/3 rounded bg-[#302822]" /></div></div></div>)}
                </div>
              ) : visibleMessages.length ? (
                <div className="space-y-2.5">
                  {visibleMessages.map(message => <PostCard key={message.id} message={message} own={String(message.userId) === String(user?.id)} canMessage={isLoggedIn} onContact={message => setPrivateAuthor(message.authorName)} onRemove={id => void removePost(id)} />)}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#514137] bg-[#211c19]/60 px-4 py-9 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#75583e]/30 bg-[#b9845c]/10 text-[#c69a74]"><MessageCircle size={17} /></div>
                  <p className="text-xs font-semibold text-[#eee4da]">{query ? 'No conversations match that search.' : 'A quiet room, for now.'}</p>
                  {!query && <p className="mt-1 text-[10px] text-[#a6978d]">Start the conversation in {category === 'looking' ? 'Looking for' : 'General chat'}.</p>}
                </div>
              )}
            </section>

            <aside className="space-y-3 lg:sticky lg:top-[72px]">
              <section className="rounded-xl border border-[#40352e] bg-[#211c19] p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[11px] font-bold text-[#f0e7de]">Around the Lounge</h2>
                    <p className="mt-1 text-[9px] text-[#918278]">Members active right now</p>
                  </div>
                  <span className="rounded-md border border-[#728a6e]/30 bg-[#728a6e]/10 px-2 py-1 font-mono text-[10px] text-[#b3c7ac]">{onlineMembers.length + 1}</span>
                </div>
                <div className="my-3 flex items-center gap-1.5 border-b border-[#3b312b] pb-2.5 text-[9px] text-[#9f9186]">
                  <Wifi size={11} className="text-[#9bad8f]" /> Presence refreshes automatically
                </div>
                <div className="space-y-1.5">
                  {[{ id: 'you', name: user?.name ?? 'You', current: true }, ...onlineMembers.map(member => ({ id: member.id, name: member.name, current: false }))].slice(0, 4).map(member => (
                    <div key={member.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1">
                      <div className="relative"><Avatar name={member.name} small /><span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#211c19] bg-[#89a87e]" /></div>
                      <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-[#e4d9ce]">{member.name}{member.current && <span className="ml-1 text-[#918278]">(you)</span>}</span>
                      <span className="text-[9px] text-[#91a389]">Here</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-[#4b3a30] bg-[#28211c] p-3.5">
                <div className="mb-2.5 flex items-center gap-2 text-[#c8a17d]"><ShieldCheck size={14} /><h2 className="text-[11px] font-bold text-[#f1e7dd]">Keep it considerate</h2></div>
                <ul className="space-y-2 text-[10px] leading-[1.55] text-[#b3a499]">
                  <li className="flex gap-2"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#c49a73]" />Respect members and keep conversation kind.</li>
                  <li className="flex gap-2"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#c49a73]" />Share only what you’re comfortable making public.</li>
                  <li className="flex gap-2"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#c49a73]" />Keep personal contact details in private messages.</li>
                </ul>
              </section>

              <p className="flex items-start gap-2 px-1 text-[9px] leading-4 text-[#80746a]"><LockKeyhole size={11} className="mt-0.5 shrink-0" />Private conversations are only for their participants.</p>
            </aside>
          </div>
        </div>
      </div>
      {privateAuthor && <PrivateMessageDialog author={privateAuthor} messages={privateThreads[privateAuthor] ?? []} onClose={() => setPrivateAuthor(null)} onSend={sendPrivate} />}
    </main>
  )
}

export function Compact() {
  return <SidebarProvider><LoungeContent /><BottomNav /></SidebarProvider>
}

export default Compact
