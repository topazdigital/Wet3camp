import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Star, Quote, MapPin, CheckCircle2 } from 'lucide-react'
import { Link } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('w3c_token') || localStorage.getItem('auth_token')
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`)
  return data
}

export default function TestimonialsPage() {
  useSEO({
    title: 'Client Testimonials — Wet3 Camp Reviews',
    description: 'Read real testimonials from clients and escorts on Wet3 Camp. Discover why Kenya trusts us for premium escort bookings.',
    keywords: 'Wet3 Camp reviews, escort platform testimonials Kenya, escort booking reviews',
    canonicalPath: '/testimonials',
  })
  const [filter, setFilter]   = useState('All')
  const { isLoggedIn }        = useAuth()
  const [writeOpen, setWriteOpen] = useState(false)
  const [myText, setMyText]   = useState('')
  const [myRating, setMyRating] = useState(5)
  const [myRole, setMyRole]   = useState<'Client' | 'Escort'>('Client')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]     = useState('')
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filter !== 'All') params.set('role', filter)
    setLoading(true)
    fetch(`/api/testimonials?${params}`)
      .then(r => r.json())
      .then(d => { setTestimonials(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter])

  const avgRating = testimonials.length
    ? (testimonials.reduce((s, t) => s + (t.rating || 5), 0) / testimonials.length).toFixed(1)
    : '5.0'

  const handleSubmit = async () => {
    if (myText.length < 20) { setError('Please write at least 20 characters'); return }
    setSubmitting(true); setError('')
    try {
      await apiFetch('/testimonials', {
        method: 'POST',
        body: JSON.stringify({ text: myText, rating: myRating, role: myRole }),
      })
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setWriteOpen(false); setMyText(''); setMyRating(5) }, 3500)
    } catch (e: any) {
      setError(e.message)
    }
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Hero */}
        <div className="w-full relative py-10 px-5 sm:px-12 border-b border-color overflow-hidden text-center" style={{ background: 'linear-gradient(135deg,#8B000015,#FFD70010)' }}>
          <Quote size={40} className="text-[#FFD700]/30 mx-auto mb-3" />
          <h1 className="text-3xl font-black text-text-light mb-2">Real Experiences</h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto">Honest reviews from real clients and escorts on Wet3 Camp.</p>
          <div className="flex items-center justify-center gap-6 mt-5">
            <div className="text-center"><p className="text-2xl font-black text-[#FFD700]">{avgRating}★</p><p className="text-[10px] text-text-muted">Avg Rating</p></div>
            <div className="w-px h-8 bg-color" />
            <div className="text-center"><p className="text-2xl font-black text-text-light">{testimonials.length || '…'}</p><p className="text-[10px] text-text-muted">Reviews</p></div>
            <div className="w-px h-8 bg-color" />
            <div className="text-center"><p className="text-2xl font-black text-[#28a745]">✓</p><p className="text-[10px] text-text-muted">Verified</p></div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-b border-color flex items-center justify-between">
          <div className="flex items-center gap-2">
            {['All', 'Client', 'Escort'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{f}</button>
            ))}
          </div>
          {isLoggedIn && (
            <button onClick={() => setWriteOpen(v => !v)} className="px-4 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold rounded-xl hover:bg-[#FFD700]/20 transition-all">Write a Review</button>
          )}
        </div>

        <div className="px-4 sm:px-6 py-5">
          {/* Write form */}
          {writeOpen && (
            <div className="mb-6 bg-card-bg border border-[#FFD700]/20 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-text-light mb-4">Share Your Experience</h3>
              {submitted ? (
                <div className="flex items-center gap-2 text-[#28a745]"><CheckCircle2 size={16} /> Thank you! Your review is pending approval.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    {(['Client', 'Escort'] as const).map(r => (
                      <button key={r} onClick={() => setMyRole(r)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${myRole === r ? 'bg-[#8B0000] border-[#8B0000] text-white' : 'border-color text-text-muted hover:border-text-muted'}`}>{r}</button>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Your Rating</p>
                    <div className="flex gap-2">{[1, 2, 3, 4, 5].map(i => <button key={i} onClick={() => setMyRating(i)}><Star size={22} className={i <= myRating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} /></button>)}</div>
                  </div>
                  <textarea value={myText} onChange={e => setMyText(e.target.value)} rows={4} placeholder="Share your honest experience on Wet3 Camp…" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all resize-none" />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 bg-[#FFD700] text-black font-bold text-xs rounded-xl hover:bg-[#e6c000] transition-all disabled:opacity-60">
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card-bg border border-color rounded-2xl p-5 animate-pulse">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-dark-bg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-dark-bg rounded w-28" />
                      <div className="h-2.5 bg-dark-bg rounded w-16" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 bg-dark-bg rounded" />
                    <div className="h-2.5 bg-dark-bg rounded w-5/6" />
                    <div className="h-2.5 bg-dark-bg rounded w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && testimonials.length === 0 && (
            <div className="text-center py-16">
              <Quote size={40} className="text-[#FFD700]/20 mx-auto mb-4" />
              <p className="text-sm text-text-muted mb-4">No reviews yet. Be the first to share your experience!</p>
              {!isLoggedIn && (
                <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-all">Join Free & Review</Link>
              )}
            </div>
          )}

          {/* Cards */}
          {!loading && testimonials.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.map(t => (
                <div key={t.id} className="bg-card-bg border border-color rounded-2xl p-5 hover:border-[#FFD700]/30 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {(t.avatar || t.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-text-light text-sm">{t.name}</p>
                        {t.verified && <CheckCircle2 size={12} className="text-[#28a745]" fill="#28a745" />}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${t.role === 'Client' ? 'bg-[#2196F3]/20 text-[#2196F3]' : 'bg-[#8B0000]/20 text-[#8B0000]'}`}>{t.role}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {t.city && <><MapPin size={9} className="text-text-muted" /><span className="text-[10px] text-text-muted">{t.city}</span></>}
                        {t.created_at && <span className="text-[10px] text-text-muted">· {new Date(t.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className={i <= (t.rating || 5) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />)}</div>
                  <p className="text-xs text-text-muted leading-relaxed">{t.text}</p>
                </div>
              ))}
            </div>
          )}

          {!isLoggedIn && (
            <div className="mt-8 text-center p-6 bg-card-bg border border-color rounded-2xl">
              <p className="text-sm font-bold text-text-light mb-2">Want to share your experience?</p>
              <p className="text-xs text-text-muted mb-4">Create an account to leave a review and help the community.</p>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B0000] text-white font-bold text-sm rounded-xl hover:bg-[#a00000] transition-all">Join Free & Review</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
