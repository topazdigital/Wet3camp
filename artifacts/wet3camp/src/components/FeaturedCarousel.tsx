import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Link } from 'wouter'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'
import { api, type ApiEscort } from '@/lib/api'
import { getSlug } from '@/data/escorts'

const CARD_W = 220
const GAP    = 12
const SPEED  = 0.6

const TIER_BADGE: Record<string, { bg: string; text: string }> = {
  elite:   { bg: '#8B000060', text: '#FF6B6B' },
  vip:     { bg: '#FF450060', text: '#FF8C00' },
  premium: { bg: '#B8860B60', text: '#FFD700' },
}

export default function FeaturedCarousel() {
  const [escorts, setEscorts] = useState<ApiEscort[]>([])

  useEffect(() => {
    api.escorts.list({ featured: true, limit: 20, sort: 'featured' })
      .then(res => setEscorts(res.data ?? []))
      .catch(() => setEscorts([]))
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
              onClick={(ev: React.MouseEvent) => {
                if (dragging.current && Math.abs(startX.current - ev.clientX) > 5) ev.preventDefault()
              }}
            >
              <div className="relative" style={{ height: 300 }}>
                {e.image ? (
                  <>
                    <img
                      src={e.image}
                      alt={e.name}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(ev) => {
                        ev.currentTarget.style.display = 'none'
                        const fb = ev.currentTarget.parentElement?.querySelector<HTMLElement>('.img-fallback')
                        if (fb) fb.style.display = 'flex'
                      }}
                    />
                    <div className="img-fallback w-full h-full absolute inset-0 items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a]" style={{ display: 'none' }}>
                      <span className="text-5xl font-black text-[#8B0000]/40 select-none">{(e.name || '?').charAt(0).toUpperCase()}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a]">
                    <span className="text-5xl font-black text-[#8B0000]/40 select-none">{(e.name || '?').charAt(0).toUpperCase()}</span>
                  </div>
                )}
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
  )
}
