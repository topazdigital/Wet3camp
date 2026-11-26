import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Link } from 'wouter'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'
import { api, type ApiEscort } from '@/lib/api'
import { getSlug } from '@/data/escorts'
import ProfilePhoto from '@/components/ProfilePhoto'

const CARD_W = 220
const GAP    = 12
const SPEED  = 0.6
const DISCOVERY_PROFILE_COUNT = 12
const DISCOVERY_HISTORY_LIMIT = 36
const DISCOVERY_HISTORY_KEY = 'wet3camp:homepage-discovery-history:v1'

const TIER_BADGE: Record<string, { bg: string; text: string }> = {
  elite:   { bg: '#8B000060', text: '#FF6B6B' },
  vip:     { bg: '#B8860B60', text: '#B8860B' },
  premium: { bg: '#FFD70020', text: '#FFD700' },
}

const TIER_ORDER: Record<string, number> = {
  elite: 0,
  vip: 1,
  premium: 2,
  standard: 3,
  free: 4,
}

function shuffle<T,>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getDiscoveryProfiles(candidates: ApiEscort[]): ApiEscort[] {
  let previousIds: string[] = []
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DISCOVERY_HISTORY_KEY) ?? '[]')
    if (Array.isArray(saved)) {
      previousIds = saved.filter((id): id is string => typeof id === 'string').slice(0, DISCOVERY_HISTORY_LIMIT)
    }
  } catch {
    // Random selection still works when browser storage is unavailable.
  }

  const count = Math.min(DISCOVERY_PROFILE_COUNT, candidates.length)
  const previousSet = new Set(previousIds)
  const selected = shuffle(candidates.filter(profile => !previousSet.has(String(profile.id)))).slice(0, count)

  if (selected.length < count) {
    const selectedSet = new Set(selected.map(profile => String(profile.id)))
    selected.push(
      ...shuffle(candidates.filter(profile => !selectedSet.has(String(profile.id)))).slice(0, count - selected.length),
    )
  }

  selected.sort((a, b) =>
    (TIER_ORDER[a.tier?.toLowerCase() ?? ''] ?? TIER_ORDER.free) -
    (TIER_ORDER[b.tier?.toLowerCase() ?? ''] ?? TIER_ORDER.free),
  )

  try {
    const selectedIds = selected.map(profile => String(profile.id))
    const selectedSet = new Set(selectedIds)
    const nextHistory = [...selectedIds, ...previousIds.filter(id => !selectedSet.has(id))]
    localStorage.setItem(DISCOVERY_HISTORY_KEY, JSON.stringify([...new Set(nextHistory)].slice(0, DISCOVERY_HISTORY_LIMIT)))
  } catch {
    // Do not block discovery if browser storage is unavailable.
  }

  return selected
}

