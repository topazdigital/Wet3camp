import { createHash, randomBytes } from 'node:crypto'
import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { sendSupportReplyEmail } from '../lib/mailer.js'

const router = Router()
const CATEGORIES = new Set(['listings', 'bookings', 'account access', 'payments', 'safety', 'other'])
const GUEST_TOKEN_HEADER = 'x-support-guest-token'
const MAX_MESSAGE_LENGTH = 3000

type SupportQuery = (sql: string, params?: unknown[]) => Promise<[any, any]>

function positiveId(value: unknown): number | null {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function safeCategory(value: unknown): string {
  const category = cleanText(value, 40).toLowerCase()
  return CATEGORIES.has(category) ? category : 'general'
}

function messageText(value: unknown): string {
  return cleanText(value, MAX_MESSAGE_LENGTH)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function guestToken(req: AuthRequest): string {
  const value = req.get(GUEST_TOKEN_HEADER)
  return typeof value === 'string' && value.length >= 40 && value.length <= 100 ? value : ''
}

function setPrivateNoStore(res: any) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
}

// Small process-local limit to keep the public guest endpoint from being used
// for bulk spam. The customer still gets normal chat usage.
const guestRateWindows = new Map<string, { startedAt: number; count: number }>()
function checkGuestRateLimit(req: AuthRequest, res: any, key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  if (guestRateWindows.size > 5000) {
    for (const [entryKey, value] of guestRateWindows) {
      if (now - value.startedAt >= windowMs) guestRateWindows.delete(entryKey)
    }
  }
  const clientKey = `${req.ip || 'unknown'}:${key}`
  const current = guestRateWindows.get(clientKey)
  if (!current || now - current.startedAt >= windowMs) {
    guestRateWindows.set(clientKey, { startedAt: now, count: 1 })
    return true
  }
  if (current.count >= max) {
    res.status(429).json({ message: 'Please wait before sending another support message.' })
    return false
  }
  current.count += 1
  return true
}

function jsonMessage(row: any) {
  return {
    id: String(row.id),
    senderType: String(row.sender_type),
    senderName: String(row.sender_name ?? (row.sender_type === 'admin' ? 'Wet3Camp Support' : 'You')),
    content: String(row.content),
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  }
}

async function getConversation(pool: any, id: number, owner: { userId: number } | { guestTokenHash: string }) {
  const ownerSql = 'userId' in owner ? 'c.user_id = ?' : 'c.guest_token_hash = ?'
  const ownerValue = 'userId' in owner ? owner.userId : owner.guestTokenHash
  const [[conversation]] = await pool.query(
    `SELECT c.id, c.user_id, c.guest_name, c.guest_email, c.category, c.status,
            c.admin_unread_count, c.customer_unread_count, c.last_message_at, c.created_at,
            COALESCE(NULLIF(u.display_name, ''), NULLIF(u.username, ''), c.guest_name, 'Visitor') AS customer_name,
            COALESCE(u.email, c.guest_email) AS customer_email
     FROM support_conversations c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.id = ? AND ${ownerSql}
     LIMIT 1`,
    [id, ownerValue],
  )
  if (!conversation) return null
  const [messages] = await pool.query(
    `SELECT sm.id, sm.sender_type, sm.content, sm.read_at, sm.created_at,
            COALESCE(NULLIF(u.display_name, ''), NULLIF(u.username, ''), 'Wet3Camp Support') AS sender_name
     FROM support_messages sm
     LEFT JOIN users u ON u.id = sm.sender_user_id AND sm.sender_type = 'admin'
     WHERE sm.conversation_id = ?
     ORDER BY sm.id ASC`,
    [id],
  )
  return {
    id: String(conversation.id),
    userId: conversation.user_id ? String(conversation.user_id) : null,
    customerName: String(conversation.customer_name ?? 'Visitor'),
    customerEmail: String(conversation.customer_email ?? ''),
    category: String(conversation.category),
    status: String(conversation.status),
    adminUnreadCount: Number(conversation.admin_unread_count ?? 0),
    customerUnreadCount: Number(conversation.customer_unread_count ?? 0),
    lastMessageAt: conversation.last_message_at,
    createdAt: conversation.created_at,
    messages: (messages as any[]).map(jsonMessage),
  }
}

async function markCustomerRead(pool: any, id: number) {
  await pool.transaction(async (query: SupportQuery) => {
    await query(
      "UPDATE support_messages SET read_at = NOW() WHERE conversation_id = ? AND sender_type = 'admin' AND read_at IS NULL",
      [id],
    )
    await query('UPDATE support_conversations SET customer_unread_count = 0 WHERE id = ?', [id])
  })
}

async function createConversationWithPool(
  pool: any,
  data: {
    userId: number | null
    guestName: string | null
    guestEmail: string | null
    guestTokenHash: string | null
    category: string
    content: string
  },
): Promise<number> {
  const [conversationResult] = await pool.query(
    `INSERT INTO support_conversations
      (user_id, guest_name, guest_email, guest_token_hash, category, status, admin_unread_count)
     VALUES (?, ?, ?, ?, ?, 'open', 1)`,
    [data.userId, data.guestName, data.guestEmail, data.guestTokenHash, data.category],
  )
  const id = Number((conversationResult as any)?.insertId)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Could not create support conversation')
  try {
    await pool.query(
      "INSERT INTO support_messages (conversation_id, sender_type, sender_user_id, content) VALUES (?, 'customer', ?, ?)",
      [id, data.userId, data.content],
    )
    await pool.query(
      'UPDATE support_conversations SET last_message_at = NOW() WHERE id = ?',
      [id],
    )
  } catch (error) {
    await pool.query('DELETE FROM support_messages WHERE conversation_id = ?', [id]).catch(() => {})
    await pool.query('DELETE FROM support_conversations WHERE id = ?', [id]).catch(() => {})
    throw error
  }
  return id
}

async function addCustomerMessage(
  pool: any,
  id: number,
  content: string,
  owner: { userId: number } | { guestTokenHash: string },
) {
  const ownerSql = 'userId' in owner ? 'user_id = ?' : 'guest_token_hash = ?'
  const ownerValue = 'userId' in owner ? owner.userId : owner.guestTokenHash
  return pool.transaction(async (query: SupportQuery) => {
    const [rows] = await query(
      `SELECT id FROM support_conversations WHERE id = ? AND ${ownerSql} LIMIT 1 FOR UPDATE`,
      [id, ownerValue],
    )
    if (!Array.isArray(rows) || rows.length === 0) return false
    const senderId = 'userId' in owner ? owner.userId : null
    await query(
      "INSERT INTO support_messages (conversation_id, sender_type, sender_user_id, content) VALUES (?, 'customer', ?, ?)",
      [id, senderId, content],
    )
    await query(
      `UPDATE support_conversations
       SET status = 'open', admin_unread_count = admin_unread_count + 1, last_message_at = NOW()
       WHERE id = ?`,
      [id],
    )
    return true
  })
}

function validateContent(req: AuthRequest, res: any): string | null {
  const content = messageText(req.body?.content)
  if (!content) {
    res.status(400).json({ message: 'Write a message before sending.' })
    return null
  }
  return content
}

// Signed-in customers and escorts can create and manage their own support chats.
router.get('/support/conversations/current', requireAuth, async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  try {
    const [[row]] = await pool.query<any[]>(
      'SELECT id FROM support_conversations WHERE user_id = ? ORDER BY last_message_at DESC LIMIT 1',
      [req.userId],
    )
    if (!row) { res.json({ conversation: null }); return }
    const id = positiveId(row.id)
    if (!id) { res.status(500).json({ message: 'Invalid support conversation' }); return }
    await markCustomerRead(pool, id)
    res.json({ conversation: await getConversation(pool, id, { userId: Number(req.userId) }) })
  } catch (error: any) {
    console.error('[support/current]', error?.message ?? error)
    res.status(500).json({ message: 'Could not load your support chat.' })
  }
})

