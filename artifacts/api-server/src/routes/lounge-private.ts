import { Router, type Response } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'

const router = Router()
const MESSAGE_LIMIT = 800

function parsePositiveId(value: unknown): number | null {
  const text = String(value ?? '')
  if (!/^[1-9]\d*$/.test(text)) return null
  const id = Number(text)
  return Number.isSafeInteger(id) ? id : null
}

function asIsoDate(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Error('Invalid private message timestamp')
  return date.toISOString()
}

function noStore(res: Response) {
  res.setHeader('Cache-Control', 'private, no-store')
}

async function belongsToUser(conversationId: number, userId: number): Promise<boolean> {
  const pool = getPool()
  if (!pool) return false
  const [[row]] = await pool.query<any[]>(
    `SELECT id FROM lounge_conversations
      WHERE id = ? AND (member_one_id = ? OR member_two_id = ?)
      LIMIT 1`,
    [conversationId, userId, userId],
  )
  return Boolean(row)
}

router.post('/lounge/conversations', requireAuth, async (req: AuthRequest, res) => {
  const postId = parsePositiveId((req.body as { messageId?: unknown } | undefined)?.messageId)
  if (!postId) {
    res.status(400).json({ message: 'Choose a valid Lounge post' })
    return
  }

  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }
    const [[post]] = await pool.query<any[]>(
      `SELECT m.user_id, u.is_active
         FROM lounge_messages m
         JOIN users u ON u.id = m.user_id
        WHERE m.id = ?
        LIMIT 1`,
      [postId],
    )
    if (!post || !Number(post.is_active)) {
      res.status(404).json({ message: 'Lounge post not found' })
      return
    }

    const viewerId = Number(req.userId)
    const recipientId = Number(post.user_id)
    if (viewerId === recipientId) {
      res.status(400).json({ message: 'You cannot message yourself' })
      return
    }

    const firstMemberId = Math.min(viewerId, recipientId)
    const secondMemberId = Math.max(viewerId, recipientId)
    let conversationId: number
    const [[existing]] = await pool.query<any[]>(
      `SELECT id FROM lounge_conversations
        WHERE member_one_id = ? AND member_two_id = ?
        LIMIT 1`,
      [firstMemberId, secondMemberId],
    )

    if (existing) {
      conversationId = Number(existing.id)
    } else {
      try {
        const [result] = await pool.query<any>(
          `INSERT INTO lounge_conversations (member_one_id, member_two_id)
           VALUES (?, ?)`,
          [firstMemberId, secondMemberId],
        )
        conversationId = Number((result as any).insertId)
      } catch (error) {
        // Another request may have created this pair at the same time.
        const [[createdByOtherRequest]] = await pool.query<any[]>(
          `SELECT id FROM lounge_conversations
            WHERE member_one_id = ? AND member_two_id = ?
            LIMIT 1`,
          [firstMemberId, secondMemberId],
        )
        if (!createdByOtherRequest) throw error
        conversationId = Number(createdByOtherRequest.id)
      }
    }

    noStore(res)
    res.status(existing ? 200 : 201).json({ id: String(conversationId) })
  } catch (error) {
    console.error('[lounge-private] conversation create failed:', error)
    res.status(500).json({ message: 'Could not open a private conversation' })
  }
})

router.get('/lounge/conversations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }
    const userId = Number(req.userId)
    const [rows] = await pool.query<any[]>(
      `SELECT c.id,
              COALESCE(NULLIF(other.display_name, ''), other.username, 'Member') AS other_name,
              other.avatar AS other_avatar,
              (SELECT dm.body
                 FROM lounge_direct_messages dm
                WHERE dm.conversation_id = c.id
                ORDER BY dm.id DESC LIMIT 1) AS last_message,
              (SELECT dm.created_at
                 FROM lounge_direct_messages dm
                WHERE dm.conversation_id = c.id
                ORDER BY dm.id DESC LIMIT 1) AS last_message_at,
              (SELECT COUNT(*)
                 FROM lounge_direct_messages unread
                WHERE unread.conversation_id = c.id
                  AND unread.sender_id <> ?
                  AND unread.read_at IS NULL) AS unread_count
         FROM lounge_conversations c
         JOIN users other
           ON other.id = CASE
                WHEN c.member_one_id = ? THEN c.member_two_id
                ELSE c.member_one_id
              END
        WHERE (c.member_one_id = ? OR c.member_two_id = ?)
          AND other.is_active = 1
        ORDER BY c.updated_at DESC, c.id DESC
        LIMIT 100`,
      [userId, userId, userId, userId],
    )
    noStore(res)
    res.json((rows as any[]).map(row => ({
      id: String(row.id),
      otherName: String(row.other_name || 'Member'),
      otherAvatar: row.other_avatar ?? null,
      lastMessage: row.last_message == null ? '' : String(row.last_message),
      lastMessageAt: row.last_message_at ? asIsoDate(row.last_message_at) : null,
      unreadCount: Number(row.unread_count ?? 0),
    })))
  } catch (error) {
    console.error('[lounge-private] conversation list failed:', error)
    res.status(500).json({ message: 'Could not load private conversations' })
  }
})

