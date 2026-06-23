import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Star, Heart, MapPin, CheckCircle2, UserPlus, UserCheck } from 'lucide-react'
import { Link } from 'wouter'
import { getSlug } from '@/data/escorts'
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

function sortEscorts(escorts: any[]): any[] {
  return [...escorts].sort((a, b) => {
    const ra = TIER_RANK[a.tier?.toLowerCase()] ?? 99
    const rb = TIER_RANK[b.tier?.toLowerCase()] ?? 99
    if (ra !== rb) return ra - rb
    if (ra <= 3) return (b.rating ?? 0) - (a.rating ?? 0)
    const aNum = parseInt(String(a.id).replace(/\D/g, '')) || 0
    const bNum = parseInt(String(b.id).replace(/\D/g, '')) || 0
    return bNum - aNum
  })
}

const PER_PAGE = 24
const SKELETON_COUNT = 24

function SkeletonCard() {
  return (
    <div className="bg-card-bg rounded-xl overflow-hidden border border-color animate-pulse">
      <div className="aspect-[3/4] bg-dark-bg/60" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 bg-dark-bg/60 rounded w-3/4" />
        <div className="h-2.5 bg-dark-bg/60 rounded w-1/2" />
        <div className="h-2.5 bg-dark-bg/60 rounded w-2/3" />
      </div>
    </div>
  )
}