export default function FeaturedCarousel() {
  const [escorts, setEscorts] = useState<ApiEscort[]>([])
  const [isDiscoveryFallback, setIsDiscoveryFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadProfiles = async () => {
      try {
        const featuredResponse = await api.escorts.list({ paidFeaturedOnly: true, limit: 20, sort: 'featured' })
        if (cancelled) return

        const paidFeaturedProfiles = featuredResponse.data ?? []
        if (paidFeaturedProfiles.length > 0) {
          setEscorts(paidFeaturedProfiles)
          setIsDiscoveryFallback(false)
          return
        }

        const discoveryResponse = await api.escorts.list({ limit: 200, sort: 'newest' })
        if (cancelled) return

        const rotatingProfiles = getDiscoveryProfiles(discoveryResponse.data ?? [])
        setEscorts(rotatingProfiles)
        setIsDiscoveryFallback(rotatingProfiles.length > 0)
      } catch (error) {
        console.error('[FeaturedCarousel] Could not load homepage profiles:', error)
        if (!cancelled) {
          setEscorts([])
          setIsDiscoveryFallback(false)
        }
      }
    }

    void loadProfiles()
    return () => { cancelled = true }
  }, [])

  const trackRef   = useRef<HTMLDivElement>(null)
  const offsetRef  = useRef(0)
  const rafRef     = useRef<number | null>(null)
  const pausedRef  = useRef(false)
  const dragging   = useRef(false)
  const startX     = useRef(0)
  const startOff   = useRef(0)

  const singleWidth = escorts.length * (CARD_W + GAP)
  const allCards    = escorts.length > 0 ? [...escorts, ...escorts, ...escorts] : []

  const applyTransform = useCallback(() => {
    if (!trackRef.current || singleWidth <= 0) return
    offsetRef.current = ((offsetRef.current % singleWidth) + singleWidth) % singleWidth
    trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`
  }, [singleWidth])

  useEffect(() => {
    if (singleWidth <= 0) return
    offsetRef.current = 0
    const tick = () => {
      if (!pausedRef.current && !dragging.current) {
        offsetRef.current += SPEED
        applyTransform()
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [applyTransform, singleWidth])

  const onMouseDown  = (e: React.MouseEvent)  => { dragging.current = true; startX.current = e.clientX; startOff.current = offsetRef.current }
  const onMouseMove  = (e: React.MouseEvent)  => { if (!dragging.current) return; offsetRef.current = startOff.current - (e.clientX - startX.current); applyTransform() }
  const onMouseUp    = ()                      => { dragging.current = false }
  const onTouchStart = (e: React.TouchEvent)  => { dragging.current = true; startX.current = e.touches[0].clientX; startOff.current = offsetRef.current }
  const onTouchMove  = (e: React.TouchEvent)  => { if (!dragging.current) return; offsetRef.current = startOff.current - (e.touches[0].clientX - startX.current); applyTransform() }
  const onTouchEnd   = ()                      => { dragging.current = false }

  if (escorts.length === 0) return null

  return (
    <section className="border-b border-color px-3 py-4 sm:px-5" aria-label={isDiscoveryFallback ? 'Discover profiles' : 'Featured profiles'}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-text-light" data-testid="text-home-profile-carousel-title">
            {isDiscoveryFallback ? 'Discover profiles' : 'Featured profiles'}
          </h2>
          {isDiscoveryFallback && (
            <p className="mt-0.5 text-[11px] text-text-muted" data-testid="text-home-profile-carousel-description">
              A rotating selection of active profiles
            </p>
          )}
        </div>
      </div>
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false; dragging.current = false }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div ref={trackRef} className="flex" style={{ gap: GAP, willChange: 'transform' }}>
          {allCards.map((e, i) => {
            const badge = TIER_BADGE[e.tier?.toLowerCase() ?? ''] ?? null
            return (
              <Link
                key={`${e.id}-${i}`}
                href={`/@${getSlug(e.name)}`}
                className="flex-shrink-0 rounded-2xl overflow-hidden relative group"
                style={{ width: CARD_W }}
                draggable={false}
                data-testid={`link-home-profile-carousel-${e.id}-${i}`}
                onClick={(ev: React.MouseEvent) => {
                  if (dragging.current && Math.abs(startX.current - ev.clientX) > 5) ev.preventDefault()
                }}
              >
                <div className="relative" style={{ height: 300 }}>
                  <ProfilePhoto
                    src={e.image}
                    alt={e.name}
                    name={e.name}
                    width={480}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {badge && (
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-md"
                        style={{ background: badge.bg, color: badge.text, backdropFilter: 'blur(4px)' }}
                      >
                        {(e.tier ?? '').toUpperCase()}
                      </span>
                    )}
                    {e.online && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#28a74530] text-[#28a745]">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-white font-black text-sm truncate">{e.name}</span>
                      {e.verified && <CheckCircle2 size={11} className="text-[#28a745] flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 text-white/70 text-[10px] mb-1.5">
                      <MapPin size={9} />
                      <span className="truncate">{e.area ? `${e.area}, ${e.city}` : e.city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        <Star size={9} className="fill-[#FFD700] text-[#FFD700]" />
                        <span className="text-[10px] text-white/80">{Number(e.rating || 0).toFixed(1)}</span>
                      </div>
                      {(e.price_hourly ?? 0) > 0 && (
                        <span className="text-[10px] text-[#FFD700] font-bold">
                          KES {(e.price_hourly).toLocaleString()}/hr
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
