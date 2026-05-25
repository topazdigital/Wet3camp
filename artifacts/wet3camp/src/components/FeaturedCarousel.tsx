import React, { useRef, useState, useCallback } from 'react'
import { Star, Heart, MapPin, Flame, CheckCircle2, UserPlus, UserCheck } from 'lucide-react'
import { Link } from 'wouter'
import { useFollow } from '@/lib/follow-context'
import { useAuth } from '@/lib/auth-context'

interface FeaturedCard {
  id: number; name: string; location: string; rating: number; reviews: number
  image: string; tier: 'standard' | 'premium' | 'vip' | 'elite'; price: number; available: boolean
}

const FEATURED: FeaturedCard[] = [
  { id: 1, name: 'Amara K.',  location: 'Nairobi CBD', rating: 4.9, reviews: 156, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=700&fit=crop&crop=face', tier: 'elite',   price: 8000, available: true  },
  { id: 2, name: 'Zara M.',   location: 'Westlands',   rating: 4.8, reviews: 142, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=700&fit=crop&crop=face', tier: 'vip',     price: 6500, available: true  },
  { id: 3, name: 'Luna K.',   location: 'Karen',       rating: 4.7, reviews: 128, image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=700&fit=crop&crop=face', tier: 'vip',     price: 5000, available: false },
  { id: 4, name: 'Sophia N.', location: 'Kilimani',    rating: 4.6, reviews: 115, image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=700&fit=crop&crop=face', tier: 'premium', price: 4000, available: true  },
  { id: 5, name: 'Priya S.',  location: 'Lavington',   rating: 4.8, reviews: 98,  image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=700&fit=crop&crop=face', tier: 'elite',   price: 9000, available: true  },
  { id: 6, name: 'Fatuma H.', location: 'Parklands',   rating: 4.5, reviews: 134, image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=700&fit=crop&crop=face', tier: 'premium', price: 3500, available: true  },
  { id: 7, name: 'Chloe W.',  location: 'Mombasa CBD', rating: 4.7, reviews: 107, image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=700&fit=crop&crop=face', tier: 'elite',   price: 7500, available: true  },
  { id: 8, name: 'Aisha M.',  location: 'Kisumu',      rating: 4.6, reviews: 89,  image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=700&fit=crop&crop=face', tier: 'vip',     price: 4500, available: true  },
]

const TIER_STYLES = {
  elite:    { bg: '#8B0000', label: '★ Elite',    glow: '0 0 20px rgba(139,0,0,0.35)' },
  vip:      { bg: '#FF4500', label: '◆ VIP',      glow: '0 0 20px rgba(255,69,0,0.25)' },
  premium:  { bg: '#B8860B', label: '◈ Premium',  glow: '0 0 20px rgba(184,134,11,0.25)' },
  standard: { bg: '#555',    label: 'Standard',   glow: 'none' },
}

const CARD_W = 220
const GAP = 14

export default function FeaturedCarousel() {
  const [liked, setLiked] = useState<Set<number>>(new Set())
  const { isFollowing, toggleFollow } = useFollow()
  const { isLoggedIn } = useAuth()
  const trackRef = useRef<HTMLDivElement>(null)

  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const dragMoved = useRef(false)
  const animFrameId = useRef<number | null>(null)
  const velocity = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)

  const stopInertia = () => {
    if (animFrameId.current !== null) {
      cancelAnimationFrame(animFrameId.current)
      animFrameId.current = null
    }
  }

  const applyInertia = useCallback(() => {
    if (!trackRef.current) return
    velocity.current *= 0.92
    trackRef.current.scrollLeft -= velocity.current
    if (Math.abs(velocity.current) > 0.5) {
      animFrameId.current = requestAnimationFrame(applyInertia)
    } else {
      animFrameId.current = null
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return
    stopInertia()
    isDragging.current = true
    dragMoved.current = false
    startX.current = e.clientX
    lastX.current = e.clientX
    lastTime.current = Date.now()
    scrollLeft.current = trackRef.current.scrollLeft
    trackRef.current.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 4) dragMoved.current = true
    const now = Date.now()
    const dt = now - lastTime.current
    if (dt > 0) {
      velocity.current = (lastX.current - e.clientX) / dt * 12
    }
    lastX.current = e.clientX
    lastTime.current = now
    trackRef.current.scrollLeft = scrollLeft.current - (e.clientX - startX.current)
  }

  const onPointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    if (Math.abs(velocity.current) > 1) {
      animFrameId.current = requestAnimationFrame(applyInertia)
    }
  }

  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation()
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleFollow = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation()
    if (isLoggedIn) toggleFollow(id)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (dragMoved.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <section className="w-full py-5 px-0 border-b border-color">
      <div className="px-3 sm:px-5 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-text-light flex items-center gap-2">
            <Flame size={16} className="text-[#8B0000]" />
            Featured Tonight
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Hand-picked elite &amp; VIP providers — drag or swipe to explore</p>
        </div>
        <Link href="/exclusive" className="text-[10px] text-[#FFD700] hover:underline font-semibold">View all →</Link>
      </div>

      <div
        ref={trackRef}
        className="overflow-x-auto overflow-y-hidden select-none"
        style={{
          cursor: isDragging.current ? 'grabbing' : 'grab',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        <div
          className="flex"
          style={{ gap: `${GAP}px`, paddingLeft: '12px', paddingRight: '12px', width: 'max-content' }}
        >
          {FEATURED.map((card, idx) => {
            const tier = TIER_STYLES[card.tier]
            const following = isFollowing(String(card.id))
            return (
              <Link
                key={`${card.id}-${idx}`}
                href={`/profile/${card.id}`}
                onClick={handleCardClick}
                className="flex-shrink-0 relative rounded-2xl overflow-hidden group"
                style={{ width: `${CARD_W}px`, boxShadow: tier.glow }}
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-card-bg">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: tier.bg }}>
                    {tier.label}
                  </div>

                  <div className="absolute top-2.5 right-9">
                    <CheckCircle2 size={14} className="text-[#28a745]" fill="#28a745" />
                  </div>

                  <button
                    onClick={e => toggleLike(e, card.id)}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all"
                  >
                    <Heart size={13} className={liked.has(card.id) ? 'text-[#E91E63] fill-[#E91E63]' : 'text-white'} />
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
                        <span className="text-[10px] text-white/70">{card.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-[#FFD700] fill-[#FFD700]" />
                        <span className="text-[10px] font-bold text-white">{card.rating}</span>
                        <span className="text-[9px] text-white/50">({card.reviews})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#FFD700]">KES {card.price.toLocaleString()}/hr</span>
                      <button
                        onClick={e => handleFollow(e, String(card.id))}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${following ? 'bg-white/20 text-white' : 'bg-[#8B0000] text-white hover:bg-[#a00000]'}`}
                      >
                        {following ? <><UserCheck size={9} /> Following</> : <><UserPlus size={9} /> Follow</>}
                      </button>
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