router.post('/support/conversations', requireAuth, async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  const content = validateContent(req, res)
  if (!content) return
  try {
    const id = await createConversationWithPool(pool, {
      userId: Number(req.userId),
      guestName: null,
      guestEmail: null,
      guestTokenHash: null,
      category: safeCategory(req.body?.category),
      content,
    })
    res.status(201).json({ conversation: await getConversation(pool, id, { userId: Number(req.userId) }) })
  } catch (error: any) {
    console.error('[support/create]', error?.message ?? error)
    res.status(500).json({ message: 'Could not start your support chat.' })
  }
})

router.get('/support/conversations/:id', requireAuth, async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  const pool = getPool()
  const id = positiveId(req.params.id)
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  if (!id) { res.status(400).json({ message: 'Invalid support conversation.' }); return }
  try {
    const conversation = await getConversation(pool, id, { userId: Number(req.userId) })
    if (!conversation) { res.status(404).json({ message: 'Support conversation not found.' }); return }
    await markCustomerRead(pool, id)
    conversation.customerUnreadCount = 0
    res.json({ conversation })
  } catch (error: any) {
    console.error('[support/read]', error?.message ?? error)
    res.status(500).json({ message: 'Could not load your support chat.' })
  }
})

router.post('/support/conversations/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  const pool = getPool()
  const id = positiveId(req.params.id)
  const content = validateContent(req, res)
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  if (!id) { res.status(400).json({ message: 'Invalid support conversation.' }); return }
  if (!content) return
  try {
    const added = await addCustomerMessage(pool, id, content, { userId: Number(req.userId) })
    if (!added) { res.status(404).json({ message: 'Support conversation not found.' }); return }
    res.status(201).json({ conversation: await getConversation(pool, id, { userId: Number(req.userId) }) })
  } catch (error: any) {
    console.error('[support/user-message]', error?.message ?? error)
    res.status(500).json({ message: 'Could not send your support message.' })
  }
})

