'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Bell, Heart } from 'lucide-react'
import LoginModal from './modals/LoginModal'
import RegisterModal from './modals/RegisterModal'

export default function Header() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-card-bg border-b border-color w-full">
        <div className="w-full px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-gradient-to-br from-primary-color to-secondary-color flex items-center justify-center text-white font-bold text-xs">
              W3
            </div>
            <span className="text-text-light font-bold text-xs sm:text-sm hidden sm:inline">Wet3Camp</span>
          </Link>

          {/* Desktop Search - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 mx-4 items-center">
            <input
              type="text"
              placeholder="Search by location, name..."
              className="w-full px-3 py-1.5 bg-dark-bg border border-color rounded text-xs text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color transition"
            />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            <button className="p-1.5 text-text-light hover:text-secondary-color transition rounded-lg hover:bg-dark-bg">
              <Bell size={18} />
            </button>
            <button className="p-1.5 text-text-light hover:text-secondary-color transition rounded-lg hover:bg-dark-bg">
              <Heart size={18} />
            </button>
            <div className="w-px h-5 bg-color mx-1"></div>
            <button
              onClick={() => setShowLogin(true)}
              className="px-3 py-1.5 bg-primary-color hover:bg-opacity-90 text-white rounded text-xs font-medium transition"
            >
              Login
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className="px-3 py-1.5 bg-secondary-color hover:bg-opacity-90 text-black rounded text-xs font-medium transition"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-1.5">
            <button className="p-1.5 text-text-light hover:text-secondary-color rounded-lg hover:bg-dark-bg">
              <Bell size={16} />
            </button>
            <button
              className="text-text-light p-1"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-color px-3 py-2 bg-dark-bg space-y-1.5">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-1.5 bg-card-bg border border-color rounded text-xs text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color mb-2"
            />
            <button
              onClick={() => {
                setShowLogin(true);
                setIsMobileOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-text-light hover:text-secondary-color text-sm hover:bg-card-bg rounded transition"
            >
              Login
            </button>
            <button
              onClick={() => {
                setShowRegister(true);
                setIsMobileOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-text-light hover:text-secondary-color text-sm hover:bg-card-bg rounded transition"
            >
              Sign Up
            </button>
          </div>
        )}
      </header>

      {/* Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
    </>
  )
}
