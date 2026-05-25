import type { Response } from 'express'

const onlineEscorts = new Set<number>()
const sseClients   = new Set<Response>()

export function getOnlineEscorts(): number[] {
  return [...onlineEscorts]
}

export function setEscortOnline(escortId: number, online: boolean) {
  online ? onlineEscorts.add(escortId) : onlineEscorts.delete(escortId)
  broadcast()
}

export function addSseClient(res: Response) {
  sseClients.add(res)
  res.on('close', () => sseClients.delete(res))
}

function broadcast() {
  const payload = `data: ${JSON.stringify([...onlineEscorts])}\n\n`
  sseClients.forEach(r => { try { r.write(payload) } catch { sseClients.delete(r) } })
}
