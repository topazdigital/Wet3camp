import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { MapPin, Star, Plane, ChevronRight, CheckCircle2, MessageCircle } from 'lucide-react'
import { Link } from 'wouter'
import { useSEO } from '@/lib/useSEO'
import { getSlug } from '@/data/escorts'

const CITIES = ['All', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Diani']
const TIER_COLORS: Record<string, string> = { elite: '#8B0000', vip: '#FF4500', premium: '#B8860B' }
const TIER_BADGE: Record<string, { bg: string; text: string }> = {
  elite:   { bg: '#8B000060', text: '#FF6B6B' },
  vip:     { bg: '#FF450060', text: '#FF8C00' },
  premium: { bg: '#B8860B60', text: '#FFD700' },
}

export default function ToursPage() {
  useSEO({
    title: 'Travel Escort Tours Kenya — Outcall Escorts',
    description: 'Book travel escorts and escort tours across Kenya and East Africa. Nairobi, Mombasa, Zanzibar and beyond.',
    keywords: 'escort tours Kenya, travel escort Nairobi, outcall escort Kenya',
    canonicalPath: '/tours',
  })
  const [city, setCity] = useState('All')
  const [escorts, setEscorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (city !== 'All') params.set('city', city)
    setLoading(true)
    fetch(`/api/tours?${params}`)
      .then(r => r.json())
      .then(d => { setEscorts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [city])

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        <div className="w-full relative h-40 border-b border-color overflow-hidden flex items-end" style={{ background: 'linear-gradient(135deg,#9C27B020,#8B000020)' }}>
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2">
              <Plane size={13} className="text-[#9C27B0]" />
              <span className="text-xs text-[#9C27B0] font-bold uppercase tracking-widest">Travel & Tours</span>
            </div>
            <h1 className="text-3xl font-black text-text-light">Escorted Tours</h1>
            <p className="text-sm text-text-muted mt-1">Travel Kenya and beyond with a verified outcall escort by your side</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-[#9C27B0]/10 border border-[#9C27B0]/20 rounded-2xl text-xs text-text-muted">
          <span className="font-bold text-[#9C27B0]">How it works:</span> These escorts offer outcall / travel companion services. Contact them directly via their profile to discuss tour packages, rates, and availability.
        </div>

        {/* City filter */}
        <div className="px-4 sm:px-6 py-3 border-b border-color">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <MapPin size={13} className="text-text-muted flex-shrink-0" />
            {CITIES.map(c => (
              <button key={c} onClick={() => setCity(c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${city === c ? 'bg-[#9C27B0] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card-bg border border-color rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-dark-bg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-dark-bg rounded w-3/4" />
                    <div className="h-3 bg-dark-bg rounded w-1/2" />
                    <div className="h-8 bg-dark-bg rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && escorts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Plane size={48} className="text-[#9C27B0]/30 mb-4" />
              <h2 className="text-lg font-bold text-text-light mb-2">No Travel Escorts Available</h2>
              <p className="text-sm text-text-muted max-w-xs mb-5">
                No escorts currently listed with outcall / travel services {city !== 'All' ? `in ${city}` : ''}. Try a different city or check back later.
              </p>
              <Link href="/" className="px-5 py-2.5 bg-[#9C27B0] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all">
                Browse All Escorts
              </Link>
            </div>
          )}

          {/* Escort cards */}
          {!loading && escorts.length > 0 && (
            <>
              <p className="text-xs text-text-muted mb-4">{escorts.length} escorts available for travel</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {escorts.map(e => {
                  const badge = TIER_BADGE[e.tier?.toLowerCase() ?? ''] ?? null
                  return (
                    <div key={e.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#9C27B0]/50 hover:shadow-lg hover:shadow-[#9C27B0]/10 transition-all group">
                      <div className="relative h-52 overflow-hidden">
                        {e.image
                          ? <img src={e.image} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full bg-gradient-to-br from-[#1a0000] to-[#2a1a1a] flex items-center justify-center text-6xl font-black text-[#8B0000]/20">{(e.name || '?')[0]}</div>
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        {badge && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-full" style={{ background: badge.bg, color: badge.text }}>
                            {(e.tier ?? '').toUpperCase()}
                          </div>
                        )}
                        {e.verified && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-[#28a745]/80 text-white text-[10px] font-bold rounded-full">
                            <CheckCircle2 size={9} /> Verified
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3">
                          <p className="text-white font-black text-base">{e.name}{e.age ? `, ${e.age}` : ''}</p>
                          <div className="flex items-center gap-1 text-white/70 text-[11px]">
                            <MapPin size={9} /> {e.area ?? e.city}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        {e.bio && <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-3">{e.bio}</p>}

                        <div className="flex items-center gap-3 mb-3">
                          <span className="flex items-center gap-0.5"><Star size={11} className="fill-[#FFD700] text-[#FFD700]" /><span className="text-xs font-bold text-text-light ml-0.5">{e.rating ?? 'New'}</span></span>
                          <div className="flex gap-1.5">
                            {e.incall && <span className="px-2 py-0.5 bg-[#9C27B0]/10 border border-[#9C27B0]/20 text-[9px] text-[#9C27B0] rounded-full font-bold">Incall</span>}
                            {e.outcall && <span className="px-2 py-0.5 bg-[#9C27B0]/20 border border-[#9C27B0]/30 text-[9px] text-[#9C27B0] rounded-full font-bold">Outcall ✈</span>}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/@${getSlug(e.name)}`} className="flex-1 py-2.5 bg-gradient-to-r from-[#9C27B0] to-[#7B1FA2] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5">
                            View Profile <ChevronRight size={13} />
                          </Link>
                          <Link href={`/messages?to=${e.id}`} className="px-3 py-2.5 bg-card-bg border border-color text-text-muted rounded-xl hover:border-[#9C27B0] hover:text-[#9C27B0] transition-all">
                            <MessageCircle size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
