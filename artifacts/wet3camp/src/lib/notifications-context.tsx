import React, { createContext, useContext, useState, useCallback } from 'react'

export type NotifType = 'follow' | 'message' | 'featured' | 'booking' | 'system' | 'review'

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
}

const NotificationsContext = createContext<NotificationsCtx>({
  notifications: [], unreadCount: 0,
  markRead: () => {}, markAllRead: () => {}, addNotification: () => {},
})

const MOCK_NOTIFS: AppNotification[] = [
  { id: 'n1', type: 'follow',   text: 'John K. started following you',           time: '2m ago',   read: false, link: '/my-profile', dot: '#2196F3',  avatar: undefined },
  { id: 'n2', type: 'message',  text: 'New message from Mike O.: "Are you…"',    time: '8m ago',   read: false, link: '/messages',   dot: '#FFD700',  avatar: undefined },
  { id: 'n3', type: 'featured', text: 'Your featured request has been approved!', time: '1h ago',   read: false, link: '/my-profile', dot: '#28a745',  avatar: undefined },
  { id: 'n4', type: 'follow',   text: 'David L. started following you',           time: '3h ago',   read: true,  link: '/my-profile', dot: '#2196F3',  avatar: undefined },
  { id: 'n5', type: 'review',   text: 'Peter M. left you a 5-star review',        time: '5h ago',   read: true,  link: '/my-profile', dot: '#FFD700',  avatar: undefined },
  { id: 'n6', type: 'booking',  text: 'New contact request from Sarah W.',         time: 'Yesterday',read: true,  link: '/messages',   dot: '#8B0000',  avatar: undefined },
  { id: 'n7', type: 'system',   text: 'Your profile verification was approved',    time: '2d ago',   read: true,  link: '/my-profile', dot: '#28a745',  avatar: undefined },
]

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFS)

  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'read'>) => {
    const notif: AppNotification = { ...n, id: `n-${Date.now()}`, read: false }
    setNotifications(prev => [notif, ...prev])
  }, [])

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
