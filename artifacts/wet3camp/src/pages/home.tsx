import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import FeaturedCarousel from '@/components/FeaturedCarousel'
import InfiniteEscortGrid from '@/components/InfiniteEscortGrid'
import { Users, MapPin, ShieldCheck, Flame, Video, Hotel, Plane, ShoppingBag, Calendar, Newspaper, Navigation, Radio } from 'lucide-react'
import { Link } from 'wouter'
import { CITIES } from '@/data/escorts'
import { useSEO } from '@/lib/useSEO'
import { api } from '@/lib/api'
import SeoFooter from '@/components/SeoFooter'

const TIER_CATEGORIES = [
  { label: 'All',       value: 'all',       icon: '✨' },
  { label: 'Elite',     value: 'Elite',     icon: '👑' },
  { label: 'VIP',       value: 'VIP',       icon: '💎' },
  { label: 'Premium',   value: 'Premium',   icon: '⭐' },
  { label: 'Available', value: 'available', icon: '🟢' },
]

const QUICK_LINKS = [
  { icon: Video,       label: 'Live',   href: '/live',   color: '#E91E63' },
  { icon: Newspaper,   label: 'Feeds',  href: '/feeds',  color: '#2196F3' },
  { icon: Hotel,       label: 'Rooms',  href: '/rooms',  color: '#FF9800' },
  { icon: Plane,       label: 'Tours',  href: '/tours',  color: '#9C27B0' },
  { icon: ShoppingBag, label: 'Shop',   href: '/shop',   color: '#00BCD4' },
  { icon: Calendar,    label: 'Events', href: '/events', color: '#4CAF50' },
]

// ─── Trending Live Strip ──────────────────────────────────────────────────────

interface LiveSession {
  id: string
  escortId: number
  name: string
  avatar?: string
  image?: string
  title?: string
  city?: string
  tier?: string
  viewerCount: number
}

