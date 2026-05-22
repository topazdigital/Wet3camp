'use client'

import React, { useState, useEffect } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Star, Heart, MapPin } from 'lucide-react'
import Link from 'next/link'

interface Escort {
  id: number
  name: string
  location: string
  city: string
  rating: number
  reviews: number
  image: string
  tier: 'free' | 'standard' | 'premium' | 'vip' | 'elite'
  price: number
}

const ESCORTS_PER_PAGE = 24
const mockEscorts: Escort[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Provider ${i + 1}`,
  location: ['Nairobi CBD', 'Westlands', 'Karen', 'Kilimani', 'South B'][i % 5],
  city: i < 30 ? 'Nairobi' : i < 50 ? 'Mombasa' : i < 70 ? 'Kisumu' : 'Nakuru',
  rating: 4.2 + Math.random() * 0.8,
  reviews: 50 + Math.floor(Math.random() * 200),
  image: `https://images.unsplash.com/photo-${1494790108377 + i}?w=300&h=400&fit=crop`,
  tier: ['free', 'standard', 'premium', 'vip', 'elite'][i % 5] as 'free' | 'standard' | 'premium' | 'vip' | 'elite',
  price: (i % 5) * 1000 + 1500,
}))

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'elite':
      return 'bg-red-600'
    case 'vip':
      return 'bg-orange-500'
    case 'premium':
      return 'bg-yellow-500'
    case 'standard':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

export default function InfiniteEscortGrid() {
  const [escorts, setEscorts] = useState<Escort[]>([])
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setEscorts(mockEscorts.slice(0, ESCORTS_PER_PAGE))
  }, [])

  const fetchMore = () => {
    setTimeout(() => {
      const newEscorts = mockEscorts.slice(escorts.length, escorts.length + ESCORTS_PER_PAGE)
      if (newEscorts.length === 0) {
        setHasMore(false)
      } else {
        setEscorts(prev => [...prev, ...newEscorts])
      }
    }, 500)
  }

  return (
    <InfiniteScroll
      dataLength={escorts.length}
      next={fetchMore}
      hasMore={hasMore}
      loader={
        <div className="col-span-full flex justify-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-primary-color border-t-transparent rounded-full" />
        </div>
      }
      endMessage={
        <div className="col-span-full text-center py-4 text-text-muted text-sm">
          No more providers available
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-3 sm:px-4 py-3">
        {escorts.map((escort) => (
          <Link href={`/profile/${escort.id}`} key={escort.id}>
            <div className="bg-card-bg rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer group h-full">
              {/* Image */}
              <div className="relative w-full aspect-[3/4] overflow-hidden">
                <img
                  src={escort.image}
                  alt={escort.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                {/* Tier Badge */}
                <div className={`absolute top-1 left-1 px-2 py-1 ${getTierColor(escort.tier)} text-white text-xs font-bold rounded`}>
                  {escort.tier.toUpperCase().slice(0, 3)}
                </div>
                {/* Wishlist */}
                <button className="absolute top-1 right-1 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Heart size={14} className="text-white" />
                </button>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <h3 className="font-semibold text-text-light text-sm mb-1 truncate">{escort.name}</h3>
                
                {/* Location */}
                <div className="flex items-center gap-1 mb-1">
                  <MapPin size={11} className="text-text-muted flex-shrink-0" />
                  <p className="text-xs text-text-muted truncate">{escort.location}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-0.5">
                  <Star size={11} className="fill-secondary-color text-secondary-color flex-shrink-0" />
                  <span className="text-xs font-bold text-text-light">{escort.rating.toFixed(1)}</span>
                  <span className="text-xs text-text-muted">({escort.reviews})</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </InfiniteScroll>
  )
}
