

import React from 'react'
import { Crown, Zap, Shield, Award } from 'lucide-react'

export default function Featured() {
  return (
    <section className="bg-card-bg py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-light mb-2">Why Choose Wet3.Camp?</h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            We provide the most secure, private, and professional booking platform for premium services
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Feature 1 */}
          <div className="bg-market-bg border border-market-border rounded-lg p-8 hover:border-secondary-color transition">
            <div className="w-12 h-12 bg-primary-color/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="text-primary-color" size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-light mb-2">100% Secure</h3>
            <p className="text-text-muted text-sm">
              Bank-level encryption and advanced security protocols protect your data and privacy
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-market-bg border border-market-border rounded-lg p-8 hover:border-secondary-color transition">
            <div className="w-12 h-12 bg-secondary-color/20 rounded-lg flex items-center justify-center mb-4">
              <Award className="text-secondary-color" size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-light mb-2">Verified Professionals</h3>
            <p className="text-text-muted text-sm">
              All professionals are thoroughly vetted and verified to ensure authenticity and quality
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-market-bg border border-market-border rounded-lg p-8 hover:border-secondary-color transition">
            <div className="w-12 h-12 bg-vip-color/20 rounded-lg flex items-center justify-center mb-4">
              <Crown className="text-vip-color" size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-light mb-2">Premium Experience</h3>
            <p className="text-text-muted text-sm">
              Exclusive features and priority support for a seamless booking and service experience
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-market-bg border border-market-border rounded-lg p-8 hover:border-secondary-color transition">
            <div className="w-12 h-12 bg-available-green/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-available-green" size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-light mb-2">Fast & Easy</h3>
            <p className="text-text-muted text-sm">
              Simple booking process with instant confirmation and flexible scheduling options
            </p>
          </div>
        </div>

        {/* Premium Tiers */}
        <div className="mt-16 pt-16 border-t border-color">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-text-light mb-2">Service Tiers</h3>
            <p className="text-text-muted">Choose the perfect tier for your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Standard Tier */}
            <div className="bg-market-bg border border-market-border rounded-lg p-8">
              <div className="px-3 py-1 bg-available-green/20 text-available-green text-xs font-bold rounded w-fit mb-4">
                STANDARD
              </div>
              <h4 className="text-xl font-bold text-text-light mb-6">Standard</h4>
              <p className="text-3xl font-bold text-text-light mb-6">From<br /><span className="text-available-green">$100</span></p>
              <ul className="space-y-3 mb-8 text-text-muted text-sm">
                <li>✓ Verified profile</li>
                <li>✓ Standard messaging</li>
                <li>✓ Basic booking tools</li>
              </ul>
              <button className="w-full px-4 py-2 bg-transparent border border-market-border hover:border-secondary-color text-text-light rounded-lg font-medium transition">
                Browse Profiles
              </button>
            </div>

            {/* Premium Tier */}
            <div className="bg-market-bg border border-market-border rounded-lg p-8">
              <div className="px-3 py-1 bg-premium-color/20 text-premium-color text-xs font-bold rounded w-fit mb-4">
                PREMIUM
              </div>
              <h4 className="text-xl font-bold text-text-light mb-6">Premium</h4>
              <p className="text-3xl font-bold text-text-light mb-6">From<br /><span className="text-premium-color">$250</span></p>
              <ul className="space-y-3 mb-8 text-text-muted text-sm">
                <li>✓ Everything in Standard</li>
                <li>✓ Video verification</li>
                <li>✓ Priority support</li>
              </ul>
              <button className="w-full px-4 py-2 bg-premium-color hover:bg-opacity-90 text-black rounded-lg font-medium transition">
                Browse Profiles
              </button>
            </div>

            {/* VIP Tier */}
            <div className="bg-market-bg border border-market-border rounded-lg p-8">
              <div className="px-3 py-1 bg-vip-color/20 text-vip-color text-xs font-bold rounded w-fit mb-4">
                VIP
              </div>
              <h4 className="text-xl font-bold text-text-light mb-6">VIP</h4>
              <p className="text-3xl font-bold text-text-light mb-6">From<br /><span className="text-vip-color">$350</span></p>
              <ul className="space-y-3 mb-8 text-text-muted text-sm">
                <li>✓ Everything in Premium</li>
                <li>✓ Dedicated manager</li>
                <li>✓ Express booking</li>
              </ul>
              <button className="w-full px-4 py-2 bg-vip-color hover:bg-opacity-90 text-white rounded-lg font-medium transition">
                Browse Profiles
              </button>
            </div>

            {/* Elite Tier */}
            <div className="bg-gradient-to-br from-primary-color/20 to-secondary-color/10 border border-market-border rounded-lg p-8">
              <div className="px-3 py-1 bg-primary-color/30 text-secondary-color text-xs font-bold rounded w-fit mb-4">
                ELITE
              </div>
              <h4 className="text-xl font-bold text-text-light mb-6">Elite</h4>
              <p className="text-3xl font-bold text-text-light mb-6">From<br /><span className="text-secondary-color">$500</span></p>
              <ul className="space-y-3 mb-8 text-text-muted text-sm">
                <li>✓ Everything in VIP</li>
                <li>✓ Concierge service</li>
                <li>✓ Exclusive access</li>
              </ul>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-primary-color to-secondary-color hover:opacity-90 text-white rounded-lg font-medium transition">
                Browse Profiles
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
