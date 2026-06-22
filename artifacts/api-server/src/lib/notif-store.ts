import type { Response } from 'express'

const clients = new Map<number, Set<Response>>()

export function addNotifClient(userId: number, res: Response): void {
  if (!clients.has(userId)) clients.set(userId, new Set())
  clients.get(userId)!.add(res)
  res.on('close', () => {
    clients.get(userId)?.delete(res)
    if (clients.get(userId)?.size === 0) clients.delete(userId)
  })
}

export function pushNotification(userId: number, notif: {
  id: string; type: string; text: string; link: string; dot: string; avatar?: string | null; read: boolean; time: string
}): void {
  const bucket = clients.get(userId)
  if (!bucket) return
  const payload = `data: ${JSON.stringify(notif)}\n\n`
  for (const r of bucket) {
    try { r.write(payload) } catch { bucket.delete(r) }
  }
}

export function pushNotificationToMany(userIds: number[], notif: Parameters<typeof pushNotification>[1]): void {
  for (const uid of userIds) pushNotification(uid, notif)
}
