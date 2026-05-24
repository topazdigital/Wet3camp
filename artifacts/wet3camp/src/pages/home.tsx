import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import FeaturedCarousel from '@/components/FeaturedCarousel'
import InfiniteEscortGrid from '@/components/InfiniteEscortGrid'
import { Users, MapPin, ShieldCheck, Flame, Star, Video, Hotel, Plane, ShoppingBag, Calendar, Newspaper } from 'lucide-react'
import { Link } from 'wouter'

const STATS = [
  { icon: Users,       value: '1,200+', label: 'Active Escorts' },
  { icon: MapPin,      value: '12',     label: 'Cities'         },
  { icon: ShieldCheck, value: '890+',   label: 'Verified'       },
  { icon: Flame,       value: '143',    label: 'Online Now',    pulse: true },
]

const CATEGORIES = [
  { label: 'All',         value: 'all',      icon: '✨' },
  { label: 'Elite',       value: 'elite',    icon: '👑' },
  { label: 'VIP',         value: 'vip',      icon: '💎' },
  { label: 'Premium',     value: 'premium',  icon: '⭐' },
  { label: 'Available',   value: 'available',icon: '🟢' },
  { label: 'Nairobi',     value: 'nairobi',  icon: '📍' },
  { label: 'Mombasa',     value: 'mombasa',  icon: '🏖️' },
  { label: 'Kisumu',      value: 'kisumu',   icon: '📍' },
]

const QUICK_LINKS = [
  { icon: Video,       label: 'Live Now',    href: '/live',      color: '#E91E63', bg: '#E91E63' },
  { icon: Newspaper,   label: 'Feeds',       href: '/feeds',     color: '#2196F3', bg: '#2196F3' },
  { icon: Hotel,       label: 'Rooms',       href: '/rooms',     color: '#FF9800', bg: '#FF9800' },
  { icon: Plane,       label: 'Tours',       href: '/tours',     color: '#9C27B0', bg: '#9C27B0' },
  { icon: ShoppingBag, label: 'Shop',        href: '/shop',      color: '#00BCD4', bg: '#00BCD4' },
  { icon: Calendar,    label: 'Events',      href: '/events',    color: '#4CAF50', bg: '#4CAF50' },
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all')

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Stats Bar */}
        <div className="w-full px-3 sm:px-5 py-3 bg-market-bg border-b border-market-border">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-hide">
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
          </div>
        </div>

        {/* Quick Links */}
        <div className="px-3 sm:px-5 py-3 border-b border-color bg-dark-bg">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {QUICK_LINKS.map(ql => {
              const Icon = ql.icon
              return (
                <Link key={ql.href} href={ql.href} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-lg"
                    style={{ backgroundColor: ql.bg + '20', border: `1px solid ${ql.bg}30` }}>
                    <Icon size={18} style={{ color: ql.color }} />
                  </div>
                  <span className="text-[10px] text-text-muted group-hover:text-text-light transition-colors font-medium">{ql.label}</span>
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
              <h2 className="text-sm font-bold text-text-light">Browse All Escorts</h2>
              <p className="text-xs text-text-muted">Showing Nairobi first · 1,200+ profiles</p>
            </div>
          </div>

          {/* Category Chips */}
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

          <InfiniteEscortGrid activeCategory={activeCategory} />
        </div>
      </div>
    </main>
  )
}
