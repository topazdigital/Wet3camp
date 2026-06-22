import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Play, Lock, Eye, Clock, Zap, Crown, Video } from 'lucide-react'
import { Link } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'

const CATS = ['All', 'Free', 'Premium', 'VIP', 'Elite']
const tierStyle: Record<string, { bg: string; label: string }> = {
  elite:   { bg: '#8B0000', label: 'ELITE' },
  vip:     { bg: '#FF4500', label: 'VIP' },
  premium: { bg: '#B8860B', label: 'PREMIUM' },
  free:    { bg: '#28a745', label: 'FREE' },
}

export default function VideosPage() {
  useSEO({
    title: 'Escort Videos Kenya',
    description: 'Watch exclusive escort videos in Kenya. Content from verified escorts in Nairobi and Mombasa.',
    keywords: 'escort videos Kenya, escort video content Nairobi',
    canonicalPath: '/videos',
  })
  const [cat, setCat] = useState('All')
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isLoggedIn } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams()
    if (cat !== 'All') params.set('cat', cat)
    setLoading(true)
    fetch(`/api/escort-videos?${params}`)
      .then(r => r.json())
      .then(d => { setVideos(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cat])

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />
        <div className="w-full relative h-40 border-b border-color overflow-hidden flex items-end" style={{ background: 'linear-gradient(135deg,#E91E6320,#8B000020)' }}>
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2"><Play size={13} className="text-[#E91E63]" /><span className="text-xs text-[#E91E63] font-bold uppercase tracking-widest">Exclusive Videos</span></div>
            <h1 className="text-3xl font-black text-text-light">Escort Videos</h1>
            <p className="text-sm text-text-muted mt-1">Exclusive content from our verified escort community.</p>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 bg-gradient-to-r from-[#8B0000]/20 to-[#FFD700]/10 border border-[#8B0000]/30 rounded-2xl flex items-center gap-3">
            <Crown size={20} className="text-[#FFD700] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-text-light">Unlock Premium Videos</p>
              <p className="text-xs text-text-muted">Sign up to access exclusive escort content and unlock VIP/Elite videos</p>
            </div>
            <Link href="/register" className="px-4 py-2 bg-[#8B0000] text-white text-xs font-bold rounded-xl hover:bg-[#a00000] transition-all flex-shrink-0">Join Free</Link>
          </div>
        )}

        <div className="px-4 sm:px-6 py-3 border-b border-color">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CATS.map(c => <button key={c} onClick={() => setCat(c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${cat === c ? 'bg-[#E91E63] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card-bg border border-color rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-dark-bg" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-3 bg-dark-bg rounded" />
                    <div className="h-2.5 bg-dark-bg rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Video size={48} className="text-[#E91E63]/30 mb-4" />
              <h2 className="text-lg font-bold text-text-light mb-2">No Videos Yet</h2>
              <p className="text-sm text-text-muted max-w-xs mb-5">
                Escorts will upload exclusive video content as they join the platform. Check back soon!
              </p>
              <Link href="/register?role=escort" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E91E63] text-white text-sm font-bold rounded-xl hover:bg-[#c2185b] transition-all">
                <Zap size={14} /> Upload Your Videos
              </Link>
            </div>
          )}

          {/* Videos grid */}
          {!loading && videos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {videos.map(v => {
                const ts = tierStyle[v.tier] ?? tierStyle.free
                return (
                  <div key={v.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#E91E63]/40 transition-all group cursor-pointer">
                    <div className="relative aspect-video overflow-hidden">
                      {v.thumbnail
                        ? <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full bg-gradient-to-br from-[#1a0000] to-[#2a1a1a] flex items-center justify-center"><Play size={24} className="text-[#E91E63]/40" /></div>
                      }
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                        {v.is_locked && !isLoggedIn
                          ? <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center border border-white/20"><Lock size={16} className="text-white" /></div>
                          : <div className="w-10 h-10 rounded-full bg-[#E91E63]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={16} className="text-white" /></div>
                        }
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ backgroundColor: ts.bg }}>{ts.label}</div>
                      {v.duration && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/70 rounded-md">
                          <Clock size={9} className="text-white" />
                          <span className="text-[9px] text-white ml-0.5">{v.duration}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-text-light leading-snug mb-1 line-clamp-2">{v.title}</p>
                      <p className="text-[10px] text-text-muted mb-1.5">{v.escort_name}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                          <Eye size={9} />
                          {v.view_count >= 1000 ? `${(v.view_count / 1000).toFixed(1)}k` : v.view_count}
                        </span>
                        {v.is_locked && v.price_kes > 0
                          ? <span className="text-[10px] font-bold text-[#FFD700]">KES {Number(v.price_kes).toLocaleString()}</span>
                          : <span className="text-[10px] font-bold text-[#28a745]">Free</span>
                        }
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
