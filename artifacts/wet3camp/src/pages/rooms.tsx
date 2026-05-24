import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { MapPin, Star, Wifi, Car, Coffee, Shield, Filter, Hotel } from 'lucide-react'

const ROOMS = [
  { id:1, name:'Sankara Suite', hotel:'Sankara Hotel', city:'Nairobi', area:'Westlands', price:15000, rating:4.9, reviews:234, amenities:['WiFi','Parking','Breakfast','24hr Security','Pool'], image:'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=250&fit=crop', type:'Suite', available:true, perHour:2000 },
  { id:2, name:'Radisson Deluxe', hotel:'Radisson Blu', city:'Nairobi', area:'Upperhill', price:12000, rating:4.8, reviews:189, amenities:['WiFi','Parking','Gym','Restaurant'], image:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop', type:'Deluxe', available:true, perHour:1500 },
  { id:3, name:'Serena Executive', hotel:'Serena Hotel', city:'Nairobi', area:'Nairobi CBD', price:18000, rating:5.0, reviews:312, amenities:['WiFi','Valet','Pool','Spa','Restaurant'], image:'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop', type:'Executive', available:false, perHour:2500 },
  { id:4, name:'Nyali Beach Villa', hotel:'Nyali Beach Hotel', city:'Mombasa', area:'Nyali', price:10000, rating:4.7, reviews:145, amenities:['WiFi','Parking','Beach Access','Pool'], image:'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop', type:'Villa', available:true, perHour:1800 },
  { id:5, name:'PrideInn Waterfront', hotel:'PrideInn Mombasa', city:'Mombasa', area:'Mombasa CBD', price:8000, rating:4.5, reviews:98, amenities:['WiFi','Parking','Restaurant'], image:'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=250&fit=crop', type:'Standard', available:true, perHour:1200 },
  { id:6, name:'Milimani VIP Room', hotel:'Milimani Hotel', city:'Kisumu', area:'Milimani', price:6000, rating:4.4, reviews:67, amenities:['WiFi','Parking','Breakfast'], image:'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=250&fit=crop', type:'VIP', available:true, perHour:1000 },
]

const amenityIcons: Record<string, React.ReactNode> = {
  'WiFi': <Wifi size={10}/>, 'Parking': <Car size={10}/>, 'Breakfast': <Coffee size={10}/>, '24hr Security': <Shield size={10}/>
}

export default function RoomsPage() {
  const [city, setCity] = useState('All')
  const [type, setType] = useState('All')
  const cities = ['All','Nairobi','Mombasa','Kisumu']
  const types = ['All','Suite','Deluxe','Executive','Villa','VIP','Standard']
  const filtered = ROOMS.filter(r => (city==='All'||r.city===city) && (type==='All'||r.type===type))

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>
        <div className="w-full relative h-40 border-b border-color overflow-hidden flex items-end" style={{background:'linear-gradient(135deg,#FF980020,#8B000020)'}}>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=300&fit=crop')] bg-cover bg-center opacity-10"/>
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2"><Hotel size={13} className="text-[#FF9800]"/><span className="text-xs text-[#FF9800] font-bold uppercase tracking-widest">Rooms & Hotels</span></div>
            <h1 className="text-3xl font-black text-text-light">Private Rooms</h1>
            <p className="text-sm text-text-muted mt-1">Discreet, verified hotel rooms for private bookings across Kenya</p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-color flex flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <MapPin size={13} className="text-text-muted flex-shrink-0"/>
            {cities.map(c=><button key={c} onClick={()=>setCity(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${city===c?'bg-[#FF9800] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={13} className="text-text-muted flex-shrink-0"/>
            {types.map(t=><button key={t} onClick={()=>setType(t)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${type===t?'bg-[#8B0000] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{t}</button>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <p className="text-xs text-text-muted mb-4">{filtered.length} rooms available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(r=>(
              <div key={r.id} className={`bg-card-bg border rounded-2xl overflow-hidden transition-all group ${r.available?'border-color hover:border-[#FF9800]/50 hover:shadow-lg hover:shadow-[#FF9800]/10':'border-color opacity-60'}`}>
                <div className="relative h-44 overflow-hidden">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 text-white text-[10px] font-bold rounded-full">{r.type}</div>
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${r.available?'bg-[#28a745]/80 text-white':'bg-gray-600/80 text-white'}`}>{r.available?'Available':'Taken'}</div>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-black text-sm">KES {r.price.toLocaleString()}<span className="text-white/60 text-[10px] font-normal">/night</span></p>
                    <p className="text-white/70 text-[10px]">KES {r.perHour.toLocaleString()}/hr</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-text-light text-sm">{r.name}</h3>
                  <p className="text-xs text-text-muted mb-2">{r.hotel}</p>
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={11} className="text-text-muted"/>
                    <span className="text-[11px] text-text-muted">{r.area}, {r.city}</span>
                    <span className="ml-auto flex items-center gap-0.5"><Star size={11} className="fill-[#FFD700] text-[#FFD700]"/><span className="text-[11px] font-bold text-text-light">{r.rating}</span><span className="text-[10px] text-text-muted">({r.reviews})</span></span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.amenities.slice(0,4).map(a=>(
                      <span key={a} className="flex items-center gap-0.5 px-2 py-0.5 bg-dark-bg border border-color rounded-full text-[9px] text-text-muted">
                        {amenityIcons[a]||null} {a}
                      </span>
                    ))}
                  </div>
                  <button disabled={!r.available} className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${r.available?'bg-gradient-to-r from-[#FF9800] to-[#f57c00] text-white hover:opacity-90':'bg-dark-bg text-text-muted cursor-not-allowed'}`}>
                    {r.available?'Book This Room':'Not Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
