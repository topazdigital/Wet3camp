import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Star, Heart, MapPin, Flame, CheckCircle2 } from 'lucide-react'
import { Link } from 'wouter'

interface FeaturedCard {
  id: number; name: string; location: string; rating: number; reviews: number
  image: string; tier: 'standard' | 'premium' | 'vip' | 'elite'; price: number; available: boolean
}

const FEATURED: FeaturedCard[] = [
  { id: 1, name: 'Amara K.',   location: 'Nairobi CBD',   rating: 4.9, reviews: 156, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=700&fit=crop', tier: 'elite',    price: 8000, available: true },
  { id: 2, name: 'Zara M.',    location: 'Westlands',     rating: 4.8, reviews: 142, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=700&fit=crop', tier: 'vip',      price: 6500, available: true },
  { id: 3, name: 'Luna K.',    location: 'Karen',         rating: 4.7, reviews: 128, image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=700&fit=crop', tier: 'vip',      price: 5000, available: false },
  { id: 4, name: 'Sophia N.',  location: 'Kilimani',      rating: 4.6, reviews: 115, image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=700&fit=crop', tier: 'premium',  price: 4000, available: true },
  { id: 5, name: 'Priya S.',   location: 'Lavington',     rating: 4.8, reviews: 98,  image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=700&fit=crop', tier: 'elite',    price: 9000, available: true },
  { id: 6, name: 'Fatuma H.',  location: 'Parklands',     rating: 4.5, reviews: 134, image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=700&fit=crop', tier: 'premium',  price: 3500, available: true },
]

const TIER = {
  elite:   { bg: '#8B0000',  label: '★ Elite',   glow: 'shadow-[#8B0000]/40' },
  vip:     { bg: '#FF4500',  label: '◆ VIP',     glow: 'shadow-[#FF4500]/30' },
  premium: { bg: '#B8860B',  label: '◈ Premium', glow: 'shadow-[#B8860B]/30' },
  standard:{ bg: '#555',     label: 'Standard',  glow: '' },
}

export default function FeaturedCarousel() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [liked, setLiked] = useState<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % FEATURED.length), 5500)
    return () => clearInterval(timerRef.current)
  }, [paused])

  const prev = () => { setIdx(i => (i - 1 + FEATURED.length) % FEATURED.length); setPaused(true) }
  const next = () => { setIdx(i => (i + 1) % FEATURED.length); setPaused(true) }

  const toggleLike = (e: React.MouseEvent, id: number) => {
    e.preventDefault(); e.stopPropagation()
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <section className="w-full bg-market-bg py-5 px-3 sm:px-5 border-b border-market-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-text-light flex items-center gap-2">
            <Flame size={16} className="text-[#8B0000]" />
            Featured Tonight
          </h2>
          <p className="text-xs text-text-muted mt-0.5">Hand-picked elite & VIP providers</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg border border-color text-text-muted hover:text-secondary-color hover:border-secondary-color/50 transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg border border-color text-text-muted hover:text-secondary-color hover:border-secondary-color/50 transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Cards strip */}
      <div className="relative overflow-hidden rounded-xl">
        <div
          className="flex gap-3 transition-transform duration-500 ease-out"
          style={{ transform: `translateX(calc(-${idx} * (var(--card-w) + 12px)))` } as React.CSSProperties}
        >
          {FEATURED.map(card => {
            const tier = TIER[card.tier]
            return (
              <Link
                key={card.id}
                href={`/profile/${card.id}`}
                className={`flex-shrink-0 relative rounded-xl overflow-hidden group cursor-pointer shadow-xl ${tier.glow}`}
                style={{ width: 'var(--card-w)', '--card-w': 'clamp(200px, 40vw, 240px)' } as React.CSSProperties}
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Tier badge */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: tier.bg }}>
                    {tier.label}
                  </div>

                  {/* Verified */}
                  <div className="absolute top-2.5 right-9 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-[#28a745]" fill="#28a745" />
                  </div>

                  {/* Like */}
                  <button
                    onClick={e => toggleLike(e, card.id)}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all"
                  >
                    <Heart size={13} className={liked.has(card.id) ? 'text-[#E91E63] fill-[#E91E63]' : 'text-white'} />
                  </button>

                  {/* Availability */}
                  <div className={`absolute bottom-[72px] left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${card.available ? 'bg-[#28a745]/20 text-[#28a745] border border-[#28a745]/30' : 'bg-white/10 text-white/60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${card.available ? 'bg-[#28a745] animate-pulse' : 'bg-gray-500'}`} />
                    {card.available ? 'Available' : 'Busy'}
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-bold text-white leading-tight mb-1">{card.name}</h3>
                    <div className="flex items-center justify-between">
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
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FFD700]">KES {card.price.toLocaleString()}/hr</span>
                      <button className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#8B0000] text-white hover:bg-[#a00000] transition-colors">
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {FEATURED.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setPaused(true) }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'bg-secondary-color w-5' : 'bg-text-muted/40 w-1.5'}`}
          />
        ))}
      </div>
    </section>
  )
}
