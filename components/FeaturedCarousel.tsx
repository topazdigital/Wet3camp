'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star, Heart } from 'lucide-react'

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
  { id: 1, name: 'Amara', location: 'Nairobi CBD', rating: 4.9, reviews: 156, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=250&fit=crop', tier: 'elite', price: 5000 },
  { id: 2, name: 'Zara', location: 'Westlands', rating: 4.8, reviews: 142, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop', tier: 'vip', price: 4000 },
  { id: 3, name: 'Luna', location: 'Karen', rating: 4.7, reviews: 128, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=250&fit=crop', tier: 'premium', price: 3000 },
  { id: 4, name: 'Sophia', location: 'Kilimani', rating: 4.6, reviews: 115, image: 'https://images.unsplash.com/photo-1494761681033-6461ffad8d80?w=200&h=250&fit=crop', tier: 'standard', price: 2000 },
  { id: 5, name: 'Elena', location: 'South B', rating: 4.5, reviews: 98, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop', tier: 'standard', price: 1500 },
  { id: 6, name: 'Jasmine', location: 'Eastleigh', rating: 4.7, reviews: 134, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=250&fit=crop', tier: 'premium', price: 2500 },
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

export default function FeaturedCarousel() {
  const [position, setPosition] = useState(0)
  const cardWidth = 200 + 12
  const visibleCards = 5
  const maxPosition = (MOCK_FEATURED.length - visibleCards) * cardWidth

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => prev >= maxPosition ? 0 : prev + cardWidth)
    }, 4000)
    return () => clearInterval(interval)
  }, [maxPosition, cardWidth])

  const scroll = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setPosition(prev => Math.max(0, prev - cardWidth))
    } else {
      setPosition(prev => Math.min(maxPosition, prev + cardWidth))
    }
  }

  return (
    <div className="bg-market-bg py-3 px-3 sm:px-4">
      <div className="max-w-full">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-text-light">Featured Services</h2>
            <p className="text-xs text-text-muted">Top rated providers</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              className="p-1 hover:bg-card-bg rounded transition"
              aria-label="Previous"
            >
              <ChevronLeft size={16} className="text-text-light" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1 hover:bg-card-bg rounded transition"
              aria-label="Next"
            >
              <ChevronRight size={16} className="text-text-light" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-3 transition-transform duration-500"
            style={{ transform: `translateX(-${position}px)` }}
          >
            {MOCK_FEATURED.map((card) => (
              <div
                key={card.id}
                className="flex-shrink-0 w-40 bg-card-bg rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer group"
              >
                <div className="relative w-full h-32 overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className={`absolute top-1 left-1 px-2 py-0.5 ${getTierColor(card.tier)} text-white text-xs font-bold rounded`}>
                    {card.tier.toUpperCase()}
                  </div>
                  <button className="absolute top-1 right-1 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition">
                    <Heart size={14} className="text-white" />
                  </button>
                </div>

                <div className="p-2">
                  <h3 className="font-semibold text-text-light text-sm mb-1 truncate">{card.name}</h3>
                  <p className="text-xs text-text-muted mb-2 truncate">{card.location}</p>

                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center">
                      <Star size={12} className="fill-secondary-color text-secondary-color" />
                      <span className="text-xs font-bold text-text-light ml-0.5">{card.rating}</span>
                    </div>
                    <span className="text-xs text-text-muted">({card.reviews})</span>
                  </div>

                  <div className="text-secondary-color font-bold text-sm">
                    KES {card.price.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
