import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Star, Heart, MapPin, CheckCircle2, UserPlus, UserCheck } from 'lucide-react'
import { Link } from 'wouter'
import { Escort, generateMoreEscorts } from '@/data/escorts'
import { useAllEscorts } from '@/hooks/useEscorts'
import { useFollow } from '@/lib/follow-context'
import { useAuth } from '@/lib/auth-context'
import { useFavorites } from '@/lib/favorites-context'
import { useOnlineStatus } from '@/lib/use-online-status'

const TIER_STYLE: Record<string, { bg: string; label: string }> = {
  Elite:   { bg: '#8B0000', label: 'Elite'   },
  VIP:     { bg: '#FF4500', label: 'VIP'     },
  Premium: { bg: '#B8860B', label: 'Premium' },
}

const TIER_RANK: Record<string, number> = {
  elite: 1, vip: 2, premium: 3, standard: 99, free: 99,
}

function sortEscorts(escorts: Escort[]): Escort[] {
  return [...escorts].sort((a, b) => {
    const ra = TIER_RANK[a.tier] ?? 99
    const rb = TIER_RANK[b.tier] ?? 99
    if (ra !== rb) return ra - rb
    if (ra <= 3) return b.rating - a.rating
    const aNum = parseInt(a.id.replace(/\D/g, '')) || 0
    const bNum = parseInt(b.id.replace(/\D/g, '')) || 0
    return bNum - aNum
  })
}

const PER_PAGE = 24

export default function InfiniteEscortGrid({
  activeCategory = 'all',
  priorityCity = 'Nairobi',
}: {
  activeCategory?: string
  priorityCity?: string
}) {
  const { isFollowing, toggleFollow } = useFollow()
  const { isLoggedIn } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isOnline } = useOnlineStatus()

  const { escorts: apiEscorts, fromApi } = useAllEscorts()

  const allEscorts = React.useMemo(() => {
    let base: Escort[]
    if (fromApi) {
      base = apiEscorts as unknown as Escort[]
    } else {
      const staticBase = [...apiEscorts] as unknown as Escort[]
      const extra = generateMoreEscorts(76)
      base = [...staticBase, ...extra]
    }
    const withCity = base.filter(e => e.city === priorityCity)
    const others   = base.filter(e => e.city !== priorityCity)
    return sortEscorts([...withCity, ...others])
  }, [apiEscorts, fromApi, priorityCity])

  const filtered = React.useMemo(() => {
    if (activeCategory === 'all')       return allEscorts
    if (activeCategory === 'available') return allEscorts.filter(e => e.available)
    const cat = activeCategory.toLowerCase()
    if (['elite','vip','premium'].includes(cat)) return allEscorts.filter(e => e.tier === cat)
    return allEscorts.filter(e => e.city === activeCategory)
  }, [activeCategory, allEscorts])

  const [page, setPage] = useState(0)
  const [shown, setShown] = useState<typeof filtered>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

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
    toggleFavorite(id)
  }

  const handleFollow = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    if (isLoggedIn) toggleFollow(id)
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 px-3 sm:px-5 py-3">
        {shown.map((escort, idx) => {
          const tierKey = escort.tier.charAt(0).toUpperCase() + escort.tier.slice(1)
          const tier = TIER_STYLE[tierKey] ?? null
          const uniqueKey = `${escort.id}-${idx}`
          const following = isFollowing(escort.id)
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {tier && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ backgroundColor: tier.bg }}>
                      {tier.label}
                    </div>
                  )}

                  <div className={`absolute top-2 right-7 w-2 h-2 rounded-full border border-card-bg ${isOnline(escort.id) || escort.available ? 'bg-[#28a745] animate-pulse' : 'bg-gray-500'}`} />

                  <button
                    onClick={e => toggleLike(e, escort.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all"
                  >
                    <Heart size={11} className={isFavorite(escort.id) ? 'text-[#E91E63] fill-[#E91E63]' : 'text-white'} />
                  </button>

                  {/* Hover actions */}
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <div className="flex-1 py-1.5 bg-[#8B0000] text-white text-[9px] font-bold rounded-lg text-center pointer-events-none">
                      View Profile
                    </div>
                    <button
                      onClick={e => handleFollow(e, escort.id)}
                      className={`py-1.5 px-2 text-[9px] font-bold rounded-lg transition-colors flex items-center gap-0.5 ${following ? 'bg-white/20 text-white' : 'bg-white/90 text-black'}`}
                    >
                      {following ? <UserCheck size={10} /> : <UserPlus size={10} />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-text-light text-sm truncate">{escort.name}, {escort.age}</h3>
                    <CheckCircle2 size={12} className="text-[#28a745] flex-shrink-0" fill="#28a745" />
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin size={10} className="text-text-muted flex-shrink-0" />
                    <p className="text-[10px] text-text-muted truncate">{escort.area}, {escort.city}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="fill-[#FFD700] text-[#FFD700]" />
                      <span className="text-[10px] font-bold text-text-light">{escort.rating}</span>
                      <span className="text-[9px] text-text-muted">({escort.reviews})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#FFD700]">KES {(escort.pricing.hourly / 1000).toFixed(0)}k/hr</span>
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

      {!hasMore && shown.length > 0 && (
        <div className="text-center py-6 text-text-muted text-xs">
          — All {shown.length} profiles shown —
        </div>
      )}
    </div>
  )
}
