import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Star, Heart, MapPin, CheckCircle2, UserPlus, UserCheck } from 'lucide-react'
import { Link } from 'wouter'
import { useAllEscorts } from '@/hooks/useEscorts'
import { useFollow } from '@/lib/follow-context'
import { useAuth } from '@/lib/auth-context'
import { useFavorites } from '@/lib/favorites-context'
import { useOnlineStatus } from '@/lib/use-online-status'

const TIER_STYLE: Record<string, { bg: string; label: string }> = {
  Elite:   { bg: '#8B0000', label: 'Elite'   },
  elite:   { bg: '#8B0000', label: 'Elite'   },
  VIP:     { bg: '#FF4500', label: 'VIP'     },
  vip:     { bg: '#FF4500', label: 'VIP'     },
  Premium: { bg: '#B8860B', label: 'Premium' },
  premium: { bg: '#B8860B', label: 'Premium' },
}

const TIER_RANK: Record<string, number> = {
  elite: 1, vip: 2, premium: 3, standard: 99, free: 99,
}

function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

type AppEscort = ReturnType<typeof useAllEscorts>['escorts'][number]

function sortEscorts(escorts: AppEscort[]): AppEscort[] {
  return [...escorts].sort((a, b) => {
    const ra = TIER_RANK[a.tier] ?? 99
    const rb = TIER_RANK[b.tier] ?? 99
    if (ra !== rb) return ra - rb
    if (ra <= 3) return b.rating - a.rating
    const aNum = parseInt(String(a.id).replace(/\D/g, '')) || 0
    const bNum = parseInt(String(b.id).replace(/\D/g, '')) || 0
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
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isOnline } = useOnlineStatus()

  const { escorts: apiEscorts, isLoading } = useAllEscorts()

  const allEscorts = React.useMemo(() => {
    const withCity = apiEscorts.filter(e => e.city === priorityCity)
    const others   = apiEscorts.filter(e => e.city !== priorityCity)
    return sortEscorts([...withCity, ...others])
  }, [apiEscorts, priorityCity])

  const filtered = React.useMemo(() => {
    if (activeCategory === 'all')       return allEscorts
    if (activeCategory === 'available') return allEscorts.filter(e => e.available)
    const cat = activeCategory.toLowerCase()
    if (['elite','vip','premium'].includes(cat)) return allEscorts.filter(e => e.tier.toLowerCase() === cat)
    return allEscorts.filter(e => e.city === activeCategory)
  }, [activeCategory, allEscorts])

  const [shown, setShown] = useState<typeof filtered>([])
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const first = filtered.slice(0, PER_PAGE)
    setShown(first)
    setHasMore(filtered.length > PER_PAGE)
  }, [filtered])

  const fetchMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setTimeout(() => {
      setShown(prev => {
        const next = filtered.slice(prev.length, prev.length + PER_PAGE)
        if (next.length === 0) { setHasMore(false); return prev }
        if (prev.length + next.length >= filtered.length) setHasMore(false)
        return [...prev, ...next]
      })
      setLoadingMore(false)
    }, 400)
  }, [loadingMore, hasMore, filtered])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) fetchMore()
    }, { threshold: 0.1 })
    if (observerTarget.current) obs.observe(observerTarget.current)
    return () => obs.disconnect()
  }, [hasMore, loadingMore, fetchMore])

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    toggleFavorite(id)
  }

  const handleFollow = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    toggleFollow(id)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 px-3 sm:px-5 py-3">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-card-bg rounded-xl overflow-hidden border border-color animate-pulse">
            <div className="aspect-[3/4] bg-dark-bg" />
            <div className="p-2.5 space-y-2">
              <div className="h-3 bg-dark-bg rounded w-3/4" />
              <div className="h-2.5 bg-dark-bg rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!isLoading && shown.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 px-5">
        <div className="text-6xl">🔍</div>
        <div>
          <p className="font-bold text-text-light text-base">No escorts found</p>
          <p className="text-sm text-text-muted mt-1">No profiles match the current filter. Try selecting a different category.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 px-3 sm:px-5 py-3">
        {shown.map((escort, idx) => {
          const tier = TIER_STYLE[escort.tier] ?? null
          const uniqueKey = `${escort.id}-${idx}`
          const following = isFollowing(escort.id)
          const isOwnEscort = !!(user?.id && (escort as any).user_id && String((escort as any).user_id) === user.id)
          const profileHref = /^\d+$/.test(String(escort.id)) ? `/profile/${escort.id}` : `/profile/${getSlug(escort.name)}`
          return (
            <Link href={profileHref} key={uniqueKey} className="group">
              <div className="bg-card-bg rounded-xl overflow-hidden border border-color hover:border-[#8B0000]/50 hover:shadow-lg hover:shadow-[#8B0000]/10 transition-all duration-200">
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  {escort.image ? (
                    <img
                      src={escort.image}
                      alt={escort.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                      loading={idx < 12 ? 'eager' : 'lazy'}
                      onError={e => {
                        const t = e.currentTarget
                        if (!t.dataset.fallback) {
                          t.dataset.fallback = '1'
                          t.style.display = 'none'
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-bg flex items-center justify-center text-5xl text-text-muted">
                      👤
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
                      <span className="text-[10px] font-bold text-text-light">{escort.rating}</span>
                      <span className="text-[9px] text-text-muted">({escort.reviews})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#FFD700]">KES {(((escort.pricing?.incall || escort.pricing?.hourly || 0)) / 1000).toFixed(0)}k/hr</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-6">
          {loadingMore && (
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
