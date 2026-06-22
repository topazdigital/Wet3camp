import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Users, Star, Eye, Radio, Zap, CheckCircle2, Lock, Gift, Share2 } from 'lucide-react'
import { Link } from 'wouter'
import { useSEO } from '@/lib/useSEO'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'

const TIER_COLORS: Record<string, string> = { elite: '#8B0000', vip: '#FF4500', premium: '#B8860B' }

function fakeViewers(id: string | number) {
  const n = typeof id === 'string' ? parseInt(id, 10) || 1 : id
  return Math.floor(((n * 137 + 31) % 2000) + 80)
}

export default function LivePage() {
  useSEO({
    title: 'Live Escorts Kenya — Watch Live Now',
    description: 'Watch live from verified escorts in Kenya. Real-time from elite, VIP and premium escorts in Nairobi, Mombasa and beyond.',
    keywords: 'live escort Kenya, escort live stream Nairobi, escort webcam Kenya',
    canonicalPath: '/live',
  })

  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const [streams, setStreams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isGoingLive, setIsGoingLive] = useState(false)
  const [liveTitle, setLiveTitle] = useState('')
  const [startingLive, setStartingLive] = useState(false)
  const [liveError, setLiveError] = useState('')

  const isEscort = user?.role === 'escort'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''

  useEffect(() => {
    const load = () => {
      fetch('/api/live')
        .then(r => r.json())
        .then(d => { setStreams(Array.isArray(d) ? d : []); setLoading(false) })
        .catch(() => setLoading(false))
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'hot'
    ? streams.filter(s => ['elite', 'vip'].includes(s.tier?.toLowerCase() ?? ''))
    : streams

  const totalViewers = streams.reduce((s, l) => s + (l.viewerCount || fakeViewers(l.id)), 0)

  async function startGoLive() {
    if (startingLive) return
    setStartingLive(true)
    setLiveError('')
    try {
      const res = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: liveTitle || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to start stream')
      window.location.href = `/live/${data.escortId}?broadcast=true`
    } catch (e: any) {
      setLiveError(e.message)
      setStartingLive(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        <main className="w-full">
          {/* Banner */}
          <div className="px-3 sm:px-5 py-4 bg-gradient-to-r from-[#1a0000] via-[#8B0000]/20 to-[#1a0000] border-b border-[#8B0000]/30">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#E91E63] px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold text-white">LIVE NOW</span>
                </div>
                <div>
                  <h1 className="text-lg font-black text-text-light">
                    {loading ? '…' : streams.length} Escorts Live
                  </h1>
                  <p className="text-xs text-text-muted">
                    {loading ? 'Loading…' : `${totalViewers.toLocaleString()} viewers watching right now`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['all', 'hot'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted hover:text-text-light'}`}
                  >
                    {f === 'hot' && <Zap size={11} />}
                    {f === 'all' ? 'All Live' : 'Hot 🔥'}
                  </button>
                ))}
                {isEscort && (
                  <button
                    onClick={() => setIsGoingLive(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E91E63] hover:bg-[#c2185b] text-white rounded-full text-xs font-bold transition-colors"
                  >
                    <Radio size={12} /> Go Live
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Go Live modal */}
          {isGoingLive && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card-bg border border-[#8B0000]/40 rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#E91E63]/20 flex items-center justify-center">
                    <Radio size={16} className="text-[#E91E63]" />
                  </div>
                  <h3 className="text-base font-bold text-text-light">Go Live</h3>
                </div>
                <p className="text-xs text-text-muted mb-4">Start a live stream and let thousands of clients discover you in real time.</p>
                <input
                  value={liveTitle}
                  onChange={e => setLiveTitle(e.target.value)}
                  placeholder="Stream title (optional)"
                  className="w-full bg-dark-bg border border-color rounded-xl px-3 py-2.5 text-sm text-text-light placeholder:text-text-muted outline-none focus:border-[#8B0000]/60 mb-3"
                />
                {liveError && <p className="text-xs text-red-400 mb-3">{liveError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsGoingLive(false)}
                    className="flex-1 py-2.5 border border-color rounded-xl text-sm text-text-muted hover:text-text-light transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startGoLive}
                    disabled={startingLive}
                    className="flex-1 py-2.5 bg-[#E91E63] hover:bg-[#c2185b] disabled:opacity-60 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    {startingLive ? (
                      <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Starting…</>
                    ) : (
                      <><Radio size={13} /> Start Streaming</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 px-3 sm:px-5 py-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden aspect-[3/4] bg-card-bg animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <Radio size={48} className="text-[#8B0000]/30 mb-4" />
              <h2 className="text-lg font-bold text-text-light mb-2">No Escorts Live Right Now</h2>
              <p className="text-sm text-text-muted max-w-xs">Check back later — escorts go live throughout the day. Browse profiles to follow your favourites.</p>
              <Link href="/" className="mt-5 px-5 py-2.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors">Browse Escorts</Link>
            </div>
          )}

          {/* Live grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 px-3 sm:px-5 py-4">
              {filtered.map(stream => {
                const viewers = stream.viewerCount || fakeViewers(stream.id)
                const isHot = ['elite', 'vip'].includes(stream.tier?.toLowerCase() ?? '')
                const elapsed = stream.startedAt ? Math.floor((Date.now() - stream.startedAt) / 60000) : 0
                return (
                  <Link key={stream.id} href={`/live/${stream.escortId || stream.id}`} className="group cursor-pointer block">
                    <div className="relative rounded-xl overflow-hidden aspect-[3/4] mb-2 border border-color group-hover:border-[#E91E63]/60 transition-all">
                      {stream.image
                        ? <img src={stream.image} alt={stream.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" loading="lazy" />
                        : <div className="w-full h-full bg-gradient-to-br from-[#1a0000] to-[#2a1a1a] flex items-center justify-center text-5xl font-black text-[#8B0000]/30">{(stream.name || '?')[0]}</div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#E91E63] px-2 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-white">LIVE</span>
                      </div>

                      {isHot && (
                        <div className="absolute top-2 right-2 bg-[#FF4500] px-1.5 py-0.5 rounded-full">
                          <span className="text-[8px] font-bold text-white">🔥 HOT</span>
                        </div>
                      )}

                      {stream.isLocked && (
                        <div className="absolute top-2 right-2 bg-[#FFD700]/20 border border-[#FFD700]/40 px-1.5 py-0.5 rounded-full">
                          <Lock size={9} className="text-[#FFD700]" />
                        </div>
                      )}

                      <div className="absolute bottom-12 right-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full">
                        <Eye size={9} className="text-white/80" />
                        <span className="text-[9px] text-white font-medium">{viewers.toLocaleString()}</span>
                      </div>

                      {elapsed > 0 && (
                        <div className="absolute bottom-12 left-2 bg-black/60 px-1.5 py-0.5 rounded-full">
                          <span className="text-[9px] text-white/70">{elapsed}m</span>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-white font-bold text-sm leading-tight mb-0.5">{stream.name}</p>
                        <p className="text-white/70 text-[10px] mb-1.5">{stream.area ?? stream.city}</p>
                        <div className="w-full py-1.5 bg-[#E91E63] text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
                          <Radio size={10} /> Watch Live
                        </div>
                      </div>
                    </div>

                    <div className="px-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-light">{(stream.name || '').split(' ')[0]}</span>
                        {stream.tier && stream.tier !== 'standard' && (
                          <span className="text-[10px] font-bold" style={{ color: TIER_COLORS[stream.tier] ?? '#555' }}>{stream.tier.toUpperCase()}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted truncate mt-0.5">{stream.title || `${stream.name} Live`}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* CTA */}
          {!loading && (
            <div className="px-5 py-6 text-center border-t border-color mt-2">
              {isEscort ? (
                <div>
                  <p className="text-xs text-text-muted mb-3">Ready to go live? Stream to thousands of clients right now.</p>
                  <button
                    onClick={() => setIsGoingLive(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E91E63] text-white text-sm font-bold rounded-xl hover:bg-[#c2185b] transition-colors"
                  >
                    <Radio size={14} /> Start Your Live Stream
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-text-muted mb-3">Are you an escort? Go live and get discovered by thousands of clients.</p>
                  <Link href="/register?role=escort" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E91E63] text-white text-sm font-bold rounded-xl hover:bg-[#c2185b] transition-colors">
                    <Radio size={14} /> Start Going Live
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
