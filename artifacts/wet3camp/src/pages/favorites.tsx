

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Heart } from 'lucide-react'
import { Link } from 'wouter'


export default function FavoritesPage() {
  const favorites = [
    { id: 1, name: 'Elena', age: 24, location: 'South B, Nairobi', rating: 4.8, reviews: 156, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop', tier: 'elite' },
    { id: 2, name: 'Jasmine', age: 22, location: 'Eastleigh, Nairobi', rating: 4.7, reviews: 134, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', tier: 'premium' },
    { id: 3, name: 'Victoria', age: 25, location: 'Kilimani, Nairobi', rating: 4.9, reviews: 189, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop', tier: 'vip' },
  ]

  const getTierColor = (tier) => {
    const colors = {
      elite: 'bg-elite-color',
      premium: 'bg-premium-color',
      vip: 'bg-vip-color',
    }
    return colors[tier] || 'bg-free-color'
  }

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />

      <div className="flex-1 w-full overflow-x-hidden transition-all duration-300 lg:pb-0 pb-24">
        <Header />
        
        <div className="w-full">
          <div className="px-3 sm:px-4 py-4 border-b border-color">
            <h1 className="text-3xl font-bold text-text-light mb-2">My Favorites</h1>
            <p className="text-text-muted text-sm">Your saved providers</p>
          </div>

          {/* Favorites Grid */}
          <div className="px-3 sm:px-4 py-4">
            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {favorites.map((provider) => (
                  <Link href={`/profile/${provider.id}`} key={provider.id}>
                    <div className="bg-card-bg rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer group h-full border border-color hover:border-secondary-color">
                      <div className="relative w-full aspect-[3/4] overflow-hidden">
                        <img
                          src={provider.image}
                          alt={provider.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className={`absolute top-2 left-2 px-2 py-1 ${getTierColor(provider.tier)} text-white text-xs font-bold rounded`}>
                          {provider.tier.toUpperCase().slice(0, 3)}
                        </div>
                        <button className="absolute top-2 right-2 p-1.5 bg-primary-color rounded-full text-white hover:bg-[#A00000] transition"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Heart size={16} fill="white" />
                        </button>
                      </div>

                      <div className="p-3">
                        <h3 className="font-semibold text-text-light text-sm mb-1">{provider.name}, {provider.age}</h3>
                        <p className="text-xs text-text-muted mb-2">{provider.location}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-secondary-color text-xs">★ {provider.rating}</span>
                          <span className="text-text-muted text-xs">({provider.reviews})</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Heart size={48} className="text-text-muted mb-4 opacity-50" />
                <p className="text-text-muted text-center mb-4">No favorites yet</p>
                <Link href="/" className="text-secondary-color hover:underline text-sm font-semibold">
                  Browse providers →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
