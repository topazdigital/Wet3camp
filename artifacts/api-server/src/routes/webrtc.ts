import { Router } from 'express'

const router = Router()

interface CallSession {
  offer?: { type: string; sdp: string }
  answer?: { type: string; sdp: string }
  callerCandidates: RTCIceCandidateInit[]
  calleeCandidates: RTCIceCandidateInit[]
  createdAt: number
}

const sessions = new Map<string, CallSession>()

// Expire sessions older than 3 minutes
setInterval(() => {
  const now = Date.now()
  for (const [roomId, session] of sessions) {
    if (now - session.createdAt > 3 * 60 * 1000) sessions.delete(roomId)
  }
}, 30_000)

function getOrCreate(roomId: string): CallSession {
  let s = sessions.get(roomId)
  if (!s) {
    s = { callerCandidates: [], calleeCandidates: [], createdAt: Date.now() }
    sessions.set(roomId, s)
  }
  return s
}

// Caller posts offer
router.post('/api/webrtc/offer', (req, res) => {
  const { roomId, sdp, type } = req.body as { roomId?: string; sdp?: string; type?: string }
  if (!roomId || !sdp) { res.status(400).json({ message: 'roomId and sdp required' }); return }
  const s = getOrCreate(roomId)
  s.offer = { type: type ?? 'offer', sdp }
  res.json({ ok: true })
})

// Callee posts answer
router.post('/api/webrtc/answer', (req, res) => {
  const { roomId, sdp, type } = req.body as { roomId?: string; sdp?: string; type?: string }
  if (!roomId || !sdp) { res.status(400).json({ message: 'roomId and sdp required' }); return }
  const s = getOrCreate(roomId)
  s.answer = { type: type ?? 'answer', sdp }
  res.json({ ok: true })
})

// Either side posts ICE candidates
router.post('/api/webrtc/ice', (req, res) => {
  const { roomId, candidate, from } = req.body as { roomId?: string; candidate?: RTCIceCandidateInit; from?: 'caller' | 'callee' }
  if (!roomId || !candidate) { res.status(400).json({ message: 'roomId and candidate required' }); return }
  const s = getOrCreate(roomId)
  if (from === 'callee') {
    s.calleeCandidates.push(candidate)
  } else {
    s.callerCandidates.push(candidate)
  }
  res.json({ ok: true })
})

// Poll for session state
router.get('/api/webrtc/poll/:roomId', (req, res) => {
  const { roomId } = req.params
  const s = sessions.get(roomId)
  if (!s) { res.json({ exists: false }); return }
  res.json({
    exists: true,
    offer:  s.offer,
    answer: s.answer,
    callerCandidates: s.callerCandidates,
    calleeCandidates: s.calleeCandidates,
  })
})

// End / cleanup a session
router.delete('/api/webrtc/session/:roomId', (req, res) => {
  sessions.delete(req.params.roomId)
  res.json({ ok: true })
})

export default router
