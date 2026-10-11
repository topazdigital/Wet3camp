import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useRoute, Link } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { getSlug } from '@/data/escorts'
import {
  Eye, Radio, X, Send, Heart, Flame, Crown, Star, Gift, Lock, Unlock,
  Share2, UserPlus, Pin, Users, Zap, Check,
  Mic, MicOff, Video, VideoOff, Camera, CameraOff, Volume2, VolumeX,
} from 'lucide-react'
import { useSEO } from '@/lib/useSEO'
import { takePendingLiveStream } from '@/lib/live-broadcaster'

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

// ── Base64 helpers ────────────────────────────────────────────────────────────
function b64toAb(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

export default function LiveStreamPage() {
  const [, params] = useRoute('/live/:escortId')
  const escortId = params?.escortId ?? ''
  const [location] = useLocation()
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
  const [broadcastStatus, setBroadcastStatus] = useState<'connecting' | 'live' | 'error'>('connecting')
  const [broadcastError, setBroadcastError] = useState('')
  const [videoAvailable, setVideoAvailable] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [liveActionError, setLiveActionError] = useState('')

  // Camera / video state (replaces Jitsi)
  const [cameraState, setCameraState] = useState<'idle'|'loading'|'active'|'denied'|'error'>('idle')
  const [micMuted, setMicMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)
  const [videoReady, setVideoReady] = useState(false) // viewer: stream started playing

  const chatRef = useRef<HTMLDivElement>(null)
  const localVideoRef  = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const localStreamRef    = useRef<MediaStream | null>(null)
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null)
  const sourceBufferRef    = useRef<SourceBuffer | null>(null)
  const mediaSourceRef     = useRef<MediaSource | null>(null)
  const mediaSourceUrlRef  = useRef<string | null>(null)
  const videoQueueRef      = useRef<ArrayBuffer[]>([])
  const videoSseRef        = useRef<EventSource | null>(null)
  const sourceOpenHandlerRef = useRef<(() => void) | null>(null)
  const endingRef = useRef(false)
  const token = (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null) ?? ''
  const wantsBroadcaster = new URLSearchParams(location.split('?')[1] ?? '').get('broadcast') === 'true'
  const isBroadcaster = wantsBroadcaster && session?.isBroadcaster === true

  useSEO({ title: session ? `${session.name} Live — Wet3Camp` : 'Live Stream', noIndex: true })

  // Load session info
  useEffect(() => {
    if (!escortId) return
    fetch(`/api/live/${escortId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.message || 'Stream not found')
        return data
      })
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
  }, [escortId, token])

  // ── Broadcaster: start camera when session is ready ───────────────────────
  useEffect(() => {
    if (!session || !isBroadcaster) return
    startCamera()
    return () => {
      if (!endingRef.current && token) {
        void fetch(`/api/live/${escortId}/end`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {})
      }
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      try { mediaRecorderRef.current?.stop() } catch {}
      localStreamRef.current = null
      mediaRecorderRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.escortId, isBroadcaster, escortId, token])

  // ── Viewer: start MediaSource video player when session is ready ──────────
  useEffect(() => {
    if (!session || isBroadcaster) return
    if (!('MediaSource' in window) || typeof MediaSource.isTypeSupported !== 'function') {
      setPlaybackError('Live video playback is not supported by this browser. Try Chrome or Firefox.')
      return
    }
    startVideoPlayer()
    return () => tearDownVideoPlayer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.escortId, isBroadcaster])

  async function startCamera() {
    setCameraState('loading')
    setBroadcastStatus('connecting')
    setBroadcastError('')
    let stream: MediaStream | null = null
    try {
      stream = takePendingLiveStream()
      if (!stream) {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access needs a secure browser connection. Open Wet3 Camp over HTTPS.')
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 720 }, height: { ideal: 480 }, frameRate: { ideal: 24 }, facingMode: 'user' },
          audio: true,
        })
      }
      localStreamRef.current = stream
      if (localVideoRef.current) { localVideoRef.current.srcObject = stream }
      setCameraState('active')
      if (typeof MediaRecorder === 'undefined') throw new Error('This browser cannot broadcast live video. Try Chrome or Firefox.')

      // Choose best supported codec
      const mimeType = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4',
      ].find(t => MediaRecorder.isTypeSupported(t)) || ''

      const mr = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 600_000,
      })
      mediaRecorderRef.current = mr
      let initChunkAccepted = false
      let uploadChain = Promise.resolve()

      mr.ondataavailable = async (e) => {
        if (!e.data.size) return
        const chunk = e.data
        uploadChain = uploadChain.then(async () => {
          const response = await fetch(`/api/live/${escortId}/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              Authorization: `Bearer ${token}`,
              'X-Mime-Type': mr.mimeType || mimeType || 'video/webm',
              'X-Is-Init': initChunkAccepted ? 'false' : 'true',
            },
            body: await chunk.arrayBuffer(),
          })
          const result = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(result.message || `Video upload failed (${response.status})`)
          initChunkAccepted = true
          setBroadcastStatus('live')
          setBroadcastError('')
        }).catch((error: any) => {
          setBroadcastStatus('error')
          setBroadcastError(error?.message || 'Live video could not reach the server. Check your connection.')
        })
      }

      mr.onerror = () => {
        setBroadcastStatus('error')
        setBroadcastError('Your browser stopped recording. Check camera and microphone permissions.')
      }
      mr.start(2000) // 2-second chunks
    } catch (e: any) {
      stream?.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
      setCameraState(e?.name === 'NotAllowedError' ? 'denied' : 'error')
      setBroadcastStatus('error')
      setBroadcastError(e?.message || 'Could not access your camera or microphone.')
    }
  }

  function tearDownVideoPlayer() {
    videoSseRef.current?.close()
    videoSseRef.current = null
    if (mediaSourceRef.current && sourceOpenHandlerRef.current) {
      mediaSourceRef.current.removeEventListener('sourceopen', sourceOpenHandlerRef.current)
    }
    sourceOpenHandlerRef.current = null
    videoQueueRef.current = []
    if (sourceBufferRef.current) {
      try { sourceBufferRef.current.removeEventListener('updateend', processVideoQueue) } catch {}
      sourceBufferRef.current = null
    }
    if (mediaSourceUrlRef.current) {
      URL.revokeObjectURL(mediaSourceUrlRef.current)
      mediaSourceUrlRef.current = null
    }
    if (remoteVideoRef.current) remoteVideoRef.current.src = ''
    mediaSourceRef.current = null
  }

  function startVideoPlayer() {
    tearDownVideoPlayer() // clean any prior state
    setVideoAvailable(false)
    setVideoReady(false)
    setPlaybackError('')

    const ms = new MediaSource()
    mediaSourceRef.current = ms
    const objectUrl = URL.createObjectURL(ms)
    mediaSourceUrlRef.current = objectUrl
    if (remoteVideoRef.current) {
      remoteVideoRef.current.src = objectUrl
    }

    const onSourceOpen = () => {
      sourceOpenHandlerRef.current = null
      const es = new EventSource(`/api/live/${escortId}/video?token=${encodeURIComponent(token)}`)
      videoSseRef.current = es
      es.onopen = () => setPlaybackError('')

      es.onmessage = (e) => {
        if (e.data === ': ping') return  // keepalive comment
        try {
          const { b64, mimeType, isInit } = JSON.parse(e.data)
          const ab = b64toAb(b64)

          if (isInit) {
            if (sourceBufferRef.current) {
              // Broadcaster restarted — tear down and re-initialise the player
              es.close()
              startVideoPlayer()
              return
            }
            if (!MediaSource.isTypeSupported(mimeType)) {
              setPlaybackError(`This browser cannot play the broadcaster's video format (${mimeType}). Try Chrome or Firefox.`)
              es.close()
              return
            }
            try {
              const sb = ms.addSourceBuffer(mimeType)
              sourceBufferRef.current = sb
              sb.mode = 'sequence'
              sb.addEventListener('updateend', processVideoQueue)
              sb.appendBuffer(ab)
            } catch {
              setPlaybackError('The live video could not be opened in this browser.')
            }
            return
          }

          videoQueueRef.current.push(ab)
          processVideoQueue()
        } catch {}
      }

      es.onerror = () => {
        if (!videoReady) setPlaybackError('Reconnecting to the live video…')
      }
    }

    if (ms.readyState === 'open') {
      onSourceOpen()
    } else {
      sourceOpenHandlerRef.current = onSourceOpen
      ms.addEventListener('sourceopen', onSourceOpen, { once: true })
    }
  }

  function processVideoQueue() {
    const sb = sourceBufferRef.current
    if (sb?.buffered.length) setVideoAvailable(true)
    if (!sb || sb.updating || !videoQueueRef.current.length) return
    try { sb.appendBuffer(videoQueueRef.current.shift()!) } catch {
      setPlaybackError('The live video connection was interrupted. Reconnecting…')
    }
  }

  // ── SSE for real-time chat/viewer/events ──────────────────────────────────
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
        } else if (['chat','reaction','gift','system','join','leave'].includes(data.type)) {
          const msg: ChatMsg = data.message
          setMessages(prev => [...prev.slice(-199), msg])
          if (['reaction','gift'].includes(msg.type)) {
            const emoji = msg.emoji ?? msg.giftEmoji ?? '❤️'
            spawnFloat(emoji)
          }
        } else if (data.type === 'viewer_count') {
          setViewerCount(data.count)
        } else if (data.type === 'pinned') {
          setPinnedMsg(data.message ?? null)
        } else if (data.type === 'ended') {
          setEnded(true)
          es.close()
        } else if (data.type === 'lock_change') {
          setIsLocked(data.isLocked)
          if (data.isLocked && !isBroadcaster) {
            es.close()
            tearDownVideoPlayer()
            setError('The broadcaster made this stream private.')
          }
        }
      } catch {}
    }
    es.onerror = () => {}
    return () => es.close()
  }, [escortId, loading, error, token, isBroadcaster])

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
    setLiveActionError('')
    try {
      const response = await fetch(`/api/live/${escortId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: chatInput.trim() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not send your message')
      setChatInput('')
    } catch (e: any) {
      setLiveActionError(e.message || 'Could not send your message')
    } finally { setSending(false) }
  }, [chatInput, escortId, token, sending])

  const sendReaction = useCallback(async (emoji: string) => {
    setLiveActionError('')
    try {
      const response = await fetch(`/api/live/${escortId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emoji }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not send reaction')
    } catch (e: any) {
      setLiveActionError(e.message || 'Could not send reaction')
    }
  }, [escortId, token])

  const sendGift = useCallback(async (giftId: string) => {
    setLiveActionError('')
    try {
      const response = await fetch(`/api/live/${escortId}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ giftId }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not send gift')
      setShowGifts(false)
    } catch (e: any) {
      setLiveActionError(e.message || 'Could not send gift')
    }
  }, [escortId, token])

  const endStream = useCallback(async () => {
    if (!confirm('End your live stream?')) return
    setLiveActionError('')
    endingRef.current = true
    try {
      const response = await fetch(`/api/live/${escortId}/end`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not end the live stream')
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      try { mediaRecorderRef.current?.stop() } catch {}
      window.location.href = '/my-profile'
    } catch (e: any) {
      endingRef.current = false
      setLiveActionError(e.message || 'Could not end the live stream')
    }
  }, [escortId, token])

  const shareLink = useCallback(() => {
    const url = `${window.location.origin}/live/${escortId}`
    if (!navigator.clipboard?.writeText) {
      setLiveActionError('Clipboard access is unavailable. Copy the address from your browser bar.')
      return
    }
    navigator.clipboard.writeText(url).then(() => {
      setLiveActionError('')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => setLiveActionError('Could not copy the link. Copy the address from your browser bar.'))
  }, [escortId])

  const pinMsg = useCallback(async (msgId: string | null) => {
    setLiveActionError('')
    try {
      const response = await fetch(`/api/live/${escortId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messageId: msgId }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not update the pinned message')
    } catch (e: any) {
      setLiveActionError(e.message || 'Could not update the pinned message')
    }
  }, [escortId, token])

  const toggleLiveLock = useCallback(async () => {
    const locked = !isLocked
    setLiveActionError('')
    try {
      const response = await fetch(`/api/live/${escortId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ locked }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'Could not change stream privacy')
      setIsLocked(locked)
    } catch (e: any) {
      setLiveActionError(e.message || 'Could not change stream privacy')
    }
  }, [escortId, isLocked, token])

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = micMuted })
    setMicMuted(m => !m)
  }

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = camOff })
    setCamOff(c => !c)
  }

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
        <h2 className="text-xl font-bold text-text-light mb-2">{ended ? 'Stream Ended' : 'Stream Unavailable'}</h2>
        <p className="text-sm text-text-muted mb-6">{ended ? 'The escort has ended this live stream.' : error || 'This stream may have ended or doesn\'t exist.'}</p>
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
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${!isBroadcaster || broadcastStatus === 'live' ? 'bg-[#E91E63]' : 'bg-amber-600'}`}>
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white">
                {!isBroadcaster || broadcastStatus === 'live' ? 'LIVE' : broadcastStatus === 'error' ? 'VIDEO ISSUE' : 'CONNECTING'}
              </span>
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
            {!isBroadcaster && (
              <button
                onClick={() => setSoundEnabled(value => !value)}
                title={soundEnabled ? 'Mute live audio' : 'Turn on live audio'}
                aria-label={soundEnabled ? 'Mute live audio' : 'Turn on live audio'}
                className="flex items-center justify-center w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full text-white"
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            )}
            {isBroadcaster && (
              <button onClick={endStream} className="flex items-center gap-1 bg-[#E91E63] hover:bg-[#c2185b] px-3 py-1 rounded-full transition-colors">
                <span className="text-[10px] font-bold text-white">End Live</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Video area ── */}
        <div className="flex-1 relative bg-black min-h-0">

          {/* BROADCASTER: local camera preview */}
          {isBroadcaster && (
            <>
              <video
                ref={localVideoRef}
                muted
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${camOff ? 'opacity-0' : 'opacity-100'} transition-opacity`}
              />
              {/* Camera off overlay */}
              {camOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0000]">
                  <CameraOff size={48} className="text-white/20 mb-3" />
                  <p className="text-sm text-white/40">Camera off</p>
                </div>
              )}
              {/* Camera loading/error states */}
              {cameraState === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                  <div className="w-10 h-10 rounded-full border-2 border-[#E91E63] border-t-transparent animate-spin mb-3" />
                  <p className="text-sm text-white/60">Starting camera…</p>
                </div>
              )}
              {cameraState === 'denied' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0000] p-8 text-center">
                  <CameraOff size={48} className="text-[#E91E63]/60 mb-4" />
                  <p className="text-base font-bold text-white mb-2">Camera access denied</p>
                  <p className="text-sm text-white/50 mb-4">Allow camera access in your browser settings, then refresh the page.</p>
                  <button onClick={startCamera} className="px-4 py-2 bg-[#E91E63] text-white text-sm font-bold rounded-xl">Try Again</button>
                </div>
              )}
              {cameraState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0000] p-8 text-center">
                  <CameraOff size={48} className="text-red-400/60 mb-4" />
                  <p className="text-base font-bold text-white mb-2">Camera error</p>
                  <p className="text-sm text-white/50 mb-4">Could not access your camera. Check your device settings.</p>
                  <button onClick={startCamera} className="px-4 py-2 bg-[#E91E63] text-white text-sm font-bold rounded-xl">Retry</button>
                </div>
              )}
            </>
          )}

          {/* VIEWER: remote stream */}
          {!isBroadcaster && (
            <>
              <video
                ref={remoteVideoRef}
                muted={!soundEnabled}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                onPlay={() => { setVideoReady(true); setPlaybackError('') }}
                onError={() => setPlaybackError('The live video could not be played. Try Chrome or Firefox.')}
              />
              {/* Waiting for stream */}
              {!videoReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-[#E91E63] border-t-transparent animate-spin" />
                  <div className="text-center">
                    <p className="text-sm text-white/70 font-semibold mb-1">
                      {playbackError || (videoAvailable ? 'Live video is ready' : 'Waiting for live video…')}
                    </p>
                    <p className="text-xs text-white/40 mb-3">
                      {videoAvailable ? 'Tap to start playback. Audio is muted until you turn it on.' : 'The broadcaster may still be connecting their camera.'}
                    </p>
                    <button
                      type="button"
                      disabled={!videoAvailable}
                      onClick={() => {
                        void remoteVideoRef.current?.play().then(() => setPlaybackError('')).catch(() => {
                          setPlaybackError('Tap Play Live again or try another browser.')
                        })
                      }}
                      className="px-4 py-2 rounded-full bg-[#E91E63] text-white text-xs font-bold disabled:opacity-40"
                    >
                      Play Live
                    </button>
                  </div>
                  {session?.image && (
                    <img src={session.image} alt={session.name} className="w-20 h-20 rounded-full object-cover border-4 border-[#E91E63]/40" />
                  )}
                </div>
              )}
            </>
          )}

          {/* Floating reactions */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {floatEmojis.map(f => (
              <div
                key={f.id}
                className="absolute bottom-20 text-2xl"
                style={{ left: `${f.x}%`, animation: 'floatUp 3s ease-out forwards' }}
              >
                {f.emoji}
              </div>
            ))}
          </div>

          {/* Pinned message */}
          {pinnedMsg && (
            <div className="absolute top-2 left-3 right-3 bg-black/70 backdrop-blur-sm border border-[#FFD700]/30 rounded-xl px-3 py-2 flex items-start gap-2 z-10">
              <Pin size={12} className="text-[#FFD700] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-white flex-1">{pinnedMsg.text}</p>
              {isBroadcaster && (
                <button onClick={() => pinMsg(null)} className="text-white/50 hover:text-white" aria-label="Unpin message">
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Controls bar ── */}
        {isBroadcaster ? (
          /* Broadcaster controls */
          <div className="flex items-center gap-3 px-4 py-3 bg-black/60 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-1 text-[10px] text-white/60">
              <Users size={12} />
              <span>{viewerCount} watching</span>
            </div>
            <div
              role="status"
              title={broadcastError || undefined}
              className={`flex items-center gap-1.5 text-[10px] font-semibold ${broadcastStatus === 'live' ? 'text-green-300' : broadcastStatus === 'error' ? 'text-red-300' : 'text-amber-200'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${broadcastStatus === 'live' ? 'bg-green-400' : broadcastStatus === 'error' ? 'bg-red-400' : 'bg-amber-300 animate-pulse'}`} />
              {broadcastStatus === 'live' ? 'Video connected' : broadcastStatus === 'error' ? 'Video issue' : 'Connecting video'}
            </div>

            <button
              onClick={toggleMic}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${micMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {micMuted ? <MicOff size={12} /> : <Mic size={12} />}
              {micMuted ? 'Muted' : 'Mic'}
            </button>

            <button
              onClick={toggleCam}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${camOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {camOff ? <VideoOff size={12} /> : <Video size={12} />}
              {camOff ? 'Cam Off' : 'Camera'}
            </button>

            <button
              onClick={toggleLiveLock}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${isLocked ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-white/10 text-white/60 hover:text-white'}`}
              title={isLocked ? 'Only you and admins can watch this stream' : 'Make this stream visible only to you and admins'}
            >
              {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
              {isLocked ? 'Private' : 'Make Private'}
            </button>
            {broadcastError && <span className="text-[10px] text-red-300 truncate max-w-48">{broadcastError}</span>}
            {liveActionError && <span role="alert" className="text-[10px] text-red-300 truncate max-w-48">{liveActionError}</span>}
          </div>
        ) : (
          /* Viewer controls */
          <div className="flex items-center gap-2 px-3 py-2.5 bg-black/50 backdrop-blur-sm flex-shrink-0">
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
            {session?.escortId && (
              <Link href={`/@${getSlug(session.name)}`} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
                <UserPlus size={12} className="text-white" />
                <span className="text-[11px] text-white">Follow</span>
              </Link>
            )}
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
                  onClick={() => sendGift(g.id)}
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
          {liveActionError && !isBroadcaster && <p role="alert" className="text-[10px] text-red-300 mb-1 px-1">{liveActionError}</p>}
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
