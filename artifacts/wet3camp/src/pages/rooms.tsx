import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { MapPin, Star, Wifi, Car, Coffee, Shield, Filter, Hotel, Loader2, AlertCircle, X, Calendar, Users, Phone, Mail, MessageSquare, CheckCircle2 } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

interface Room {
  id: number
  name: string
  hotel: string
  city: string
  area: string
  type: string
  price_night: number
  price_hourly: number
  rating: number
  reviews_count: number
  amenities: string[]
  image: string | null
  available: boolean
}

const amenityIcons: Record<string, React.ReactNode> = {
  'WiFi': <Wifi size={10}/>,
  'Parking': <Car size={10}/>,
  'Breakfast': <Coffee size={10}/>,
  '24hr Security': <Shield size={10}/>,
}

function BookingModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '', checkIn: '', checkOut: '', guests: 1, notes: '' })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState<any>(null)

  const nights = (() => {
    if (!form.checkIn || !form.checkOut) return 0
    const diff = new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()
    return Math.max(0, Math.ceil(diff / 86400000))
  })()

  const totalAmount = room.price_night * Math.max(1, nights)

  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.guestName.trim() || !form.guestEmail.trim() || !form.checkIn || !form.checkOut) {
      setError('Please fill in all required fields.'); return
    }
    if (nights < 1) { setError('Check-out must be after check-in.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/rooms/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`)
      setResult(data)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Booking failed. Please try again.')
    }
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md bg-dark-bg border border-color rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-color bg-card-bg">
          <div>
            <h2 className="font-black text-text-light text-sm">Book {room.name}</h2>
            <p className="text-[10px] text-text-muted">{room.hotel} · {room.area}, {room.city}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-light hover:bg-dark-bg transition-all"><X size={16}/></button>
        </div>

        {success && result ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#28a745]/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-[#28a745]"/>
            </div>
            <h3 className="font-black text-text-light text-base">Booking Received!</h3>
            <p className="text-sm text-text-muted">Your booking has been submitted and is pending confirmation. We'll contact you within 2 hours.</p>
            <div className="bg-card-bg border border-color rounded-xl p-4 text-left space-y-2">
              <p className="text-[11px] text-text-muted"><span className="text-text-light font-semibold">Room:</span> {result.roomName}</p>
              <p className="text-[11px] text-text-muted"><span className="text-text-light font-semibold">Check-in:</span> {result.checkIn}</p>
              <p className="text-[11px] text-text-muted"><span className="text-text-light font-semibold">Check-out:</span> {result.checkOut}</p>
              <p className="text-[11px] text-text-muted"><span className="text-text-light font-semibold">Nights:</span> {result.nights}</p>
              <p className="text-[11px] text-text-muted"><span className="text-text-light font-semibold">Total:</span> <span className="text-[#FFD700] font-bold">KES {Number(result.totalAmount).toLocaleString()}</span></p>
              <p className="text-[11px] text-text-muted"><span className="text-text-light font-semibold">Confirmation email:</span> {result.guestEmail}</p>
            </div>
            <button onClick={onClose} className="w-full py-2.5 bg-[#FF9800] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
                <AlertCircle size={14} className="text-[#EF4444] flex-shrink-0"/>
                <p className="text-xs text-[#EF4444]">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card-bg border border-color rounded-xl p-3 col-span-2">
                <p className="text-[10px] text-text-muted mb-0.5">Rate</p>
                <p className="text-sm font-bold text-text-light">KES {room.price_night.toLocaleString()} / night</p>
                {nights > 0 && <p className="text-xs text-[#FF9800] font-bold mt-1">{nights} night{nights>1?'s':''} → KES {totalAmount.toLocaleString()}</p>}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1"><Users size={9}/> Full Name *</label>
              <input required value={form.guestName} onChange={e=>set('guestName',e.target.value)} placeholder="Your full name" className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#FF9800] transition-all"/>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1"><Mail size={9}/> Email Address *</label>
              <input required type="email" value={form.guestEmail} onChange={e=>set('guestEmail',e.target.value)} placeholder="your@email.com" className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#FF9800] transition-all"/>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1"><Phone size={9}/> Phone / WhatsApp</label>
              <input type="tel" value={form.guestPhone} onChange={e=>set('guestPhone',e.target.value)} placeholder="07XX XXX XXX" className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#FF9800] transition-all"/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1"><Calendar size={9}/> Check-in *</label>
                <input required type="date" min={today} value={form.checkIn} onChange={e=>set('checkIn',e.target.value)} className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FF9800] transition-all"/>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1"><Calendar size={9}/> Check-out *</label>
                <input required type="date" min={form.checkIn||today} value={form.checkOut} onChange={e=>set('checkOut',e.target.value)} className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FF9800] transition-all"/>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1"><Users size={9}/> Number of Guests</label>
              <select value={form.guests} onChange={e=>set('guests',parseInt(e.target.value))} className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FF9800] transition-all">
                {[1,2,3,4].map(n=><option key={n} value={n}>{n} guest{n>1?'s':''}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5 flex items-center gap-1"><MessageSquare size={9}/> Notes (optional)</label>
              <textarea rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Any special requests or notes…" className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/50 focus:outline-none focus:border-[#FF9800] transition-all resize-none"/>
            </div>

            <p className="text-[10px] text-text-muted">A confirmation email will be sent to your address. We'll contact you within 2 hours to confirm availability.</p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FF9800] to-[#f57c00] text-white font-black text-sm rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : null}
              {loading ? 'Submitting…' : `Book for KES ${totalAmount.toLocaleString()}`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function RoomsPage() {
  useSEO({
    title: 'Discreet Rooms Kenya — Escort Accommodation',
    description: 'Book discreet rooms and private accommodation for escort meetups in Nairobi, Mombasa and across Kenya.',
    keywords: 'discreet rooms Kenya, escort accommodation Nairobi, escort rooms Kenya',
    canonicalPath: '/rooms',
  })

  const [rooms, setRooms]         = useState<Room[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [city, setCity]           = useState('All')
  const [type, setType]           = useState('All')
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (city !== 'All') params.set('city', city)
    if (type !== 'All') params.set('type', type)
    fetch(`/api/rooms?${params.toString()}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Room[]) => setRooms(data))
      .catch(err => setError(err.message || 'Failed to load rooms'))
      .finally(() => setLoading(false))
  }, [city, type])

  const cities = ['All', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret']
  const types  = ['All', 'Suite', 'Deluxe', 'Executive', 'Villa', 'VIP', 'Standard']

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
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-[#FF9800]"/>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2.5 p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl mb-4">
              <AlertCircle size={16} className="text-[#EF4444] flex-shrink-0"/>
              <p className="text-sm text-[#EF4444]">{error === 'HTTP 503' ? 'Room listings are temporarily unavailable.' : error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <p className="text-xs text-text-muted mb-4">{rooms.length} room{rooms.length !== 1 ? 's' : ''} available</p>
              {rooms.length === 0 && (
                <div className="text-center py-16">
                  <Hotel size={40} className="text-text-muted mx-auto mb-3 opacity-40"/>
                  <p className="text-text-muted text-sm">No rooms found for this filter.</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(r=>(
                  <div key={r.id} className={`bg-card-bg border rounded-2xl overflow-hidden transition-all group ${r.available?'border-color hover:border-[#FF9800]/50 hover:shadow-lg hover:shadow-[#FF9800]/10':'border-color opacity-60'}`}>
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={r.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=250&fit=crop'}
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 text-white text-[10px] font-bold rounded-full">{r.type}</div>
                      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${r.available?'bg-[#28a745]/80 text-white':'bg-gray-600/80 text-white'}`}>{r.available?'Available':'Taken'}</div>
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white font-black text-sm">KES {r.price_night.toLocaleString()}<span className="text-white/60 text-[10px] font-normal">/night</span></p>
                        <p className="text-white/70 text-[10px]">KES {r.price_hourly.toLocaleString()}/hr</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-text-light text-sm">{r.name}</h3>
                      <p className="text-xs text-text-muted mb-2">{r.hotel}</p>
                      <div className="flex items-center gap-1.5 mb-3">
                        <MapPin size={11} className="text-text-muted"/>
                        <span className="text-[11px] text-text-muted">{r.area}, {r.city}</span>
                        <span className="ml-auto flex items-center gap-0.5">
                          <Star size={11} className="fill-[#FFD700] text-[#FFD700]"/>
                          <span className="text-[11px] font-bold text-text-light">{Number(r.rating).toFixed(1)}</span>
                          <span className="text-[10px] text-text-muted">({r.reviews_count})</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {r.amenities.slice(0,4).map(a=>(
                          <span key={a} className="flex items-center gap-0.5 px-2 py-0.5 bg-dark-bg border border-color rounded-full text-[9px] text-text-muted">
                            {amenityIcons[a]||null} {a}
                          </span>
                        ))}
                      </div>
                      <button
                        disabled={!r.available}
                        onClick={() => r.available && setBookingRoom(r)}
                        className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${r.available?'bg-gradient-to-r from-[#FF9800] to-[#f57c00] text-white hover:opacity-90':'bg-dark-bg text-text-muted cursor-not-allowed'}`}
                      >
                        {r.available?'Book This Room':'Not Available'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {bookingRoom && <BookingModal room={bookingRoom} onClose={() => setBookingRoom(null)} />}
    </main>
  )
}
