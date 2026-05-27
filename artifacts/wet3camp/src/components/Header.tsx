import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'wouter'
import { Bell, Heart, Search, X, Flame, ShieldCheck, ChevronDown, LogOut, User, Settings, BookOpen } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'
import { useAuth } from '@/lib/auth-context'
import { useNotifications } from '@/lib/notifications-context'

export default function Header() {
  const [showSearch, setShowSearch] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [, navigate] = useLocation()
  const { user, logout, isLoggedIn, isAdmin, isEscort } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  let isMobile = false
  try { isMobile = useSidebar().isMobile } catch (_) {}

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-card-bg/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-color'
          : 'bg-card-bg border-b border-color'
      }`}
    >
      <div className="w-full px-3 sm:px-5 h-14 flex items-center gap-2">
        {/* Logo (mobile) */}
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

        <div className="flex-1 lg:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          {/* Mobile search */}
          <button className="lg:hidden p-2 text-text-muted hover:text-secondary-color rounded-lg hover:bg-dark-bg transition-colors" onClick={() => setShowSearch(v => !v)}>
            <Search size={18} />
          </button>

          {/* Notifications (only when logged in) */}
          {isLoggedIn && (
            <div className="relative" ref={notifRef}>
              <button
                className="relative p-2 text-text-muted hover:text-secondary-color rounded-lg hover:bg-dark-bg transition-colors"
                onClick={() => setNotifOpen(v => !v)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-[#8B0000] ring-1 ring-card-bg flex items-center justify-center text-[8px] font-black text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-10 w-80 bg-card-bg border border-color rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-color flex items-center justify-between">
                    <span className="text-xs font-bold text-text-light uppercase tracking-widest">
                      Notifications {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-[#8B0000] text-white text-[9px] rounded-full">{unreadCount} new</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-[#2196F3] hover:underline">Mark all read</button>
                      )}
                      <button onClick={() => setNotifOpen(false)}><X size={14} className="text-text-muted" /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-xs text-text-muted text-center">No notifications yet</p>
                    ) : notifications.map(n => (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={() => { markRead(n.id); setNotifOpen(false) }}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-dark-bg transition-colors cursor-pointer border-b border-color/30 last:border-0 ${!n.read ? 'bg-dark-bg/50' : ''}`}
                      >
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: n.dot }} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${n.read ? 'text-text-muted' : 'text-text-light font-medium'}`}>{n.text}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{n.time}</p>
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#8B0000] flex-shrink-0 mt-1.5" />}
                      </Link>
                    ))}
                  </div>
                  <Link href="/messages" onClick={() => setNotifOpen(false)} className="block px-4 py-2.5 text-center text-xs text-secondary-color hover:bg-dark-bg transition-colors border-t border-color">
                    View all messages →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Favorites */}
          <Link href="/favorites" className="hidden sm:flex p-2 text-text-muted hover:text-[#E91E63] rounded-lg hover:bg-dark-bg transition-colors">
            <Heart size={18} />
          </Link>

          <div className="hidden md:block w-px h-5 bg-color mx-1" />

          {/* Auth state */}
          {isLoggedIn ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-dark-bg transition-colors"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-[#8B0000]/50" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {user?.name?.charAt(0) ?? 'U'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-text-light leading-none">{user?.name}</p>
                  <p className="text-[10px] text-text-muted capitalize leading-none mt-0.5">{user?.role}</p>
                </div>
                <ChevronDown size={13} className="text-text-muted hidden md:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-10 w-52 bg-card-bg border border-color rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 py-1">
                  {isEscort && (
                    <Link href="/my-profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-bg transition-colors text-xs text-text-light">
                      <User size={14} className="text-text-muted" /> My Profile
                    </Link>
                  )}
                  {!isEscort && (
                    <>
                      <Link href="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-bg transition-colors text-xs text-text-light">
                        <User size={14} className="text-text-muted" /> My Account
                      </Link>
                      <Link href="/favorites" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-bg transition-colors text-xs text-text-light">
                        <Heart size={14} className="text-text-muted" /> My Favourites
                      </Link>
                    </>
                  )}
                  <Link href="/messages" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-bg transition-colors text-xs text-text-light">
                    <BookOpen size={14} className="text-text-muted" /> Messages
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-bg transition-colors text-xs text-[#FFD700]">
                      <Settings size={14} className="text-[#FFD700]" /> Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-color my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-bg transition-colors text-xs text-[#EF4444]">
                    <LogOut size={14} className="text-[#EF4444]" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 border border-color hover:border-secondary-color text-text-light rounded-lg text-xs font-medium transition-all hover:text-secondary-color">
                <ShieldCheck size={13} /> Sign In
              </Link>
              <Link href="/register" className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] hover:from-[#a00000] hover:to-[#8B0000] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#8B0000]/20">
                Join Free
              </Link>
              <Link href="/register" className="md:hidden px-3 py-1.5 bg-[#8B0000] text-white rounded-lg text-xs font-bold">Join</Link>
            </>
          )}
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
