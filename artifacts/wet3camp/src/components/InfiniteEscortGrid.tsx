import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Star, Heart, MapPin, CheckCircle2 } from 'lucide-react'
import { Link } from 'wouter'
import { ESCORTS, generateMoreEscorts, sortByLocation } from '@/data/escorts'

const TIER_STYLE: Record<string, { bg: string; label: string }> = {
  Elite:    { bg: '#8B0000', label: 'Elite'    },
  VIP:      { bg: '#FF4500', label: 'VIP'      },
  Premium:  { bg: '#B8860B', label: 'Premium'  },
  Standard: { bg: '#3a6da8', label: 'Standard' },
}

const PER_PAGE = 24

export default function InfiniteEscortGrid({
  activeCategory = 'all',
  priorityCity = 'Nairobi',
}: {
  activeCategory?: string
  priorityCity?: string
}) {
  const allEscorts = React.useMemo(() => {
    const base = sortByLocation(ESCORTS, priorityCity)
    const extra = generateMoreEscorts(76)
    return [...base, ...extra]
  }, [priorityCity])

  const filtered = React.useMemo(() => {
    if (activeCategory === 'all')       return allEscorts
    if (activeCategory === 'available') return allEscorts.filter(e => e.available)
    if (['Elite','VIP','Premium','Standard'].includes(activeCategory)) return allEscorts.filter(e => e.tier === activeCategory)
    return allEscorts.filter(e => e.city === activeCategory)
  }, [activeCategory, allEscorts])

  const [page, setPage] = useState(0)
  const [shown, setShown] = useState<typeof filtered>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const observerTarget = useRef<HTMLDivElement>(null)

  // Reset when filter changes
  useEffect(() => {
    const first = filtered.slice(0, PER_PAGE)
    setShown(first)
    setPage(0)
    setHasMore(filtered.length > PER_PAGE)
  }, [filtered])

  const fetchMore = useCallback(() => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    setTimeout(() => {
      setShown(prev => {
        const next = filtered.slice(prev.length, prev.length + PER_PAGE)
        if (next.length === 0) { setHasMore(false); return prev }
        if (prev.length + next.length >= filtered.length) setHasMore(false)
        return [...prev, ...next]
      })
      setIsLoading(false)
    }, 400)
  }, [isLoading, hasMore, filtered])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) fetchMore()
    }, { threshold: 0.1 })
    if (observerTarget.current) obs.observe(observerTarget.current)
    return () => obs.disconnect()
  }, [hasMore, isLoading, fetchMore])

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 px-3 sm:px-5 py-3">
        {shown.map((escort, idx) => {
          const tier = TIER_STYLE[escort.tier] ?? TIER_STYLE['Standard']
          const uniqueKey = `${escort.id}-${idx}`
          return (
            <Link href={`/profile/${escort.id}`} key={uniqueKey} className="group">
              <div className="bg-card-bg rounded-xl overflow-hidden border border-color hover:border-[#8B0000]/50 hover:shadow-lg hover:shadow-[#8B0000]/10 transition-all duration-200">
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <img
                    src={escort.image}
                    alt={escort.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{backgroundColor:tier.bg}}>
                    {tier.label}
                  </div>

                  <div className={`absolute top-2 right-7 w-2 h-2 rounded-full border border-card-bg ${escort.available?'bg-[#28a745]':'bg-gray-500'}`}/>

                  <button
                    onClick={e => toggleLike(e, escort.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all"
                  >
                    <Heart size={11} className={liked.has(escort.id)?'text-[#E91E63] fill-[#E91E63]':'text-white'}/>
                  </button>

                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full py-1.5 bg-[#8B0000] text-white text-[10px] font-bold rounded-lg hover:bg-[#a00000] transition-colors">
                      Book — KES {escort.pricing.hourly.toLocaleString()}/hr
                    </button>
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-text-light text-sm truncate">{escort.name}, {escort.age}</h3>
                    <CheckCircle2 size={12} className="text-[#28a745] flex-shrink-0" fill="#28a745"/>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin size={10} className="text-text-muted flex-shrink-0"/>
                    <p className="text-[10px] text-text-muted truncate">{escort.area}, {escort.city}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="fill-[#FFD700] text-[#FFD700]"/>
                      <span className="text-[10px] font-bold text-text-light">{escort.rating}</span>
                      <span className="text-[9px] text-text-muted">({escort.reviews})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#FFD700]">KES {(escort.pricing.hourly/1000).toFixed(0)}k</span>
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
              <div className="w-4 h-4 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin"/>
              Loading more…
            </div>
          )}
        </div>
      )}

      {!hasMore && shown.length > 0 && (
        <div className="text-center py-6 text-text-muted text-xs">
          — All {shown.length} profiles shown —
        </div>
      )}
    </div>
  )
}
