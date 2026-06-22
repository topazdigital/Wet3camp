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

export interface LiveSession {
  escortId: number
  escortName: string
  escortImage: string | null
  escortTier: string
  escortCity: string
  escortArea: string
  jitsiRoom: string
  title: string
  startedAt: number
  isLocked: boolean
  lockedTier: string | null
  messages: LiveChatMessage[]
  clients: Map<string, SseClient>
  viewerIds: Set<string>
  pinnedMessageId: string | null
}

const sessions = new Map<string, LiveSession>()

export function startLive(
  escortId: number,
  data: { name: string; image: string | null; tier: string; city: string; area: string; title?: string }
): LiveSession {
  const jitsiRoom = `wet3camp-live-${escortId}-${Date.now()}`
  const session: LiveSession = {
    escortId,
    escortName: data.name,
    escortImage: data.image,
    escortTier: data.tier,
    escortCity: data.city,
    escortArea: data.area,
    jitsiRoom,
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
  }
  sessions.set(String(escortId), session)
  return session
}

export function endLive(escortId: number): boolean {
  const key = String(escortId)
  const session = sessions.get(key)
  if (!session) return false
  broadcast(session, { type: 'ended', message: 'Stream ended by escort' })
  for (const client of session.clients.values()) {
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
