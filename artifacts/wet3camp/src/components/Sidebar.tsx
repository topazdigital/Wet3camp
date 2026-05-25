import { Flame, Home, Radio, Newspaper, Star, ShoppingBag, Megaphone, Calendar, Video, Hotel, Plane, MessageSquare, Heart, Ban, MessageCircle, HelpCircle, Mail, Shield, Smartphone, CalendarCheck, X, Menu } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useState, useEffect } from 'react'
import { useSidebar } from '@/lib/sidebar-context'
import { useAuth } from '@/lib/auth-context'

const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { icon: Home,          label: 'Home',            href: '/' },
      { icon: Radio,         label: 'Live',            href: '/live',    badge: 'LIVE', badgeColor: '#E91E63' },
      { icon: Newspaper,     label: 'Feeds',           href: '/feeds' },
      { icon: MessageSquare,  label: 'Messages',        href: '/messages' },
      { icon: CalendarCheck, label: 'Bookings',        href: '/bookings' },
      { icon: Heart,         label: 'My Favorites',    href: '/favorites' },
    ],
  },
  {
    title: 'Discover',
    items: [
      { icon: Star,          label: 'Exclusive',       href: '/exclusive', badge: 'VIP', badgeColor: '#FF4500' },
      { icon: ShoppingBag,   label: 'Premium Shop',    href: '/shop' },
      { icon: Megaphone,     label: 'Adverts',         href: '/adverts' },
      { icon: Calendar,      label: 'Events',          href: '/events' },
      { icon: Video,         label: 'Videos',          href: '/videos' },
      { icon: Hotel,         label: 'Rooms',           href: '/rooms' },
      { icon: Plane,         label: 'Tours',           href: '/tours' },
    ],
  },
  {
    title: 'Community',
    items: [
      { icon: Star,          label: 'Reviews',         href: '/reviews' },
      { icon: Ban,           label: 'Blacklisted',     href: '/blacklist' },
      { icon: MessageCircle, label: 'Testimonials',    href: '/testimonials' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle,    label: 'FAQs',            href: '/faqs' },
      { icon: Mail,          label: 'Contact Admin',   href: '/contact' },
      { icon: Smartphone,    label: 'Install App',     href: '/install', highlight: true },
    ],
  },
]

export default function Sidebar() {
  const [clientReady, setClientReady] = useState(false)
  const [localIsOpen, setLocalIsOpen] = useState(true)
  const [localIsMobile, setLocalIsMobile] = useState(false)
  const [location] = useLocation()
  const { isAdmin } = useAuth()

  let isOpen = localIsOpen, setIsOpen = setLocalIsOpen, isMobile = localIsMobile
  try {
    const ctx = useSidebar()
    isOpen = ctx.isOpen; setIsOpen = ctx.setIsOpen; isMobile = ctx.isMobile
  } catch (_) {}

  useEffect(() => {
    setClientReady(true)
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setLocalIsMobile(mobile)
      setLocalIsOpen(!mobile)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isActive = (href: string) => href === '/' ? location === '/' : location.startsWith(href)

  return (
    <>
      <aside
        className={`${
          isMobile ? 'fixed' : 'relative hidden lg:flex lg:flex-col'
        } left-0 top-0 ${
          isMobile ? 'h-screen' : 'min-h-screen h-auto'
        } bg-card-bg border-r border-color overflow-y-auto transition-all duration-300 z-40 flex-shrink-0 ${
          isOpen ? (isMobile ? 'w-64' : 'w-60') : (isMobile ? '-translate-x-full w-64' : 'w-[60px]')
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-color sticky top-0 bg-card-bg z-10 flex-shrink-0 ${isOpen ? 'px-4 gap-3' : 'px-0 justify-center'}`}>
          {isOpen && (
            <Link href="/" className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center shadow-lg flex-shrink-0">
                <Flame size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-light leading-none">
                  Wet3<span className="text-secondary-color">Camp</span>
                </p>
                <p className="text-[10px] text-text-muted leading-tight mt-0.5">Premium Platform</p>
              </div>
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-dark-bg transition-colors text-text-muted hover:text-text-light flex-shrink-0"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.title} className={si > 0 ? 'mt-1' : ''}>
              {isOpen && (
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  {section.title}
                </p>
              )}
              {!isOpen && si > 0 && <div className="h-px mx-3 bg-color my-2" />}
              <div className="space-y-0.5 px-2">
                {/* Admin panel link injected here for admins only */}
                {isAdmin && section.title === 'Support' && (
                  <Link
                    href="/admin"
                    onClick={() => isMobile && setIsOpen(false)}
                    title={!isOpen ? 'Admin Panel' : ''}
                    className={`flex items-center rounded-lg transition-all duration-150 group relative ${isOpen ? 'px-3 py-2 gap-3' : 'px-0 py-2 justify-center'} ${location.startsWith('/admin') ? 'bg-[#8B0000]/20 text-[#8B0000] border border-[#8B0000]/30' : 'text-text-muted hover:bg-dark-bg hover:text-text-light'}`}
                  >
                    <Shield size={16} className={`flex-shrink-0 ${location.startsWith('/admin') ? 'text-[#8B0000]' : ''}`} />
                    {isOpen && <span className="text-sm truncate flex-1 font-medium">Admin Panel</span>}
                  </Link>
                )}
                {section.items.map(item => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && setIsOpen(false)}
                      title={!isOpen ? item.label : ''}
                      className={`flex items-center rounded-lg transition-all duration-150 group relative ${
                        isOpen ? 'px-3 py-2 gap-3' : 'px-0 py-2 justify-center'
                      } ${
                        active
                          ? 'bg-[#8B0000]/20 text-[#8B0000] border border-[#8B0000]/30'
                          : item.highlight
                            ? 'bg-gradient-to-r from-[#8B0000]/20 to-transparent text-secondary-color hover:from-[#8B0000]/30'
                            : 'text-text-muted hover:bg-dark-bg hover:text-text-light'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={`flex-shrink-0 ${active ? 'text-[#8B0000]' : item.highlight ? 'text-secondary-color' : ''}`}
                      />
                      {isOpen && (
                        <span className="text-sm truncate flex-1 font-medium">{item.label}</span>
                      )}
                      {isOpen && item.badge && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0"
                          style={{ backgroundColor: item.badgeColor }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {!isOpen && active && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#8B0000] rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom CTA */}
        {isOpen && (
          <div className="p-3 border-t border-color">
            <div className="bg-gradient-to-br from-[#8B0000]/30 to-[#1a0000] rounded-xl p-3 border border-[#8B0000]/20">
              <p className="text-xs font-bold text-text-light mb-1">List Your Profile</p>
              <p className="text-[10px] text-text-muted mb-2.5 leading-snug">Start earning today — verified profiles get 3× more bookings.</p>
              <Link href="/register" className="block text-center text-xs font-bold py-1.5 rounded-lg bg-[#8B0000] text-white hover:bg-[#a00000] transition-colors">
                Register as Escort
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile toggle button */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 left-4 w-11 h-11 rounded-full bg-[#8B0000] text-white z-50 hover:bg-[#a00000] transition-all shadow-lg shadow-[#8B0000]/40 flex items-center justify-center"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
