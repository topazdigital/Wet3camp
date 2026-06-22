import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Calendar, MapPin, Users, Ticket, Filter, PartyPopper } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

const CATS   = ['All', 'Mixer', 'Party', 'Dinner', 'Cultural', 'VIP']
const CITIES = ['All', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru']

export default function EventsPage() {
  useSEO({
    title: 'Escort Events Kenya',
    description: 'Find exclusive adult events, social mixers and escort events in Nairobi, Mombasa and across Kenya.',
    keywords: 'escort events Kenya, adult events Nairobi, escort events Kenya',
    canonicalPath: '/events',
  })
  const [cat, setCat]     = useState('All')
  const [city, setCity]   = useState('All')
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (cat  !== 'All') params.set('cat', cat)
    if (city !== 'All') params.set('city', city)
    setLoading(true)
    fetch(`/api/events?${params}`)
      .then(r => r.json())
      .then(d => { setEvents(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cat, city])

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Hero */}
        <div className="w-full relative h-40 bg-gradient-to-r from-[#4CAF50]/20 to-[#8B0000]/20 border-b border-color overflow-hidden flex items-end">
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
              <span className="text-xs text-[#4CAF50] font-bold uppercase tracking-widest">Events</span>
            </div>
            <h1 className="text-3xl font-black text-text-light">Exclusive Events</h1>
            <p className="text-sm text-text-muted mt-1">Curated social gatherings with verified escorts — Nairobi, Mombasa & beyond</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-6 py-3 border-b border-color flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={13} className="text-text-muted flex-shrink-0" />
            {CATS.map(c => <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${cat === c ? 'bg-[#4CAF50] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <MapPin size={13} className="text-text-muted flex-shrink-0" />
            {CITIES.map(c => <button key={c} onClick={() => setCity(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${city === c ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card-bg border border-color rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-dark-bg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-dark-bg rounded w-3/4" />
                    <div className="h-3 bg-dark-bg rounded w-1/2" />
                    <div className="h-8 bg-dark-bg rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PartyPopper size={48} className="text-[#4CAF50]/30 mb-4" />
              <h2 className="text-lg font-bold text-text-light mb-2">No Events Scheduled</h2>
              <p className="text-sm text-text-muted max-w-xs mb-5">
                Events are added by the platform team. Check back soon — VIP mixers and private dinners are coming.
              </p>
              <a href="mailto:admin@wet3.camp" className="px-5 py-2.5 bg-[#4CAF50] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all">
                Submit Your Event
              </a>
            </div>
          )}

          {/* Events grid */}
          {!loading && events.length > 0 && (
            <>
              <p className="text-xs text-text-muted mb-4">{events.length} upcoming events</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(ev => (
                  <div key={ev.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#4CAF50]/50 hover:shadow-lg hover:shadow-[#4CAF50]/10 transition-all group">
                    <div className="relative h-44 overflow-hidden">
                      {ev.image_url
                        ? <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full bg-gradient-to-br from-[#4CAF50]/20 to-[#8B0000]/20 flex items-center justify-center"><PartyPopper size={40} className="text-[#4CAF50]/40" /></div>
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      {ev.featured && <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#FFD700] text-black text-[10px] font-black rounded-full">★ FEATURED</div>}
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 text-white text-[10px] font-bold rounded-full">{ev.category}</div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-white font-black text-sm">KES {Number(ev.price || 0).toLocaleString()}<span className="text-white/60 text-[10px] font-normal"> /person</span></span>
                        {ev.escorts > 0 && <span className="text-[10px] text-white/70">{ev.escorts} escorts attending</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-text-light text-sm mb-2">{ev.title}</h3>
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-[11px] text-text-muted"><Calendar size={11} />{ev.event_date} {ev.event_time && `· ${ev.event_time}`}</div>
                        {ev.venue && <div className="flex items-center gap-2 text-[11px] text-text-muted"><MapPin size={11} />{ev.venue}</div>}
                        {ev.capacity > 0 && (
                          <div className="flex items-center gap-2 text-[11px] text-text-muted"><Users size={11} />{ev.attending}/{ev.capacity} attending</div>
                        )}
                      </div>
                      {ev.capacity > 0 && (
                        <div className="w-full h-1.5 bg-dark-bg rounded-full mb-3 overflow-hidden">
                          <div className="h-full bg-[#4CAF50] rounded-full" style={{ width: `${Math.min(100, ((ev.attending || 0) / ev.capacity) * 100)}%` }} />
                        </div>
                      )}
                      <button className="w-full py-2.5 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                        <Ticket size={12} /> Book Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
