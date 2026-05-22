'use client'

import { useState } from 'react'
import { Heart, Share2, MessageCircle, MapPin, Star, Clock, Check, X, Phone, MessageSquare } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('about')

  const profile = {
    name: 'Bisola',
    age: 24,
    location: 'Lekki, Lagos, Nigeria',
    tier: 'elite',
    rating: 4.8,
    reviews: 342,
    phone: '+234 (0) 801 234 5678',
    whatsapp: '+234 (0) 801 234 5678',
    verified: true,
    followers: 1234,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
    ],
    bio: 'Hi! I am Bisola, a luxury service provider in Lagos. I offer tailored experiences for sophisticated clients. Available for dinner dates, events, and private meetings.',
    services: [
      { name: 'Video Call', available: true },
      { name: 'Voice Call', available: true },
      { name: 'In-Call', available: true },
      { name: 'Out-Call', available: false },
      { name: 'Travel', available: true },
    ],
    pricing: {
      hourly: 500,
      overnight: 2500,
      video: 200,
    },
    availability: {
      monday: { available: true, from: '18:00', to: '23:00' },
      tuesday: { available: true, from: '18:00', to: '23:00' },
      wednesday: { available: false },
      thursday: { available: true, from: '18:00', to: '23:00' },
      friday: { available: true, from: '12:00', to: '23:59' },
      saturday: { available: true, from: '12:00', to: '23:59' },
      sunday: { available: true, from: '18:00', to: '22:00' },
    },
    languages: ['English', 'Yoruba', 'French'],
    bodyType: 'Curvy',
    ethnicity: 'Nigerian',
    hairColor: 'Black',
    height: '5\'6"',
  }

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden">
        <Header />

        <main className="w-full px-3 sm:px-4 py-4 sm:py-8">
          {/* Profile Header Section - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
            {/* Main Image */}
            <div className="lg:col-span-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[3/4] w-full">
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />

                {/* Tier Badge */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-elite-color text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm">
                  ★ ELITE
                </div>

                {/* Available Badge */}
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-available-green text-dark-bg px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                  <Check size={14} className="sm:w-4 sm:h-4" />
                  <span>Available</span>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 p-2 sm:p-3 rounded-full bg-white/90 hover:bg-white transition-colors"
                >
                  <Heart
                    size={18}
                    className={`sm:w-6 sm:h-6 ${isFavorite ? 'fill-primary-color text-primary-color' : 'text-dark-bg'}`}
                  />
                </button>
              </div>

              {/* Photo Gallery */}
              <div className="grid grid-cols-4 gap-2 mt-2 sm:mt-4">
                {profile.gallery.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            </div>

            {/* Profile Info */}
            <div className="lg:col-span-2">
              {/* Name and Location */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-4 mb-1 sm:mb-2 flex-wrap">
                  <h1 className="text-2xl sm:text-4xl font-bold text-light">{profile.name}</h1>
                  <span className="text-lg sm:text-2xl text-text-muted">{profile.age}</span>
                  {profile.verified && <span className="text-xs sm:text-sm bg-green-500/20 text-green-400 px-2 sm:px-3 py-1 rounded-full">✓ Verified</span>}
                </div>
                <div className="flex items-center gap-2 text-secondary-color mb-2 sm:mb-4 text-sm sm:text-base">
                  <MapPin size={16} className="sm:w-5 sm:h-5" />
                  <span>{profile.location}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base">
                  <div className="flex gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`sm:w-5 sm:h-5 ${i < Math.floor(profile.rating) ? 'fill-secondary-color text-secondary-color' : 'text-text-muted'}`}
                      />
                    ))}
                  </div>
                  <span className="text-light font-semibold">{profile.rating}</span>
                  <span className="text-text-muted">({profile.reviews})</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-6 bg-card-bg rounded-xl border border-color text-sm sm:text-base">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-secondary-color">₦{profile.pricing.hourly}</div>
                  <div className="text-text-muted text-xs sm:text-sm">Per Hour</div>
                </div>
                <div className="text-center border-x border-color">
                  <div className="text-lg sm:text-2xl font-bold text-secondary-color">₦{profile.pricing.overnight}</div>
                  <div className="text-text-muted text-xs sm:text-sm">Overnight</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-secondary-color">₦{profile.pricing.video}</div>
                  <div className="text-text-muted text-xs sm:text-sm">Video Call</div>
                </div>
              </div>

              {/* Contact Section - Phone & WhatsApp */}
              <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-6">
                <a
                  href={`tel:${profile.phone.replace(/\s/g, '')}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                >
                  <Phone size={16} className="sm:w-5 sm:h-5" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${profile.whatsapp.replace(/\s/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                >
                  <MessageSquare size={16} className="sm:w-5 sm:h-5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                <button className="bg-primary-color hover:bg-[#A00000] text-white py-2 sm:py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                  <MessageCircle size={16} className="sm:w-5 sm:h-5" />
                  <span>Chat</span>
                </button>
                <button className="bg-vip-color hover:bg-[#E63E00] text-white py-2 sm:py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                  <Heart size={16} className="sm:w-5 sm:h-5" />
                  <span>Book</span>
                </button>
                <button className="bg-card-bg hover:bg-[#252525] text-light py-2 sm:py-3 rounded-lg font-semibold transition-colors border border-color flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                  <Share2 size={16} className="sm:w-5 sm:h-5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Bio */}
              <div className="p-3 sm:p-6 bg-card-bg rounded-xl border border-color">
                <h3 className="text-base sm:text-lg font-semibold text-light mb-2 sm:mb-3">About Me</h3>
                <p className="text-text-light text-sm sm:text-base leading-relaxed">{profile.bio}</p>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-card-bg rounded-xl border border-color overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-color overflow-x-auto">
              {['about', 'services', 'availability', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 sm:py-4 px-2 sm:px-6 font-semibold transition-colors text-center text-xs sm:text-base whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-primary-color text-white'
                      : 'text-text-muted hover:text-light'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-3 sm:p-6">
              {activeTab === 'about' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  <div>
                    <p className="text-text-muted text-xs sm:text-sm mb-1 sm:mb-2">Body Type</p>
                    <p className="text-light font-semibold text-sm">{profile.bodyType}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs sm:text-sm mb-1 sm:mb-2">Ethnicity</p>
                    <p className="text-light font-semibold text-sm">{profile.ethnicity}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs sm:text-sm mb-1 sm:mb-2">Hair Color</p>
                    <p className="text-light font-semibold text-sm">{profile.hairColor}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs sm:text-sm mb-1 sm:mb-2">Height</p>
                    <p className="text-light font-semibold text-sm">{profile.height}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-text-muted text-xs sm:text-sm mb-1 sm:mb-2">Languages</p>
                    <div className="flex gap-2 flex-wrap">
                      {profile.languages.map((lang) => (
                        <span key={lang} className="bg-primary-color/20 text-secondary-color px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'services' && (
                <div className="space-y-2 sm:space-y-3">
                  {profile.services.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-2 sm:p-4 bg-dark-bg rounded-lg text-sm sm:text-base">
                      <span className="text-light font-semibold">{service.name}</span>
                      {service.available ? (
                        <span className="flex items-center gap-1 sm:gap-2 text-yes-color font-semibold text-xs sm:text-sm">
                          <Check size={16} className="sm:w-5 sm:h-5" /> Available
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 sm:gap-2 text-no-color font-semibold text-xs sm:text-sm">
                          <X size={16} className="sm:w-5 sm:h-5" /> Not Available
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'availability' && (
                <div className="space-y-2">
                  {Object.entries(profile.availability).map(([day, info]) => (
                    <div key={day} className="flex items-center justify-between p-2 sm:p-4 bg-dark-bg rounded-lg text-sm">
                      <span className="text-light font-semibold capitalize">{day}</span>
                      {info.available ? (
                        <span className="text-yes-color font-semibold text-xs sm:text-sm">
                          {info.from} - {info.to}
                        </span>
                      ) : (
                        <span className="text-no-color font-semibold text-xs sm:text-sm">Not Available</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="p-2 sm:p-4 bg-dark-bg rounded-lg border border-color">
                      <div className="flex items-center justify-between mb-1 sm:mb-2 flex-wrap gap-2">
                        <p className="text-light font-semibold text-sm">Anonymous Client</p>
                        <div className="flex gap-0.5 sm:gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className="sm:w-4 sm:h-4 fill-secondary-color text-secondary-color" />
                          ))}
                        </div>
                      </div>
                      <p className="text-text-light text-xs sm:text-sm">Great experience! Highly recommended. Professional and friendly.</p>
                      <p className="text-text-muted text-xs mt-1 sm:mt-2">2 weeks ago</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
