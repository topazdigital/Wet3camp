import { Router } from 'express'
import express from 'express'
import { randomBytes } from 'crypto'
import {
  startLive, endLive, getLiveSession, getAllLiveSessions, isLive,
  addSseClient, removeSseClient, addChatMessage, pinMessage, setLocked,
  addVideoChunk, addVideoSseClient, removeVideoSseClient,
} from '../lib/live-store.js'
import { verifyToken } from '../lib/jwt.js'
import { getPool } from '../lib/db.js'
import { pushNotification } from '../lib/notif-store.js'

const router = Router()

async function optionalAuth(req: any): Promise<{ userId: number | null; displayName: string; role: string }> {
  const raw = req.headers['authorization'] ?? ''
  const qToken = req.query['token'] as string | undefined
  const token = qToken ?? (typeof raw === 'string' ? raw.replace('Bearer ', '') : '')
  if (!token) return { userId: null, displayName: 'Guest', role: 'guest' }
  try {
    const payload = await verifyToken(token)
    return {
      userId: payload['id'] as number,
      displayName: (payload['username'] as string) || 'Viewer',
      role: (payload['role'] as string) || 'user',
    }
  } catch {
    return { userId: null, displayName: 'Guest', role: 'guest' }
  }
}

// ── POST /live/:escortId/stream — broadcaster sends video chunk ───────────────
router.post('/live/:escortId/stream',
  express.raw({ type: '*/*', limit: '8mb' }),
  async (req, res) => {
    const auth = await optionalAuth(req)
    if (!auth.userId) { res.status(401).json({ message: 'Login required' }); return }

    const session = getLiveSession(req.params.escortId)
    if (!session) { res.status(404).json({ message: 'Stream not found' }); return }

    // Only the escort who owns this stream (or admin) may publish video
    if (auth.role !== 'admin' && session.escortUserId !== auth.userId) {
      res.status(403).json({ message: 'Forbidden' }); return
    }

    const data = req.body as Buffer
    if (!data?.length) { res.status(400).json({ message: 'No data' }); return }

    const isInit = req.headers['x-is-init'] === 'true'
    const mimeType = (req.headers['x-mime-type'] as string) || 'video/webm'

    addVideoChunk(String(req.params.escortId), data.toString('base64'), isInit, mimeType)
    res.json({ ok: true })
  }
)

// ── GET /live/:escortId/video — SSE stream of video chunks to viewers ─────────
router.get('/live/:escortId/video', async (req, res) => {
  const session = getLiveSession(req.params.escortId)
  if (!session) { res.status(404).json({ message: 'Stream not found' }); return }

  const clientId = randomBytes(8).toString('hex')
  const escortKey = String(req.params.escortId)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  addVideoSseClient(escortKey, clientId, res)

  // Keepalive comment every 20s to prevent proxy/CDN timeouts
  const ping = setInterval(() => {
    try { res.write(': ping\n\n') } catch { clearInterval(ping) }
  }, 20_000)

  req.on('close', () => {
    clearInterval(ping)
    removeVideoSseClient(escortKey, clientId)
  })
})

// ── GET /live — list all active streams ─────────────────────────────────────
router.get('/live', (_req, res) => {
  const sessions = getAllLiveSessions()
  res.json(sessions.map(s => ({
    id: String(s.escortId),
    escortId: s.escortId,
    name: s.escortName,
    image: s.escortImage,
    tier: s.escortTier,
    city: s.escortCity,
    area: s.escortArea,
    title: s.title,
    startedAt: s.startedAt,
    viewerCount: s.clients.size,
    isLocked: s.isLocked,
    lockedTier: s.lockedTier,
  })))
})

// ── GET /live/:escortId — single stream info ─────────────────────────────────
router.get('/live/:escortId', (req, res) => {
  const session = getLiveSession(req.params.escortId)
  if (!session) { res.status(404).json({ message: 'Stream not found or ended' }); return }
  res.json({
    id: String(session.escortId),
    escortId: session.escortId,
    name: session.escortName,
    image: session.escortImage,
    tier: session.escortTier,
    city: session.escortCity,
    area: session.escortArea,
    title: session.title,
    startedAt: session.startedAt,
    viewerCount: session.clients.size,
    isLocked: session.isLocked,
    lockedTier: session.lockedTier,
    recentMessages: session.messages.slice(-50),
    pinnedMessageId: session.pinnedMessageId,
  })
})

