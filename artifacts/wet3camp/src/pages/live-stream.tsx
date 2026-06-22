import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useRoute, Link } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import {
  Eye, Radio, X, Send, Heart, Flame, Crown, Star, Gift, Lock, Unlock,
  Share2, UserPlus, BookOpen, Pin, Users, Zap, ChevronDown, AlertCircle,
  Mic, MicOff, Video, VideoOff, MoreVertical, Copy, Check,
} from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

interface ChatMsg {
  id: string
  userId: number | null
  displayName: string
  text: string
  type: 'chat' | 'reaction' | 'gift' | 'system' | 'join' | 'leave'
  emoji?: string
  giftName?: string
  giftEmoji?: string
  timestamp: number
  pinned?: boolean
}

const REACTIONS = ['❤️','🔥','😍','💯','👑','😘','💋','🎉','💪','✨']
const GIFTS: { id: string; emoji: string; label: string }[] = [
  { id: 'rose',      emoji: '🌹', label: 'Rose'      },
  { id: 'diamond',   emoji: '💎', label: 'Diamond'   },
  { id: 'crown',     emoji: '👑', label: 'Crown'     },
  { id: 'heart',     emoji: '💖', label: 'Heart'     },
  { id: 'fire',      emoji: '🔥', label: 'Fire'      },
  { id: 'star',      emoji: '⭐', label: 'Star'      },
  { id: 'champagne', emoji: '🍾', label: 'Champagne' },
  { id: 'ring',      emoji: '💍', label: 'Ring'      },
]

interface FloatEmoji { id: string; emoji: string; x: number }

