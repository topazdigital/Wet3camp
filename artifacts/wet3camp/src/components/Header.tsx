import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { Bell, Heart, Search, X, Flame, ShieldCheck, ChevronDown, Menu } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'

export default function Header() {
  const [showSearch, setShowSearch] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [location] = useLocation()

  let isMobile = false
  try { isMobile = useSidebar().isMobile } catch (_) {}

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const notifications = [
    { id: 1, text: 'Amara K. accepted your booking', time: '2m ago', dot: '#28a745' },
    { id: 2, text: 'New message from Zara M.',        time: '15m ago', dot: '#FFD700' },
    { id: 3, text: '3 new escorts near Westlands',    time: '1h ago',  dot: '#8B0000' },
  ]

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-card-bg/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-color'
          : 'bg-card-bg border-b border-color'
      }`}
    >
      <div className="w-full px-3 sm:px-5 h-14 flex items-center gap-2">

        {/* Logo (mobile only — desktop uses sidebar) */}
        <Link href="/" className="flex lg:hidden items-center gap-2 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center shadow-md">
            <Flame size={16} className="text-white" />
          </div>
          <span className="text-text-light font-bold text-sm tracking-tight group-hover:text-secondary-color transition-colors">
            Wet3<span className="text-secondary-color">Camp</span>
          </span>
        </Link>

        {/* Desktop search */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, location, service…"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-dark-bg border border-color rounded-xl text-xs text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color focus:bg-black/40 transition-all"
            />
            {searchVal && (
              <button onClick={() => setSearchVal('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 lg:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-0.5">

          {/* Mobile search toggle */}
          <button
            className="lg:hidden p-2 text-text-muted hover:text-secondary-color rounded-lg hover:bg-dark-bg transition-colors"
            onClick={() => setShowSearch(v => !v)}
          >
            <Search size={18} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative p-2 text-text-muted hover:text-secondary-color rounded-lg hover:bg-dark-bg transition-colors"
              onClick={() => setNotifOpen(v => !v)}
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8B0000] ring-1 ring-card-bg" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-72 bg-card-bg border border-color rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-color flex items-center justify-between">
                  <span className="text-xs font-bold text-text-light uppercase tracking-widest">Notifications</span>
                  <button onClick={() => setNotifOpen(false)}><X size={14} className="text-text-muted" /></button>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-dark-bg transition-colors cursor-pointer border-b border-color/40 last:border-0">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: n.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-light leading-snug">{n.text}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
                <Link href="/messages" onClick={() => setNotifOpen(false)} className="block px-4 py-2.5 text-center text-xs text-secondary-color hover:bg-dark-bg transition-colors">
                  View all messages →
                </Link>
              </div>
            )}
          </div>

          {/* Favorites */}
          <Link href="/favorites" className="hidden sm:flex p-2 text-text-muted hover:text-[#E91E63] rounded-lg hover:bg-dark-bg transition-colors">
            <Heart size={18} />
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-color mx-1" />

          {/* Auth buttons */}
          <Link href="/login" className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 border border-color hover:border-secondary-color text-text-light rounded-lg text-xs font-medium transition-all hover:text-secondary-color">
            <ShieldCheck size={13} />
            Sign In
          </Link>
          <Link href="/register" className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] hover:from-[#a00000] hover:to-[#8B0000] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#8B0000]/20">
            Join Free
          </Link>

          {/* Mobile auth */}
          <Link href="/register" className="md:hidden px-3 py-1.5 bg-[#8B0000] text-white rounded-lg text-xs font-bold">
            Join
          </Link>
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="lg:hidden px-3 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              autoFocus
              type="text"
              placeholder="Search escorts, locations…"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color transition-all"
            />
          </div>
        </div>
      )}
    </header>
  )
}