// Guest chats are bearer-token protected; the random token is returned only
// when the conversation is created and only its SHA-256 hash is stored.
router.post('/support/guest/conversations', async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  if (!checkGuestRateLimit(req, res, 'create', 8, 60 * 60 * 1000)) return
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  const guestName = cleanText(req.body?.name, 120)
  const guestEmail = cleanText(req.body?.email, 254).toLowerCase()
  const content = validateContent(req, res)
  if (!content) return
  if (guestName.length < 2) { res.status(400).json({ message: 'Enter your name to start a chat.' }); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) { res.status(400).json({ message: 'Enter a valid email address.' }); return }
  try {
    const token = randomBytes(32).toString('base64url')
    const id = await createConversationWithPool(pool, {
      userId: null,
      guestName,
      guestEmail,
      guestTokenHash: sha256(token),
      category: safeCategory(req.body?.category),
      content,
    })
    setPrivateNoStore(res)
    res.status(201).json({
      conversation: await getConversation(pool, id, { guestTokenHash: sha256(token) }),
      accessToken: token,
    })
  } catch (error: any) {
    console.error('[support/guest-create]', error?.message ?? error)
    res.status(500).json({ message: 'Could not start your support chat.' })
  }
})

router.get('/support/guest/conversations/:id', async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  const pool = getPool()
  const id = positiveId(req.params.id)
  const token = guestToken(req)
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  if (!id || !token) { res.status(404).json({ message: 'Support conversation not found.' }); return }
  try {
    const conversation = await getConversation(pool, id, { guestTokenHash: sha256(token) })
    if (!conversation) { res.status(404).json({ message: 'Support conversation not found.' }); return }
    await markCustomerRead(pool, id)
    conversation.customerUnreadCount = 0
    res.json({ conversation })
  } catch (error: any) {
    console.error('[support/guest-read]', error?.message ?? error)
    res.status(500).json({ message: 'Could not load your support chat.' })
  }
})

