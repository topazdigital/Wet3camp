import type { Response } from 'express'

export interface LiveChatMessage {
  id: string
  userId: number | null
  displayName: string
  avatar?: string
  text: string
  type: 'chat' | 'reaction' | 'gift' | 'system' | 'join' | 'leave'
  emoji?: string
  giftName?: string
  giftEmoji?: string
  timestamp: number
  pinned?: boolean
}

interface SseClient {
  res: Response
  userId: number | null
  displayName: string
  clientId: string
}

interface VideoSseClient {
  res: Response
  clientId: string
}

export interface LiveSession {
  escortId: number
  escortName: string
  escortImage: string | null
  escortTier: string
  escortCity: string
  escortArea: string
  escortUserId: number   // user account that owns this stream (for authz)
  title: string
  startedAt: number
  isLocked: boolean
  lockedTier: string | null
  messages: LiveChatMessage[]
  clients: Map<string, SseClient>
  viewerIds: Set<string>
  pinnedMessageId: string | null
  // Native video streaming
  videoInitChunk: string | null   // base64 init segment (first MediaRecorder chunk)
  videoChunks: string[]           // rolling buffer of last 30 non-init chunks (base64)
  videoMimeType: string
  videoClients: Map<string, VideoSseClient>
  videoSeq: number
}

const sessions = new Map<string, LiveSession>()

export function startLive(
  escortId: number,
  data: { name: string; image: string | null; tier: string; city: string; area: string; title?: string; userId: number }
): LiveSession {
  const session: LiveSession = {
    escortId,
    escortName: data.name,
    escortImage: data.image,
    escortTier: data.tier,
    escortCity: data.city,
    escortArea: data.area,
    escortUserId: data.userId,
    title: data.title || `${data.name} is Live`,
    startedAt: Date.now(),
    isLocked: false,
    lockedTier: null,
    messages: [{
      id: 'sys-start',
      userId: null,
      displayName: 'System',
      text: `${data.name} just went live! 🎉`,
      type: 'system',
      timestamp: Date.now(),
    }],
    clients: new Map(),
    viewerIds: new Set(),
    pinnedMessageId: null,
    videoInitChunk: null,
    videoChunks: [],
    videoMimeType: 'video/webm',
    videoClients: new Map(),
    videoSeq: 0,
  }
  sessions.set(String(escortId), session)
  return session
}

// ── Video chunk management ────────────────────────────────────────────────────

export function addVideoChunk(escortId: string, b64: string, isInit: boolean, mimeType: string): void {
  const session = sessions.get(escortId)
  if (!session) return
  if (isInit) {
    session.videoInitChunk = b64
    session.videoMimeType = mimeType
    session.videoChunks = []
    session.videoSeq = 0
  } else {
    session.videoChunks.push(b64)
    if (session.videoChunks.length > 30) session.videoChunks.shift()
  }
  const seq = ++session.videoSeq
  broadcastVideo(session, { b64, mimeType: session.videoMimeType, isInit, seq })
}

export function addVideoSseClient(escortId: string, clientId: string, res: Response): void {
  const session = sessions.get(escortId)
  if (!session) return
  session.videoClients.set(clientId, { res, clientId })
  // Send init chunk first so viewer can set up SourceBuffer
  if (session.videoInitChunk) {
    try {
      res.write(`data: ${JSON.stringify({ b64: session.videoInitChunk, mimeType: session.videoMimeType, isInit: true, seq: 0 })}\n\n`)
    } catch {}
    // Catch up with last 5 chunks
    for (const b64 of session.videoChunks.slice(-5)) {
      try {
        res.write(`data: ${JSON.stringify({ b64, mimeType: session.videoMimeType, isInit: false, seq: 0 })}\n\n`)
      } catch {}
    }
  }
}

export function removeVideoSseClient(escortId: string, clientId: string): void {
  const session = sessions.get(escortId)
  if (!session) return
  session.videoClients.delete(clientId)
}

function broadcastVideo(session: LiveSession, data: unknown): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  for (const [id, client] of session.videoClients) {
    try { client.res.write(payload) } catch { session.videoClients.delete(id) }
  }
}

export function endLive(escortId: number): boolean {
  const key = String(escortId)
  const session = sessions.get(key)
  if (!session) return false
  broadcast(session, { type: 'ended', message: 'Stream ended by escort' })
  for (const client of session.clients.values()) {
    try { client.res.end() } catch {}
  }
  // Close video SSE connections too
  for (const client of session.videoClients.values()) {
    try { client.res.end() } catch {}
  }
  sessions.delete(key)
  return true
}

export function getLiveSession(escortId: string | number): LiveSession | null {
  return sessions.get(String(escortId)) ?? null
}

export function getAllLiveSessions(): LiveSession[] {
  return Array.from(sessions.values())
}

export function isLive(escortId: number): boolean {
  return sessions.has(String(escortId))
}

export function addSseClient(
  escortId: string,
  clientId: string,
  res: Response,
  userId: number | null,
  displayName: string
): void {
  const session = sessions.get(escortId)
  if (!session) return
  session.clients.set(clientId, { res, userId, clientId, displayName })
  if (userId) session.viewerIds.add(String(userId))
  else session.viewerIds.add(`anon-${clientId}`)
  broadcastViewerCount(session)
}

export function removeSseClient(escortId: string, clientId: string, displayName: string): void {
  const session = sessions.get(escortId)
  if (!session) return
  session.clients.delete(clientId)
  broadcastViewerCount(session)
  const leaveMsg: LiveChatMessage = {
    id: `leave-${Date.now()}`,
    userId: null,
    displayName,
    text: `${displayName} left`,
    type: 'leave',
    timestamp: Date.now(),
  }
  broadcast(session, { type: 'chat', message: leaveMsg })
}

export function addChatMessage(
  escortId: string,
  msg: Omit<LiveChatMessage, 'id' | 'timestamp'>
): LiveChatMessage | null {
  const session = sessions.get(escortId)
  if (!session) return null
  const full: LiveChatMessage = { ...msg, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, timestamp: Date.now() }
  session.messages.push(full)
  if (session.messages.length > 200) session.messages.splice(0, session.messages.length - 200)
  broadcast(session, { type: 'chat', message: full })
  return full
}

export function pinMessage(escortId: string, messageId: string): void {
  const session = sessions.get(escortId)
  if (!session) return
  session.pinnedMessageId = messageId
  const msg = session.messages.find(m => m.id === messageId)
  if (msg) {
    msg.pinned = true
    broadcast(session, { type: 'pinned', message: msg })
  }
}

export function setLocked(escortId: string, locked: boolean, tier: string | null): void {
  const session = sessions.get(escortId)
  if (!session) return
  session.isLocked = locked
  session.lockedTier = tier
  broadcast(session, { type: 'lock_change', isLocked: locked, lockedTier: tier })
}

export function broadcast(session: LiveSession, data: any): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  for (const client of session.clients.values()) {
    try { client.res.write(payload) } catch { session.clients.delete(client.clientId) }
  }
}

function broadcastViewerCount(session: LiveSession): void {
  broadcast(session, { type: 'viewer_count', count: session.clients.size })
}

setInterval(() => {
  for (const session of sessions.values()) {
    const ping = ': ping\n\n'
    for (const [id, client] of session.clients) {
      try { client.res.write(ping) } catch { session.clients.delete(id) }
    }
  }
}, 20000)
