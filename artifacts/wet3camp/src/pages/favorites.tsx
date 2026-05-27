import React from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Heart, Star, MapPin, CheckCircle2, Trash2, MessageCircle } from 'lucide-react'
import { Link } from 'wouter'
import { useFavorites } from '@/lib/favorites-context'
import { useAllEscorts } from '@/hooks/useEscorts'

const tierStyle: Record<string,{bg:string,text:string,label:string}> = {
  elite:    { bg:'#8B000020', text:'#FF6B6B',  label:'ELITE'    },
  vip:      { bg:'#FF450020', text:'#FF8C00',  label:'VIP'      },
  premium:  { bg:'#B8860B20', text:'#B8860B',  label:'PREMIUM'  },
  standard: { bg:'#55555520', text:'#888',     label:'STANDARD' },
}

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavorites()
  const { escorts: apiEscorts, isLoading } = useAllEscorts()
  const escorts = apiEscorts.filter(e => favorites.has(String(e.id)))

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>

        <div className="px-4 sm:px-6 py-5 border-b border-color flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-text-light">My Favourites</h1>
            <p className="text-sm text-text-muted mt-0.5">{escorts.length} saved escort{escorts.length !== 1 ? 's' : ''}</p>
          </div>
          {escorts.length > 0 && (
            <button
              onClick={() => escorts.forEach(e => toggleFavorite(String(e.id)))}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#EF4444]/30 text-[#EF4444] text-xs rounded-xl hover:bg-[#EF4444]/10 transition-all"
            >
              <Trash2 size={12}/> Clear All
            </button>
          )}
        </div>

        <div className="px-4 sm:px-6 py-5">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card-bg border border-color rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-dark-bg" />
                  <div className="p-2.5 h-10 bg-dark-bg" />
                </div>
              ))}
            </div>
          ) : escorts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {escorts.map(e => {
                const ts = tierStyle[e.tier?.toLowerCase() ?? 'standard'] ?? tierStyle['standard']
                return (
                  <div key={e.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden group hover:border-[#8B0000]/50 hover:shadow-lg hover:shadow-[#8B0000]/10 transition-all">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Link href={`/profile/${e.id}`}>
                        {e.image ? (
                          <img src={e.image} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                        ) : (
                          <div className="w-full h-full bg-dark-bg flex items-center justify-center">
                            <span className="text-text-muted text-xs">No photo</span>
                          </div>
                        )}
                      </Link>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"/>
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{background:ts.bg, color:ts.text}}>{ts.label}</span>
                      </div>
                      {e.online && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-[#28a745] rounded-full border border-dark-bg animate-pulse"/>
                      )}
                      <button
                        onClick={() => toggleFavorite(String(e.id))}
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
                      >
                        <Heart size={12} className="fill-[#E91E63] text-[#E91E63]"/>
                      </button>
                    </div>
                    <div className="p-2.5">
                      <Link href={`/profile/${e.id}`}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-bold text-text-light text-xs truncate hover:underline">{e.name}</span>
                          {e.verified && <CheckCircle2 size={9} className="text-[#28a745] flex-shrink-0"/>}
                        </div>
                      </Link>
                      <div className="flex items-center gap-0.5 text-text-muted mb-1">
                        <MapPin size={8}/>
                        <span className="text-[9px] truncate">{e.area ? `${e.area}, ${e.city}` : e.city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          <Star size={9} className="fill-[#FFD700] text-[#FFD700]"/>
                          <span className="text-[10px] text-text-muted">{Number(e.rating || 0).toFixed(1)}</span>
                        </div>
                        {(e.pricing?.hourly ?? 0) > 0 && (
                          <span className="text-[9px] text-[#FFD700] font-bold">KES {(e.pricing.hourly).toLocaleString()}/hr</span>
                        )}
                      </div>
                      <Link href={`/profile/${e.id}`} className="mt-2 flex items-center justify-center gap-1 py-1.5 bg-dark-bg border border-color rounded-lg text-[10px] font-bold text-text-muted hover:text-text-light hover:border-text-muted transition-all">
                        <MessageCircle size={10}/> Contact
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart size={48} className="text-text-muted/30 mb-4"/>
              <h2 className="text-lg font-bold text-text-light mb-2">No favourites yet</h2>
              <p className="text-sm text-text-muted mb-6 max-w-xs">Browse escorts and tap the heart icon to save your favourites here.</p>
              <Link href="/" className="px-6 py-3 bg-[#8B0000] text-white font-bold text-sm rounded-xl hover:bg-[#a00000] transition-all">
                Browse Escorts
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
