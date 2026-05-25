import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { useAuth } from './auth-context'

export interface Booking {
  id: string
  escortId: string
  escortName: string
  escortAvatar: string
  escortTier: string
  escortCity: string
  date: string
  time: string
  duration: string
  durationHrs: number
  type: 'incall' | 'outcall'
  location?: string
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  amount: number
  txRef?: string
  createdAt: string
}

interface BookingsCtx {
  bookings: Booking[]
  loading: boolean
  requestBooking: (b: Omit<Booking, 'id' | 'status' | 'createdAt'>) => Promise<string>
  cancelBooking: (id: string) => void
  payBooking: (id: string, txRef: string) => void
}

const BookingsContext = createContext<BookingsCtx | null>(null)

function durLabel(hrs: number) {
  if (hrs >= 12) return 'Overnight'
  if (hrs === 1) return '1 Hour'
  return `${hrs} Hours`
}

function mapApiBooking(r: any): Booking {
  const parts = (r.escortArea ?? '').split(', ')
  const city  = parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? ''
  const durationHrs = Number(r.duration) || 1
  return {
    id:           String(r.id),
    escortId:     String(r.escortId),
    escortName:   r.escortName ?? 'Unknown',
    escortAvatar: r.escortImage ?? '',
    escortTier:   'Standard',
    escortCity:   city,
    date:         (r.date ?? '').split('T')[0],
    time:         r.time ?? '',
    duration:     durLabel(durationHrs),
    durationHrs,
    type:         r.type === 'outcall' ? 'outcall' : 'incall',
    location:     r.location ?? undefined,
    notes:        r.notes ?? undefined,
    status:       r.status ?? 'pending',
    amount:       r.amount ?? 0,
    txRef:        r.txRef ?? undefined,
    createdAt:    r.createdAt ?? new Date().toISOString(),
  }
}

const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'bk001', escortId: '1', escortName: 'Amara K.',
    escortAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop',
    escortTier: 'Elite', escortCity: 'Nairobi',
    date: '2026-05-28', time: '8:00 PM', duration: '2 Hours', durationHrs: 2,
    type: 'incall', status: 'confirmed', amount: 16000,
    txRef: 'MPE240524001', createdAt: '2026-05-24T14:00:00Z',
  },
  {
    id: 'bk002', escortId: '2', escortName: 'Zara M.',
    escortAvatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=80&h=80&fit=crop',
    escortTier: 'VIP', escortCity: 'Nairobi',
    date: '2026-06-01', time: '7:00 PM', duration: '1 Hour', durationHrs: 1,
    type: 'outcall', location: 'Westlands, Nairobi', status: 'pending',
    amount: 6500, createdAt: '2026-05-24T10:00:00Z',
  },
  {
    id: 'bk003', escortId: '3', escortName: 'Luna K.',
    escortAvatar: 'https://images.unsplash.com/photo-1509868918748-a554bf5f7e09?w=80&h=80&fit=crop',
    escortTier: 'VIP', escortCity: 'Nairobi',
    date: '2026-05-10', time: '9:00 PM', duration: 'Overnight', durationHrs: 12,
    type: 'incall', status: 'completed', amount: 40000,
    txRef: 'MPE240510002', createdAt: '2026-05-09T18:00:00Z',
  },
]

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return
    setLoading(true)
    api.bookings.list()
      .then(rows => { if (rows.length > 0) setBookings(rows.map(mapApiBooking)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isLoggedIn])

  const requestBooking = useCallback(async (b: Omit<Booking, 'id' | 'status' | 'createdAt'>): Promise<string> => {
    try {
      const res = await api.bookings.create({
        escortId: b.escortId,
        date: b.date,
        time: b.time,
        duration: b.durationHrs,
        type: b.type,
        notes: b.notes,
        location: b.location,
      })
      const booking: Booking = {
        ...b,
        id: String((res as any).id ?? Date.now()),
        status: 'pending',
        createdAt: new Date().toISOString(),
        amount: (res as any).amount ?? b.amount,
      }
      setBookings(prev => [booking, ...prev])
      return booking.id
    } catch {
      const id = 'bk' + Date.now()
      setBookings(prev => [{ ...b, id, status: 'pending', createdAt: new Date().toISOString() }, ...prev])
      return id
    }
  }, [])

  const cancelBooking = useCallback((id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
  }, [])

  const payBooking = useCallback((id: string, txRef: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed', txRef } : b))
  }, [])

  return (
    <BookingsContext.Provider value={{ bookings, loading, requestBooking, cancelBooking, payBooking }}>
      {children}
    </BookingsContext.Provider>
  )
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
