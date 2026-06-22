import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Users, Star, Eye, Radio, Zap, CheckCircle2, MessageCircle } from 'lucide-react'
import { Link } from 'wouter'
import { useSEO } from '@/lib/useSEO'

const TIER_COLORS: Record<string, string> = { elite: '#8B0000', vip: '#FF4500', premium: '#B8860B' }

// Deterministic pseudo-viewer count based on escort id
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
  const [filter, setFilter] = useState('all')
  const [streams, setStreams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/live')
      .then(r => r.json())
      .then(d => { setStreams(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'hot'
    ? streams.filter(s => ['elite', 'vip'].includes(s.tier?.toLowerCase() ?? ''))
    : streams

  const totalViewers = streams.reduce((s, l) => s + fakeViewers(l.id), 0)

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
              </div>
            </div>
          </div>

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

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 px-3 sm:px-5 py-4">
              {filtered.map(stream => {
                const viewers = fakeViewers(stream.id)
                const isHot = ['elite', 'vip'].includes(stream.tier?.toLowerCase() ?? '')
                return (
                  <Link key={stream.id} href={`/profile/${stream.id}`} className="group cursor-pointer block">
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

                      <div className="absolute bottom-12 right-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full">
                        <Eye size={9} className="text-white/80" />
                        <span className="text-[9px] text-white font-medium">{viewers.toLocaleString()}</span>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-white font-bold text-sm leading-tight mb-0.5">{stream.name}</p>
                        <p className="text-white/70 text-[10px] mb-1.5">{stream.area ?? stream.city}</p>
                        <div className="w-full py-1.5 bg-[#E91E63] text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
                          <Radio size={10} /> View Profile
                        </div>
                      </div>
                    </div>

                    <div className="px-0.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-text-light">{(stream.name || '').split(' ')[0]}</span>
                          {stream.verified && <CheckCircle2 size={11} className="text-[#28a745]" fill="#28a745" />}
                        </div>
                        {stream.tier && stream.tier !== 'standard' && (
                          <span className="text-[10px] font-bold" style={{ color: TIER_COLORS[stream.tier] ?? '#555' }}>{stream.tier.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="fill-[#FFD700] text-[#FFD700]" />
                        <span className="text-[10px] text-text-muted">{stream.rating ?? '4.5'} · {stream.city}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* CTA */}
          {!loading && (
            <div className="px-5 py-6 text-center border-t border-color mt-2">
              <p className="text-xs text-text-muted mb-3">Are you an escort? Go live and get discovered by thousands of clients.</p>
              <Link href="/register?role=escort" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E91E63] text-white text-sm font-bold rounded-xl hover:bg-[#c2185b] transition-colors">
                <Radio size={14} /> Start Going Live
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