export default function LiveStreamPage() {
  const [, params] = useRoute('/live/:escortId')
  const escortId = params?.escortId ?? ''
  const [location] = useLocation()
  const isBroadcaster = new URLSearchParams(location.split('?')[1] ?? '').get('broadcast') === 'true'

  const { user } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [viewerCount, setViewerCount] = useState(0)
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showGifts, setShowGifts] = useState(false)
  const [floatEmojis, setFloatEmojis] = useState<FloatEmoji[]>([])
  const [pinnedMsg, setPinnedMsg] = useState<ChatMsg | null>(null)
  const [copied, setCopied] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [ended, setEnded] = useState(false)
  const [jitsiLoaded, setJitsiLoaded] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const jitsiRef = useRef<HTMLDivElement>(null)
  const jitsiApiRef = useRef<any>(null)
  const token = (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ?? ''

  useSEO({
    title: session ? `${session.name} Live — Wet3Camp` : 'Live Stream',
    noIndex: true,
  })

  // Load session info
  useEffect(() => {
    if (!escortId) return
    fetch(`/api/live/${escortId}`)
      .then(r => { if (!r.ok) throw new Error('Stream not found'); return r.json() })
      .then(d => {
        setSession(d)
        setMessages(d.recentMessages ?? [])
        setViewerCount(d.viewerCount ?? 0)
        setIsLocked(d.isLocked ?? false)
        if (d.pinnedMessageId && d.recentMessages) {
          const p = d.recentMessages.find((m: ChatMsg) => m.id === d.pinnedMessageId)
          if (p) setPinnedMsg(p)
        }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [escortId])

  // Load Jitsi once session is ready
  useEffect(() => {
    if (!session?.jitsiRoom || !jitsiRef.current) return
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.onload = () => {
      if (!(window as any).JitsiMeetExternalAPI || !jitsiRef.current) return
      const api = new (window as any).JitsiMeetExternalAPI('meet.jit.si', {
        roomName: session.jitsiRoom,
        parentNode: jitsiRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName: user?.name ?? 'Viewer' },
        configOverwrite: {
          startWithAudioMuted: !isBroadcaster,
          startWithVideoMuted: !isBroadcaster,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          startAudioOnly: false,
          toolbarButtons: isBroadcaster
            ? ['microphone','camera','desktop','hangup','fullscreen','settings','tileview']
            : ['fullscreen','tileview'],
        },
        interfaceConfigOverwrite: {
          TOOLBAR_ALWAYS_VISIBLE: true,
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          DEFAULT_BACKGROUND: '#0a0000',
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
      })
      jitsiApiRef.current = api
      setJitsiLoaded(true)
    }
    document.head.appendChild(script)
    return () => { try { jitsiApiRef.current?.dispose() } catch {} }
  }, [session?.jitsiRoom, isBroadcaster, user?.username])

  // SSE for real-time events
  useEffect(() => {
    if (!escortId || loading || error) return
    const url = `/api/live/${escortId}/events?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'init') {
          setViewerCount(data.viewerCount ?? 0)
          setMessages(data.recentMessages ?? [])
          if (data.isLocked !== undefined) setIsLocked(data.isLocked)
        } else if (data.type === 'chat' || data.type === 'reaction' || data.type === 'gift' || data.type === 'system' || data.type === 'join' || data.type === 'leave') {
          const msg: ChatMsg = data.message
          setMessages(prev => [...prev.slice(-199), msg])
          if (['reaction', 'gift'].includes(msg.type)) {
            const emoji = msg.emoji ?? msg.giftEmoji ?? '❤️'
            spawnFloat(emoji)
          }
        } else if (data.type === 'viewer_count') {
          setViewerCount(data.count)
        } else if (data.type === 'pinned') {
          setPinnedMsg(data.message)
        } else if (data.type === 'ended') {
          setEnded(true)
          es.close()
        } else if (data.type === 'lock_change') {
          setIsLocked(data.isLocked)
        }
      } catch {}
    }
    es.onerror = () => {}
    return () => es.close()
  }, [escortId, loading, error, token])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  function spawnFloat(emoji: string) {
    const id = `f-${Date.now()}-${Math.random()}`
    const x = 10 + Math.random() * 80
    setFloatEmojis(prev => [...prev.slice(-20), { id, emoji, x }])
    setTimeout(() => setFloatEmojis(prev => prev.filter(f => f.id !== id)), 3000)
  }

  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || sending) return
    setSending(true)
    try {
      await fetch(`/api/live/${escortId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: chatInput.trim() }),
      })
      setChatInput('')
    } finally { setSending(false) }
  }, [chatInput, escortId, token, sending])

  const sendReaction = useCallback(async (emoji: string) => {
    spawnFloat(emoji)
    await fetch(`/api/live/${escortId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    })
  }, [escortId, token])

  const sendGift = useCallback(async (giftId: string, giftEmoji: string) => {
    spawnFloat(giftEmoji)
    setShowGifts(false)
    await fetch(`/api/live/${escortId}/gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ giftId }),
    })
  }, [escortId, token])

  const endStream = useCallback(async () => {
    if (!confirm('End your live stream?')) return
    await fetch(`/api/live/${escortId}/end`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    })
    window.location.href = '/my-profile'
  }, [escortId, token])

  const shareLink = useCallback(() => {
    const url = `${window.location.origin}/live/${escortId}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [escortId])

  const pinMsg = useCallback(async (msgId: string) => {
    await fetch(`/api/live/${escortId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messageId: msgId }),
    })
  }, [escortId, token])

  function msgColor(type: ChatMsg['type']) {
    if (type === 'system') return 'text-[#FFD700]'
    if (type === 'join')   return 'text-[#28a745]/80'
    if (type === 'leave')  return 'text-text-muted/60'
    if (type === 'gift')   return 'text-[#E91E63]'
    if (type === 'reaction') return 'text-[#FF4500]'
    return 'text-text-light'
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-dark-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#E91E63] border-t-transparent animate-spin" />
        <p className="text-sm text-text-muted">Connecting to stream…</p>
      </div>
    </div>
  )

  if (error || ended) return (
    <div className="flex items-center justify-center min-h-screen bg-dark-bg">
      <div className="text-center p-8">
        <Radio size={48} className="text-[#8B0000]/40 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-light mb-2">{ended ? 'Stream Ended' : 'Stream Not Found'}</h2>
        <p className="text-sm text-text-muted mb-6">{ended ? 'The escort has ended this live stream.' : 'This stream may have ended or doesn\'t exist.'}</p>
        <Link href="/live" className="px-5 py-2.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors">Browse Live</Link>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#050000] overflow-hidden">
      {/* ── Video pane ── */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/60 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Link href="/live" className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </Link>
            <div className="flex items-center gap-1.5 bg-[#E91E63] px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white">LIVE</span>
            </div>
            {session?.image && (
              <img src={session.image} alt={session.name} className="w-7 h-7 rounded-full object-cover border border-[#E91E63]/50" />
            )}
            <div>
              <p className="text-xs font-bold text-white leading-none">{session?.name}</p>
              <p className="text-[10px] text-white/60">{session?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
              <Eye size={10} className="text-white/70" />
              <span className="text-[10px] text-white font-medium">{viewerCount.toLocaleString()}</span>
            </div>
            <button onClick={shareLink} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full transition-colors">
              {copied ? <Check size={12} className="text-[#28a745]" /> : <Share2 size={12} className="text-white" />}
              <span className="text-[10px] text-white">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            {isBroadcaster && (
              <button onClick={endStream} className="flex items-center gap-1 bg-[#E91E63] hover:bg-[#c2185b] px-3 py-1 rounded-full transition-colors">
                <span className="text-[10px] font-bold text-white">End Live</span>
              </button>
            )}
          </div>
        </div>

        {/* Jitsi embed */}
        <div ref={jitsiRef} className="flex-1 bg-black" style={{ minHeight: 0 }}>
          {!jitsiLoaded && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#E91E63] border-t-transparent animate-spin" />
                <p className="text-xs text-white/50">Loading video…</p>
              </div>
            </div>
          )}
        </div>

        {/* Floating reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {floatEmojis.map(f => (
            <div
              key={f.id}
              className="absolute bottom-20 text-2xl animate-bounce"
              style={{ left: `${f.x}%`, animation: 'floatUp 3s ease-out forwards' }}
            >
              {f.emoji}
            </div>
          ))}
        </div>

        {/* Pinned message */}
        {pinnedMsg && (
          <div className="absolute top-14 left-3 right-3 bg-black/70 backdrop-blur-sm border border-[#FFD700]/30 rounded-xl px-3 py-2 flex items-start gap-2 z-10">
            <Pin size={12} className="text-[#FFD700] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-white flex-1">{pinnedMsg.text}</p>
            {isBroadcaster && (
              <button onClick={() => setPinnedMsg(null)} className="text-white/50 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Quick action bar (viewers) */}
        {!isBroadcaster && (
          <div className="flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex gap-1.5 flex-1">
              {REACTIONS.slice(0, 5).map(e => (
                <button key={e} onClick={() => sendReaction(e)} className="text-lg hover:scale-125 transition-transform active:scale-90">
                  {e}
                </button>
              ))}
            </div>
            <button onClick={() => setShowGifts(v => !v)} className="flex items-center gap-1 bg-gradient-to-r from-[#8B0000] to-[#E91E63] px-3 py-1.5 rounded-full">
              <Gift size={12} className="text-white" />
              <span className="text-[11px] font-bold text-white">Gift</span>
            </button>
            {session?.id && (
              <Link href={`/profile/${session.id}`} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
                <UserPlus size={12} className="text-white" />
                <span className="text-[11px] text-white">Follow</span>
              </Link>
            )}
          </div>
        )}

        {/* Broadcaster controls */}
        {isBroadcaster && (
          <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-1 text-[10px] text-white/60">
              <Users size={12} />
              <span>{viewerCount} watching</span>
            </div>
            <button
              onClick={async () => {
                const locked = !isLocked
                setIsLocked(locked)
                await fetch(`/api/live/${escortId}/lock`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ locked, tier: locked ? 'premium' : null }),
                })
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${isLocked ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-white/10 text-white/60 hover:text-white'}`}
            >
              {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
              {isLocked ? 'Locked' : 'Lock Stream'}
            </button>
          </div>
        )}

        {/* Gift panel */}
        {showGifts && (
          <div className="absolute bottom-16 left-3 right-3 bg-card-bg border border-color rounded-2xl p-3 z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-light">Send a Gift</span>
              <button onClick={() => setShowGifts(false)}><X size={14} className="text-text-muted" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {GIFTS.map(g => (
                <button
                  key={g.id}
                  onClick={() => sendGift(g.id, g.emoji)}
                  className="flex flex-col items-center gap-1 p-2 bg-dark-bg hover:bg-[#8B0000]/20 border border-color/40 hover:border-[#8B0000]/40 rounded-xl transition-all"
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-[9px] text-text-muted">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Chat sidebar ── */}
      <div className="w-72 flex flex-col bg-[#0a0000] border-l border-[#8B0000]/20 flex-shrink-0 lg:flex">
        {/* Chat header */}
        <div className="px-3 py-2.5 border-b border-[#8B0000]/20 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-bold text-text-light">Live Chat</span>
          <div className="flex items-center gap-1 text-[10px] text-text-muted">
            <Eye size={10} />
            <span>{viewerCount}</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`group flex items-start gap-1.5 text-[11px] ${msg.type === 'system' || msg.type === 'join' || msg.type === 'leave' ? 'justify-center' : ''}`}
            >
              {(msg.type === 'system' || msg.type === 'join' || msg.type === 'leave') ? (
                <span className={msgColor(msg.type)}>{msg.text}</span>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-[#8B0000]/30 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-[#FFD700] mt-0.5">
                    {(msg.displayName || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[#FFD700]/80 mr-1">{msg.displayName}</span>
                    <span className={msgColor(msg.type)}>
                      {msg.type === 'gift' ? `${msg.giftEmoji} ${msg.text}` : msg.text}
                    </span>
                  </div>
                  {isBroadcaster && (
                    <button onClick={() => pinMsg(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Pin size={10} className="text-[#FFD700]/60 hover:text-[#FFD700]" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Reaction strip */}
        <div className="flex gap-1.5 px-2 py-1.5 border-t border-[#8B0000]/20 flex-shrink-0">
          {REACTIONS.map(e => (
            <button key={e} onClick={() => sendReaction(e)} className="text-sm hover:scale-125 transition-transform active:scale-90 leading-none">
              {e}
            </button>
          ))}
        </div>

        {/* Chat input */}
        <div className="px-2 pb-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-dark-bg border border-color rounded-xl px-2 py-1.5">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder={user ? 'Say something…' : 'Login to chat'}
              disabled={!user}
              maxLength={300}
              className="flex-1 bg-transparent text-xs text-text-light placeholder:text-text-muted outline-none"
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim() || sending || !user}
              className="text-[#8B0000] hover:text-[#E91E63] disabled:opacity-30 transition-colors"
            >
              <Send size={13} />
            </button>
          </div>
          {!user && (
            <p className="text-[10px] text-text-muted text-center mt-1">
              <Link href="/login" className="text-[#8B0000] hover:underline">Sign in</Link> to chat & send gifts
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-180px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
