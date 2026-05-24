'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star, Heart, MapPin } from 'lucide-react'
import Link from 'next/link'

interface FeaturedCard {
  id: number
  name: string
  location: string
  rating: number
  reviews: number
  image: string
  tier: 'free' | 'standard' | 'premium' | 'vip' | 'elite'
  price: number
}

const MOCK_FEATURED: FeaturedCard[] = [
  { id: 1, name: 'Amara', location: 'Nairobi CBD', rating: 4.9, reviews: 156, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop', tier: 'elite', price: 5000 },
  { id: 2, name: 'Zara', location: 'Westlands', rating: 4.8, reviews: 142, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop', tier: 'vip', price: 4000 },
  { id: 3, name: 'Luna', location: 'Karen', rating: 4.7, reviews: 128, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=600&fit=crop', tier: 'premium', price: 3000 },
  { id: 4, name: 'Sophia', location: 'Kilimani', rating: 4.6, reviews: 115, image: 'https://images.unsplash.com/photo-1494761681033-6461ffad8d80?w=500&h=600&fit=crop', tier: 'standard', price: 2000 },
  { id: 5, name: 'Elena', location: 'South B', rating: 4.5, reviews: 98, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop', tier: 'standard', price: 1500 },
  { id: 6, name: 'Jasmine', location: 'Eastleigh', rating: 4.7, reviews: 134, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=600&fit=crop', tier: 'premium', price: 2500 },
]

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'elite':
      return 'bg-red-600'
    case 'vip':
      return 'bg-orange-500'
    case 'premium':
      return 'bg-yellow-500'
    case 'standard':
      return 'bg-gray-500'
    default:
      return 'bg-gray-400'
  }
}

const getTierLabel = (tier: string) => {
  switch (tier) {
    case 'elite':
      return 'Bed a Hot ⭐'
    case 'vip':
      return 'VIP'
    case 'premium':
      return 'Premium'
    case 'standard':
      return 'Standard'
    default:
      return 'New'
  }
}

export default function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  // Infinite carousel with smooth animation
  useEffect(() => {
    if (!isAutoPlay) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % MOCK_FEATURED.length)
    }, 6000) // 6 seconds rotation

    return () => clearInterval(interval)
  }, [isAutoPlay])

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + MOCK_FEATURED.length) % MOCK_FEATURED.length)
    setIsAutoPlay(false)
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % MOCK_FEATURED.length)
    setIsAutoPlay(false)
  }

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlay(false)
  }

  return (
    <div className="bg-market-bg py-4 px-3 sm:px-4 w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-text-light">Bed & Hot Featured</h2>
            <p className="text-xs text-text-muted">Top rated profiles</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-card-bg rounded-lg transition text-text-light"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-card-bg rounded-lg transition text-text-light"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Featured Carousel - Responsive cards */}
        <div className="overflow-hidden rounded-lg">
          <div className="flex gap-2 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {MOCK_FEATURED.map((card) => (
              <div
                key={card.id}
                className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 relative h-64 overflow-hidden rounded-lg"
              >
                <Link href={`/profile/${card.id}`}>
                  {/* Background Image */}
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover hover:scale-105 transition"
                  />

                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  {/* Tier Badge */}
                  <div className={`absolute top-2 left-2 px-2 py-1 ${getTierColor(card.tier)} text-white font-bold rounded text-xs`}>
                    {getTierLabel(card.tier)}
                  </div>

                  {/* Favorite Button */}
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition"
                  >
                    <Heart size={16} className="text-white" fill="white" />
                  </button>

                  {/* Info at Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-base font-bold mb-1">{card.name}</h3>

                    <div className="flex items-center gap-1 mb-2">
                      <MapPin size={12} />
                      <p className="text-xs">{card.location}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-secondary-color text-secondary-color" />
                      <span className="font-bold text-xs">{card.rating}</span>
                      <span className="text-xs opacity-80">({card.reviews})</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {MOCK_FEATURED.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 rounded-full transition ${
                index === currentIndex ? 'bg-secondary-color w-6' : 'bg-gray-600'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
