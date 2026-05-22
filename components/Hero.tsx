'use client'

import React from 'react'
import { ChevronRight, Star, Zap } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-b from-market-bg to-dark-bg py-16 md:py-32 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary-color rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary-color rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-market-bg border border-market-border rounded-full mb-8">
            <Zap size={16} className="text-secondary-color" />
            <span className="text-text-muted text-sm">Premium Booking Platform Trusted by Thousands</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-text-light mb-6 leading-tight">
            Discover Premium
            <span className="block bg-gradient-to-r from-secondary-color to-primary-color bg-clip-text text-transparent">
              Services & Professionals
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-text-muted mb-8 max-w-2xl mx-auto">
            Connect with verified professionals offering premium services. Browse profiles, check availability, and book your perfect experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="px-8 py-4 bg-primary-color hover:bg-opacity-90 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
              Browse Now
              <ChevronRight size={20} />
            </button>
            <button className="px-8 py-4 bg-transparent border border-market-border hover:border-secondary-color text-text-light rounded-lg font-semibold transition">
              Become a Professional
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-market-border">
            <div>
              <p className="text-2xl md:text-3xl font-bold text-secondary-color">5000+</p>
              <p className="text-text-muted text-sm mt-2">Verified Professionals</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-secondary-color">50K+</p>
              <p className="text-text-muted text-sm mt-2">Happy Customers</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-secondary-color">100%</p>
              <p className="text-text-muted text-sm mt-2">Secure & Private</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold text-secondary-color">24/7</p>
              <p className="text-text-muted text-sm mt-2">Customer Support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
