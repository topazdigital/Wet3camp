

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'


export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24">
        <Header />
        <div className="w-full px-3 sm:px-4 py-4">
          <h1 className="text-3xl font-bold text-text-light mb-4">Testimonials</h1>
          <p className="text-text-muted">User testimonials and reviews</p>
        </div>
      </div>
    </main>
  )
}
