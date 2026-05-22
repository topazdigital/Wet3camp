'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default function LivePage() {

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
          <h1 className="text-2xl sm:text-3xl font-bold text-text-light mb-4">Live Streams</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer">
                <div className="w-full aspect-video bg-gray-700 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl">🔴</span>
                </div>
                <div className="p-2 sm:p-3">
                  <h3 className="font-semibold text-text-light text-xs sm:text-sm mb-1 truncate">Provider {i + 1}</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                    <span>Live</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
