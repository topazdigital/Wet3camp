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
      <header className="sticky top-0 z-40 bg-card-bg border-b border-color">
        <div className="max-w-full px-3 sm:px-4 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary-color to-secondary-color flex items-center justify-center text-white font-bold text-xs">
              W3
            </div>
            <span className="text-text-light font-bold text-sm hidden sm:inline">Wet3</span>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button className="p-1.5 text-text-light hover:text-secondary-color transition">
              <Bell size={18} />
            </button>
            <button className="p-1.5 text-text-light hover:text-secondary-color transition">
              <Heart size={18} />
            </button>
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-text-light p-1"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-color px-3 py-2 bg-dark-bg space-y-1.5">
            <button
              onClick={() => {
                setShowLogin(true);
                setIsMobileOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-text-light hover:text-secondary-color text-sm"
            >
              Login
            </button>
            <button
              onClick={() => {
                setShowRegister(true);
                setIsMobileOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-text-light hover:text-secondary-color text-sm"
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
