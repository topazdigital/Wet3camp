'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-card-bg border-t border-color">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-color to-secondary-color flex items-center justify-center text-white font-bold">
                W3
              </div>
              <span className="text-text-light font-bold">Wet3.Camp</span>
            </Link>
            <p className="text-text-muted text-sm mb-6">
              Premium booking platform for exclusive services. Secure, verified, and trusted by thousands.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-text-muted hover:text-secondary-color transition">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-text-muted hover:text-secondary-color transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-text-muted hover:text-secondary-color transition">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-text-muted hover:text-secondary-color transition">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-text-light mb-4">Quick Links</h4>
            <ul className="space-y-2 text-text-muted text-sm">
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Browse Profiles
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Become a Professional
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* For Professionals */}
          <div>
            <h4 className="font-bold text-text-light mb-4">For Professionals</h4>
            <ul className="space-y-2 text-text-muted text-sm">
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="font-bold text-text-light mb-4">Support</h4>
            <ul className="space-y-2 text-text-muted text-sm">
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-secondary-color transition">
                  Safety Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-text-light mb-4">Contact</h4>
            <ul className="space-y-3 text-text-muted text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-secondary-color flex-shrink-0" />
                <a href="mailto:support@wet3.camp" className="hover:text-secondary-color transition">
                  support@wet3.camp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-secondary-color flex-shrink-0" />
                <a href="tel:+1-800-123-4567" className="hover:text-secondary-color transition">
                  +1 (800) 123-4567
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-secondary-color flex-shrink-0 mt-1" />
                <span>123 Premium Street<br />New York, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="my-12 py-8 bg-market-bg border border-market-border rounded-lg p-8">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-text-light mb-2">Stay Updated</h3>
            <p className="text-text-muted text-sm mb-4">Subscribe to our newsletter for exclusive deals and new profiles</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-dark-bg border border-border-color rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:border-secondary-color transition"
              />
              <button className="px-6 py-3 bg-primary-color hover:bg-opacity-90 text-white rounded-lg font-medium transition whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-color pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-sm text-center sm:text-left">
            © 2024 Wet3.Camp. All rights reserved. Premium booking platform.
          </p>
          <div className="flex gap-6 text-text-muted text-sm">
            <Link href="#" className="hover:text-secondary-color transition">
              Terms
            </Link>
            <Link href="#" className="hover:text-secondary-color transition">
              Privacy
            </Link>
            <Link href="#" className="hover:text-secondary-color transition">
              Cookies
            </Link>
            <Link href="#" className="hover:text-secondary-color transition">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
