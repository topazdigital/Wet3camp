

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'


export default function ExclusivePage() {
  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24">
        <Header />

        <main className="w-full px-3 sm:px-4 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-light mb-2">Exclusive Content</h1>
            <p className="text-text-muted mb-8">Premium and exclusive services</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card-bg rounded-lg border border-color overflow-hidden hover:border-secondary-color transition-colors cursor-pointer group">
                  <div className="w-full aspect-square bg-dark-bg flex items-center justify-center group-hover:bg-primary-color/20 transition-colors">
                    <p className="text-text-muted">Exclusive {i}</p>
                  </div>
                  <div className="p-4">
                    <h3 className="text-light font-bold text-sm mb-1">Premium Item {i}</h3>
                    <p className="text-text-muted text-xs">Exclusive premium content</p>
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
