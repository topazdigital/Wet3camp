'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default function ReviewsPage() {

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
        <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-light mb-4 sm:mb-6">Reviews & Ratings</h1>
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-lg p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-light text-sm truncate">Provider {i + 1}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <span key={j} className="text-sm sm:text-lg">⭐</span>
                        ))}
                      </div>
                      <span className="text-xs text-text-muted">5.0 (127)</span>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted flex-shrink-0">2d ago</span>
                </div>
                <p className="text-text-muted text-xs sm:text-sm mb-1.5 sm:mb-2">"Excellent service! Very professional and friendly. Highly recommended!"</p>
                <p className="text-xs text-text-muted">- John D.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
