'use client'

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default function ShopPage() {
  const products = [
    { id: 1, name: 'Luxury Collection Set', price: 'KES 8,500', category: 'Premium', image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=300&h=400&fit=crop', rating: 4.8 },
    { id: 2, name: 'Beginners Bundle', price: 'KES 3,200', category: 'Starter', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=400&fit=crop', rating: 4.6 },
    { id: 3, name: 'Professional Grade', price: 'KES 12,000', category: 'Premium', image: 'https://images.unsplash.com/photo-1551431009-381d36ac3a4b?w=300&h=400&fit=crop', rating: 4.9 },
    { id: 4, name: 'Discreet Travel Kit', price: 'KES 4,500', category: 'Travel', image: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300&h=400&fit=crop', rating: 4.7 },
    { id: 5, name: 'Couples Bundle', price: 'KES 15,000', category: 'Premium', image: 'https://images.unsplash.com/photo-1576091160550-112173faf00e?w=300&h=400&fit=crop', rating: 4.8 },
    { id: 6, name: 'Solo Pleasure Pro', price: 'KES 6,800', category: 'Popular', image: 'https://images.unsplash.com/photo-1549887534-f2cb8a4e6d1a?w=300&h=400&fit=crop', rating: 4.9 },
  ]

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24">
        <Header />
        
        <div className="w-full">
          <div className="px-3 sm:px-4 py-4 border-b border-color">
            <h1 className="text-3xl font-bold text-text-light mb-2">Premium Shop</h1>
            <p className="text-text-muted text-sm">Discreet, quality products delivered safely</p>
          </div>

          {/* Filter Tags */}
          <div className="px-3 sm:px-4 py-3 border-b border-color flex gap-2 overflow-x-auto">
            {['All', 'Premium', 'Starter', 'Popular', 'Travel'].map((tag) => (
              <button
                key={tag}
                className="px-4 py-1.5 rounded-full text-sm font-medium flex-shrink-0 bg-dark-bg border border-color text-text-light hover:border-secondary-color transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="px-3 sm:px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((product) => (
                <div key={product.id} className="bg-card-bg rounded-lg overflow-hidden border border-color hover:border-secondary-color transition-all group cursor-pointer">
                  <div className="relative w-full aspect-[3/4] overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-secondary-color text-black px-2 py-1 rounded text-xs font-bold">
                      {product.category}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-text-light mb-1 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-secondary-color font-bold text-sm">{product.price}</span>
                      <span className="text-xs text-text-muted">★ {product.rating}</span>
                    </div>
                    <button className="w-full bg-primary-color hover:bg-[#A00000] text-white py-2 rounded text-xs font-semibold transition-colors">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
