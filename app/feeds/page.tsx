'use client'

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Heart, MessageCircle, Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function FeedsPage() {
  const feeds = [
    {
      id: 1,
      name: 'Amara',
      location: 'Lagos',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
      caption: 'Available for video calls and bookings! 🔥',
      likes: 234,
      comments: 45,
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      name: 'Zara',
      location: 'Nairobi',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
      caption: 'New photos available in my gallery! Check them out',
      likes: 567,
      comments: 89,
      timestamp: '4 hours ago',
    },
    {
      id: 3,
      name: 'Maya',
      location: 'Accra',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop',
      caption: 'Luxury experiences await! Premium services available',
      likes: 345,
      comments: 67,
      timestamp: '6 hours ago',
    },
  ]

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24">
        <Header />

        <main className="w-full px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-light mb-1">Feeds</h1>
              <p className="text-text-muted text-sm">Latest updates from escorts</p>
            </div>

            {/* Feeds Grid */}
            <div className="space-y-6">
              {feeds.map((feed) => (
                <div key={feed.id} className="bg-card-bg rounded-lg border border-color overflow-hidden">
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between border-b border-color">
                    <div>
                      <h3 className="text-light font-bold text-sm">{feed.name}</h3>
                      <p className="text-text-muted text-xs">{feed.location} • {feed.timestamp}</p>
                    </div>
                    <button className="text-text-muted hover:text-light">···</button>
                  </div>

                  {/* Image */}
                  <div className="relative aspect-square w-full overflow-hidden">
                    <img
                      src={feed.image}
                      alt={feed.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Actions */}
                  <div className="p-3 flex items-center justify-between border-b border-color text-xs sm:text-sm">
                    <button className="flex items-center gap-2 text-text-muted hover:text-primary-color transition-colors">
                      <Heart size={18} />
                      <span>{feed.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-text-muted hover:text-secondary-color transition-colors">
                      <MessageCircle size={18} />
                      <span>{feed.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 text-text-muted hover:text-light transition-colors">
                      <Share2 size={18} />
                    </button>
                  </div>

                  {/* Caption */}
                  <div className="p-4">
                    <p className="text-light text-sm leading-relaxed">{feed.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
