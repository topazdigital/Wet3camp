import { Router } from 'express'
import { getOnlineEscorts, addSseClient } from '../lib/online-store.js'

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

export default router
