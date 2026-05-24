

import { useState } from 'react'
import { Heart, Share2, MessageCircle, MapPin, Star, Check, X, Phone, MessageSquare } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'


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
    languages: ['English', 'Yoruba', 'French'],
    bodyType: 'Curvy',
    ethnicity: 'Nigerian',
    hairColor: 'Black',
    height: '5\'6"',
  }

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24">
        <Header />

        <main className="w-full px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Profile Header - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Main Image */}
              <div className="lg:col-span-1">
                <div className="relative rounded-xl overflow-hidden shadow-lg aspect-[3/4] w-full">
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-elite-color text-white px-3 py-1 sm:py-1.5 rounded-full font-bold text-xs sm:text-sm">
                    ★ ELITE
                  </div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 bg-available-green text-dark-bg px-2 sm:px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1">
                    <Check size={14} />
                    Available
                  </div>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                  >
                    <Heart
                      size={18}
                      className={isFavorite ? 'fill-primary-color text-primary-color' : 'text-dark-bg'}
                    />
                  </button>
                </div>

                {/* Photo Gallery */}
                <div className="grid grid-cols-4 gap-2 mt-3 sm:mt-4">
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
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-light">{profile.name}</h1>
                    <span className="text-lg sm:text-xl text-text-muted">{profile.age}</span>
                    {profile.verified && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Verified</span>}
                  </div>
                  <div className="flex items-center gap-2 text-secondary-color mb-3 text-sm">
                    <MapPin size={16} />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.floor(profile.rating) ? 'fill-secondary-color text-secondary-color' : 'text-text-muted'}
                        />
                      ))}
                    </div>
                    <span className="text-light font-semibold">{profile.rating}</span>
                    <span className="text-text-muted">({profile.reviews})</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 sm:p-4 bg-card-bg rounded-lg border border-color text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary-color">₦{profile.pricing.hourly}</div>
                    <div className="text-text-muted text-xs">Per Hour</div>
                  </div>
                  <div className="text-center border-x border-color">
                    <div className="text-lg font-bold text-secondary-color">₦{profile.pricing.overnight}</div>
                    <div className="text-text-muted text-xs">Overnight</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary-color">₦{profile.pricing.video}</div>
                    <div className="text-text-muted text-xs">Video</div>
                  </div>
                </div>

                {/* Contact Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <a
                    href={`tel:${profile.phone.replace(/\s/g, '')}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <Phone size={16} />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${profile.whatsapp.replace(/\s/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <MessageSquare size={16} />
                    WhatsApp
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button className="bg-primary-color hover:bg-[#A00000] text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm">
                    <MessageCircle size={16} />
                    Chat
                  </button>
                  <button className="bg-vip-color hover:bg-[#E63E00] text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm">
                    <Heart size={16} />
                    Book
                  </button>
                  <button className="bg-card-bg hover:bg-[#252525] text-light py-2 rounded-lg font-semibold transition-colors border border-color flex items-center justify-center gap-1 text-xs sm:text-sm">
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-card-bg rounded-lg border border-color p-4 sm:p-6 mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-light mb-3">About Me</h3>
              <p className="text-text-light text-sm sm:text-base leading-relaxed">{profile.bio}</p>
            </div>

            {/* Tabs Section */}
            <div className="bg-card-bg rounded-lg border border-color overflow-hidden">
              <div className="flex gap-0 border-b border-color overflow-x-auto">
                {['about', 'services', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 font-semibold transition-colors text-center text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-primary-color text-white'
                        : 'text-text-muted hover:text-light'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-6">
                {activeTab === 'about' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-text-muted text-xs mb-1">Body Type</p>
                      <p className="text-light font-semibold text-sm">{profile.bodyType}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Ethnicity</p>
                      <p className="text-light font-semibold text-sm">{profile.ethnicity}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Hair Color</p>
                      <p className="text-light font-semibold text-sm">{profile.hairColor}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Height</p>
                      <p className="text-light font-semibold text-sm">{profile.height}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="space-y-2">
                    {profile.services.map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-3 bg-dark-bg rounded-lg text-sm">
                        <span className="text-light font-semibold">{service.name}</span>
                        {service.available ? (
                          <span className="flex items-center gap-1 text-yes-color font-semibold text-xs">
                            <Check size={16} /> Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-no-color font-semibold text-xs">
                            <X size={16} /> Not Available
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-3">
                    {[1, 2].map((review) => (
                      <div key={review} className="p-3 bg-dark-bg rounded-lg border border-color">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <p className="text-light font-semibold text-sm">Anonymous Client</p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className="fill-secondary-color text-secondary-color" />
                            ))}
                          </div>
                        </div>
                        <p className="text-text-light text-xs sm:text-sm">Great experience! Highly recommended.</p>
                        <p className="text-text-muted text-xs mt-1">2 weeks ago</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
