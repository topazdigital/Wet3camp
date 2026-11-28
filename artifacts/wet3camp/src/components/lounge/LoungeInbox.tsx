import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUp, Inbox, LoaderCircle, MessageCircle, ShieldCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api, type LoungeConversation, type LoungeDirectMessage } from '@/lib/api'

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase() || 'M'
}

function formatTime(value: string | null) {
  if (!value) return 'New conversation'
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return 'Recently'
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return new Date(value).toLocaleDateString()
}

function Avatar({ name, src, small = false }: { name: string; src: string | null; small?: boolean }) {
  return src ? (
    <img src={src} alt="" className={`${small ? 'h-9 w-9' : 'h-10 w-10'} shrink-0 rounded-full object-cover`} />
  ) : (
    <span aria-hidden="true" className={`${small ? 'h-9 w-9 text-[10px]' : 'h-10 w-10 text-xs'} flex shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] font-bold text-[#FFD700]`}>
      {initials(name)}
    </span>
  )
}

export default function LoungeInbox({
  open,
  onOpenChange,
  initialConversationId = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialConversationId?: string | null
}) {
  const [conversations, setConversations] = useState<LoungeConversation[]>([])
  const [messages, setMessages] = useState<LoungeDirectMessage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedConversation = useMemo(
    () => conversations.find(conversation => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  )

  const refreshConversations = useCallback(async () => {
    try {
      const next = await api.lounge.conversations()
      setConversations(next)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load private messages.')
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  const refreshMessages = useCallback(async (conversationId: string) => {
    try {
      const next = await api.lounge.conversationMessages(conversationId)
      setMessages(next)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load this conversation.')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setSelectedId(initialConversationId)
    setLoadingConversations(true)
    void refreshConversations()
    const timer = window.setInterval(() => { void refreshConversations() }, 15_000)
    return () => window.clearInterval(timer)
  }, [open, initialConversationId, refreshConversations])

  useEffect(() => {
    if (!open || !selectedId) {
      setMessages([])
      return
    }
    setLoadingMessages(true)
    void refreshMessages(selectedId)
    const timer = window.setInterval(() => { void refreshMessages(selectedId) }, 8_000)
    return () => window.clearInterval(timer)
  }, [open, selectedId, refreshMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const body = draft.trim()
    if (!selectedId || !body || body.length > 800 || sending) return
    setSending(true)
    setError('')
    try {
      const sent = await api.lounge.sendPrivate(selectedId, body)
      setMessages(current => [...current, sent])
      setDraft('')
      void refreshConversations()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your message could not be sent.')
    } finally {
      setSending(false)
    }
  }

  const chooseConversation = (conversationId: string) => {
    setSelectedId(conversationId)
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(760px,calc(100dvh-1rem))] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden border-[#333] bg-[#0a0a0a] p-0 text-[#e0e0e0] sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b border-[#333] px-4 py-3 text-left sm:px-5">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <MessageCircle size={17} className="text-[#FFD700]" />
            Private Lounge messages
          </DialogTitle>
          <DialogDescription className="text-xs text-[#999]">
            Only you and the person you message can see these conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[270px_minmax(0,1fr)]">
          <aside className={`${selectedId ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-[#333]`}>
            <div className="flex items-center justify-between border-b border-[#333] px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#FFD700]">Inbox</span>
              {conversations.some(item => item.unreadCount > 0) && (
                <span className="rounded-full bg-[#8B0000] px-2 py-0.5 text-[10px] font-bold text-white">
                  {conversations.reduce((total, item) => total + item.unreadCount, 0)} new
                </span>
              )}
            </div>
            {error && !selectedId && <p role="alert" className="border-b border-[#8B0000]/50 bg-[#8B0000]/10 px-4 py-2 text-[11px] text-[#ffb3b3]">{error}</p>}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingConversations && conversations.length === 0 ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-[#a6978d]">
                  <LoaderCircle size={14} className="animate-spin" /> Loading conversations
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Inbox size={24} className="mx-auto mb-3 text-[#FFD700]" />
                  <p className="text-sm font-semibold text-[#e9dfd5]">No private messages yet</p>
                  <p className="mt-1 text-xs leading-5 text-[#a6978d]">Choose Message on a Lounge post to start a private conversation.</p>
                </div>
              ) : conversations.map(conversation => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => chooseConversation(conversation.id)}
                  className={`flex w-full items-center gap-3 border-b border-[#262626] px-3 py-3 text-left transition-colors hover:bg-white/[0.04] ${selectedId === conversation.id ? 'bg-[#8B0000]/20' : ''}`}
                >
                  <Avatar name={conversation.otherName} src={conversation.otherAvatar} small />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-[#eee4da]">{conversation.otherName}</span>
                      <span className="shrink-0 text-[10px] text-[#8f8178]">{formatTime(conversation.lastMessageAt)}</span>
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-[#a6978d]">{conversation.lastMessage || 'Conversation started'}</span>
                  </span>
                  {conversation.unreadCount > 0 && <span aria-label={`${conversation.unreadCount} unread`} className="h-2 w-2 shrink-0 rounded-full bg-[#FFD700]" />}
                </button>
              ))}
            </div>
          </aside>

          <section className={`${selectedId ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-col`}>
            {selectedId ? (
              <>
                <div className="flex shrink-0 items-center gap-3 border-b border-[#333] px-3 py-2.5 sm:px-4">
                  <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg p-2 text-[#b0b0b0] hover:bg-white/[0.06] md:hidden" aria-label="Back to inbox">
                    <ArrowLeft size={17} />
                  </button>
                  {selectedConversation && <Avatar name={selectedConversation.otherName} src={selectedConversation.otherAvatar} small />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#f1e8df]">{selectedConversation?.otherName ?? 'Private conversation'}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#999]"><ShieldCheck size={11} /> Private between participants</p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center gap-2 text-xs text-[#a6978d]">
                      <LoaderCircle size={14} className="animate-spin" /> Loading messages
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <MessageCircle size={25} className="mb-3 text-[#FFD700]" />
                      <p className="text-sm font-semibold text-[#e9dfd5]">Start the conversation</p>
                      <p className="mt-1 text-xs text-[#a6978d]">Your messages here are private.</p>
                    </div>
                  ) : messages.map(message => (
                    <div key={message.id} className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <article className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 sm:max-w-[75%] ${message.isOwn ? 'rounded-br-md bg-[#8B0000] text-white' : 'rounded-bl-md border border-[#333] bg-[#1a1a1a] text-[#e0e0e0]'}`}>
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-5">{message.body}</p>
                        <time dateTime={message.createdAt} className="mt-1.5 block text-right text-[9px] text-[#c1ab96]">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </time>
                      </article>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={sendMessage} className="shrink-0 border-t border-[#333] bg-[#111] p-3 sm:p-4">
                  {error && <p role="alert" className="mb-2 text-xs text-[#ffb3b3]">{error}</p>}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={event => setDraft(event.target.value.slice(0, 800))}
                      maxLength={800}
                      rows={2}
                      aria-label="Private message"
                      placeholder="Write a private message…"
                      className="max-h-28 min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-[#333] bg-[#0a0a0a] px-3 py-2.5 text-sm leading-5 text-[#e0e0e0] placeholder:text-[#777] outline-none focus:border-[#FFD700]"
                    />
                    <button type="submit" disabled={!draft.trim() || sending} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#8B0000] px-3.5 text-xs font-bold text-white transition-colors hover:bg-[#a30000] disabled:cursor-not-allowed disabled:opacity-45" aria-label="Send private message">
                      {sending ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowUp size={16} />}
                      <span className="hidden sm:inline">{sending ? 'Sending…' : 'Send'}</span>
                    </button>
                  </div>
                  <p className="mt-1.5 text-right font-mono text-[9px] text-[#888]">{draft.length}/800</p>
                </form>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700]"><Inbox size={21} /></div>
                <p className="text-sm font-semibold text-[#eee4da]">Your private inbox</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-[#a6978d]">Select a conversation to read and reply. Only its participants can see the messages.</p>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
