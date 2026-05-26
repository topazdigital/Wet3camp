import type { Response } from 'express'

const clients = new Map<number, Set<Response>>()

export interface MessagePush {
  id: number
  escortId: number
  escortName: string
  escortImage: string
  content: string
  fromEscort: boolean
  createdAt: string
}

export function addMessageClient(userId: number, res: Response) {
  if (!clients.has(userId)) clients.set(userId, new Set())
  clients.get(userId)!.add(res)
  res.on('close', () => {
    clients.get(userId)?.delete(res)
    if (clients.get(userId)?.size === 0) clients.delete(userId)
  })
}

export function broadcastToUser(userId: number, event: MessagePush) {
  const bucket = clients.get(userId)
  if (!bucket) return
  const payload = `data: ${JSON.stringify(event)}\n\n`
  for (const r of bucket) {
    try { r.write(payload) } catch { bucket.delete(r) }
  }
}
