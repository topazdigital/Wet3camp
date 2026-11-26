import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CheckCheck, Inbox, LoaderCircle, MessageSquareText, RefreshCw, Send, ShieldCheck } from 'lucide-react'
import type { SupportChatMessage, SupportConversation } from '@/lib/api'

type StatusFilter = 'all' | 'open' | 'resolved'
type AdminFetch = (path: string, opts?: RequestInit) => Promise<any>
type ConversationSummary = Pick<SupportConversation, 'id' | 'userId' | 'customerName' | 'customerEmail' | 'category' | 'status' | 'adminUnreadCount' | 'customerUnreadCount' | 'lastMessageAt' | 'createdAt'> & { lastMessage: string }

type Props = { adminFetch: AdminFetch }

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return ''
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function fullDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminSupportInbox({ adminFetch }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [thread, setThread] = useState<SupportConversation | null>(null)
  const [listLoading, setListLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [threadError, setThreadError] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const listRequest = useRef(0)
  const threadRequest = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)
  const adminFetchRef = useRef(adminFetch)
  adminFetchRef.current = adminFetch

  const refreshList = useCallback(async (quiet = false) => {
    const request = ++listRequest.current
    if (!quiet) setListLoading(true)
    setListError('')
    try {
      const result = await adminFetchRef.current('/support/admin/conversations?status=all')
      if (request !== listRequest.current) return
      if (!Array.isArray(result)) throw new Error('Invalid conversation list')
      setConversations(result)
    } catch (error: any) {
      if (request === listRequest.current) setListError(error?.message || 'Could not load support conversations.')
    } finally {
      if (request === listRequest.current) setListLoading(false)
    }
  }, [])

  const refreshThread = useCallback(async (id: string, quiet = false) => {
    const request = ++threadRequest.current
    if (!quiet) setThreadLoading(true)
    setThreadError('')
    try {
      const result = await adminFetchRef.current(`/support/admin/conversations/${encodeURIComponent(id)}`)
      if (request !== threadRequest.current) return
      if (!result?.conversation) throw new Error('Invalid conversation')
      setThread(result.conversation)
    } catch (error: any) {
      if (request === threadRequest.current) setThreadError(error?.message || 'Could not load this conversation.')
    } finally {
      if (request === threadRequest.current) setThreadLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshList()
    const timer = window.setInterval(() => void refreshList(true), 15000)
    return () => {
      window.clearInterval(timer)
      listRequest.current += 1
    }
  }, [refreshList])

  useEffect(() => {
    if (!selectedId) {
      setThread(null)
      return
    }
    setThread(null)
    void refreshThread(selectedId)
    const timer = window.setInterval(() => void refreshThread(selectedId, true), 12000)
    return () => {
      window.clearInterval(timer)
      threadRequest.current += 1
    }
  }, [selectedId, refreshThread])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [thread?.messages.length])

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId || !reply.trim() || sending) return
    const content = reply.trim()
    setSending(true)
    setThreadError('')
    setFeedback('')
    const optimisticMessage: SupportChatMessage = {
      id: `pending-${Date.now()}`,
      senderType: 'admin',
      senderName: 'Support team',
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
    }
    setThread(current => current ? { ...current, messages: [...current.messages, optimisticMessage], lastMessageAt: optimisticMessage.createdAt } : current)
    setReply('')
    try {
      const result = await adminFetchRef.current(`/support/admin/conversations/${encodeURIComponent(selectedId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      setFeedback(result?.emailSent ? 'Reply sent. Email notification delivered.' : 'Reply sent.')
      await Promise.all([refreshThread(selectedId, true), refreshList(true)])
    } catch (error: any) {
      setThread(current => current ? { ...current, messages: current.messages.filter(item => item.id !== optimisticMessage.id) } : current)
      setReply(content)
      setThreadError(error?.message || 'Reply could not be sent. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const changeStatus = async () => {
    if (!thread || statusSaving) return
    const status = thread.status === 'open' ? 'resolved' : 'open'
    setStatusSaving(true)
    setThreadError('')
    try {
      const result = await adminFetchRef.current(`/support/admin/conversations/${encodeURIComponent(thread.id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setThread(current => current ? { ...current, status: result?.status ?? status } : current)
      setFeedback(status === 'resolved' ? 'Conversation marked resolved.' : 'Conversation reopened.')
      await refreshList(true)
    } catch (error: any) {
      setThreadError(error?.message || 'Could not update conversation status.')
    } finally {
      setStatusSaving(false)
    }
  }

  const visibleConversations = useMemo(() => filter === 'all'
    ? conversations
    : conversations.filter(item => item.status === filter), [conversations, filter])
  const counts = useMemo(() => ({
    all: conversations.length,
    open: conversations.filter(item => item.status === 'open').length,
    resolved: conversations.filter(item => item.status === 'resolved').length,
  }), [conversations])

  return (
    <section className="overflow-hidden rounded-2xl border border-[#463632] bg-[#171515] text-[#f0e8df] shadow-[0_18px_60px_rgba(0,0,0,.18)]" data-testid="admin-support-inbox" aria-label="Support inbox">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#463632] bg-[#231b19] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-[#d0b477]/25 bg-[#d0b477]/10 text-[#d8bd7f]"><Inbox size={19} /></div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#fff8ee]">Support inbox</h2>
            <p className="mt-0.5 text-xs text-[#aa9c91]">Direct conversations with Wet3Camp members and guests</p>
          </div>
        </div>
        <button type="button" onClick={() => { void refreshList() }} disabled={listLoading} data-testid="button-refresh-support-list" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#6a5149] px-3 text-xs font-semibold text-[#e2d3c4] transition hover:border-[#d0b477]/50 hover:bg-white/[.04] disabled:opacity-50">
          <RefreshCw size={13} className={listLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid min-h-[560px] grid-cols-1 lg:grid-cols-[minmax(270px,340px)_minmax(0,1fr)]">
        <aside className={`${selectedId ? 'hidden lg:flex' : 'flex'} min-h-[400px] flex-col border-r-0 border-[#463632] lg:border-r`} aria-label="Conversation list">
          <div className="flex gap-1 border-b border-[#39302d] px-3 py-2.5" role="tablist" aria-label="Filter conversations">
            {(['all', 'open', 'resolved'] as StatusFilter[]).map(item => (
              <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => { setSelectedId(null); setThread(null); setFilter(item) }} data-testid={`filter-support-${item}`} className={`flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold capitalize transition ${filter === item ? 'bg-[#6d302a] text-[#fff4e7]' : 'text-[#aa9c91] hover:bg-white/[.04] hover:text-[#eee2d6]'}`}>
                {item} <span className={`ml-1 ${filter === item ? 'text-[#e8c989]' : 'text-[#82766d]'}`}>{counts[item]}</span>
              </button>
            ))}
          </div>
          {listError && (
            <div className="m-3 rounded-xl border border-[#a75449]/35 bg-[#662d27]/20 p-3" role="alert" data-testid="support-list-error">
              <p className="text-xs text-[#e7b0a4]">{listError}</p>
              <button type="button" onClick={() => { void refreshList() }} data-testid="button-retry-support-list" className="mt-2 text-xs font-semibold text-[#e3c57f] underline underline-offset-2">Try again</button>
            </div>
          )}
          {listLoading && conversations.length === 0 ? (
            <div className="space-y-2 p-3" role="status" aria-label="Loading conversations">
              {[0, 1, 2, 3].map(item => <div key={item} className="h-[76px] animate-pulse rounded-xl bg-white/[.04]" />)}
            </div>
          ) : visibleConversations.length === 0 && !listError ? (
            <div className="flex flex-1 flex-col items-center justify-center px-7 py-14 text-center" data-testid="support-list-empty">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-[#d0b477]/20 bg-[#d0b477]/[.06] text-[#c7ad75]"><MessageSquareText size={19} /></div>
              <p className="text-sm font-semibold text-[#e8ddd1]">No conversations yet</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#92867d]">New member and guest messages will appear here.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2">
              {visibleConversations.map(item => {
                const active = item.id === selectedId
                return (
                  <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setFeedback('') }} aria-pressed={active} data-testid={`support-conversation-${item.id}`} className={`mb-1 block w-full rounded-xl border p-3 text-left transition ${active ? 'border-[#aa6553]/60 bg-[#462622]/55' : 'border-transparent hover:border-white/[.06] hover:bg-white/[.035]'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-[#f0e6db]">{item.customerName || 'Guest'}</span>
                      <span className="shrink-0 pt-0.5 text-[10px] text-[#92867d]">{relativeTime(item.lastMessageAt)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${item.status === 'open' ? 'bg-[#d7b36e]' : 'bg-[#728676]'}`} />
                      <span className="text-[10px] capitalize text-[#aa9c91]">{item.status}</span>
                      <span className="text-[#655951]">·</span>
                      <span className="truncate text-[10px] text-[#aa9c91]">{item.category}</span>
                    </div>
                    <p className="mt-2 truncate text-xs text-[#8f8379]">{item.lastMessage || 'No message preview'}</p>
                    {item.adminUnreadCount > 0 && <span className="mt-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#c9a55d] px-1.5 py-0.5 text-[10px] font-bold text-[#211814]" data-testid={`support-unread-${item.id}`}>{item.adminUnreadCount} new</span>}
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <main className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-h-[500px] flex-col bg-[#151312]`}>
          {!selectedId ? (
            <div className="hidden flex-1 flex-col items-center justify-center px-8 text-center lg:flex" data-testid="support-thread-placeholder">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-[#d0b477]/20 bg-[#d0b477]/[.06] text-[#c7ad75]"><ShieldCheck size={23} strokeWidth={1.7} /></div>
              <h3 className="text-sm font-semibold text-[#e8ddd1]">Your support desk</h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#92867d]">Select a conversation to read the full message history and reply directly.</p>
            </div>
          ) : threadLoading && !thread ? (
            <div className="flex flex-1 flex-col gap-4 p-6" role="status" aria-label="Loading conversation">
              <div className="h-14 animate-pulse rounded-xl bg-white/[.04]" />
              <div className="mt-auto h-20 w-3/4 animate-pulse rounded-2xl bg-white/[.04]" />
            </div>
          ) : threadError && !thread ? (
            <div className="m-auto max-w-sm p-6 text-center" role="alert" data-testid="support-thread-error">
              <p className="text-sm font-semibold text-[#e5b0a4]">Could not open conversation</p>
              <p className="mt-2 text-xs leading-relaxed text-[#a39489]">{threadError}</p>
              <button type="button" onClick={() => { if (selectedId) void refreshThread(selectedId) }} data-testid="button-retry-support-thread" className="mt-4 rounded-lg border border-[#75544a] px-3 py-2 text-xs font-semibold text-[#e4c981]">Try again</button>
            </div>
          ) : thread ? (
            <>
              <header className="flex items-start justify-between gap-3 border-b border-[#39302d] px-4 py-3.5 sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <button type="button" onClick={() => setSelectedId(null)} aria-label="Back to conversation list" data-testid="button-back-support-list" className="mt-0.5 rounded-lg p-2 text-[#b9a89b] hover:bg-white/[.06] lg:hidden"><span aria-hidden="true">←</span></button>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#d0b477]/25 bg-[#4b2b25] text-xs font-bold uppercase text-[#e5ca8c]">{(thread.customerName || 'G').trim().slice(0, 1)}</div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[#fff7ed]" data-testid="text-support-customer">{thread.customerName}</h3>
                    <p className="truncate text-[11px] text-[#a39489]" data-testid="text-support-email">{thread.customerEmail || 'Guest conversation'}{thread.userId ? ' · Member' : ' · Guest'}</p>
                    <p className="mt-1 text-[10px] text-[#8e8177]">{thread.category} · Started {fullDate(thread.createdAt)}</p>
                  </div>
                </div>
                <button type="button" onClick={changeStatus} disabled={statusSaving} data-testid="button-support-status" className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition disabled:opacity-50 ${thread.status === 'open' ? 'border-[#d2b578]/30 text-[#dfc47f] hover:bg-[#d2b578]/[.08]' : 'border-[#72917a]/35 text-[#a9c3ad] hover:bg-[#72917a]/[.08]'}`}>
                  {statusSaving ? <LoaderCircle size={13} className="animate-spin" /> : thread.status === 'open' ? <Check size={13} /> : <CheckCheck size={13} />}
                  {thread.status === 'open' ? 'Resolve' : 'Reopen'}
                </button>
              </header>

              {feedback && <p className="mx-4 mt-3 rounded-lg border border-[#718d71]/25 bg-[#526b4e]/[.12] px-3 py-2 text-xs text-[#b8d1aa]" role="status" data-testid="support-action-feedback">{feedback}</p>}
              {(threadError || listError) && <p className="mx-4 mt-3 rounded-lg border border-[#a75449]/30 bg-[#662d27]/20 px-3 py-2 text-xs text-[#e7b0a4]" role="alert" data-testid="support-thread-error">{threadError || listError}</p>}

              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite" data-testid="admin-support-message-list">
                {thread.messages.length === 0 ? (
                  <p className="py-12 text-center text-xs text-[#978a80]" data-testid="support-messages-empty">No messages in this conversation.</p>
                ) : thread.messages.map((message: SupportChatMessage) => {
                  const isAdmin = message.senderType === 'admin'
                  return (
                    <article key={message.id} data-testid={`admin-support-message-${message.id}`} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[min(82%,620px)] rounded-2xl px-4 py-3 ${isAdmin ? 'rounded-br-md border border-[#86463d]/45 bg-[#462522]' : 'rounded-bl-md border border-[#423936] bg-[#211d1b]'}`}>
                        <div className="mb-1.5 flex items-center justify-between gap-5">
                          <p className={`text-[10px] font-semibold ${isAdmin ? 'text-[#e1c37d]' : 'text-[#d4b9a0]'}`}>{isAdmin ? message.senderName || 'Support team' : thread.customerName || message.senderName || 'Guest'}</p>
                          <time dateTime={message.createdAt} title={fullDate(message.createdAt)} className="shrink-0 text-[9px] text-[#96877c]">{relativeTime(message.createdAt)}</time>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.65] text-[#eee5dc]">{message.content}</p>
                      </div>
                    </article>
                  )
                })}
                <div ref={endRef} />
              </div>

              {thread.status === 'open' ? (
                <form onSubmit={sendReply} className="border-t border-[#39302d] bg-[#1c1917] p-3.5 sm:px-5 sm:py-4">
                  <label className="sr-only" htmlFor="admin-support-reply">Write a reply</label>
                  <div className="flex items-end gap-2 rounded-xl border border-[#53433d] bg-[#141211] p-2 focus-within:border-[#c9a966]/55">
                    <textarea id="admin-support-reply" value={reply} onChange={event => setReply(event.target.value)} maxLength={3000} rows={2} data-testid="input-admin-support-reply" placeholder={`Reply to ${thread.customerName || 'this guest'}…`} className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm leading-relaxed text-[#f0e8df] outline-none placeholder:text-[#82766d]" />
                    <button type="submit" disabled={!reply.trim() || sending} aria-label="Send reply" data-testid="button-admin-send-reply" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#85352e] text-white transition hover:bg-[#9c4037] disabled:cursor-not-allowed disabled:opacity-45">
                      {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                  <p className="mt-2 px-1 text-[10px] text-[#877a70]">Replies are added to the conversation{thread.customerEmail ? ' and sent by email when available' : ''}.</p>
                </form>
              ) : (
                <div className="border-t border-[#39302d] bg-[#1c1917] px-5 py-4 text-center text-xs text-[#a89b90]">Resolved conversation. Reopen it to send another reply.</div>
              )}
            </>
          ) : null}
        </main>
      </div>
    </section>
  )
}