function TrendingLive() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLive = () => {
      fetch('/api/live')
        .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
        .then(data => {
          setSessions(Array.isArray(data) ? data : [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
    fetchLive()
    const id = setInterval(fetchLive, 30000)
    return () => clearInterval(id)
  }, [])

  if (loading || sessions.length === 0) return null

  return (
    <div className="w-full px-3 sm:px-5 py-4 border-b border-color bg-dark-bg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#E91E63] rounded-full animate-pulse" />
          <Radio size={13} className="text-[#E91E63]" />
          <span className="text-xs font-bold text-text-light">Live Now</span>
        </div>
        <span className="text-[10px] text-text-muted">{sessions.length} streaming</span>
        <Link href="/live" className="ml-auto text-[10px] text-[#8B0000] hover:text-[#FFD700] font-semibold transition-colors">
          See all →
        </Link>
      </div>

      {/* Story-style circles */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {sessions.map(s => {
          const photo = s.avatar || s.image
          return (
          <Link
            key={s.id}
            href={`/live/${s.escortId}`}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
          >
            {/* Story ring — gradient border + gap ring, no spin so photo stays upright */}
            <div className="relative">
              {/* Gradient ring */}
              <div className="w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full p-[3px] bg-gradient-to-br from-[#E91E63] via-[#FF4500] to-[#8B0000] shadow-[0_0_14px_#E91E6360] group-hover:shadow-[0_0_20px_#E91E6380] transition-shadow">
                {/* Gap ring */}
                <div className="w-full h-full rounded-full p-[2px] bg-dark-bg">
                  {/* Avatar */}
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    {photo
                      ? <img
                          src={photo}
                          alt={s.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      : <div className="w-full h-full bg-card-bg flex items-center justify-center text-2xl font-black text-[#8B0000]/40">
                          {(s.name || '?')[0]}
                        </div>
                    }
                  </div>
                </div>
              </div>
              {/* LIVE badge pinned at bottom of circle */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-[#E91E63] px-2 py-0.5 rounded-full border border-dark-bg">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                <span className="text-[8px] font-black text-white leading-none tracking-wide">LIVE</span>
              </div>
            </div>
            {/* Name */}
            <p className="text-[11px] text-text-light text-center max-w-[80px] truncate font-semibold group-hover:text-[#E91E63] transition-colors leading-tight mt-1">
              {s.name.split(' ')[0]}
            </p>
            {/* Viewer count */}
            <p className="text-[9px] text-text-muted text-center leading-none -mt-0.5">
              👁 {s.viewerCount}
            </p>
          </Link>
          )
        })}

        {/* See all bubble */}
        <Link href="/live" className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border-2 border-dashed border-[#8B0000]/40 flex items-center justify-center hover:border-[#E91E63]/60 transition-colors bg-card-bg">
            <span className="text-2xl group-hover:scale-110 transition-transform">🎬</span>
          </div>
          <p className="text-[11px] text-text-muted font-semibold">See all</p>
        </Link>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Home() {
  useSEO({
    title: "Kenya's #1 Escort Directory",
    description: "Browse 1,200+ verified escorts in Nairobi, Mombasa, Kisumu & across Kenya. Elite, VIP & Premium female escorts. Discreet, safe, real photos. Better than nairobi raha — join free.",
    keywords: "nairobiraha, nairobi raha, raha nairobi, rahazanairobi, raha za nairobi, escorts Kenya, Nairobi escorts, Mombasa escorts, Kisumu escorts, escort booking Kenya, VIP escorts Nairobi, elite escorts Nairobi, verified escorts Kenya, call girl Nairobi, escort near me Kenya, female escort Nairobi, escort directory Kenya, kenyan escorts 2025, escorts near me Kenya, escort WhatsApp Kenya",
    canonicalPath: '/',
  })
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeService, setActiveService] = useState('')
  const [detectedCity, setDetectedCity] = useState<string | null>(null)
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle')
  const [stats, setStats] = useState<{ total: number; verified: number; online: number; cities: number } | null>(null)
  const [popularCities, setPopularCities] = useState<string[]>([])
  const [popularServices, setPopularServices] = useState<string[]>([])

  useEffect(() => {
    api.escorts.meta()
      .then(res => {
        setStats({
          total: res.total ?? 0,
          verified: res.verified ?? 0,
          online: res.online ?? 0,
          cities: res.cities ?? 12,
        })
        if (Array.isArray(res.byCity)) {
          const cities = res.byCity
            .slice(0, 6)
            .map(c => c.city)
            .filter(Boolean)
          setPopularCities(cities)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/services/popular')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPopularServices(data.slice(0, 14).map((s: any) => s.name ?? s)) })
      .catch(() => {})
  }, [])

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
    ? `Near you · ${detectedCity}`
    : geoState === 'denied'
    ? 'All cities worldwide'
    : 'All cities · Nairobi shown first'

  const statItems = [
    { icon: Users,       value: stats ? `${stats.total}+` : '…',        label: 'Active Escorts' },
    { icon: MapPin,      value: stats ? String(stats.cities) : '…',     label: 'Cities'         },
    { icon: ShieldCheck, value: stats ? `${stats.verified}+` : '…',     label: 'Verified'       },
    { icon: Flame,       value: stats ? String(stats.online) : '…',     label: 'Online Now', pulse: true },
  ]

  // Build category chips: tier chips + top cities from DB (worldwide)
  const cityChips = popularCities.map(city => ({
    label: city,
    value: city,
    icon: '📍',
  }))
  const allCategories = [...TIER_CATEGORIES, ...cityChips]

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Stats Bar */}
        <div className="w-full px-3 sm:px-5 py-3 border-b border-color bg-card-bg">
          <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto scrollbar-hide">
            {statItems.map(s => {
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

        {/* Quick Links */}
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

        {/* Trending Live — only shown when escorts are streaming */}
        <TrendingLive />

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
                {stats ? ` · ${stats.total}+ profiles` : ''}
              </p>
            </div>
          </div>

          {/* Category Chips — tier filters + real cities from DB */}
          <div className="px-3 sm:px-5 py-2.5 border-b border-color">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {allCategories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => { setActiveCategory(cat.value); setActiveService('') }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${
                    activeCategory === cat.value && !activeService
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

          {/* Service Chips */}
          {popularServices.length > 0 && (
            <div className="px-3 sm:px-5 py-2 border-b border-color bg-dark-bg/40">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                <span className="text-[9px] text-text-muted uppercase tracking-widest flex-shrink-0 mr-1">Services:</span>
                {activeService && (
                  <button
                    onClick={() => setActiveService('')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 bg-[#8B0000] text-white"
                  >
                    ✕ Clear
                  </button>
                )}
                {popularServices.map(svc => (
                  <button
                    key={svc}
                    onClick={() => { setActiveService(activeService === svc ? '' : svc); setActiveCategory('all') }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 transition-all border ${
                      activeService === svc
                        ? 'bg-[#FFD700]/20 border-[#FFD700]/60 text-[#FFD700]'
                        : 'bg-card-bg border-color text-text-muted hover:border-[#FFD700]/40 hover:text-text-light'
                    }`}
                  >
                    {svc}
                  </button>
                ))}
              </div>
            </div>
          )}

          <InfiniteEscortGrid activeCategory={activeCategory} priorityCity={detectedCity || 'Nairobi'} activeService={activeService} />
        </div>

        <SeoFooter />
      </div>
    </main>
  )
}
