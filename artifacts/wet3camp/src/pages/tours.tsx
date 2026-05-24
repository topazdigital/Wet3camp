import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { MapPin, Clock, Star, Plane, Users, ChevronRight } from 'lucide-react'

const TOURS = [
  { id:1, title:'Nairobi Weekend Getaway', dest:'Nairobi → Nakuru', duration:'2 days', price:45000, rating:4.8, reviews:67, escorts:3, image:'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=250&fit=crop', includes:['Hotel 2 nights','Transport','Escort companion','Meals'], category:'Weekend' },
  { id:2, title:'Mombasa Beach Escape', dest:'Nairobi → Mombasa', duration:'3 days', price:75000, rating:4.9, reviews:89, escorts:5, image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop', includes:['Flight','Beachfront hotel','Escort companion','All meals','Activities'], category:'Beach' },
  { id:3, title:'Maasai Mara Safari', dest:'Nairobi → Mara', duration:'4 days', price:120000, rating:5.0, reviews:134, escorts:2, image:'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=250&fit=crop', includes:['4×4 game drives','Lodge','Escort companion','All inclusive'], category:'Safari' },
  { id:4, title:'Zanzibar Island Tour', dest:'Nairobi → Zanzibar', duration:'5 days', price:180000, rating:4.9, reviews:112, escorts:4, image:'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400&h=250&fit=crop', includes:['Flights','Luxury resort','Escort','Boat trips','Spice tour'], category:'International' },
  { id:5, title:'Diani Romantic Weekend', dest:'Mombasa → Diani', duration:'2 days', price:55000, rating:4.7, reviews:45, escorts:3, image:'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=250&fit=crop', includes:['Beach cottage','Transport','Escort companion','Dinner'], category:'Beach' },
  { id:6, title:'Mount Kenya Trek', dest:'Nairobi → Mt Kenya', duration:'3 days', price:65000, rating:4.6, reviews:38, escorts:2, image:'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=400&h=250&fit=crop', includes:['Guide','Camp accommodation','Escort','Meals','Gear'], category:'Adventure' },
]

const CATS = ['All','Weekend','Beach','Safari','International','Adventure']

export default function ToursPage() {
  const [cat, setCat] = useState('All')
  const filtered = TOURS.filter(t => cat==='All'||t.category===cat)

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>
        <div className="w-full relative h-40 border-b border-color overflow-hidden flex items-end" style={{background:'linear-gradient(135deg,#9C27B020,#8B000020)'}}>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&h=300&fit=crop')] bg-cover bg-center opacity-10"/>
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2"><Plane size={13} className="text-[#9C27B0]"/><span className="text-xs text-[#9C27B0] font-bold uppercase tracking-widest">Travel & Tours</span></div>
            <h1 className="text-3xl font-black text-text-light">Escorted Tours</h1>
            <p className="text-sm text-text-muted mt-1">Travel Kenya and beyond with a premium verified companion by your side</p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-color">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CATS.map(c=><button key={c} onClick={()=>setCat(c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${cat===c?'bg-[#9C27B0] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(t=>(
              <div key={t.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#9C27B0]/50 hover:shadow-lg hover:shadow-[#9C27B0]/10 transition-all group">
                <div className="relative h-44 overflow-hidden">
                  <img src={t.image} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#9C27B0]/80 text-white text-[10px] font-bold rounded-full">{t.category}</div>
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-black text-sm">KES {t.price.toLocaleString()}</p>
                    <p className="text-white/70 text-[10px]">per person</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-text-light text-sm mb-1">{t.title}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center gap-1 text-[11px] text-text-muted"><MapPin size={10}/>{t.dest}</span>
                    <span className="flex items-center gap-1 text-[11px] text-text-muted"><Clock size={10}/>{t.duration}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-0.5"><Star size={11} className="fill-[#FFD700] text-[#FFD700]"/><span className="text-xs font-bold text-text-light ml-0.5">{t.rating}</span><span className="text-[10px] text-text-muted">({t.reviews})</span></span>
                    <span className="flex items-center gap-1 text-[10px] text-text-muted"><Users size={10}/>{t.escorts} escorts available</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.includes.slice(0,3).map(inc=><span key={inc} className="px-2 py-0.5 bg-[#9C27B0]/10 border border-[#9C27B0]/20 text-[9px] text-[#9C27B0] rounded-full">{inc}</span>)}
                    {t.includes.length>3&&<span className="px-2 py-0.5 bg-dark-bg border border-color text-[9px] text-text-muted rounded-full">+{t.includes.length-3} more</span>}
                  </div>
                  <button className="w-full py-2.5 bg-gradient-to-r from-[#9C27B0] to-[#7B1FA2] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    Book Tour <ChevronRight size={13}/>
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
