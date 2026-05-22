'use client'

import React from 'react'
import { Star, Heart, MapPin, Video, Camera, MessageSquare } from 'lucide-react'

interface Profile {
  id: string
  name: string
  category: 'Elite' | 'VIP' | 'Premium' | 'Standard'
  rating: number
  reviews: number
  image: string
  location: string
  price: number
  verified: boolean
  services: string[]
}

export default function ProfileGrid() {
  const profiles: Profile[] = [
    {
      id: '1',
      name: 'Alexandra Rose',
      category: 'Elite',
      rating: 4.9,
      reviews: 247,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
      location: 'New York, NY',
      price: 500,
      verified: true,
      services: ['Video', 'Photos', 'Verified'],
    },
    {
      id: '2',
      name: 'Sophia Diamond',
      category: 'VIP',
      rating: 4.8,
      reviews: 189,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
      location: 'Los Angeles, CA',
      price: 350,
      verified: true,
      services: ['Video', 'Verified'],
    },
    {
      id: '3',
      name: 'Isabella Grace',
      category: 'Premium',
      rating: 4.7,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop',
      location: 'Miami, FL',
      price: 250,
      verified: true,
      services: ['Photos', 'Verified'],
    },
    {
      id: '4',
      name: 'Emma Luxury',
      category: 'Elite',
      rating: 4.9,
      reviews: 312,
      image: 'https://images.unsplash.com/photo-1488426862026-56bde33da37a?w=400&h=500&fit=crop',
      location: 'Chicago, IL',
      price: 600,
      verified: true,
      services: ['Video', 'Photos', 'Verified'],
    },
    {
      id: '5',
      name: 'Valentina Star',
      category: 'VIP',
      rating: 4.8,
      reviews: 201,
      image: 'https://images.unsplash.com/photo-1517849845537-1d51a20414de?w=400&h=500&fit=crop',
      location: 'Seattle, WA',
      price: 300,
      verified: true,
      services: ['Video', 'Verified'],
    },
    {
      id: '6',
      name: 'Crystal Belle',
      category: 'Premium',
      rating: 4.6,
      reviews: 128,
      image: 'https://images.unsplash.com/photo-1507038957-0e6aa56aeb51?w=400&h=500&fit=crop',
      location: 'Boston, MA',
      price: 200,
      verified: true,
      services: ['Photos', 'Verified'],
    },
    {
      id: '7',
      name: 'Natasha Royale',
      category: 'Elite',
      rating: 4.95,
      reviews: 289,
      image: 'https://images.unsplash.com/photo-1494548162494-133106df6778?w=400&h=500&fit=crop',
      location: 'Las Vegas, NV',
      price: 700,
      verified: true,
      services: ['Video', 'Photos', 'Verified'],
    },
    {
      id: '8',
      name: 'Victoria Crown',
      category: 'Premium',
      rating: 4.7,
      reviews: 167,
      image: 'https://images.unsplash.com/photo-1532453288759-1c6ea36dc25d?w=400&h=500&fit=crop',
      location: 'San Francisco, CA',
      price: 280,
      verified: true,
      services: ['Video', 'Photos', 'Verified'],
    },
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Elite':
        return 'bg-elite-color'
      case 'VIP':
        return 'bg-vip-color'
      case 'Premium':
        return 'bg-premium-color'
      default:
        return 'bg-available-green'
    }
  }

  const getCategoryTextColor = (category: string) => {
    if (category === 'Premium') return 'text-black'
    return 'text-white'
  }

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-text-light mb-2">Featured Profiles</h2>
        <p className="text-text-muted">Browse our verified professionals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="group bg-card-bg border border-color rounded-lg overflow-hidden hover:border-secondary-color transition transform hover:scale-105"
          >
            {/* Image Container */}
            <div className="relative overflow-hidden h-64 sm:h-80">
              <img
                src={profile.image}
                alt={profile.name}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />

              {/* Category Badge */}
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(profile.category)} ${getCategoryTextColor(profile.category)}`}>
                {profile.category}
              </div>

              {/* Heart Button */}
              <button className="absolute top-3 right-3 p-2 bg-dark-bg/80 hover:bg-primary-color rounded-full transition text-secondary-color hover:text-white">
                <Heart size={18} />
              </button>

              {/* Services Icons */}
              <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                {profile.services.includes('Video') && (
                  <button className="flex-1 py-2 bg-video-color/90 hover:bg-video-color text-white rounded-md flex items-center justify-center gap-1 transition text-sm font-medium">
                    <Video size={14} />
                    Video
                  </button>
                )}
                {profile.services.includes('Photos') && (
                  <button className="flex-1 py-2 bg-primary-color/90 hover:bg-primary-color text-white rounded-md flex items-center justify-center gap-1 transition text-sm font-medium">
                    <Camera size={14} />
                    Photos
                  </button>
                )}
              </div>
            </div>

            {/* Content Container */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-text-light">{profile.name}</h3>
                  <div className="flex items-center gap-1 text-text-muted text-sm mt-1">
                    <MapPin size={14} />
                    {profile.location}
                  </div>
                </div>
                {profile.verified && (
                  <div className="w-6 h-6 bg-yes-color rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.floor(profile.rating) ? 'fill-secondary-color text-secondary-color' : 'text-text-muted'}
                    />
                  ))}
                </div>
                <span className="text-secondary-color font-semibold text-sm">{profile.rating}</span>
                <span className="text-text-muted text-xs">({profile.reviews})</span>
              </div>

              {/* Price */}
              <div className="mb-4 pb-4 border-t border-color">
                <p className="text-text-muted text-xs mb-1">From</p>
                <p className="text-2xl font-bold text-secondary-color">${profile.price}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-primary-color hover:bg-opacity-90 text-white rounded-lg font-medium transition text-sm">
                  View
                </button>
                <button className="flex-1 px-4 py-2 bg-transparent border border-market-border hover:border-secondary-color text-text-light rounded-lg font-medium transition text-sm flex items-center justify-center gap-1">
                  <MessageSquare size={14} />
                  Chat
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <div className="mt-12 text-center">
        <button className="px-8 py-3 bg-transparent border border-market-border hover:border-secondary-color text-text-light rounded-lg font-medium transition">
          Load More Profiles
        </button>
      </div>
    </section>
  )
}
