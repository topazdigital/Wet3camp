import { Router } from 'express'
import { getOnlineEscorts, addSseClient } from '../lib/online-store.js'
import { addMessageClient } from '../lib/message-store.js'
import { addNotifClient } from '../lib/notif-store.js'
import { verifyToken } from '../lib/jwt.js'

const router = Router()

router.get('/events/online', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  res.write(`data: ${JSON.stringify(getOnlineEscorts())}\n\n`)
  addSseClient(res)

  const keep = setInterval(() => { try { res.write(': ping\n\n') } catch { clearInterval(keep) } }, 25000)
  req.on('close', () => clearInterval(keep))
})

router.get('/events/messages', async (req, res) => {
  const raw = req.headers['authorization'] ?? ''
  const qToken = req.query['token'] as string | undefined
  const token = qToken ?? (typeof raw === 'string' ? raw.replace('Bearer ', '') : '')

  if (!token) {
    res.status(401).json({ message: 'token required' })
    return
  }

  let userId: number
  try {
    const payload = await verifyToken(token)
    userId = payload['id'] as number
  } catch {
    res.status(401).json({ message: 'Invalid token' })
    return
  }

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  res.write(': connected\n\n')
  addMessageClient(userId, res)

  const keep = setInterval(() => { try { res.write(': ping\n\n') } catch { clearInterval(keep) } }, 25000)
  req.on('close', () => clearInterval(keep))
})

// Real-time push notifications channel
router.get('/events/notifications', async (req, res) => {
  const raw = req.headers['authorization'] ?? ''
  const qToken = req.query['token'] as string | undefined
  const token = qToken ?? (typeof raw === 'string' ? raw.replace('Bearer ', '') : '')

  if (!token) { res.status(401).json({ message: 'token required' }); return }

  let userId: number
  try {
    const payload = await verifyToken(token)
    userId = payload['id'] as number
  } catch {
    res.status(401).json({ message: 'Invalid token' }); return
  }

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()
  res.write(': connected\n\n')

  addNotifClient(userId, res)

  const keep = setInterval(() => { try { res.write(': ping\n\n') } catch { clearInterval(keep) } }, 25000)
  req.on('close', () => clearInterval(keep))
})

export default router
