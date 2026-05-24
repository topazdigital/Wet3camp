

import { Menu, X } from 'lucide-react'
import { Link } from 'wouter'
import { useState, useEffect } from 'react'
import { useSidebar } from '@/lib/sidebar-context'

export default function Sidebar() {
  const [clientReady, setClientReady] = useState(false)
  const [localIsOpen, setLocalIsOpen] = useState(true)
  const [localIsMobile, setLocalIsMobile] = useState(false)

  // Try to get context, fall back to local state
  let isOpen = localIsOpen
  let setIsOpen = setLocalIsOpen
  let isMobile = localIsMobile

  try {
    const context = useSidebar()
    isOpen = context.isOpen
    setIsOpen = context.setIsOpen
    isMobile = context.isMobile
  } catch (e) {
    // Not in provider context during static generation
    // Use local state instead
  }

  useEffect(() => {
    setClientReady(true)
    const handleResize = () => {
      setLocalIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setLocalIsOpen(false)
      } else {
        setLocalIsOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems = [
    { icon: '🏠', label: 'Home', href: '/' },
    { icon: '🔴', label: 'Live', href: '/live' },
    { icon: '📰', label: 'Feeds', href: '/feeds' },
    { icon: '✨', label: 'Exclusive', href: '/exclusive' },
    { icon: '🛍️', label: 'Shop', href: '/shop' },
    { icon: '📣', label: 'Adverts', href: '/adverts' },
    { icon: '🎉', label: 'Events', href: '/events' },
    { icon: '🎥', label: 'Naughty Videos', href: '/videos' },
    { icon: '🚪', label: 'Rooms', href: '/rooms' },
    { icon: '✈️', label: 'Tours', href: '/tours' },
    { icon: '⭐', label: 'Reviews', href: '/reviews' },
    { icon: '🚫', label: 'Blacklisted', href: '/blacklist' },
    { icon: '💬', label: 'Testimonials', href: '/testimonials' },
    { icon: '❓', label: 'FAQs', href: '/faqs' },
    { icon: '💌', label: 'Messages', href: '/messages' },
    { icon: '📧', label: 'Contact Admin', href: '/contact' },
    { icon: '⚙️', label: 'Admin Panel', href: '/admin', highlight: false },
    { icon: '📱', label: 'Install App', href: '/install', highlight: true },
  ]

  return (
    <>
      {/* Sidebar - Hidden on mobile, shown on desktop via lg:flex */}
      <aside
        className={`${
          isMobile ? 'fixed' : 'relative hidden lg:flex lg:flex-col'
        } left-0 top-0 ${
          isMobile ? 'h-screen' : 'h-auto'
        } bg-card-bg border-r border-color overflow-y-auto transition-all duration-300 z-40 ${
          isOpen ? (isMobile ? 'w-64' : 'w-56 lg:w-64') : (isMobile ? '-translate-x-full' : 'w-20')
        }`}
      >
        {/* Sidebar Header - Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-color sticky top-0 bg-card-bg h-16 gap-2">
          {isOpen && (
            <Link href="/" className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-color to-secondary-color flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                W3
              </div>
              <span className="text-lg font-bold text-secondary-color truncate">Wet3Camp</span>
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-dark-bg transition-colors text-light flex-shrink-0"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                item.highlight
                  ? 'bg-primary-color text-white font-semibold'
                  : 'text-light hover:bg-dark-bg'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {isOpen && <span className="text-sm truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Menu Toggle - Only on small screens */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 p-3 rounded-full bg-primary-color text-white z-50 hover:bg-[#A00000] transition-colors shadow-lg"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