router.get('/lounge/conversations/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  const conversationId = parsePositiveId(req.params.id)
  if (!conversationId) {
    res.status(400).json({ message: 'Invalid conversation ID' })
    return
  }
  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }
    const userId = Number(req.userId)
    const [[conversation]] = await pool.query<any[]>(
      `SELECT id FROM lounge_conversations
        WHERE id = ? AND (member_one_id = ? OR member_two_id = ?)
        LIMIT 1`,
      [conversationId, userId, userId],
    )
    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' })
      return
    }

    await pool.query(
      `UPDATE lounge_direct_messages
          SET read_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL`,
      [conversationId, userId],
    )
    const [rows] = await pool.query<any[]>(
      `SELECT id, sender_id, body, created_at
         FROM lounge_direct_messages
        WHERE conversation_id = ?
        ORDER BY id ASC
        LIMIT 200`,
      [conversationId],
    )
    noStore(res)
    res.json((rows as any[]).map(row => ({
      id: String(row.id),
      isOwn: Number(row.sender_id) === userId,
      body: String(row.body),
      createdAt: asIsoDate(row.created_at),
    })))
  } catch (error) {
    console.error('[lounge-private] messages fetch failed:', error)
    res.status(500).json({ message: 'Could not load this private conversation' })
  }
})

router.post('/lounge/conversations/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  const conversationId = parsePositiveId(req.params.id)
  const rawBody = (req.body as { body?: unknown } | undefined)?.body
  if (!conversationId) {
    res.status(400).json({ message: 'Invalid conversation ID' })
    return
  }
  if (typeof rawBody !== 'string' || !rawBody.trim()) {
    res.status(400).json({ message: 'Write a message before sending' })
    return
  }
  const body = rawBody.trim()
  if (Array.from(body).length > MESSAGE_LIMIT) {
    res.status(400).json({ message: `Messages must be ${MESSAGE_LIMIT} characters or fewer` })
    return
  }

  try {
    const pool = getPool()
    if (!pool) {
      res.status(503).json({ message: 'Database not configured', code: 'NO_DB' })
      return
    }
    const userId = Number(req.userId)
    if (!(await belongsToUser(conversationId, userId))) {
      res.status(404).json({ message: 'Conversation not found' })
      return
    }
    const oneMinuteAgo = new Date(Date.now() - 60_000)
    const [[recent]] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total
         FROM lounge_direct_messages
        WHERE sender_id = ? AND created_at >= ?`,
      [userId, oneMinuteAgo],
    )
    if (Number(recent?.total ?? 0) >= 10) {
      res.status(429).json({ message: 'Please wait a moment before sending another message' })
      return
    }

    const [result] = await pool.query<any>(
      `INSERT INTO lounge_direct_messages (conversation_id, sender_id, body)
       VALUES (?, ?, ?)`,
      [conversationId, userId, body],
    )
    await pool.query(
      `UPDATE lounge_conversations
          SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [conversationId],
    )
    const messageId = Number((result as any).insertId)
    const [[row]] = await pool.query<any[]>(
      `SELECT id, body, created_at
         FROM lounge_direct_messages
        WHERE id = ? AND conversation_id = ?
        LIMIT 1`,
      [messageId, conversationId],
    )
    if (!row) {
      res.status(500).json({ message: 'Message was sent but could not be returned' })
      return
    }
    noStore(res)
    res.status(201).json({
      id: String(row.id),
      isOwn: true,
      body: String(row.body),
      createdAt: asIsoDate(row.created_at),
    })
  } catch (error) {
    console.error('[lounge-private] message send failed:', error)
    res.status(500).json({ message: 'Could not send this private message' })
  }
})

export default router
