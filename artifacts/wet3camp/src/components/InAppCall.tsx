import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

interface InAppCallProps {
  roomId: string
  isCaller: boolean
  calleeName: string
  calleeAvatar?: string
  onClose: () => void
}

type CallState = 'connecting' | 'ringing' | 'active' | 'ended' | 'failed'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export default function InAppCall({ roomId, isCaller, calleeName, calleeAvatar, onClose }: InAppCallProps) {
  const [state, setState] = useState<CallState>('connecting')
  const [muted, setMuted]   = useState(false)
  const [speaker, setSpeaker] = useState(true)
  const [duration, setDuration] = useState(0)

  const pcRef          = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef        = useRef(false)
  const sentCandidates = useRef<Set<string>>(new Set())

  const cleanup = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    pollRef.current  && clearInterval(pollRef.current)
    timerRef.current && clearInterval(timerRef.current)
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    fetch(`/api/webrtc/session/${roomId}`, { method: 'DELETE' }).catch(() => {})
  }, [roomId])

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
  }, [])

  const postJson = useCallback((path: string, body: object) =>
    fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        localStreamRef.current = stream

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
        pcRef.current = pc

        stream.getTracks().forEach(t => pc.addTrack(t, stream))

        pc.ontrack = (ev) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = ev.streams[0]
            remoteAudioRef.current.play().catch(() => {})
          }
        }

        pc.onconnectionstatechange = () => {
          const s = pc.connectionState
          if (s === 'connected') { setState('active'); startTimer() }
          if (s === 'disconnected' || s === 'failed' || s === 'closed') {
            if (mounted) setState('ended')
          }
        }

        pc.onicecandidate = async (ev) => {
          if (!ev.candidate) return
          const key = JSON.stringify(ev.candidate)
          if (sentCandidates.current.has(key)) return
          sentCandidates.current.add(key)
          await postJson('/api/webrtc/ice', {
            roomId, candidate: ev.candidate, from: isCaller ? 'caller' : 'callee',
          }).catch(() => {})
        }

        if (isCaller) {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          await postJson('/api/webrtc/offer', { roomId, sdp: offer.sdp, type: offer.type })
          setState('ringing')

          // Poll for answer + callee ICE
          let answered = false
          pollRef.current = setInterval(async () => {
            if (!mounted || doneRef.current) return
            try {
              const r = await fetch(`/api/webrtc/poll/${roomId}`)
              const data = await r.json()
              if (!data.exists) return
              if (!answered && data.answer) {
                answered = true
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
              }
              if (data.calleeCandidates?.length) {
                for (const c of data.calleeCandidates) {
                  try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
                }
              }
            } catch {}
          }, 1000)
        } else {
          // Callee: poll for offer
          setState('ringing')
          pollRef.current = setInterval(async () => {
            if (!mounted || doneRef.current) return
            try {
              const r = await fetch(`/api/webrtc/poll/${roomId}`)
              const data = await r.json()
              if (!data.exists || !data.offer) return
              if (pc.signalingState !== 'stable') return

              clearInterval(pollRef.current!)
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
              const answer = await pc.createAnswer()
              await pc.setLocalDescription(answer)
              await postJson('/api/webrtc/answer', { roomId, sdp: answer.sdp, type: answer.type })

              // Now poll for caller ICE
              pollRef.current = setInterval(async () => {
                if (!mounted || doneRef.current) return
                try {
                  const r2 = await fetch(`/api/webrtc/poll/${roomId}`)
                  const d2 = await r2.json()
                  if (d2.callerCandidates?.length) {
                    for (const c of d2.callerCandidates) {
                      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
                    }
                  }
                } catch {}
              }, 1000)
            } catch {}
          }, 1000)
        }
      } catch {
        if (mounted) setState('failed')
      }
    }

    init()
    return () => {
      mounted = false
      cleanup()
    }
  }, [roomId, isCaller, cleanup, postJson, startTimer])

  const handleHangUp = () => {
    cleanup()
    setState('ended')
    setTimeout(onClose, 800)
  }

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted })
    setMuted(m => !m)
  }

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = speaker
    }
    setSpeaker(s => !s)
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const stateLabel: Record<CallState, string> = {
    connecting: 'Connecting…',
    ringing:    isCaller ? 'Ringing…' : 'Incoming call',
    active:     fmt(duration),
    ended:      'Call ended',
    failed:     'Call failed — mic access denied?',
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center">
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="flex flex-col items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          {calleeAvatar
            ? <img src={calleeAvatar} alt={calleeName} className="w-28 h-28 rounded-full object-cover border-4 border-[#28a745]/30" />
            : <div className="w-28 h-28 rounded-full bg-[#8B0000]/20 border-4 border-[#8B0000]/30 flex items-center justify-center text-4xl font-black text-[#8B0000]">{calleeName.charAt(0)}</div>
          }
          {state === 'active' && (
            <div className="absolute inset-0 rounded-full border-4 border-[#28a745] animate-ping opacity-30" />
          )}
        </div>

        <div className="text-center">
          <p className="text-xl font-black text-white">{calleeName}</p>
          <p className={`text-sm mt-1 ${state === 'active' ? 'text-[#28a745]' : state === 'failed' ? 'text-[#EF4444]' : 'text-white/60'}`}>
            {stateLabel[state]}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-4">
          {state === 'active' && (
            <>
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${muted ? 'bg-[#EF4444] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              <button
                onClick={handleHangUp}
                className="w-16 h-16 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg shadow-[#EF4444]/40 hover:bg-red-600 transition-all"
                title="Hang up"
              >
                <PhoneOff size={26} />
              </button>

              <button
                onClick={toggleSpeaker}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!speaker ? 'bg-[#EF4444] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={speaker ? 'Mute speaker' : 'Unmute speaker'}
              >
                {speaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>
            </>
          )}

          {(state === 'connecting' || state === 'ringing') && (
            <button
              onClick={handleHangUp}
              className="w-16 h-16 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg shadow-[#EF4444]/40 hover:bg-red-600 transition-all"
              title="Cancel"
            >
              <PhoneOff size={26} />
            </button>
          )}

          {(state === 'ended' || state === 'failed') && (
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-all"
            >
              Close
            </button>
          )}
        </div>

        {state === 'ringing' && (
          <div className="flex gap-1.5 mt-2">
            {[0, 200, 400].map(d => (
              <div key={d} className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