router.post('/support/guest/conversations/:id/messages', async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  const pool = getPool()
  const id = positiveId(req.params.id)
  const token = guestToken(req)
  const content = validateContent(req, res)
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  if (!id || !token) { res.status(404).json({ message: 'Support conversation not found.' }); return }
  if (!content) return
  if (!checkGuestRateLimit(req, res, sha256(token).slice(0, 16), 30, 60 * 60 * 1000)) return
  try {
    const added = await addCustomerMessage(pool, id, content, { guestTokenHash: sha256(token) })
    if (!added) { res.status(404).json({ message: 'Support conversation not found.' }); return }
    setPrivateNoStore(res)
    res.status(201).json({
      conversation: await getConversation(pool, id, { guestTokenHash: sha256(token) }),
    })
  } catch (error: any) {
    console.error('[support/guest-message]', error?.message ?? error)
    res.status(500).json({ message: 'Could not send your support message.' })
  }
})

// Admin inbox and replies
router.get('/support/admin/conversations', requireAuth, async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required.' }); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  const status = cleanText(req.query.status, 20)
  const where = status === 'open' || status === 'resolved' ? 'WHERE c.status = ?' : ''
  const params = where ? [status] : []
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT c.id, c.user_id, c.guest_name, c.guest_email, c.category, c.status,
              c.admin_unread_count, c.customer_unread_count, c.last_message_at, c.created_at,
              COALESCE(NULLIF(u.display_name, ''), NULLIF(u.username, ''), c.guest_name, 'Visitor') AS customer_name,
              COALESCE(u.email, c.guest_email) AS customer_email,
              (SELECT sm.content FROM support_messages sm WHERE sm.conversation_id = c.id ORDER BY sm.id DESC LIMIT 1) AS last_message
       FROM support_conversations c
       LEFT JOIN users u ON u.id = c.user_id
       ${where}
       ORDER BY c.last_message_at DESC`,
      params,
    )
    res.json((rows as any[]).map(row => ({
      id: String(row.id),
      userId: row.user_id ? String(row.user_id) : null,
      customerName: String(row.customer_name ?? 'Visitor'),
      customerEmail: String(row.customer_email ?? ''),
      category: String(row.category),
      status: String(row.status),
      adminUnreadCount: Number(row.admin_unread_count ?? 0),
      customerUnreadCount: Number(row.customer_unread_count ?? 0),
      lastMessage: String(row.last_message ?? ''),
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
    })))
  } catch (error: any) {
    console.error('[support/admin-list]', error?.message ?? error)
    res.status(500).json({ message: 'Could not load the support inbox.' })
  }
})

router.get('/support/admin/conversations/:id', requireAuth, async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required.' }); return }
  const pool = getPool()
  const id = positiveId(req.params.id)
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  if (!id) { res.status(400).json({ message: 'Invalid support conversation.' }); return }
  try {
    const [[row]] = await pool.query<any[]>(
      `SELECT c.id, c.user_id, c.guest_name, c.guest_email, c.category, c.status,
              c.admin_unread_count, c.customer_unread_count, c.last_message_at, c.created_at,
              COALESCE(NULLIF(u.display_name, ''), NULLIF(u.username, ''), c.guest_name, 'Visitor') AS customer_name,
              COALESCE(u.email, c.guest_email) AS customer_email
       FROM support_conversations c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = ? LIMIT 1`,
      [id],
    )
    if (!row) { res.status(404).json({ message: 'Support conversation not found.' }); return }
    await pool.transaction(async (query: SupportQuery) => {
      await query(
        "UPDATE support_messages SET read_at = NOW() WHERE conversation_id = ? AND sender_type = 'customer' AND read_at IS NULL",
        [id],
      )
      await query('UPDATE support_conversations SET admin_unread_count = 0 WHERE id = ?', [id])
    })
    const [messages] = await pool.query<any[]>(
      `SELECT sm.id, sm.sender_type, sm.sender_user_id, sm.content, sm.read_at, sm.created_at,
              CASE WHEN sm.sender_type = 'admin'
                   THEN COALESCE(NULLIF(u.display_name, ''), NULLIF(u.username, ''), 'Wet3Camp Support')
                   ELSE COALESCE(NULLIF(c.guest_name, ''), NULLIF(cu.display_name, ''), NULLIF(cu.username, ''), 'Visitor')
              END AS sender_name
       FROM support_messages sm
       JOIN support_conversations c ON c.id = sm.conversation_id
       LEFT JOIN users u ON u.id = sm.sender_user_id AND sm.sender_type = 'admin'
       LEFT JOIN users cu ON cu.id = c.user_id
       WHERE sm.conversation_id = ?
       ORDER BY sm.id ASC`,
      [id],
    )
    res.json({
      conversation: {
        id: String(row.id),
        userId: row.user_id ? String(row.user_id) : null,
        customerName: String(row.customer_name ?? 'Visitor'),
        customerEmail: String(row.customer_email ?? ''),
        category: String(row.category),
        status: String(row.status),
        adminUnreadCount: 0,
        customerUnreadCount: Number(row.customer_unread_count ?? 0),
        lastMessageAt: row.last_message_at,
        createdAt: row.created_at,
        messages: (messages as any[]).map(jsonMessage),
      },
    })
  } catch (error: any) {
    console.error('[support/admin-read]', error?.message ?? error)
    res.status(500).json({ message: 'Could not load this support conversation.' })
  }
})

router.post('/support/admin/conversations/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  setPrivateNoStore(res)
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required.' }); return }
  const pool = getPool()
  const id = positiveId(req.params.id)
  const content = validateContent(req, res)
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  if (!id) { res.status(400).json({ message: 'Invalid support conversation.' }); return }
  if (!content) return
  try {
    const result = await pool.transaction(async (query: SupportQuery) => {
      const [rows] = await query(
        'SELECT id FROM support_conversations WHERE id = ? LIMIT 1 FOR UPDATE',
        [id],
      )
      if (!Array.isArray(rows) || rows.length === 0) return false
      await query(
        "INSERT INTO support_messages (conversation_id, sender_type, sender_user_id, content) VALUES (?, 'admin', ?, ?)",
        [id, req.userId, content],
      )
      await query(
        `UPDATE support_conversations
         SET status = 'open', customer_unread_count = customer_unread_count + 1, last_message_at = NOW()
         WHERE id = ?`,
        [id],
      )
      return true
    })
    if (!result) { res.status(404).json({ message: 'Support conversation not found.' }); return }
    const [[customer]] = await pool.query<any[]>(
      `SELECT c.guest_email, c.guest_name, u.email AS user_email,
              COALESCE(NULLIF(u.display_name, ''), NULLIF(u.username, ''), c.guest_name, 'there') AS customer_name
       FROM support_conversations c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = ? LIMIT 1`,
      [id],
    ).catch(() => [[null]] as any)
    let emailSent = false
    const toEmail = String(customer?.user_email ?? customer?.guest_email ?? '')
    if (toEmail) {
      try {
        emailSent = await sendSupportReplyEmail({
          toEmail,
          toName: String(customer?.customer_name ?? 'there'),
          preview: content.slice(0, 300),
        })
      } catch (emailError: any) {
        console.warn('[support/reply-email]', emailError?.message ?? emailError)
      }
    }
    res.status(201).json({ success: true, emailSent })
  } catch (error: any) {
    console.error('[support/admin-message]', error?.message ?? error)
    res.status(500).json({ message: 'Could not send the support reply.' })
  }
})

router.patch('/support/admin/conversations/:id/status', requireAuth, async (req: AuthRequest, res) => {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required.' }); return }
  const pool = getPool()
  const id = positiveId(req.params.id)
  const status = req.body?.status
  if (!pool) { res.status(503).json({ message: 'Database not configured' }); return }
  if (!id) { res.status(400).json({ message: 'Invalid support conversation.' }); return }
  if (status !== 'open' && status !== 'resolved') { res.status(400).json({ message: 'Choose open or resolved.' }); return }
  try {
    const [result] = await pool.query<any>(
      'UPDATE support_conversations SET status = ? WHERE id = ?',
      [status, id],
    )
    if (Number((result as any)?.affectedRows ?? 0) === 0) {
      const [[row]] = await pool.query<any[]>('SELECT id FROM support_conversations WHERE id = ? LIMIT 1', [id])
      if (!row) { res.status(404).json({ message: 'Support conversation not found.' }); return }
    }
    res.json({ success: true, status })
  } catch (error: any) {
    console.error('[support/status]', error?.message ?? error)
    res.status(500).json({ message: 'Could not update support status.' })
  }
})

export default router
