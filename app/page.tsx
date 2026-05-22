'use client'

import Header from '@/components/Header'
import FeaturedCarousel from '@/components/FeaturedCarousel'
import InfiniteEscortGrid from '@/components/InfiniteEscortGrid'

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-bg">
      <Header />
      <FeaturedCarousel />
      <div className="max-w-full">
        <div className="px-3 sm:px-4 py-2 border-b border-color">
          <h2 className="text-sm font-bold text-text-light">Browse All Services</h2>
          <p className="text-xs text-text-muted">Location based - showing Nairobi first</p>
        </div>
        <InfiniteEscortGrid />
      </div>
    </main>
  )
}
