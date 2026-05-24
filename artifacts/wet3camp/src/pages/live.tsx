import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Users, Star, Eye, Radio, Zap, CheckCircle2 } from 'lucide-react'

const LIVE_STREAMS = [
  { id: 1, name: 'Amara K.',  age: 24, location: 'Nairobi CBD', tier: 'elite',   rating: 4.9, viewers: 1247, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop', title: 'Evening Show ✨', hot: true },
  { id: 2, name: 'Zara M.',   age: 22, location: 'Westlands',   tier: 'vip',     rating: 4.8, viewers: 892,  image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop', title: 'Private Chat Available', hot: true },
  { id: 3, name: 'Luna K.',   age: 25, location: 'Karen',       tier: 'premium', rating: 4.7, viewers: 445,  image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop', title: 'Chill & Chat 💋', hot: false },
  { id: 4, name: 'Priya S.',  age: 23, location: 'Lavington',   tier: 'elite',   rating: 4.8, viewers: 2100, image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop', title: 'Book Me Tonight!', hot: true },
  { id: 5, name: 'Fatuma H.', age: 26, location: 'Parklands',   tier: 'premium', rating: 4.5, viewers: 330,  image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop', title: 'New Here 💛', hot: false },
  { id: 6, name: 'Sofia N.',  age: 24, location: 'Kilimani',    tier: 'vip',     rating: 4.6, viewers: 710,  image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop', title: 'Exclusive Stream 🔥', hot: false },
]

const TIER_COLORS: Record<string, string> = { elite: '#8B0000', vip: '#FF4500', premium: '#B8860B' }
const totalViewers = LIVE_STREAMS.reduce((s, l) => s + l.viewers, 0)

export default function LivePage() {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'hot' ? LIVE_STREAMS.filter(s => s.hot) : LIVE_STREAMS

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        <main className="w-full">
          {/* Live Header Banner */}
          <div className="px-3 sm:px-5 py-4 bg-gradient-to-r from-[#1a0000] via-[#8B0000]/20 to-[#1a0000] border-b border-[#8B0000]/30">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#E91E63] px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold text-white">LIVE NOW</span>
                </div>
                <div>
                  <h1 className="text-lg font-black text-text-light">{LIVE_STREAMS.length} Escorts Live</h1>
                  <p className="text-xs text-text-muted">{totalViewers.toLocaleString()} viewers watching right now</p>
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

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 px-3 sm:px-5 py-4">
            {filtered.map(stream => (
              <div key={stream.id} className="group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden aspect-[3/4] mb-2 border border-color group-hover:border-[#E91E63]/60 transition-all">
                  <img src={stream.image} alt={stream.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  {/* LIVE badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#E91E63] px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-white">LIVE</span>
                  </div>

                  {/* Hot badge */}
                  {stream.hot && (
                    <div className="absolute top-2 right-2 bg-[#FF4500] px-1.5 py-0.5 rounded-full">
                      <span className="text-[8px] font-bold text-white">🔥 HOT</span>
                    </div>
                  )}

                  {/* Viewer count */}
                  <div className="absolute bottom-12 right-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full">
                    <Eye size={9} className="text-white/80" />
                    <span className="text-[9px] text-white font-medium">{stream.viewers.toLocaleString()}</span>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white font-bold text-sm leading-tight mb-0.5">{stream.name}</p>
                    <p className="text-white/70 text-[10px] mb-1.5">{stream.title}</p>
                    <button className="w-full py-1.5 bg-[#E91E63] hover:bg-[#c2185b] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Radio size={10} /> Watch Live
                    </button>
                  </div>
                </div>

                <div className="px-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-text-light">{stream.name.split(' ')[0]}</span>
                      <CheckCircle2 size={11} className="text-[#28a745]" fill="#28a745" />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: TIER_COLORS[stream.tier] ?? '#555' }}>{stream.tier.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="fill-[#FFD700] text-[#FFD700]" />
                    <span className="text-[10px] text-text-muted">{stream.rating} · {stream.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
