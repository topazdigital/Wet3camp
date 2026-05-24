

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import FeaturedCarousel from '@/components/FeaturedCarousel'
import InfiniteEscortGrid from '@/components/InfiniteEscortGrid'


export default function Home() {

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      {/* Desktop Sidebar - Hidden on mobile */}
      <Sidebar />

      {/* Main Content - Full width on mobile, flex-1 on desktop */}
      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24">
        <Header />
        <FeaturedCarousel />
        <div className="w-full">
          <div className="px-3 sm:px-4 py-2 border-b border-color">
            <h2 className="text-sm font-bold text-text-light">Browse All Services</h2>
            <p className="text-xs text-text-muted">Location based - showing Nairobi first</p>
          </div>
          <InfiniteEscortGrid />
        </div>
      </div>
    </main>
  )
}
