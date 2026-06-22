import React, { useState, useRef, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useSEO } from '@/lib/useSEO'
import {
  Send, Search, CheckCheck, Check, MoreVertical, Phone, Video, Paperclip,
  Smile, ArrowLeft, Calendar, X, Wifi, WifiOff, Mic, StopCircle, FileText,
  Image as ImageIcon, Download
} from 'lucide-react'
import { Link } from 'wouter'
import { api, getToken } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import InAppCall from '@/components/InAppCall'

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'image' | 'audio' | 'file' | 'vcall' | 'acall'
type MsgStatus = 'sent' | 'delivered' | 'read'
interface Msg {
  id: number; text: string; mine: boolean
  time: string; fullTime?: string; isoDate?: string
  status?: MsgStatus; isBookingReq?: boolean
  msgType?: MsgType; mediaUrl?: string; callRoomId?: string
  fileName?: string; fileSize?: string
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

const now = new Date()
const today = (h: number, m: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).toISOString()
const yesterday = (h: number, m: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, h, m).toISOString()

const INITIAL_CHAT: Record<number, Msg[]> = {
  1: [
    { id: 1, text: 'Hey! Are you available this evening?',     mine: false, time: '7:02 PM', isoDate: today(19, 2) },
    { id: 2, text: 'Yes I am 😊 What time were you thinking?', mine: true,  time: '7:05 PM', isoDate: today(19, 5), status: 'read' },
    { id: 3, text: 'Around 8 PM works?',                       mine: false, time: '7:06 PM', isoDate: today(19, 6) },
    { id: 4, text: 'Perfect. How long?',                       mine: true,  time: '7:07 PM', isoDate: today(19, 7), status: 'read' },
    { id: 5, text: 'Maybe 2 hours. KES 16,000 right?',         mine: false, time: '7:08 PM', isoDate: today(19, 8) },
    { id: 6, text: "Yes that's correct. See you at 8 PM 🔥",   mine: true,  time: '7:09 PM', isoDate: today(19, 9), status: 'delivered' },
    { id: 7, text: 'Available tonight?',                       mine: false, time: '7:15 PM', isoDate: today(19, 15) },
  ],
  2: [
    { id: 1, text: 'Hi! Your booking is confirmed for tomorrow.', mine: false, time: '2:00 PM', isoDate: yesterday(14, 0) },
    { id: 2, text: 'Great, looking forward to it!',               mine: true,  time: '2:05 PM', isoDate: yesterday(14, 5), status: 'read' },
    { id: 3, text: 'Thanks for booking!',                          mine: false, time: '2:10 PM', isoDate: yesterday(14, 10) },
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

function getDateLabel(isoDate: string): string {
  const d = new Date(isoDate)
  const todayD = new Date(); todayD.setHours(0,0,0,0)
  const yesterdayD = new Date(todayD); yesterdayD.setDate(yesterdayD.getDate() - 1)
  d.setHours(0,0,0,0)
  if (d.getTime() === todayD.getTime()) return 'Today'
  if (d.getTime() === yesterdayD.getTime()) return 'Yesterday'
  return new Date(isoDate).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Parse message content for special types
function parseMsgType(text: string): { msgType: MsgType; mediaUrl?: string; callRoomId?: string; displayText: string; fileName?: string } {
  const imgMatch = text.match(/^\[img\](.*?)\[\/img\]$/)
  if (imgMatch) return { msgType: 'image', mediaUrl: imgMatch[1], displayText: '📷 Photo' }

  const audioMatch = text.match(/^\[audio\](.*?)\[\/audio\]$/)
  if (audioMatch) return { msgType: 'audio', mediaUrl: audioMatch[1], displayText: '🎤 Voice message' }

  const fileMatch = text.match(/^\[file name="(.*?)" size="(.*?)"\](.*?)\[\/file\]$/)
  if (fileMatch) return { msgType: 'file', mediaUrl: fileMatch[3], fileName: fileMatch[1], displayText: `📎 ${fileMatch[1]}` }

  const vcallMatch = text.match(/\[vcall\](.*?)\[\/vcall\]/)
  if (vcallMatch) return { msgType: 'vcall', callRoomId: vcallMatch[1], displayText: '📹 Video Call' }

  const acallMatch = text.match(/\[acall\](.*?)\[\/acall\]/)
  if (acallMatch) return { msgType: 'acall', callRoomId: acallMatch[1], displayText: '📞 Voice Call' }

  return { msgType: 'text', displayText: text }
}

// ─── Tick Component ────────────────────────────────────────────────────────────

function MsgTick({ status, booking }: { status?: MsgStatus; booking?: boolean }) {
  if (!status) return null
  if (status === 'read') return <CheckCheck size={11} className={booking ? 'text-[#FFD700]' : 'text-[#4FC3F7]'} />
  if (status === 'delivered') return <CheckCheck size={11} className="text-white/50" />
  return <Check size={11} className="text-white/50" />
}

// ─── Audio Player ─────────────────────────────────────────────────────────────

function AudioPlayer({ src, mine }: { src: string; mine: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  return (
    <div className="flex items-center gap-2 min-w-[180px] max-w-[240px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={e => {
          const a = e.currentTarget
          setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0)
        }}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => { setPlaying(false); setProgress(0) }}
      />
      <button
        onClick={toggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          mine ? 'bg-white/20 hover:bg-white/30' : 'bg-[#8B0000]/20 hover:bg-[#8B0000]/30'
        }`}
      >
        {playing
          ? <span className="flex gap-0.5">{[0,1,2].map(i => <span key={i} className="w-0.5 h-3 bg-current rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
          : <span className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-current ml-0.5" />
        }
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1 bg-current/20 rounded-full overflow-hidden">
          <div className="h-full bg-current/70 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[9px] opacity-60">
          {duration > 0 ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '0:00'}
        </span>
      </div>
    </div>
  )
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

  const timeLine = (
    <div className={`flex items-center gap-1 mt-1 ${msg.mine ? 'justify-end' : 'justify-start'}`}>
      <span
        className={`text-[9px] cursor-default ${msg.mine ? 'text-white/50' : 'text-text-muted'}`}
        onClick={() => setShowTime(v => !v)}
      >
        {showTime && msg.fullTime ? msg.fullTime : msg.time}
      </span>
      {msg.mine && <MsgTick status={msg.status} booking={msg.isBookingReq} />}
    </div>
  )

  if (parsed.msgType === 'image' && parsed.mediaUrl) {
    return (
      <div>
        <img
          src={parsed.mediaUrl}
          alt="attachment"
          className="max-w-[220px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity block"
          onClick={() => window.open(parsed.mediaUrl, '_blank')}
        />
        {timeLine}
      </div>
    )
  }

  if (parsed.msgType === 'audio' && parsed.mediaUrl) {
    return (
      <div>
        <AudioPlayer src={parsed.mediaUrl} mine={msg.mine} />
        {timeLine}
      </div>
    )
  }

  if (parsed.msgType === 'file' && parsed.mediaUrl) {
    return (
      <div>
        <a
          href={parsed.mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 no-underline group"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.mine ? 'bg-white/20' : 'bg-[#8B0000]/20'}`}>
            <FileText size={18} className="opacity-80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate max-w-[150px]">{parsed.fileName ?? 'File'}</p>
            <p className="text-[10px] opacity-60">{msg.fileSize ?? ''}</p>
          </div>
          <Download size={14} className="opacity-60 group-hover:opacity-100 flex-shrink-0" />
        </a>
        {timeLine}
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
      <span className="break-words whitespace-pre-wrap">{msg.text}</span>
      <div className={`flex items-center gap-1 mt-1 ${msg.mine ? 'justify-end' : 'justify-start'}`}>
        <span
          className={`text-[9px] cursor-default ${msg.mine ? (msg.isBookingReq ? 'text-[#FFD700]/60' : 'text-white/50') : 'text-text-muted'}`}
          onClick={() => setShowTime(v => !v)}
        >
          {showTime && msg.fullTime ? msg.fullTime : msg.time}
        </span>
        {msg.mine && <MsgTick status={msg.status} booking={msg.isBookingReq} />}
      </div>
    </>
  )
}

