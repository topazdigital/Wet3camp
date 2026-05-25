import React, { createContext, useContext, useState } from 'react'

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
  requestBooking: (b: Omit<Booking, 'id' | 'status' | 'createdAt'>) => string
  cancelBooking: (id: string) => void
  payBooking: (id: string, txRef: string) => void
}

const BookingsContext = createContext<BookingsCtx | null>(null)

const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'bk001',
    escortId: '1',
    escortName: 'Amara K.',
    escortAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
    escortTier: 'Elite',
    escortCity: 'Nairobi',
    date: '2026-05-28',
    time: '8:00 PM',
    duration: '2 Hours',
    durationHrs: 2,
    type: 'incall',
    notes: 'Looking forward to meeting you!',
    status: 'confirmed',
    amount: 16000,
    txRef: 'MPE240524001',
    createdAt: '2026-05-24T14:00:00Z',
  },
  {
    id: 'bk002',
    escortId: '2',
    escortName: 'Zara M.',
    escortAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
    escortTier: 'VIP',
    escortCity: 'Nairobi',
    date: '2026-06-01',
    time: '7:00 PM',
    duration: '1 Hour',
    durationHrs: 1,
    type: 'outcall',
    location: 'Westlands, Nairobi',
    status: 'pending',
    amount: 6500,
    createdAt: '2026-05-24T10:00:00Z',
  },
  {
    id: 'bk003',
    escortId: '3',
    escortName: 'Luna K.',
    escortAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop',
    escortTier: 'VIP',
    escortCity: 'Nairobi',
    date: '2026-05-10',
    time: '9:00 PM',
    duration: 'Overnight',
    durationHrs: 12,
    type: 'incall',
    status: 'completed',
    amount: 40000,
    txRef: 'MPE240510002',
    createdAt: '2026-05-09T18:00:00Z',
  },
  {
    id: 'bk004',
    escortId: '4',
    escortName: 'Sophia N.',
    escortAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop',
    escortTier: 'Premium',
    escortCity: 'Nairobi',
    date: '2026-04-20',
    time: '6:00 PM',
    duration: '3 Hours',
    durationHrs: 3,
    type: 'outcall',
    location: 'Karen, Nairobi',
    status: 'cancelled',
    amount: 12000,
    createdAt: '2026-04-19T12:00:00Z',
  },
]

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS)

  const requestBooking = (b: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    const id = 'bk' + Date.now()
    setBookings(prev => [{ ...b, id, status: 'pending', createdAt: new Date().toISOString() }, ...prev])
    return id
  }

  const cancelBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
  }

  const payBooking = (id: string, txRef: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed', txRef } : b))
  }

  return (
    <BookingsContext.Provider value={{ bookings, requestBooking, cancelBooking, payBooking }}>
      {children}
    </BookingsContext.Provider>
  )
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
