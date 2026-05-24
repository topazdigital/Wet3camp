'use client'

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default function TemplatePage() {
  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24">
        <Header />

        <main className="w-full px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-light mb-1">Page Title</h1>
              <p className="text-text-muted text-sm">Page description goes here</p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card-bg rounded-lg border border-color p-4 hover:border-secondary-color transition-colors cursor-pointer">
                  <div className="w-full aspect-video bg-dark-bg rounded-lg mb-3 flex items-center justify-center">
                    <p className="text-text-muted">Content {i}</p>
                  </div>
                  <h3 className="text-light font-bold text-sm mb-2">Item {i}</h3>
                  <p className="text-text-muted text-xs leading-relaxed">Brief description of the content item goes here with relevant details.</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
