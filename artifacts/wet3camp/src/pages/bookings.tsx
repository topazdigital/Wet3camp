import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useBookings, Booking } from '@/lib/bookings-context'
import { useSEO } from '@/lib/useSEO'
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, XCircle, Loader2, Star, X, Send } from 'lucide-react'
import { Link } from 'wouter'

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  pending:   { bg: '#FFD70020', text: '#FFD700', label: 'Pending',   icon: <Loader2 size={11} className="animate-spin" /> },
  confirmed: { bg: '#28a74520', text: '#28a745', label: 'Confirmed', icon: <CheckCircle2 size={11} /> },
  cancelled: { bg: '#EF444420', text: '#EF4444', label: 'Cancelled', icon: <XCircle size={11} /> },
  completed: { bg: '#6B728020', text: '#9CA3AF', label: 'Completed', icon: <CheckCircle2 size={11} /> },
}

const TIER_COLOR: Record<string, string> = {
  Elite: '#8B0000', VIP: '#FF4500', Premium: '#B8860B',
}

interface ReviewModalProps {
  booking: Booking
  onClose: () => void
  onSubmitted: (escortId: string) => void
}

function ReviewModal({ booking, onClose, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim() || text.trim().length < 20) {
      setError('Please write at least 20 characters in your review.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('w3c_token')
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ escortId: (booking as any).escortId ?? booking.id, rating, text: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Failed to submit review')
      setSuccess(true)
      setTimeout(() => {
        onSubmitted((booking as any).escortId ?? booking.id)
        onClose()
      }, 1800)
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const tierColor = TIER_COLOR[booking.escortTier] ?? '#8B0000'
  const displayRating = hoverRating || rating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-md bg-card-bg border border-color rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-color">
          <h2 className="font-black text-text-light">Rate Your Experience</h2>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-light rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-14 h-14 rounded-full bg-[#28a745]/15 border border-[#28a745]/30 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-[#28a745]" />
            </div>
            <p className="font-bold text-text-light">Review submitted!</p>
            <p className="text-text-muted text-sm">Thank you for your feedback.</p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <img src={booking.escortAvatar} alt={booking.escortName} className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: tierColor + '60' }} />
              <div>
                <p className="font-bold text-text-light text-sm">{booking.escortName}</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: tierColor, background: tierColor + '20' }}>{booking.escortTier}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-2 font-semibold">Your Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={star <= displayRating ? 'text-[#FFD700] fill-[#FFD700]' : 'text-text-muted'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-text-light self-center">
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][displayRating]}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-2 font-semibold">Your Review</p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Share your experience — what went well, what to expect…"
                rows={4}
                className="w-full bg-dark-bg border border-color rounded-xl px-4 py-3 text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]/60 transition-all resize-none"
              />
              <p className="text-[10px] text-text-muted mt-1">{text.length}/500 characters (min 20)</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#EF4444] text-xs bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-3 py-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !text.trim()}
              className="w-full py-3 bg-[#8B0000] hover:bg-[#a00000] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function BookingCard({ b, onCancel, onReview, reviewed }: { b: Booking; onCancel: (id: string) => void; onReview: (b: Booking) => void; reviewed: Set<string> }) {
  const status = STATUS_STYLE[b.status]
  const tierColor = TIER_COLOR[b.escortTier] ?? '#8B0000'
  const dateFormatted = new Date(b.date + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
  const escortId = (b as any).escortId ?? b.id
  const hasReviewed = reviewed.has(escortId)

  return (
    <div className="bg-card-bg border border-color rounded-2xl p-4 hover:border-[#8B0000]/30 transition-all">
      <div className="flex items-start gap-3">
        <img src={b.escortAvatar} alt={b.escortName} className="w-13 h-13 rounded-full object-cover flex-shrink-0 w-12 h-12 border-2" style={{ borderColor: tierColor + '60' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-bold text-text-light text-sm">{b.escortName}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: tierColor, backgroundColor: tierColor + '20' }}>{b.escortTier} · {b.escortCity}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0 text-[10px] font-bold" style={{ color: status.text, backgroundColor: status.bg }}>
              {status.icon} <span className="ml-0.5">{status.label}</span>
            </div>
          </div>

          <div className="space-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Calendar size={11} className="flex-shrink-0" />
              <span>{dateFormatted} at {b.time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock size={11} className="flex-shrink-0" />
              <span>{b.duration} · {b.type === 'incall' ? '🏠 Incall' : '🚗 Outcall'}</span>
            </div>
            {b.location && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <MapPin size={11} className="flex-shrink-0" />
                <span>{b.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-color/50">
            <div>
              <p className="text-[10px] text-text-muted">{b.txRef ? 'Paid' : 'Amount'}</p>
              <p className="text-sm font-black text-[#FFD700]">KES {b.amount.toLocaleString()}</p>
              {b.txRef && <p className="text-[10px] text-[#28a745] font-mono">{b.txRef}</p>}
            </div>
            <div className="flex gap-2">
              {b.status === 'pending' && (
                <button
                  onClick={() => onCancel(b.id)}
                  className="px-3 py-1.5 text-xs font-bold text-[#EF4444] border border-[#EF4444]/30 rounded-lg hover:bg-[#EF4444]/10 transition-all"
                >
                  Cancel
                </button>
              )}
              {b.status === 'completed' && (
                hasReviewed ? (
                  <span className="px-3 py-1.5 text-xs font-bold text-[#28a745] border border-[#28a745]/30 rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={11} /> Reviewed
                  </span>
                ) : (
                  <button
                    onClick={() => onReview(b)}
                    className="px-3 py-1.5 text-xs font-bold text-[#FFD700] border border-[#FFD700]/30 rounded-lg hover:bg-[#FFD700]/10 transition-all flex items-center gap-1"
                  >
                    <Star size={11} /> Review
                  </button>
                )
              )}
              {b.status === 'confirmed' && (
                <Link
                  href="/messages"
                  className="px-3 py-1.5 text-xs font-bold text-[#25D366] border border-[#25D366]/30 rounded-lg hover:bg-[#25D366]/10 transition-all"
                >
                  Message
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookingsPage() {
  useSEO({ title: 'My Bookings', noIndex: true })
  const { bookings, cancelBooking } = useBookings()
  const [tab, setTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming')
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())

  const now = new Date()
  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.date + 'T23:59:59') >= now)
  const pending  = bookings.filter(b => b.status === 'pending')
  const past     = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || (b.status === 'confirmed' && new Date(b.date + 'T23:59:59') < now))

  const lists = { upcoming, pending, past }
  const current = lists[tab]

  const totalSpent = bookings.filter(b => b.txRef).reduce((s, b) => s + b.amount, 0)

  const handleReviewSubmitted = (escortId: string) => {
    setReviewedIds(prev => new Set([...prev, escortId]))
  }

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full min-w-0 pb-24 lg:pb-0 overflow-x-hidden">
        <Header />
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-text-light">My Bookings</h1>
              <p className="text-sm text-text-muted mt-0.5">Manage your companion appointments</p>
            </div>
            <Link href="/" className="px-4 py-2 bg-[#8B0000] text-white text-xs font-bold rounded-xl hover:bg-[#a00000] transition-all">
              + New Booking
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Upcoming',    count: upcoming.length,                                    color: '#28a745' },
              { label: 'Pending',     count: pending.length,                                     color: '#FFD700' },
              { label: 'Completed',   count: bookings.filter(b => b.status === 'completed').length, color: '#8B0000' },
              { label: 'Total Spent', count: `KES ${(totalSpent/1000).toFixed(0)}K`,             color: '#E91E63' },
            ].map(s => (
              <div key={s.label} className="bg-card-bg border border-color rounded-2xl p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
                <p className="text-[10px] text-text-muted leading-tight mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1 p-1 bg-dark-bg rounded-xl border border-color mb-5">
            {[
              { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
              { key: 'pending',  label: 'Pending',  count: pending.length  },
              { key: 'past',     label: 'Past',      count: past.length     },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as 'upcoming' | 'pending' | 'past')}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === t.key ? 'bg-card-bg text-text-light border border-color' : 'text-text-muted hover:text-text-light'}`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-[#8B0000] text-white' : 'bg-dark-bg text-text-muted'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {current.length === 0 ? (
            <div className="text-center py-16 bg-card-bg rounded-2xl border border-color">
              <div className="w-14 h-14 rounded-2xl bg-dark-bg border border-color flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-text-muted" />
              </div>
              <p className="font-bold text-text-light">No {tab} bookings</p>
              <p className="text-text-muted text-sm mt-1">
                {tab === 'upcoming' && 'Book an escort to get started.'}
                {tab === 'pending'  && 'No pending bookings right now.'}
                {tab === 'past'     && 'Your booking history will appear here.'}
              </p>
              {tab !== 'past' && (
                <Link href="/" className="inline-block mt-5 px-6 py-2.5 bg-[#8B0000] text-white font-bold rounded-xl text-sm hover:bg-[#a00000] transition-all">
                  Browse Escorts
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {current.map(b => (
                <BookingCard
                  key={b.id}
                  b={b}
                  onCancel={cancelBooking}
                  onReview={setReviewTarget}
                  reviewed={reviewedIds}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  )
}