// ── POST /live/start — escort starts a live session ──────────────────────────
router.post('/live/start', async (req, res) => {
  const auth = await optionalAuth(req)
  if (!auth.userId) { res.status(401).json({ message: 'Login required' }); return }
  if (auth.role !== 'escort' && auth.role !== 'admin') {
    res.status(403).json({ message: 'Only escorts can go live' }); return
  }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }

  const [[escort]] = await pool.query<any[]>(
    'SELECT id, name, image, tier, city, area FROM escorts WHERE user_id = ? AND is_active = 1 LIMIT 1',
    [auth.userId]
  )
  if (!escort) { res.status(404).json({ message: 'Escort profile not found' }); return }
  if (isLive(escort.id)) { res.status(409).json({ message: 'You are already live' }); return }

  const { title } = req.body as { title?: string }
  const session = startLive(escort.id, {
    name: escort.name,
    image: escort.image,
    tier: escort.tier,
    city: escort.city,
    area: escort.area,
    title: title || `${escort.name} is Live`,
    userId: auth.userId!,
  })

  // Notify all followers immediately — insert DB record + push SSE
  try {
    const [followers] = await pool.query<any[]>(
      'SELECT user_id FROM user_follows WHERE escort_id = ?',
      [escort.id]
    )
    const notifText = `🔴 ${escort.name} just went live! Tap to watch now`
    const notifLink = `/live/${escort.id}`
    const notifDot  = '#E91E63'
    for (const f of followers) {
      // Persist to DB so it shows in notification list
      try {
        await pool.query(
          'INSERT INTO notifications (user_id, type, text, link, dot, avatar) VALUES (?,?,?,?,?,?)',
          [f.user_id, 'live', notifText, notifLink, notifDot, escort.image ?? null]
        )
      } catch { /* non-fatal */ }
      // Push instant SSE event to connected browser
      pushNotification(f.user_id, {
        id: `live-${escort.id}-${Date.now()}`,
        type: 'live',
        text: notifText,
        link: notifLink,
        dot:  notifDot,
        avatar: escort.image ?? null,
        read: false,
        time: 'just now',
      })
    }
  } catch { /* non-fatal — stream still starts */ }

  res.json({
    escortId: escort.id,
    title: session.title,
    startedAt: session.startedAt,
  })
})

// ── POST /live/:escortId/end — escort ends their stream ──────────────────────
router.post('/live/:escortId/end', async (req, res) => {
  const auth = await optionalAuth(req)
  if (!auth.userId) { res.status(401).json({ message: 'Login required' }); return }

  const escortId = parseInt(req.params.escortId, 10)
  if (auth.role !== 'admin') {
    const pool = getPool()
    if (pool) {
      const [[escort]] = await pool.query<any[]>(
        'SELECT id FROM escorts WHERE id = ? AND user_id = ? LIMIT 1',
        [escortId, auth.userId]
      )
      if (!escort) { res.status(403).json({ message: 'Not your stream' }); return }
    }
  }

  const ended = endLive(escortId)
  if (!ended) { res.status(404).json({ message: 'Stream not found' }); return }
  res.json({ ok: true })
})

// ── GET /live/:escortId/events — SSE for real-time updates ──────────────────
router.get('/live/:escortId/events', async (req, res) => {
  const session = getLiveSession(req.params.escortId)
  if (!session) { res.status(404).json({ message: 'Stream not found' }); return }

  const auth = await optionalAuth(req)
  const clientId = randomBytes(8).toString('hex')
  const displayName = auth.displayName

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // Send initial state
  res.write(`data: ${JSON.stringify({
    type: 'init',
    viewerCount: session.clients.size + 1,
    recentMessages: session.messages.slice(-50),
    pinnedMessageId: session.pinnedMessageId,
    isLocked: session.isLocked,
  })}\n\n`)

  addSseClient(req.params.escortId, clientId, res, auth.userId, displayName)

  // Announce join
  addChatMessage(req.params.escortId, {
    userId: auth.userId,
    displayName,
    text: `${displayName} joined`,
    type: 'join',
  })

  req.on('close', () => {
    removeSseClient(req.params.escortId, clientId, displayName)
  })
})

