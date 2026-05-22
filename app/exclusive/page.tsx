'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export const dynamic = 'force-dynamic'

export default function ExclusivePage() {

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
          <h1 className="text-2xl sm:text-3xl font-bold text-text-light mb-4">Exclusive Content</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer">
                <div className="w-full aspect-video bg-gray-700 relative">
                  <img 
                    src={`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=225&fit=crop&q=${i}`} 
                    alt={`Exclusive content ${i + 1}`}
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">EXCLUSIVE</div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-text-light text-sm mb-1">Premium Content {i + 1}</h3>
                  <p className="text-xs text-secondary-color">Subscribe to view</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
