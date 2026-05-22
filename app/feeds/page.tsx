'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default function FeedsPage() {

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar />
      </div>

      <div className="lg:hidden">
        <Sidebar />
      </div>

      <div className="flex-1 w-full overflow-x-hidden">
        <Header />
        <div className="px-3 sm:px-4 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-light mb-4 sm:mb-6">Feeds & Updates</h1>
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-lg p-3 sm:p-4">
                <div className="flex gap-2 sm:gap-3 mb-3">
                  <img src={`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&q=${i}`} alt={`Provider ${i + 1}`} className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-light text-sm truncate">Provider {i + 1}</h3>
                    <p className="text-xs text-text-muted">2 hours ago</p>
                  </div>
                </div>
                <p className="text-text-light text-xs sm:text-sm mb-3">Just updated my availability! Check out my latest photos and availability.</p>
                <img src={`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop&q=${i}`} alt={`Update ${i + 1}`} className="w-full aspect-video object-cover rounded mb-3" />
                <div className="flex gap-3 sm:gap-4 text-text-muted text-xs sm:text-sm">
                  <button className="hover:text-secondary-color transition">❤️ Like</button>
                  <button className="hover:text-secondary-color transition">💬 Comment</button>
                  <button className="hover:text-secondary-color transition">↗️ Share</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