// Date separator between messages
function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-color" />
      <span className="text-[10px] text-text-muted px-2 bg-dark-bg rounded-full py-0.5">{label}</span>
      <div className="flex-1 h-px bg-color" />
    </div>
  )
}

// ─── Recording Indicator ──────────────────────────────────────────────────────

function RecordingBar({ seconds, onStop, onCancel }: { seconds: number; onStop: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#8B0000]/10 border-t border-[#8B0000]/30">
      <div className="w-2 h-2 rounded-full bg-[#8B0000] animate-pulse flex-shrink-0" />
      <span className="text-[11px] text-[#8B0000] font-medium flex-1">
        Recording… {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </span>
      <button onClick={onCancel} className="p-1.5 text-text-muted hover:text-text-light transition-colors" title="Cancel">
        <X size={15} />
      </button>
      <button
        onClick={onStop}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B0000] text-white text-xs font-bold rounded-lg hover:bg-[#a00000] transition-colors"
      >
        <StopCircle size={13} /> Send
      </button>
    </div>
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
  const [showAttachMenu, setShowAttachMenu] = useState(false)

  // Voice recording
  const [recording, setRecording] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const chatEndRef   = useRef<HTMLDivElement>(null)
  const selectedRef  = useRef<number | null>(selected)
  const sseRef       = useRef<EventSource | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const anyFileRef   = useRef<HTMLInputElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

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
          const nowD = new Date(m.createdAt)
          return {
            id: m.id,
            text: m.content,
            mine: !m.fromEscort,
            time: formatMsgTime(nowD),
            fullTime: formatFullTime(nowD),
            isoDate: new Date(m.createdAt).toISOString(),
            status: m.readAt ? 'read' : 'delivered',
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
          const nowD = new Date(msg.createdAt || Date.now())
          setTyping(prev => ({ ...prev, [escortId]: false }))
          const incomingMsg: Msg = {
            id: msg.id,
            text: msg.content,
            mine: !msg.fromEscort,
            time: formatMsgTime(nowD),
            fullTime: formatFullTime(nowD),
            isoDate: nowD.toISOString(),
            status: msg.fromEscort ? undefined : 'delivered',
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
    setShowAttachMenu(false)
    if (isLoggedIn) api.messages.markRead(id).catch(() => {})
    // Mark all my messages in this conv as "read" after a short delay
    setTimeout(() => {
      setMessages(prev => {
        const msgs = prev[id]
        if (!msgs) return prev
        return { ...prev, [id]: msgs.map(m => m.mine && m.status !== 'read' ? { ...m, status: 'read' as MsgStatus } : m) }
      })
    }, 2000)
  }

  const upgradeToDelivered = (convId: number, msgId: number) => {
    setTimeout(() => {
      setMessages(prev => {
        const msgs = prev[convId]
        if (!msgs) return prev
        return { ...prev, [convId]: msgs.map(m => m.id === msgId && m.status === 'sent' ? { ...m, status: 'delivered' as MsgStatus } : m) }
      })
    }, 1500)
  }

  const pushMsg = (convId: number, text: string, mine: boolean, extra: Partial<Msg> = {}) => {
    const nowD = new Date()
    const msg: Msg = {
      id: Date.now(),
      text,
      mine,
      time: formatMsgTime(nowD),
      fullTime: formatFullTime(nowD),
      isoDate: nowD.toISOString(),
      status: mine ? 'sent' : undefined,
      ...extra,
    }
    setMessages(prev => ({ ...prev, [convId]: [...(prev[convId] ?? []), msg] }))
    if (mine) {
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, last: text, time: 'now' } : c))
      upgradeToDelivered(convId, msg.id)
    }
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
        // Mark our last message as "read" after reply
        setMessages(prev => {
          const msgs = prev[convId]
          if (!msgs) return prev
          return { ...prev, [convId]: msgs.map(m => m.mine ? { ...m, status: 'read' as MsgStatus } : m) }
        })
        setUnread(prev => selectedRef.current === convId ? prev : { ...prev, [convId]: (prev[convId] ?? 0) + 1 })
      }, 1500 + Math.random() * 1500)
    }, 800)
  }, [])

  const sendMsg = () => {
    if (!input.trim() || !selected) return
    const text = input.trim()
    setInput('')
    setShowEmojiPicker(false)
    setShowAttachMenu(false)
    pushMsg(selected, text, true, { status: 'sent' })

    if (isLoggedIn) {
      api.messages.send(selected, text)
        .then(() => setTimeout(() => setTyping(prev => ({ ...prev, [selected]: true })), 800))
        .catch(() => simulateReply(selected))
    } else {
      simulateReply(selected)
    }
  }

  // ── Image attachment ──
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    e.target.value = ''
    setShowAttachMenu(false)
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

  // ── File attachment ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    e.target.value = ''
    setShowAttachMenu(false)
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const { url } = await api.upload.photo(base64, 'gallery', file.name)
          const sizeStr = formatFileSize(file.size)
          const msgText = `[file name="${file.name}" size="${sizeStr}"]${url}[/file]`
          pushMsg(selected, msgText, true, { status: 'sent', fileName: file.name, fileSize: sizeStr })
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

  // ── Voice recording ──
  const startRecording = async () => {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' })
      audioChunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.start(100)
      mediaRecorderRef.current = recorder
      setRecording(true)
      setRecSeconds(0)
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch {
      alert('Microphone access denied. Please allow microphone in browser settings.')
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null }
    const recorder = mediaRecorderRef.current
    const convId = selected!
    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType })
      recorder.stream.getTracks().forEach(t => t.stop())
      if (blob.size < 500) { setRecording(false); return }
      try {
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64 = reader.result as string
            const { url } = await api.upload.photo(base64, 'gallery', `voice-${Date.now()}.webm`)
            const msgText = `[audio]${url}[/audio]`
            pushMsg(convId, msgText, true, { status: 'sent' })
            api.messages.send(convId, msgText).catch(() => {})
          } catch {
            alert('Voice upload failed.')
          }
        }
        reader.readAsDataURL(blob)
      } finally {
        setRecording(false)
      }
    }
    recorder.stop()
  }

  const cancelRecording = () => {
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    setRecording(false)
    setRecSeconds(0)
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
        setMessages(prev => {
          const msgs = prev[selected]
          if (!msgs) return prev
          return { ...prev, [selected]: msgs.map(m => m.mine ? { ...m, status: 'read' as MsgStatus } : m) }
        })
      }, 2500)
    }, 1200)
  }

  // ── Compute date-separated message render list ──
  const activeCon = conversations.find(c => c.id === selected)
  const filtered  = conversations.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  const totalUnread = Object.values(unread).reduce((s, n) => s + n, 0)

  const renderMessages = (() => {
    if (!selected) return []
    const msgs = messages[selected] ?? []
    const result: Array<{ type: 'separator'; label: string } | { type: 'msg'; msg: Msg }> = []
    let lastDateLabel = ''
    for (const msg of msgs) {
      if (msg.isoDate) {
        const label = getDateLabel(msg.isoDate)
        if (label !== lastDateLabel) {
          result.push({ type: 'separator', label })
          lastDateLabel = label
        }
      }
      result.push({ type: 'msg', msg })
    }
    if (result.length === 0) {
      result.push({ type: 'separator', label: 'Today' })
    }
    return result
  })()

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

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageSelect} />
      <input ref={anyFileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" className="hidden" onChange={handleFileSelect} />

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
                const lastMsgStatus = lastMsg?.mine ? lastMsg.status : undefined
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
                        <div className="flex items-center gap-1 min-w-0">
                          {lastMsgStatus && <MsgTick status={lastMsgStatus} />}
                          <span className={`text-xs truncate ${isTypingHere ? 'text-[#28a745] italic' : convUnread ? 'text-text-light font-semibold' : 'text-text-muted'}`}>
                            {isTypingHere ? 'typing…' : lastDisplay}
                          </span>
                        </div>
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
              <div className="flex-1 overflow-y-auto px-4 py-4" onClick={() => { setShowEmojiPicker(false); setShowAttachMenu(false) }}>
                <div className="space-y-1">
                  {renderMessages.map((item, i) => {
                    if (item.type === 'separator') {
                      return <DateSeparator key={`sep-${i}`} label={item.label} />
                    }
                    const { msg } = item
                    const parsed = parseMsgType(msg.text)
                    const isSpecial = parsed.msgType === 'vcall' || parsed.msgType === 'acall'
                    return (
                      <div key={msg.id} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'} mb-1.5`}>
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
                    <div className="flex justify-start items-end gap-2 mb-1.5">
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
              </div>

              {/* Voice recording bar */}
              {recording && (
                <RecordingBar
                  seconds={recSeconds}
                  onStop={stopRecording}
                  onCancel={cancelRecording}
                />
              )}

              {/* Input bar */}
              {!recording && (
                <div className="px-3 py-3 border-t border-color bg-card-bg">
                  {/* Attachment menu */}
                  {showAttachMenu && (
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                      <button
                        onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click() }}
                        disabled={uploading}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-[#2196F3]/10 border border-[#2196F3]/30 flex items-center justify-center group-hover:bg-[#2196F3]/20 transition-colors">
                          <ImageIcon size={18} className="text-[#2196F3]" />
                        </div>
                        <span className="text-[9px] text-text-muted">Photo/Video</span>
                      </button>
                      <button
                        onClick={() => { setShowAttachMenu(false); anyFileRef.current?.click() }}
                        disabled={uploading}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-[#FF9800]/10 border border-[#FF9800]/30 flex items-center justify-center group-hover:bg-[#FF9800]/20 transition-colors">
                          <FileText size={18} className="text-[#FF9800]" />
                        </div>
                        <span className="text-[9px] text-text-muted">Document</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* Attachment button */}
                    <button
                      onClick={() => { setShowAttachMenu(v => !v); setShowEmojiPicker(false) }}
                      disabled={uploading}
                      className={`p-2 rounded-xl hover:bg-dark-bg transition-colors flex-shrink-0 ${
                        showAttachMenu ? 'text-[#2196F3]' : uploading ? 'text-text-muted opacity-50' : 'text-text-muted hover:text-text-light'
                      }`}
                      title="Attach"
                    >
                      {uploading
                        ? <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                        : <Paperclip size={17} />
                      }
                    </button>

                    {/* Text input */}
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
                            onClick={() => { setShowEmojiPicker(v => !v); setShowAttachMenu(false) }}
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

                    {/* Mic or Send */}
                    {input.trim() ? (
                      <button
                        onClick={sendMsg}
                        className="w-9 h-9 flex items-center justify-center bg-[#8B0000] hover:bg-[#a00000] text-white rounded-xl transition-colors flex-shrink-0"
                      >
                        <Send size={15} />
                      </button>
                    ) : (
                      <button
                        onMouseDown={startRecording}
                        onTouchStart={e => { e.preventDefault(); startRecording() }}
                        className="w-9 h-9 flex items-center justify-center bg-dark-bg border border-color hover:border-[#8B0000]/50 text-text-muted hover:text-[#8B0000] rounded-xl transition-colors flex-shrink-0"
                        title="Hold to record voice message"
                      >
                        <Mic size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-text-muted text-center mt-1.5">
                    Tap time to see full date · Click name to view profile · Hold 🎤 for voice
                  </p>
                </div>
              )}
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
