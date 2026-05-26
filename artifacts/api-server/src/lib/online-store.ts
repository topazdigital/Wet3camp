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

export async function seedOnlineFromDb(pool: { query: Function }) {
  try {
    const [rows] = await pool.query(
      "SELECT id FROM escorts WHERE is_active = 1 AND online = 1 LIMIT 500"
    )
    for (const row of (rows as any[])) onlineEscorts.add(Number(row.id))
    if ((rows as any[]).length > 0) broadcast()
  } catch {}
}
