'use client'

import { useState } from 'react'

interface LiveProfile {
  id: number
  name: string
  image: string
  isLive: boolean
}

const liveProfiles: LiveProfile[] = [
  { id: 1, name: 'Angel', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', isLive: true },
  { id: 2, name: 'Sexy Sam', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', isLive: true },
  { id: 3, name: 'Diamond', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', isLive: true },
  { id: 4, name: 'Jasmine', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', isLive: true },
  { id: 5, name: 'Venus', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', isLive: true },
  { id: 6, name: 'Kiara', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', isLive: true },
  { id: 7, name: 'Zara', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', isLive: true },
  { id: 8, name: 'Nina', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', isLive: true },
  { id: 9, name: 'Rosa', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', isLive: true },
]

export default function LiveProfiles() {
  return (
    <div className="bg-dark-bg py-8 border-b border-color">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-light mb-6 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-available-green animate-pulse"></span>
          Now Live
        </h2>

        {/* Horizontal Scroll Container */}
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-6 min-w-min">
            {liveProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex-shrink-0 group cursor-pointer"
              >
                {/* Profile Image Container */}
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-secondary-color/50 hover:border-secondary-color transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-110">
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Live Indicator - Bottom */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-available-green text-dark-bg px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-dark-bg rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                </div>

                {/* Name */}
                <p className="text-center text-light text-sm font-semibold mt-3 group-hover:text-secondary-color transition-colors">
                  {profile.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Hide CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
