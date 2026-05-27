import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Star, Heart, MapPin, Flame, CheckCircle2, UserPlus, UserCheck, Radio } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useFollow } from '@/lib/follow-context'
import { useAuth } from '@/lib/auth-context'
import { useOnlineStatus } from '@/lib/use-online-status'
import { api } from '@/lib/api'
import type { ApiEscort } from '@/lib/api'

const TIER_STYLES: Record<string, { bg: string; label: string; glow: string }> = {
  elite:    { bg: '#8B0000', label: '★ Elite',    glow: '0 0 20px rgba(139,0,0,0.35)' },
  vip:      { bg: '#FF4500', label: '◆ VIP',      glow: '0 0 20px rgba(255,69,0,0.25)' },
  premium:  { bg: '#B8860B', label: '◈ Premium',  glow: '0 0 20px rgba(184,134,11,0.25)' },
  standard: { bg: '#555',    label: 'Standard',   glow: 'none' },
}

const CARD_W = 220
const GAP = 14
const SPEED = 0.6

export default function FeaturedCarousel() {
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [escorts, setEscorts] = useState<ApiEscort[]>([])
  const { isFollowing, toggleFollow } = useFollow()
  const { isLoggedIn } = useAuth()
  const { isOnline, onlineIds } = useOnlineStatus()
  const [, navigate] = useLocation()

  useEffect(() => {
    api.escorts.list({ limit: 12, sort: 'tier' })
      .then(res => {
        if (res.data && res.data.length > 0) setEscorts(res.data)
      })
      .catch(() => {})
  }, [])

  const onlineCount = onlineIds.size > 0
    ? escorts.filter(c => isOnline(String(c.id))).length
    : escorts.filter(c => c.available).length

  const trackRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const paused = useRef(false)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const dragDir = useRef<'h' | 'v' | null>(null)
  const dragStartOffset = useRef(0)
  const dragMoved = useRef(false)
  const velocity = useRef(0)
  const lastDragX = useRef(0)
  const lastDragTime = useRef(0)
  const inertiaRaf = useRef<number | null>(null)

  const singleWidth = escorts.length * (CARD_W + GAP)

  const applyTransform = useCallback(() => {
    if (!trackRef.current) return
    offsetRef.current = ((offsetRef.current % singleWidth) + singleWidth) % singleWidth
    trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`
  }, [singleWidth])

  const stopInertia = () => {
    if (inertiaRaf.current !== null) { cancelAnimationFrame(inertiaRaf.current); inertiaRaf.current = null }
  }

  const runInertia = useCallback(() => {
    if (Math.abs(velocity.current) < 0.3) { velocity.current = 0; return }
    velocity.current *= 0.93
    offsetRef.current += velocity.current
    applyTransform()
    inertiaRaf.current = requestAnimationFrame(runInertia)
  }, [applyTransform])

  useEffect(() => {
    const tick = () => {
      if (!paused.current && !isDragging.current) { offsetRef.current += SPEED; applyTransform() }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [applyTransform])

  const onPointerDown = (e: React.PointerEvent) => {
    stopInertia(); isDragging.current = true; dragMoved.current = false; dragDir.current = null
    dragStartX.current = e.clientX; dragStartY.current = e.clientY
    dragStartOffset.current = offsetRef.current; lastDragX.current = e.clientX
    lastDragTime.current = performance.now(); velocity.current = 0
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStartX.current
    const dy = e.clientY - dragStartY.current
    if (dragDir.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      if (Math.abs(dy) > Math.abs(dx)) {
        isDragging.current = false; dragDir.current = 'v'
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); return
      }
      dragDir.current = 'h'
    }
    if (dragDir.current !== 'h') return
    e.preventDefault()
    if (Math.abs(dx) > 8) dragMoved.current = true
    const now = performance.now(); const dt = now - lastDragTime.current
    if (dt > 0) velocity.current = ((lastDragX.current - e.clientX) / dt) * 14
    lastDragX.current = e.clientX; lastDragTime.current = now
    offsetRef.current = dragStartOffset.current - dx; applyTransform()
  }

  const onPointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    if (dragDir.current === 'h' && Math.abs(velocity.current) > 0.5) inertiaRaf.current = requestAnimationFrame(runInertia)
    setTimeout(() => { dragMoved.current = false }, 50)
  }

  const handleCardClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!dragMoved.current) navigate(`/profile/${slug}`)
  }

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleFollow = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation(); toggleFollow(id)
  }

  if (escorts.length === 0) return null

  const allCards = [...escorts, ...escorts, ...escorts]

  return (
    <section className="w-full py-5 px-0 border-b border-color">
      <div className="px-3 sm:px-5 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-text-light flex items-center gap-2">
            <Flame size={16} className="text-[#8B0000]" />
            Featured Tonight
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-text-muted">Hand-picked elite &amp; VIP providers</p>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(40,167,69,0.12)', border: '1px solid rgba(40,167,69,0.25)', color: '#28a745' }}>
              <Radio size={9} className="animate-pulse" />
              {onlineCount} online now
            </span>
          </div>
        </div>
        <Link href="/exclusive" className="text-[10px] text-[#FFD700] hover:underline font-semibold">View all →</Link>
      </div>

      <div
        className="overflow-hidden select-none"
        style={{ touchAction: 'pan-y', cursor: 'grab' }}
        onMouseEnter={() => { paused.current = true }}
        onMouseLeave={() => { paused.current = false; if (isDragging.current) onPointerUp() }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={trackRef} className="flex will-change-transform" style={{ gap: `${GAP}px`, paddingLeft: '12px', width: 'max-content' }}>
          {allCards.map((card, idx) => {
            const tierKey = (card.tier ?? 'standard').toLowerCase()
            const tier = TIER_STYLES[tierKey] ?? TIER_STYLES.standard
            const following = isFollowing(String(card.id))
            const slug = card.slug ?? String(card.id)
            return (
              <div
                key={`${card.id}-${idx}`}
                onClick={e => handleCardClick(e, slug)}
                className="flex-shrink-0 relative rounded-2xl overflow-hidden group cursor-pointer"
                style={{ width: `${CARD_W}px`, boxShadow: tier.glow }}
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-card-bg">
                  <img
                    src={card.image || '/placeholder.jpg'}
                    alt={card.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: tier.bg }}>
                    {tier.label}
                  </div>

                  <div className="absolute top-2.5 right-9 flex items-center gap-1">
                    {card.verified && <CheckCircle2 size={14} className="text-[#28a745]" fill="#28a745" />}
                  </div>

                  {(isOnline(String(card.id)) || card.available) && (
                    <div className="absolute top-2 right-[68px] flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(40,167,69,0.2)', border: '1px solid rgba(40,167,69,0.4)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#28a745] animate-pulse" />
                      <span className="text-[8px] font-bold text-[#28a745]">LIVE</span>
                    </div>
                  )}

                  <button
                    onClick={e => toggleLike(e, String(card.id))}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all"
                  >
                    <Heart size={13} className={liked.has(String(card.id)) ? 'text-[#E91E63] fill-[#E91E63]' : 'text-white'} />
                  </button>

                  <div className={`absolute bottom-[84px] left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${card.available ? 'bg-[#28a745]/20 text-[#28a745] border border-[#28a745]/30' : 'bg-white/10 text-white/60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${card.available ? 'bg-[#28a745] animate-pulse' : 'bg-gray-500'}`} />
                    {card.available ? 'Available' : 'Busy'}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-bold text-white leading-tight mb-1">{card.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-white/60" />
                        <span className="text-[10px] text-white/70">{card.area || card.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-[#FFD700] fill-[#FFD700]" />
                        <span className="text-[10px] font-bold text-white">{card.rating ?? '—'}</span>
                        <span className="text-[9px] text-white/50">({card.reviews ?? 0})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#FFD700]">{card.pricing?.incall ? `KES ${card.pricing.incall.toLocaleString()}/hr` : 'Contact'}</span>
                      <button
                        onClick={e => handleFollow(e, String(card.id))}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${following ? 'bg-white/20 text-white' : 'bg-[#8B0000] text-white hover:bg-[#a00000]'}`}
                      >
                        {following ? <><UserCheck size={9} /> Following</> : <><UserPlus size={9} /> Follow</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
