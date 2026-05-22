'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)

  const menuItems = [
    { icon: '🏠', label: 'Home', href: '/' },
    { icon: '🔴', label: 'Live', href: '/live' },
    { icon: '📰', label: 'Feeds', href: '/feeds' },
    { icon: '✨', label: 'Exclusive', href: '/exclusive' },
    { icon: '📣', label: 'Adverts', href: '/adverts' },
    { icon: '🎉', label: 'Events', href: '/events' },
    { icon: '🎥', label: 'Naughty Videos', href: '/videos' },
    { icon: '🚪', label: 'Rooms', href: '/rooms' },
    { icon: '✈️', label: 'Tours', href: '/tours' },
    { icon: '⭐', label: 'Reviews', href: '/reviews' },
    { icon: '🚫', label: 'Blacklisted', href: '/blacklist' },
    { icon: '💬', label: 'Testimonials', href: '/testimonials' },
    { icon: '❓', label: 'FAQs', href: '/faqs' },
    { icon: '📧', label: 'Contact Admin', href: '/contact' },
    { icon: '📱', label: 'Install App', href: '/install', highlight: true },
  ]

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-card-bg border-r border-color overflow-y-auto transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-color">
          {isOpen && <h2 className="text-lg font-bold text-secondary-color">Menu</h2>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-dark-bg transition-colors text-light"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.highlight
                  ? 'bg-primary-color text-white font-semibold'
                  : 'text-light hover:bg-dark-bg'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {isOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Toggle Button for Small Screens - Only visible when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 p-3 rounded-full bg-primary-color text-white z-50 lg:hidden hover:bg-[#A00000] transition-colors"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