export default function InfiniteEscortGrid({
  activeCategory = 'all',
  priorityCity = 'Nairobi',
  activeService = '',
}: {
  activeCategory?: string
  priorityCity?: string
  activeService?: string
}) {
  const { isFollowing, toggleFollow } = useFollow()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isOnline } = useOnlineStatus()

  const { escorts: apiEscorts, fromApi, isLoading } = useAllEscorts({ service: activeService || undefined })

  const allEscorts = React.useMemo(() => {
    if (!fromApi) return []
    const withCity = apiEscorts.filter((e: any) => e.city === priorityCity)
    const others   = apiEscorts.filter((e: any) => e.city !== priorityCity)
    return sortEscorts([...withCity, ...others])
  }, [apiEscorts, fromApi, priorityCity])

  const filtered = React.useMemo(() => {
    if (activeCategory === 'all')       return allEscorts
    if (activeCategory === 'available') return allEscorts.filter((e: any) => e.available)
    const cat = activeCategory.toLowerCase()
    if (['elite','vip','premium'].includes(cat)) return allEscorts.filter((e: any) => (e.tier ?? '').toLowerCase() === cat)
    return allEscorts.filter((e: any) => e.city === activeCategory)
  }, [activeCategory, allEscorts])

  const [page, setPage] = useState(0)
  const [shown, setShown] = useState<typeof filtered>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const first = filtered.slice(0, PER_PAGE)
    setShown(first)
    setPage(0)
    setHasMore(filtered.length > PER_PAGE)
  }, [filtered])

  const fetchMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    setTimeout(() => {
      setShown(prev => {
        const next = filtered.slice(prev.length, prev.length + PER_PAGE)
        if (next.length === 0) { setHasMore(false); return prev }
        if (prev.length + next.length >= filtered.length) setHasMore(false)
        return [...prev, ...next]
      })
      setIsLoadingMore(false)
    }, 400)
  }, [isLoadingMore, hasMore, filtered])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) fetchMore()
    }, { threshold: 0.1 })
    if (observerTarget.current) obs.observe(observerTarget.current)
    return () => obs.disconnect()
  }, [hasMore, isLoadingMore, fetchMore])

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    toggleFavorite(id)
  }

  const handleFollow = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    toggleFollow(id)
  }

  // Show skeleton while loading
  if (isLoading || (!fromApi && shown.length === 0)) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 px-3 sm:px-5 py-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (fromApi && filtered.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-text-muted text-sm">No escorts found for this filter.</p>
        <p className="text-text-muted text-xs mt-1">Try a different city or category.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 px-3 sm:px-5 py-3">
        {shown.map((escort: any, idx: number) => {
          const tierKey = (escort.tier ?? '').charAt(0).toUpperCase() + (escort.tier ?? '').slice(1)
          const tier = TIER_STYLE[tierKey] ?? null
          const uniqueKey = `${escort.id}-${idx}`
          const following = isFollowing(escort.id)
          const isOwnEscort = !!(user?.id && escort.user_id && String(escort.user_id) === user.id)
          const profileHref = `/@${getSlug(escort.name)}`
          return (
            <Link href={profileHref} key={uniqueKey} className="group">
              <div className="bg-card-bg rounded-xl overflow-hidden border border-color hover:border-[#8B0000]/50 hover:shadow-lg hover:shadow-[#8B0000]/10 transition-all duration-200">
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  {escort.image ? (
                    <>
                      <img
                        src={escort.image}
                        alt={escort.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        loading={idx < 12 ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={idx < 4 ? 'high' : 'auto'}
                        onError={(ev) => {
                          ev.currentTarget.style.display = 'none'
                          const fb = ev.currentTarget.parentElement?.querySelector<HTMLElement>('.img-fallback')
                          if (fb) fb.style.display = 'flex'
                        }}
                      />
                      <div className="img-fallback w-full h-full absolute inset-0 items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a]" style={{ display: 'none' }}>
                        <span className="text-5xl font-black text-[#8B0000]/60 select-none">{(escort.name || '?').charAt(0).toUpperCase()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a]">
                      <span className="text-5xl font-black text-[#8B0000]/60 select-none">
                        {(escort.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {tier && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ backgroundColor: tier.bg }}>
                      {tier.label}
                    </div>
                  )}

                  <div className={`absolute top-2 w-2 h-2 rounded-full border border-card-bg ${isOnline(escort.id) || escort.available ? 'bg-[#28a745] animate-pulse' : 'bg-gray-500'} ${isOwnEscort ? 'right-2' : 'right-7'}`} />

                  {!isOwnEscort && (
                    <button
                      onClick={e => toggleLike(e, escort.id)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all"
                    >
                      <Heart size={11} className={isFavorite(escort.id) ? 'text-[#E91E63] fill-[#E91E63]' : 'text-white'} />
                    </button>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <div className="flex-1 py-1.5 bg-[#8B0000] text-white text-[9px] font-bold rounded-lg text-center pointer-events-none">
                      {isOwnEscort ? 'My Profile' : 'View Profile'}
                    </div>
                    {!isOwnEscort && (
                      <button
                        onClick={e => handleFollow(e, escort.id)}
                        className={`py-1.5 px-2 text-[9px] font-bold rounded-lg transition-colors flex items-center gap-0.5 ${following ? 'bg-white/20 text-white' : 'bg-white/90 text-black'}`}
                      >
                        {following ? <UserCheck size={10} /> : <UserPlus size={10} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-text-light text-sm truncate">{escort.name}, {escort.age}</h3>
                    {escort.verified && <CheckCircle2 size={12} className="text-[#28a745] flex-shrink-0" fill="#28a745" />}
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin size={10} className="text-text-muted flex-shrink-0" />
                    <p className="text-[10px] text-text-muted truncate">{escort.area}, {escort.city}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="fill-[#FFD700] text-[#FFD700]" />
                      <span className="text-[10px] font-bold text-text-light">{Number(escort.rating || 0).toFixed(1)}</span>
                      <span className="text-[9px] text-text-muted">({escort.reviews ?? 0})</span>
                    </div>
                    {(escort.pricing?.incall || escort.pricing?.hourly || 0) > 0 && (
                      <span className="text-[10px] font-bold text-[#FFD700]">
                        KES {(((escort.pricing?.incall || escort.pricing?.hourly || 0)) / 1000).toFixed(0)}k/hr
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-6">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <div className="w-4 h-4 border-2 border-[#8B0000]/30 border-t-[#8B0000] rounded-full animate-spin" />
              Loading more…
            </div>
          )}
        </div>
      )}

      {!hasMore && shown.length > 0 && (
        <div className="py-6" />
      )}
    </div>
  )
}
