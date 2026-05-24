import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import FeaturedCarousel from '@/components/FeaturedCarousel'
import InfiniteEscortGrid from '@/components/InfiniteEscortGrid'
import { Users, MapPin, ShieldCheck, Flame, Video, Hotel, Plane, ShoppingBag, Calendar, Newspaper, Navigation } from 'lucide-react'
import { Link } from 'wouter'
import { CITIES } from '@/data/escorts'
import { useSEO } from '@/lib/useSEO'

const STATS = [
  { icon: Users,       value: '1,200+', label: 'Active Escorts' },
  { icon: MapPin,      value: '12',     label: 'Cities'         },
  { icon: ShieldCheck, value: '890+',   label: 'Verified'       },
  { icon: Flame,       value: '143',    label: 'Online Now',    pulse: true },
]

const CATEGORIES = [
  { label: 'All',       value: 'all',       icon: '✨' },
  { label: 'Elite',     value: 'Elite',     icon: '👑' },
  { label: 'VIP',       value: 'VIP',       icon: '💎' },
  { label: 'Premium',   value: 'Premium',   icon: '⭐' },
  { label: 'Available', value: 'available', icon: '🟢' },
  { label: 'Nairobi',   value: 'Nairobi',   icon: '📍' },
  { label: 'Mombasa',   value: 'Mombasa',   icon: '🏖️' },
  { label: 'Kisumu',    value: 'Kisumu',    icon: '📍' },
  { label: 'Nakuru',    value: 'Nakuru',    icon: '🏔️' },
  { label: 'Eldoret',   value: 'Eldoret',   icon: '🌄' },
]

const QUICK_LINKS = [
  { icon: Video,       label: 'Live',   href: '/live',   color: '#E91E63' },
  { icon: Newspaper,   label: 'Feeds',  href: '/feeds',  color: '#2196F3' },
  { icon: Hotel,       label: 'Rooms',  href: '/rooms',  color: '#FF9800' },
  { icon: Plane,       label: 'Tours',  href: '/tours',  color: '#9C27B0' },
  { icon: ShoppingBag, label: 'Shop',   href: '/shop',   color: '#00BCD4' },
  { icon: Calendar,    label: 'Events', href: '/events', color: '#4CAF50' },
]

export default function Home() {
  useSEO({
    title: "Kenya's #1 Escort & Companion Directory",
    description: "Browse 1,200+ verified escorts in Nairobi, Mombasa, Kisumu & across Kenya. Elite, VIP & Premium companions. Discreet, safe, real profiles.",
    keywords: "escorts Kenya, Nairobi escorts, Mombasa escorts, companion booking Kenya, VIP escorts Nairobi, elite companions, verified escorts",
    canonicalPath: '/',
  })
  const [activeCategory, setActiveCategory] = useState('all')
  const [detectedCity, setDetectedCity] = useState<string | null>(null)
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle')

  useEffect(() => {
    if (!navigator.geolocation) return
    setGeoState('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        let nearest = CITIES[0], minD = Infinity
        CITIES.forEach(c => {
          const d = Math.hypot(c.lat - lat, c.lng - lng)
          if (d < minD) { minD = d; nearest = c }
        })
        setDetectedCity(nearest.name)
        setGeoState('done')
      },
      () => { setGeoState('denied') },
      { timeout: 5000, maximumAge: 60000 }
    )
  }, [])

  const locationLabel = geoState === 'done' && detectedCity
    ? `Near you in ${detectedCity}`
    : 'Nairobi first'

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Stats Bar */}
        <div className="w-full px-3 sm:px-5 py-3 border-b border-color bg-card-bg">
          <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-hide">
            {STATS.map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative">
                    <Icon size={13} className="text-text-muted" />
                    {s.pulse && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#28a745] rounded-full animate-pulse" />}
                  </div>
                  <span className="text-xs font-bold text-text-light">{s.value}</span>
                  <span className="text-xs text-text-muted">{s.label}</span>
                </div>
              )
            })}

            {/* Location indicator */}
            <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
              {geoState === 'loading' && <div className="w-3 h-3 border border-[#2196F3]/40 border-t-[#2196F3] rounded-full animate-spin" />}
              {geoState === 'done' && <div className="w-2 h-2 bg-[#28a745] rounded-full" />}
              {geoState === 'idle' && (
                <button onClick={() => setGeoState('loading')} className="flex items-center gap-1 text-[10px] text-[#2196F3] hover:underline">
                  <Navigation size={10} /> Detect location
                </button>
              )}
              {(geoState === 'done' || geoState === 'denied') && (
                <span className="text-[10px] text-text-muted flex items-center gap-1">
                  <MapPin size={9} />{detectedCity || 'Location unavailable'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links — 6-item grid, no horizontal scroll */}
        <div className="px-3 sm:px-5 py-4 border-b border-color bg-dark-bg">
          <div className="grid grid-cols-6 gap-2 sm:gap-4 max-w-lg">
            {QUICK_LINKS.map(ql => {
              const Icon = ql.icon
              return (
                <Link key={ql.href} href={ql.href} className="flex flex-col items-center gap-1.5 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-lg"
                    style={{ backgroundColor: ql.color + '20', border: `1px solid ${ql.color}30` }}>
                    <Icon size={17} style={{ color: ql.color }} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-text-muted group-hover:text-text-light transition-colors font-medium">{ql.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Featured Carousel */}
        <FeaturedCarousel />

        {/* Browse Section */}
        <div className="w-full">
          <div className="px-3 sm:px-5 py-3 border-b border-color flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-text-light">Browse Escorts</h2>
              <p className="text-xs text-text-muted flex items-center gap-1">
                {geoState === 'done'
                  ? <><div className="w-1.5 h-1.5 bg-[#28a745] rounded-full animate-pulse inline-block" />{locationLabel}</>
                  : locationLabel}
                {' · '}1,200+ profiles
              </p>
            </div>
          </div>

          {/* Category Chips — horizontal scroll with hidden scrollbar */}
          <div className="px-3 sm:px-5 py-2.5 border-b border-color">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                    activeCategory === cat.value
                      ? 'bg-[#8B0000] text-white shadow-md shadow-[#8B0000]/30'
                      : 'bg-card-bg border border-color text-text-muted hover:border-text-muted hover:text-text-light'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <InfiniteEscortGrid activeCategory={activeCategory} priorityCity={detectedCity || 'Nairobi'} />
        </div>
      </div>
    </main>
  )
}
