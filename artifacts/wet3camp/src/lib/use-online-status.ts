import { useState, useEffect, useRef } from 'react'

const BASE = '/api'

let sharedOnline = new Set<string>()
const listeners = new Set<(ids: Set<string>) => void>()
let es: EventSource | null = null
let refCount = 0

function connect() {
  if (es) return
  es = new EventSource(`${BASE}/events/online`)
  es.onmessage = (e) => {
    try {
      const ids: number[] = JSON.parse(e.data)
      sharedOnline = new Set(ids.map(String))
      listeners.forEach(fn => fn(sharedOnline))
    } catch {}
  }
  es.onerror = () => {
    es?.close(); es = null
    setTimeout(() => { if (refCount > 0) connect() }, 5000)
  }
}

function disconnect() {
  es?.close(); es = null
}

export function useOnlineStatus() {
  const [online, setOnline] = useState<Set<string>>(sharedOnline)

  useEffect(() => {
    refCount++
    const fn = (ids: Set<string>) => setOnline(new Set(ids))
    listeners.add(fn)
    connect()
    return () => {
      listeners.delete(fn)
      refCount--
      if (refCount === 0) disconnect()
    }
  }, [])

  return {
    isOnline: (id: string) => online.has(id),
    onlineIds: online,
  }
}
