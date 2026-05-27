import React, { useState, useRef, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useSEO } from '@/lib/useSEO'
import {
  Send, Search, CheckCheck, Check, MoreVertical, Phone, Video, Paperclip,
  Smile, ArrowLeft, Calendar, X, Wifi, WifiOff, Image as ImageIcon
} from 'lucide-react'
import { Link } from 'wouter'
import { api, getToken } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import InAppCall from '@/components/InAppCall'

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'image' | 'vcall' | 'acall'
type MsgStatus = 'sent' | 'read'
interface Msg {
  id: number; text: string; mine: boolean
  time: string; fullTime?: string
  status?: MsgStatus; isBookingReq?: boolean
  msgType?: MsgType; mediaUrl?: string; callRoomId?: string
}
interface Conv {
  id: number; name: string; avatar: string
  last: string; time: string; unread: number; online: boolean; tier: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJIS = [
  '😊','😂','🥰','😍','🔥','💕','🌟','💋','😘','🤩',
  '💖','💗','✨','🎉','🙏','👀','😏','😈','🤫','💦',
  '🍑','🌹','🥂','💎','👑','🫦','❤️','💪','🎁','💌',
  '🌙','⭐','😋','🥵','💫','🎶','💃','💯','😎','🤭',
  '😅','😜','🧡','💛','💚','💙','💜','🖤','🔮','🌺',
]

const TIER_COLOR: Record<string, string> = { Elite: '#8B0000', VIP: '#FF4500', Premium: '#B8860B' }

const STATIC_CONVERSATIONS: Conv[] = [
  { id: 1, name: 'Amara K.',  avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop', last: 'Available tonight?',       time: '2m',        unread: 2, online: true,  tier: 'Elite'   },
  { id: 2, name: 'Zara M.',   avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=80&h=80&fit=crop', last: 'Thanks for booking!',      time: '1h',        unread: 0, online: true,  tier: 'VIP'     },
  { id: 3, name: 'Luna K.',   avatar: 'https://images.unsplash.com/photo-1509868918748-a554bf5f7e09?w=80&h=80&fit=crop', last: 'What time works for you?', time: '3h',        unread: 1, online: false, tier: 'VIP'     },
  { id: 4, name: 'Priya S.',  avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop', last: "Sure, I'll confirm ASAP.", time: 'Yesterday', unread: 0, online: false, tier: 'Elite'   },
  { id: 5, name: 'Fatuma H.', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop', last: 'Perfect, see you then!',    time: '2 days',    unread: 0, online: false, tier: 'Premium' },
]

const INITIAL_CHAT: Record<number, Msg[]> = {
  1: [
    { id: 1, text: 'Hey! Are you available this evening?',     mine: false, time: '7:02 PM' },
    { id: 2, text: 'Yes I am 😊 What time were you thinking?', mine: true,  time: '7:05 PM', status: 'read' },
    { id: 3, text: 'Around 8 PM works?',                       mine: false, time: '7:06 PM' },
    { id: 4, text: 'Perfect. How long?',                       mine: true,  time: '7:07 PM', status: 'read' },
    { id: 5, text: 'Maybe 2 hours. KES 16,000 right?',         mine: false, time: '7:08 PM' },
    { id: 6, text: "Yes that's correct. See you at 8 PM 🔥",   mine: true,  time: '7:09 PM', status: 'sent' },
    { id: 7, text: 'Available tonight?',                       mine: false, time: '7:15 PM' },
  ],
  2: [
    { id: 1, text: 'Hi! Your booking is confirmed for tomorrow.', mine: false, time: '2:00 PM' },
    { id: 2, text: 'Great, looking forward to it!',               mine: true,  time: '2:05 PM', status: 'read' },
    { id: 3, text: 'Thanks for booking!',                          mine: false, time: '2:10 PM' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMsgTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatFullTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Parse message content for special types
function parseMsgType(text: string): { msgType: MsgType; mediaUrl?: string; callRoomId?: string; displayText: string } {
  const imgMatch = text.match(/^\[img\](.*?)\[\/img\]$/)
  if (imgMatch) return { msgType: 'image', mediaUrl: imgMatch[1], displayText: '📷 Image' }

  const vcallMatch = text.match(/\[vcall\](.*?)\[\/vcall\]/)
  if (vcallMatch) return { msgType: 'vcall', callRoomId: vcallMatch[1], displayText: '📹 Video Call' }

  const acallMatch = text.match(/\[acall\](.*?)\[\/acall\]/)
  if (acallMatch) return { msgType: 'acall', callRoomId: acallMatch[1], displayText: '📞 Voice Call' }

  return { msgType: 'text', displayText: text }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 bg-card-bg border border-color rounded-xl shadow-2xl shadow-black/60 p-2 z-50 w-72">
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose() }}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-dark-bg rounded-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}


function MsgContent({ msg, onJoinCall }: { msg: Msg; onJoinCall: (roomId: string, type: 'vcall' | 'acall') => void }) {
  const [showTime, setShowTime] = useState(false)
  const parsed = parseMsgType(msg.text)

  if (parsed.msgType === 'image' && parsed.mediaUrl) {
    return (
      <div>
        <img
          src={parsed.mediaUrl}
          alt="attachment"
          className="max-w-[220px] max-h-[180px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(parsed.mediaUrl, '_blank')}
        />
        <div className={`flex items-center gap-1 mt-1 ${msg.mine ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[9px] text-white/50">{msg.time}</span>
          {msg.mine && (msg.status === 'read' ? <CheckCheck size={11} className="text-[#FFD700]" /> : <Check size={11} className="text-white/60" />)}
        </div>
      </div>
    )
  }

  if ((parsed.msgType === 'vcall' || parsed.msgType === 'acall') && parsed.callRoomId) {
    const isVideo = parsed.msgType === 'vcall'
    return (
      <div className="min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{isVideo ? '📹' : '📞'}</span>
          <div>
            <p className="text-sm font-bold text-text-light">{isVideo ? 'Video Call' : 'Voice Call'}</p>
            <p className="text-[10px] text-text-muted">{msg.mine ? 'You started a call' : 'Incoming call'}</p>
          </div>
        </div>
        <button
          onClick={() => onJoinCall(parsed.callRoomId!, parsed.msgType as 'vcall' | 'acall')}
          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors ${isVideo ? 'bg-[#2196F3] hover:bg-[#1976D2] text-white' : 'bg-[#28a745] hover:bg-[#218838] text-white'}`}
        >
          {isVideo ? '🎥 Join Video Call' : '📞 Join Voice Call'}
        </button>
        <p className="text-[9px] text-text-muted text-center mt-1.5">{msg.time}</p>
      </div>
    )
  }

  return (
    <>
      <span className="break-words">{msg.text}</span>
      <div className={`flex items-center gap-1 mt-1 ${msg.mine ? 'justify-end' : 'justify-start'}`} title={msg.fullTime}>
        <span
          className={`text-[9px] cursor-default ${msg.mine ? (msg.isBookingReq ? 'text-[#FFD700]/60' : 'text-white/60') : 'text-text-muted'}`}
          onClick={() => setShowTime(v => !v)}
        >
          {showTime && msg.fullTime ? msg.fullTime : msg.time}
        </span>
        {msg.mine && (msg.status === 'read'
          ? <CheckCheck size={11} className={msg.isBookingReq ? 'text-[#FFD700]' : 'text-[#FFD700]'} />
          : <Check size={11} className={msg.isBookingReq ? 'text-[#FFD700]/60' : 'text-white/60'} />
        )}
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessagesPage() {
  useSEO({ title: 'Messages', noIndex: true })
  const { isLoggedIn } = useAuth()

  const [conversations, setConversations] = useState<Conv[]>(STATIC_CONVERSATIONS)
  const [selected, setSelected] = useState<number | null>(1)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState<Record<number, Msg[]>>(INITIAL_CHAT)
  const [showList, setShowList] = useState(true)
  const [typing, setTyping] = useState<Record<number, boolean>>({})
  const [unread, setUnread] = useState<Record<number, number>>({ 1: 2, 3: 1 })
  const [bookingPrompt, setBookingPrompt] = useState(false)
  const [sseConnected, setSseConnected] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeCall, setActiveCall] = useState<{ roomId: string; isCaller: boolean; type: 'vcall' | 'acall' } | null>(null)
  const [uploading, setUploading] = useState(false)

  const chatEndRef  = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<number | null>(selected)
  const sseRef      = useRef<EventSource | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selected, messages, typing])

  // Load real threads from API
  useEffect(() => {
    if (!isLoggedIn) return
    api.messages.list().then((threads: any[]) => {
      if (!threads || threads.length === 0) return
      const mapped: Conv[] = threads.map((t: any) => ({
        id: Number(t.escortId),
        name: t.escortName ?? 'Unknown',
        avatar: t.escortImage ?? '',
        last: t.messages?.slice(-1)[0]?.content ?? '',
        time: 'recent',
        unread: 0,
        online: false,
        tier: 'Standard',
      }))
      setConversations(mapped)
      const msgMap: Record<number, Msg[]> = {}
      threads.forEach((t: any) => {
        if (!Array.isArray(t.messages)) return
        const escortId = Number(t.escortId)
        msgMap[escortId] = t.messages.map((m: any) => {
          const now = new Date(m.createdAt)
          return {
            id: m.id,
            text: m.content,
            mine: !m.fromEscort,
            time: formatMsgTime(now),
            fullTime: formatFullTime(now),
            status: m.readAt ? 'read' : 'sent',
          }
        })
      })
      if (Object.keys(msgMap).length > 0) {
        setMessages(prev => ({ ...prev, ...msgMap }))
      }
    }).catch(() => {})
  }, [isLoggedIn])

  // SSE for real-time messages
  useEffect(() => {
    if (!isLoggedIn) return
    const token = getToken()
    if (!token) return

    const connect = () => {
      const es = new EventSource(`/api/events/messages?token=${encodeURIComponent(token)}`)
      sseRef.current = es
      es.onopen = () => setSseConnected(true)
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (!msg || typeof msg !== 'object') return
          const escortId = Number(msg.escortId)
          const now = new Date(msg.createdAt || Date.now())
          setTyping(prev => ({ ...prev, [escortId]: false }))
          const incomingMsg: Msg = {
            id: msg.id,
            text: msg.content,
            mine: !msg.fromEscort,
            time: formatMsgTime(now),
            fullTime: formatFullTime(now),
            status: msg.fromEscort ? undefined : 'sent',
          }
          setMessages(prev => {
            const existing = prev[escortId] ?? []
            if (existing.some(m => m.id === msg.id)) return prev
            return { ...prev, [escortId]: [...existing, incomingMsg] }
          })
          setConversations(prev => prev.map(c =>
            c.id === escortId ? { ...c, last: msg.content, time: 'now' } : c
          ))
          if (selectedRef.current !== escortId && msg.fromEscort) {
            setUnread(prev => ({ ...prev, [escortId]: (prev[escortId] ?? 0) + 1 }))
          }
        } catch {}
      }
      es.onerror = () => {
        setSseConnected(false)
        es.close()
        sseRef.current = null
        setTimeout(connect, 5000)
      }
    }
    connect()
    return () => { sseRef.current?.close(); sseRef.current = null; setSseConnected(false) }
  }, [isLoggedIn])

  const selectConv = (id: number) => {
    setSelected(id)
    setShowList(false)
    setUnread(prev => ({ ...prev, [id]: 0 }))
    setBookingPrompt(false)
    setShowEmojiPicker(false)
    if (isLoggedIn) api.messages.markRead(id).catch(() => {})
  }

  const pushMsg = (convId: number, text: string, mine: boolean, extra: Partial<Msg> = {}) => {
    const now = new Date()
    const msg: Msg = {
      id: Date.now(),
      text,
      mine,
      time: formatMsgTime(now),
      fullTime: formatFullTime(now),
      status: mine ? 'sent' : undefined,
      ...extra,
    }
    setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] ?? []), msg] }))
    if (mine) setConversations(prev => prev.map(c => c.id === convId ? { ...c, last: text, time: 'now' } : c))
    return msg
  }

  const simulateReply = useCallback((convId: number) => {
    const replies = [
      "I'd love that! Let me check my schedule 😊",
      'That sounds perfect 🔥',
      "Sure! What's your preference for location?",
      "I'm available — when exactly?",
      'Looking forward to it! 💕',
      'Let me know the time and I will confirm.',
    ]
    setTimeout(() => {
      setTyping(prev => ({ ...prev, [convId]: true }))
      setTimeout(() => {
        setTyping(prev => ({ ...prev, [convId]: false }))
        const text = replies[Math.floor(Math.random() * replies.length)]
        pushMsg(convId, text, false)
        setUnread(prev => selectedRef.current === convId ? prev : { ...prev, [convId]: (prev[convId] ?? 0) + 1 })
      }, 1500 + Math.random() * 1500)
    }, 800)
  }, [])

  const sendMsg = () => {
    if (!input.trim() || !selected) return
    const text = input.trim()
    setInput('')
    setShowEmojiPicker(false)
    pushMsg(selected, text, true, { status: 'sent' })

    if (isLoggedIn) {
      api.messages.send(selected, text)
        .then(() => setTimeout(() => setTyping(prev => ({ ...prev, [selected]: true })), 800))
        .catch(() => simulateReply(selected))
    } else {
      simulateReply(selected)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    e.target.value = ''

    if (!file.type.startsWith('image/')) {
      alert('Only image attachments are supported.')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const { url } = await api.upload.photo(base64, 'gallery', file.name)
          const msgText = `[img]${url}[/img]`
          pushMsg(selected, msgText, true, { status: 'sent' })
          api.messages.send(selected, msgText).catch(() => {})
        } catch {
          alert('Upload failed. Please try again.')
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
  }

  const startCall = (type: 'vcall' | 'acall') => {
    if (!selected) return
    const roomId = `WET3CAMP-${Date.now().toString(36).toUpperCase()}`
    const msgText = `[${type}]${roomId}[/${type}]`
    pushMsg(selected, msgText, true, { status: 'sent' })
    api.messages.send(selected, msgText).catch(() => {})
    if (type === 'acall') {
      setActiveCall({ roomId, isCaller: true, type })
    } else {
      // Video calls still use Jitsi (full video needs more infrastructure)
      window.open(`https://meet.jit.si/${roomId}`, '_blank')
    }
  }

  const joinCall = (roomId: string, type: 'vcall' | 'acall') => {
    if (type === 'acall') {
      setActiveCall({ roomId, isCaller: false, type })
    } else {
      window.open(`https://meet.jit.si/${roomId}`, '_blank')
    }
  }

  const sendBookingRequest = () => {
    if (!selected) return
    const text = '📅 Booking request sent — please check your bookings to confirm.'
    pushMsg(selected, text, true, { status: 'sent', isBookingReq: true })
    setBookingPrompt(false)
    api.messages.send(selected, text).catch(() => {})
    setTimeout(() => {
      setTyping(prev => ({ ...prev, [selected]: true }))
      setTimeout(() => {
        setTyping(prev => ({ ...prev, [selected]: false }))
        pushMsg(selected, "I received your booking request! I'll confirm shortly 💕", false)
      }, 2500)
    }, 1200)
  }

  const activeCon = conversations.find(c => c.id === selected)
  const filtered  = conversations.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  const totalUnread = Object.values(unread).reduce((s, n) => s + n, 0)

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      {activeCall && (
        <InAppCall
          roomId={activeCall.roomId}
          isCaller={activeCall.isCaller}
          calleeName={activeCon?.name ?? 'Unknown'}
          calleeAvatar={activeCon?.avatar}
          onClose={() => setActiveCall(null)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Sidebar />
      <div className="flex-1 w-full min-w-0 lg:pb-0 overflow-hidden">
        <Header />
        <div className="flex h-[calc(100vh-56px)] overflow-hidden pb-16 lg:pb-0">

          {/* ── Conversation List ── */}
          <div className={`${selected && !showList ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 flex-col border-r border-color bg-card-bg`}>
            <div className="p-3 border-b border-color">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-text-light">Messages</h2>
                {totalUnread > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-[#8B0000] text-white rounded-full">{totalUnread} new</span>
                )}
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-8 pr-3 py-2 bg-dark-bg border border-color rounded-xl text-xs text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]/60 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(conv => {
                const tierColor = TIER_COLOR[conv.tier] ?? '#8B0000'
                const convUnread = unread[conv.id] ?? 0
                const isTypingHere = typing[conv.id]
                const lastMsg = messages[conv.id]?.slice(-1)[0]
                const { displayText: lastDisplay } = lastMsg ? parseMsgType(lastMsg.text) : { displayText: conv.last }
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConv(conv.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3.5 border-b border-color/50 transition-colors text-left ${selected === conv.id ? 'bg-[#8B0000]/10 border-l-2 border-l-[#8B0000]' : 'hover:bg-dark-bg border-l-2 border-l-transparent'}`}
                  >
                    <div className="relative flex-shrink-0">
                      <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-full object-cover border-2" style={{ borderColor: tierColor + '60' }} />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card-bg ${conv.online ? 'bg-[#28a745]' : 'bg-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-light">{conv.name}</span>
                        <span className="text-[10px] text-text-muted">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className={`text-xs truncate ${isTypingHere ? 'text-[#28a745] italic' : convUnread ? 'text-text-light font-semibold' : 'text-text-muted'}`}>
                          {isTypingHere ? 'typing…' : lastDisplay}
                        </span>
                        {convUnread > 0 && (
                          <span className="w-5 h-5 bg-[#8B0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-1">{convUnread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Chat Area ── */}
          {selected ? (
            <div className={`${!showList ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>

              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-color bg-card-bg">
                <button className="md:hidden p-1.5 text-text-muted hover:text-text-light mr-1" onClick={() => setShowList(true)}>
                  <ArrowLeft size={18} />
                </button>
                <Link href={`/profile/${activeCon?.id}`} className="relative flex-shrink-0 group">
                  <img src={activeCon?.avatar} alt={activeCon?.name} className="w-9 h-9 rounded-full object-cover group-hover:ring-2 group-hover:ring-[#8B0000]/50 transition-all" />
                  {activeCon?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#28a745] rounded-full border-2 border-card-bg" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${activeCon?.id}`} className="font-bold text-text-light text-sm hover:text-[#FFD700] transition-colors">
                      {activeCon?.name}
                    </Link>
                    {isLoggedIn && (
                      <span title={sseConnected ? 'Real-time connected' : 'Connecting…'}>
                        {sseConnected ? <Wifi size={10} className="text-[#28a745]" /> : <WifiOff size={10} className="text-text-muted animate-pulse" />}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] ${typing[selected] ? 'text-[#28a745] animate-pulse' : activeCon?.online ? 'text-[#28a745]' : 'text-text-muted'}`}>
                    {typing[selected] ? 'typing…' : activeCon?.online ? 'Online' : 'Offline'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBookingPrompt(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFD700] border border-[#FFD700]/30 rounded-lg hover:bg-[#FFD700]/10 transition-all"
                  >
                    <Calendar size={13} /> Book
                  </button>
                  <button onClick={() => startCall('acall')} className="p-2 text-text-muted hover:text-[#28a745] rounded-lg hover:bg-dark-bg transition-colors" title="Voice Call">
                    <Phone size={16} />
                  </button>
                  <button onClick={() => startCall('vcall')} className="p-2 text-text-muted hover:text-[#2196F3] rounded-lg hover:bg-dark-bg transition-colors" title="Video Call">
                    <Video size={16} />
                  </button>
                  <button className="p-2 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors"><MoreVertical size={16} /></button>
                </div>
              </div>

              {/* Booking prompt */}
              {bookingPrompt && (
                <div className="mx-4 mt-3 p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#FFD700]">📅 Request a Booking</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Send {activeCon?.name.split(' ')[0]} a booking request. Payment arranged between you directly.</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button onClick={sendBookingRequest} className="px-3 py-1.5 bg-[#8B0000] text-white text-xs font-bold rounded-lg hover:bg-[#a00000] transition-all">
                      Send Request
                    </button>
                    <Link href="/bookings" className="px-3 py-1.5 bg-dark-bg border border-color text-text-muted text-xs font-semibold rounded-lg hover:border-text-muted transition-all">
                      View Bookings
                    </Link>
                    <button onClick={() => setBookingPrompt(false)} className="p-1 text-text-muted hover:text-text-light"><X size={14} /></button>
                  </div>
                </div>
              )}

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-color" />
                  <span className="text-[10px] text-text-muted px-2">Today</span>
                  <div className="flex-1 h-px bg-color" />
                </div>

                {(messages[selected] ?? []).map(msg => {
                  const parsed = parseMsgType(msg.text)
                  const isSpecial = parsed.msgType === 'vcall' || parsed.msgType === 'acall'
                  return (
                    <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                      {!msg.mine && (
                        <Link href={`/profile/${activeCon?.id}`}>
                          <img src={activeCon?.avatar} alt="" className="w-6 h-6 rounded-full object-cover mr-2 self-end flex-shrink-0 hover:ring-2 hover:ring-[#8B0000]/40 transition-all" />
                        </Link>
                      )}
                      <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
                        msg.mine
                          ? msg.isBookingReq
                            ? 'bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] rounded-br-sm'
                            : isSpecial
                              ? 'bg-dark-bg border border-color text-text-light rounded-br-sm'
                              : 'bg-[#8B0000] text-white rounded-br-sm'
                          : isSpecial
                            ? 'bg-dark-bg border border-color text-text-light rounded-bl-sm'
                            : 'bg-card-bg text-text-light border border-color rounded-bl-sm'
                      }`}>
                        <MsgContent msg={msg} onJoinCall={joinCall} />
                      </div>
                    </div>
                  )
                })}

                {typing[selected] && (
                  <div className="flex justify-start items-end gap-2">
                    <img src={activeCon?.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    <div className="bg-card-bg border border-color rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.9s' }} />
                      <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.9s' }} />
                      <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '400ms', animationDuration: '0.9s' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-3 py-3 border-t border-color bg-card-bg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`p-2 text-text-muted hover:text-text-light rounded-xl hover:bg-dark-bg transition-colors flex-shrink-0 ${uploading ? 'opacity-50' : ''}`}
                    title="Attach image"
                  >
                    {uploading ? <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" /> : <Paperclip size={17} />}
                  </button>
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMsg())}
                      placeholder="Type a message…"
                      className="w-full pl-4 pr-10 py-2.5 bg-dark-bg border border-color rounded-2xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]/50 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(v => !v)}
                          className="text-text-muted hover:text-[#FFD700] transition-colors"
                        >
                          <Smile size={16} />
                        </button>
                        {showEmojiPicker && (
                          <EmojiPicker
                            onSelect={e => { setInput(prev => prev + e); inputRef.current?.focus() }}
                            onClose={() => setShowEmojiPicker(false)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={sendMsg}
                    disabled={!input.trim()}
                    className="w-9 h-9 flex items-center justify-center bg-[#8B0000] hover:bg-[#a00000] text-white rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                  </button>
                </div>
                <p className="text-[9px] text-text-muted text-center mt-1.5">
                  Tap the time on any message to see full date/time • Click name to view profile
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center flex-col gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-card-bg border border-color flex items-center justify-center">
                <Send size={28} className="text-text-muted" />
              </div>
              <p className="text-text-light font-semibold">Select a conversation</p>
              <p className="text-text-muted text-sm">Choose someone from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