// ── POST /live/:escortId/chat — send a chat message ─────────────────────────
router.post('/live/:escortId/chat', async (req, res) => {
  const session = getLiveSession(req.params.escortId)
  if (!session) { res.status(404).json({ message: 'Stream not found' }); return }

  const auth = await optionalAuth(req)
  const { text } = req.body as { text: string }
  if (!text || text.trim().length === 0) { res.status(400).json({ message: 'Message required' }); return }
  if (text.trim().length > 300) { res.status(400).json({ message: 'Message too long' }); return }

  const msg = addChatMessage(req.params.escortId, {
    userId: auth.userId,
    displayName: auth.displayName,
    text: text.trim(),
    type: 'chat',
  })

  res.json({ ok: true, message: msg })
})

// ── POST /live/:escortId/react — send an emoji reaction ─────────────────────
router.post('/live/:escortId/react', async (req, res) => {
  const session = getLiveSession(req.params.escortId)
  if (!session) { res.status(404).json({ message: 'Stream not found' }); return }

  const auth = await optionalAuth(req)
  const { emoji } = req.body as { emoji: string }
  const allowed = ['❤️','🔥','😍','💯','👑','😘','💋','🎉','💪','✨']
  if (!allowed.includes(emoji)) { res.status(400).json({ message: 'Invalid emoji' }); return }

  const msg = addChatMessage(req.params.escortId, {
    userId: auth.userId,
    displayName: auth.displayName,
    text: emoji,
    type: 'reaction',
    emoji,
  })

  res.json({ ok: true, message: msg })
})

// ── POST /live/:escortId/gift — send a virtual gift ─────────────────────────
router.post('/live/:escortId/gift', async (req, res) => {
  const session = getLiveSession(req.params.escortId)
  if (!session) { res.status(404).json({ message: 'Stream not found' }); return }

  const auth = await optionalAuth(req)
  const GIFTS: Record<string, string> = {
    rose: '🌹', diamond: '💎', crown: '👑', heart: '💖', fire: '🔥',
    star: '⭐', champagne: '🍾', ring: '💍', kiss: '💋', trophy: '🏆',
  }
  const { giftId } = req.body as { giftId: string }
  const giftEmoji = GIFTS[giftId]
  if (!giftEmoji) { res.status(400).json({ message: 'Invalid gift' }); return }

  const msg = addChatMessage(req.params.escortId, {
    userId: auth.userId,
    displayName: auth.displayName,
    text: `${auth.displayName} sent a ${giftId}!`,
    type: 'gift',
    emoji: giftEmoji,
    giftName: giftId,
    giftEmoji,
  })

  res.json({ ok: true, message: msg })
})

// ── POST /live/:escortId/pin — pin a message (escort only) ──────────────────
router.post('/live/:escortId/pin', async (req, res) => {
  const auth = await optionalAuth(req)
  if (!auth.userId) { res.status(401).json({ message: 'Login required' }); return }

  const { messageId } = req.body as { messageId: string }
  if (!messageId) { res.status(400).json({ message: 'messageId required' }); return }
  pinMessage(req.params.escortId, messageId)
  res.json({ ok: true })
})

// ── POST /live/:escortId/lock — lock/unlock stream (escort only) ─────────────
router.post('/live/:escortId/lock', async (req, res) => {
  const auth = await optionalAuth(req)
  if (!auth.userId) { res.status(401).json({ message: 'Login required' }); return }

  const { locked, tier } = req.body as { locked: boolean; tier?: string }
  setLocked(req.params.escortId, locked, tier ?? null)
  res.json({ ok: true })
})

export default router
