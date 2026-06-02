import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Calendar, MapPin, Users, Clock, Ticket, Star, Filter } from 'lucide-react'
import { Link } from 'wouter'
import { useSEO } from '@/lib/useSEO'

const EVENTS = [
  { id:1, title:'VIP Nairobi Mixer', date:'Sat, Jun 7 2026', time:'8:00 PM', venue:'Sankara Hotel, Westlands', city:'Nairobi', price:5000, capacity:50, attending:38, escorts:8, category:'Mixer', image:'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=250&fit=crop', featured:true },
  { id:2, title:'Mombasa Beach Party',date:'Sun, Jun 8 2026', time:'6:00 PM', venue:'Nyali Beach Club',city:'Mombasa', price:3000, capacity:100, attending:72, escorts:12, category:'Party', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop', featured:true },
  { id:3, title:'Elite Dinner Soirée', date:'Fri, Jun 13 2026',time:'7:30 PM', venue:'Radisson Blu, Upperhill', city:'Nairobi', price:8000, capacity:30, attending:24, escorts:6, category:'Dinner', image:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop', featured:false },
  { id:4, title:'Kisumu Lakeside Night',date:'Sat, Jun 14 2026',time:'9:00 PM', venue:'Acacia Premier Hotel',city:'Kisumu', price:2000, capacity:80, attending:45, escorts:7, category:'Mixer', image:'https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=400&h=250&fit=crop', featured:false },
  { id:5, title:'Karen Garden Party',  date:'Sun, Jun 15 2026',time:'4:00 PM', venue:'Karen Country Club',city:'Nairobi', price:4000, capacity:60, attending:41, escorts:10, category:'Party', image:'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=250&fit=crop', featured:false },
  { id:6, title:'Coast Cultural Night',  date:'Fri, Jun 20 2026',time:'7:00 PM', venue:'Fort Jesus, Mombasa',city:'Mombasa', price:2500, capacity:120, attending:88, escorts:15, category:'Cultural', image:'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=250&fit=crop', featured:false },
]

const CATS = ['All','Mixer','Party','Dinner','Cultural']
const CITIES = ['All','Nairobi','Mombasa','Kisumu']

export default function EventsPage() {
  useSEO({
    title: 'Escort Events Kenya',
    description: 'Find exclusive adult events, social mixers and escort events in Nairobi, Mombasa and across Kenya.',
    keywords: 'escort events Kenya, adult events Nairobi, escort events Kenya',
    canonicalPath: '/events',
  })
  const [cat, setCat] = useState('All')
  const [city, setCity] = useState('All')
  const filtered = EVENTS.filter(e => (cat==='All'||e.category===cat) && (city==='All'||e.city===city))

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Hero */}
        <div className="w-full relative h-40 bg-gradient-to-r from-[#4CAF50]/20 to-[#8B0000]/20 border-b border-color overflow-hidden flex items-end">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&h=300&fit=crop')] bg-cover bg-center opacity-10"/>
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"/><span className="text-xs text-[#4CAF50] font-bold uppercase tracking-widest">Events</span></div>
            <h1 className="text-3xl font-black text-text-light">Exclusive Events</h1>
            <p className="text-sm text-text-muted mt-1">Curated social gatherings with verified escorts — Nairobi, Mombasa & beyond</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-6 py-3 border-b border-color flex flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={13} className="text-text-muted flex-shrink-0"/>
            {CATS.map(c=><button key={c} onClick={()=>setCat(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${cat===c?'bg-[#4CAF50] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <MapPin size={13} className="text-text-muted flex-shrink-0"/>
            {CITIES.map(c=><button key={c} onClick={()=>setCity(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${city===c?'bg-[#8B0000] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <p className="text-xs text-text-muted mb-4">{filtered.length} upcoming events</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ev => (
              <div key={ev.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#4CAF50]/50 hover:shadow-lg hover:shadow-[#4CAF50]/10 transition-all group">
                <div className="relative h-44 overflow-hidden">
                  <img src={ev.image} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                  {ev.featured && <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#FFD700] text-black text-[10px] font-black rounded-full">★ FEATURED</div>}
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 text-white text-[10px] font-bold rounded-full">{ev.category}</div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-white font-black text-sm">KES {ev.price.toLocaleString()}<span className="text-white/60 text-[10px] font-normal"> /person</span></span>
                    <span className="text-[10px] text-white/70">{ev.escorts} escorts attending</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-text-light text-sm mb-2">{ev.title}</h3>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-[11px] text-text-muted"><Calendar size={11}/>{ev.date} · {ev.time}</div>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted"><MapPin size={11}/>{ev.venue}</div>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted"><Users size={11}/>{ev.attending}/{ev.capacity} attending</div>
                  </div>
                  <div className="w-full h-1.5 bg-dark-bg rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-[#4CAF50] rounded-full" style={{width:`${(ev.attending/ev.capacity)*100}%`}}/>
                  </div>
                  <button className="w-full py-2.5 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <Ticket size={12}/> Book Ticket
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
