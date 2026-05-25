import React from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Heart, Star, MapPin, CheckCircle2, Trash2, MessageCircle } from 'lucide-react'
import { Link } from 'wouter'
import { ESCORTS } from '@/data/escorts'
import { useFavorites } from '@/lib/favorites-context'
import { useAllEscorts } from '@/hooks/useEscorts'

const tierStyle: Record<string,{bg:string,text:string,label:string}> = {
  Elite:    { bg:'#8B000020', text:'#8B0000', label:'ELITE'    },
  VIP:      { bg:'#FF450020', text:'#FF4500', label:'VIP'      },
  Premium:  { bg:'#B8860B20', text:'#B8860B', label:'PREMIUM'  },
  Standard: { bg:'#55555520', text:'#888',    label:'STANDARD' },
}

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavorites()
  const { escorts: apiEscorts, fromApi } = useAllEscorts()

  const allEscorts = fromApi
    ? (apiEscorts as unknown as typeof ESCORTS)
    : ESCORTS

  const escorts = allEscorts.filter(e => favorites.has(String(e.id)))

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
          {favorites.size > 0 && (
            <button
              onClick={() => escorts.forEach(e => toggleFavorite(String(e.id)))}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#EF4444]/30 text-[#EF4444] text-xs rounded-xl hover:bg-[#EF4444]/10 transition-all"
            >
              <Trash2 size={12}/> Clear All
            </button>
          )}
        </div>

        <div className="px-4 sm:px-6 py-5">
          {escorts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {escorts.map(e => {
                const ts = tierStyle[e.tier as string] ?? tierStyle['Standard']
                return (
                  <div key={e.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden group hover:border-[#8B0000]/50 hover:shadow-lg hover:shadow-[#8B0000]/10 transition-all">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Link href={`/profile/${e.id}`}>
                        <img src={e.image} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      </Link>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"/>
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold" style={{backgroundColor:ts.bg,color:ts.text}}>{ts.label}</div>
                      {e.available && <div className="absolute top-2 right-2 w-2 h-2 bg-[#28a745] rounded-full border border-dark-bg"/>}
                      <button
                        onClick={() => toggleFavorite(String(e.id))}
                        className="absolute top-2 right-2 mt-5 p-1.5 bg-[#8B0000] rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#a00000]"
                      >
                        <Heart size={11} fill="white"/>
                      </button>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white font-black text-xs">{e.name}, {e.age}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={9} className="text-white/60"/><span className="text-[9px] text-white/60">{e.area}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-0.5"><Star size={10} className="fill-[#FFD700] text-[#FFD700]"/><span className="text-[10px] font-bold text-text-light ml-0.5">{e.rating}</span></div>
                        <span className="text-[10px] font-bold text-[#FFD700]">KES {(e.pricing.hourly).toLocaleString()}/hr</span>
                      </div>
                      <div className="flex gap-1.5">
                        <Link href={`/profile/${e.id}`} className="flex-1 py-1.5 text-center text-[10px] font-bold border border-color text-text-light rounded-lg hover:border-[#FFD700] transition-all flex items-center justify-center gap-1">
                          <CheckCircle2 size={9}/> Book
                        </Link>
                        <Link href="/messages" className="py-1.5 px-2 bg-[#8B0000]/20 border border-[#8B0000]/30 text-[#8B0000] rounded-lg hover:bg-[#8B0000]/30 transition-all flex items-center justify-center">
                          <MessageCircle size={11}/>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-card-bg border border-color flex items-center justify-center">
                <Heart size={36} className="text-text-muted"/>
              </div>
              <div>
                <p className="font-bold text-text-light text-base">No favourites yet</p>
                <p className="text-sm text-text-muted mt-1">Browse profiles and tap the heart icon to save your favourites</p>
              </div>
              <Link href="/" className="px-6 py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all">
                Browse Escorts →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
