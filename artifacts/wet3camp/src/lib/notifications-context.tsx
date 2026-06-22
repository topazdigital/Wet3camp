import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './auth-context'
import { getToken } from './api'

export type NotifType = 'follow' | 'message' | 'featured' | 'booking' | 'system' | 'review' | 'live'

export interface AppNotification {
  id: string
  type: NotifType
  text: string
  time: string
  read: boolean
  link: string
  dot: string
  avatar?: string
}

interface NotificationsCtx {
  notifications: AppNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  addNotification: (n: Omit<AppNotification, 'id' | 'read'>) => void
  refresh: () => void
}

const NotificationsContext = createContext<NotificationsCtx>({
  notifications: [], unreadCount: 0,
  markRead: () => {}, markAllRead: () => {}, addNotification: () => {}, refresh: () => {},
})

const BASE = '/api'

async function apiFetch(path: string, opts?: RequestInit) {
  const t = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (t) headers['Authorization'] = `Bearer ${t}`
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...headers, ...opts?.headers } })
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loaded, setLoaded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return
    try {
      const data = await apiFetch('/notifications')
      if (Array.isArray(data)) {
        setNotifications(data as AppNotification[])
      }
      setLoaded(true)
    } catch {
      setLoaded(true)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([])
      setLoaded(false)
      return
    }
    fetchNotifications()
    timerRef.current = setInterval(fetchNotifications, 30000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLoggedIn])

  // Real-time push via SSE — instant alerts when escort goes live, etc.
  useEffect(() => {
    if (!isLoggedIn) return
    const token = getToken()
    if (!token) return
    const es = new EventSource(`/api/events/notifications?token=${encodeURIComponent(token)}`)
    es.onmessage = (e) => {
      try {
        const notif = JSON.parse(e.data) as AppNotification
        if (!notif?.id) return
        setNotifications(prev => {
          if (prev.find(n => n.id === notif.id)) return prev
          return [{ ...notif, read: false }, ...prev]
        })
      } catch {}
    }
    es.onerror = () => {}
    return () => es.close()
  }, [isLoggedIn])

  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (isLoggedIn) {
      apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {})
    }
  }, [isLoggedIn])

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (isLoggedIn) {
      apiFetch('/notifications/read-all', { method: 'PATCH' }).catch(() => {})
    }
  }, [isLoggedIn])

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'read'>) => {
    const notif: AppNotification = { ...n, id: `n-${Date.now()}`, read: false }
    setNotifications(prev => [notif, ...prev])
  }, [])

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, markRead, markAllRead, addNotification, refresh: fetchNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
