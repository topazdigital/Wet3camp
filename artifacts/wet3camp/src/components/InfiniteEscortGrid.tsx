import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Star, Heart, MapPin, CheckCircle2 } from 'lucide-react'
import { Link } from 'wouter'

interface Escort {
  id: number; name: string; location: string; city: string; rating: number
  reviews: number; image: string; tier: 'free' | 'standard' | 'premium' | 'vip' | 'elite'
  price: number; available: boolean
}

const NAMES = ['Amara','Zara','Luna','Sofia','Priya','Fatuma','Jasmine','Mercy','Nadia','Elena','Victoria','Aisha','Grace','Chloe','Lena','Diana','Tasha','Monica','Sharon','Kezia','Ruth','Esther','Lydia','Gloria','Faith','Joy','Precious','Blessing','Angel','Hope']

const mockEscorts: Escort[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: NAMES[i % NAMES.length],
  location: ['Nairobi CBD','Westlands','Karen','Kilimani','South B','Lavington','Parklands','Upperhill','Langata','Gigiri'][i % 10],
  city: ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret'][i % 5],
  rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
  reviews: 40 + Math.floor(Math.random() * 250),
  image: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  ][i % 8] + '?w=300&h=400&fit=crop',
  tier: ['free','standard','premium','vip','elite'][i % 5] as Escort['tier'],
  price: [1500,2500,4000,6500,9000][i % 5],
  available: Math.random() > 0.3,
}))

const TIER_STYLE: Record<string, { bg: string; label: string }> = {
  elite:    { bg: '#8B0000', label: 'Elite'    },
  vip:      { bg: '#FF4500', label: 'VIP'      },
  premium:  { bg: '#B8860B', label: 'Premium'  },
  standard: { bg: '#3a6da8', label: 'Standard' },
  free:     { bg: '#555',    label: 'Free'     },
}

const PER_PAGE = 24

export default function InfiniteEscortGrid({ activeCategory = 'all' }: { activeCategory?: string }) {
  const [escorts, setEscorts] = useState<Escort[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [liked, setLiked] = useState<Set<number>>(new Set())
  const observerTarget = useRef<HTMLDivElement>(null)

  const filtered = mockEscorts.filter(e => {
    if (activeCategory === 'all')       return true
    if (activeCategory === 'available') return e.available
    if (['elite','vip','premium'].includes(activeCategory)) return e.tier === activeCategory
    if (['nairobi','mombasa','kisumu','nakuru'].includes(activeCategory)) return e.city.toLowerCase() === activeCategory
    return true
  })

  useEffect(() => {
    setEscorts(filtered.slice(0, PER_PAGE))
    setHasMore(filtered.length > PER_PAGE)
  }, [activeCategory])

  const fetchMore = useCallback(() => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    setTimeout(() => {
      const next = filtered.slice(escorts.length, escorts.length + PER_PAGE)
      if (next.length === 0) setHasMore(false)
      else setEscorts(prev => [...prev, ...next])
      setIsLoading(false)
    }, 400)
  }, [escorts.length, hasMore, isLoading, filtered])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) fetchMore()
    }, { threshold: 0.1 })
    if (observerTarget.current) obs.observe(observerTarget.current)
    return () => { if (observerTarget.current) obs.unobserve(observerTarget.current) }
  }, [hasMore, isLoading, fetchMore])

  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation()
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 px-3 sm:px-5 py-3">
        {escorts.map(escort => {
          const tier = TIER_STYLE[escort.tier]
          return (
            <Link href={`/profile/${escort.id}`} key={escort.id} className="group">
              <div className="bg-card-bg rounded-xl overflow-hidden border border-color hover:border-[#8B0000]/50 hover:shadow-lg hover:shadow-[#8B0000]/10 transition-all duration-200">
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <img
                    src={escort.image}
                    alt={escort.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ backgroundColor: tier.bg }}>
                    {tier.label}
                  </div>

                  <div className={`absolute top-2 right-7 w-2 h-2 rounded-full border border-card-bg ${escort.available ? 'bg-[#28a745]' : 'bg-gray-500'}`} />

                  <button
                    onClick={e => toggleLike(e, escort.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all"
                  >
                    <Heart size={11} className={liked.has(escort.id) ? 'text-[#E91E63] fill-[#E91E63]' : 'text-white'} />
                  </button>

                  {/* Hover Book Button */}
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full py-1.5 bg-[#8B0000] text-white text-[10px] font-bold rounded-lg hover:bg-[#a00000] transition-colors">
                      Book — KES {escort.price.toLocaleString()}/hr
                    </button>
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-text-light text-sm truncate">{escort.name}</h3>
                    <CheckCircle2 size={12} className="text-[#28a745] flex-shrink-0" fill="#28a745" />
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin size={10} className="text-text-muted flex-shrink-0" />
                    <p className="text-[10px] text-text-muted truncate">{escort.location}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="fill-[#FFD700] text-[#FFD700]" />
                      <span className="text-[10px] font-bold text-text-light">{escort.rating}</span>
                      <span className="text-[9px] text-text-muted">({escort.reviews})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#FFD700]">KES {(escort.price / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-6">
          {isLoading && (
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <div className="w-4 h-4 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin" />
              Loading more…
            </div>
          )}
        </div>
      )}

      {!hasMore && escorts.length > 0 && (
        <div className="text-center py-6 text-text-muted text-xs">
          — All {escorts.length} profiles shown —
        </div>
      )}
    </div>
  )
}
