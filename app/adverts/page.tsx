'use client'

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default function AdvertsPage() {
  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24">
        <Header />
        <div className="w-full px-3 sm:px-4 py-4">
          <h1 className="text-3xl font-bold text-text-light mb-4">Advertisements</h1>
          <p className="text-text-muted">Premium advertising space coming soon</p>
        </div>
      </div>
    </main>
  )
}
