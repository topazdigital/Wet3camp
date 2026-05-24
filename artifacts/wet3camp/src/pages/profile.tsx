import React, { useState } from 'react'
import { Heart, Share2, MessageCircle, MapPin, Star, Check, X, Phone, Calendar, Clock, CheckCircle2, ChevronLeft, Flame } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Link, useRoute } from 'wouter'

const PROFILES: Record<string, any> = {
  default: {
    name: 'Amara K.', age: 24, location: 'Nairobi CBD, Nairobi', tier: 'elite', rating: 4.9, reviews: 156,
    verified: true, available: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&h=800&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=250&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=250&fit=crop',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=250&fit=crop',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=250&fit=crop',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=250&fit=crop',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=250&fit=crop',
    ],
    bio: 'Elite companion based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: [
      { name: 'Dinner Dates',       available: true  },
      { name: 'Video Calls',        available: true  },
      { name: 'Overnight',          available: true  },
      { name: 'Out-Call',           available: true  },
      { name: 'Travel Companion',   available: true  },
      { name: 'Events & Functions', available: false },
    ],
    pricing: { hourly: 8000, overnight: 50000, video: 3000 },
    languages: ['English', 'Swahili'],
    height: "5'6\"", bodyType: 'Slim/Athletic', ethnicity: 'Kenyan', hairColor: 'Black',
    reviews_data: [
      { id: 1, client: 'John K.',  rating: 5, text: 'Absolutely stunning and professional. Made the evening unforgettable.', date: '2 weeks ago' },
      { id: 2, client: 'Mike O.', rating: 5, text: 'Best escort in Nairobi. Punctual, elegant and great company.', date: '1 month ago' },
    ],
  },
}

const TIER_STYLE: Record<string, { bg: string; label: string }> = {
  elite:   { bg: '#8B0000', label: '★ ELITE' },
  vip:     { bg: '#FF4500', label: '◆ VIP'   },
  premium: { bg: '#B8860B', label: '◈ PREMIUM' },
}

export default function ProfilePage() {
  const [, params] = useRoute('/profile/:id')
  const profile = PROFILES[params?.id ?? 'default'] ?? PROFILES.default
  const [liked, setLiked] = useState(false)
  const [activeTab, setActiveTab] = useState('about')
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const tier = TIER_STYLE[profile.tier] ?? TIER_STYLE.elite

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Image Gallery — lightbox */}
        {selectedImg && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setSelectedImg(null)}>
            <img src={selectedImg} alt="Gallery" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain" />
            <button className="absolute top-5 right-5 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><X size={20} /></button>
          </div>
        )}

        <main className="w-full">
          {/* Back */}
          <div className="px-4 py-3 border-b border-color flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 text-text-muted hover:text-text-light text-xs transition-colors">
              <ChevronLeft size={15} /> Back to Browse
            </Link>
          </div>

          <div className="max-w-5xl mx-auto px-3 sm:px-5 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Left col: images */}
              <div className="lg:col-span-2">
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-color shadow-2xl">
                  <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: tier.bg }}>{tier.label}</div>

                  {profile.verified && (
                    <div className="absolute top-3 right-10 flex items-center gap-1 bg-[#28a745]/80 px-2 py-1 rounded-full">
                      <Check size={10} className="text-white" />
                      <span className="text-[9px] font-bold text-white">Verified</span>
                    </div>
                  )}

                  <button onClick={() => setLiked(v => !v)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-all">
                    <Heart size={15} className={liked ? 'fill-[#E91E63] text-[#E91E63]' : 'text-white'} />
                  </button>

                  <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${profile.available ? 'bg-[#28a745]/80 text-white' : 'bg-black/60 text-white/60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${profile.available ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                    {profile.available ? 'Available Now' : 'Busy'}
                  </div>
                </div>

                {/* Gallery thumbnails */}
                <div className="grid grid-cols-6 gap-1.5 mt-2">
                  {profile.gallery.map((img: string, i: number) => (
                    <button key={i} onClick={() => setSelectedImg(img)} className="aspect-square rounded-lg overflow-hidden border border-color hover:border-[#8B0000]/70 transition-all">
                      <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right col: info */}
              <div className="lg:col-span-3 space-y-5">
                {/* Name + stats */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-black text-text-light">{profile.name}, <span className="text-text-muted font-normal text-xl">{profile.age}</span></h1>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin size={13} className="text-text-muted" />
                        <span className="text-sm text-text-muted">{profile.location}</span>
                      </div>
                    </div>
                    <button className="p-2 text-text-muted hover:text-text-light rounded-xl hover:bg-card-bg transition-colors">
                      <Share2 size={17} />
                    </button>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} className={i <= Math.round(profile.rating) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />)}
                    </div>
                    <span className="font-bold text-text-light text-sm">{profile.rating}</span>
                    <span className="text-text-muted text-xs">({profile.reviews} reviews)</span>
                    {profile.verified && <CheckCircle2 size={14} className="text-[#28a745] ml-1" fill="#28a745" />}
                  </div>
                </div>

                {/* Pricing cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Per Hour',   val: `KES ${profile.pricing.hourly.toLocaleString()}`,    icon: Clock },
                    { label: 'Overnight',  val: `KES ${profile.pricing.overnight.toLocaleString()}`, icon: Calendar },
                    { label: 'Video Call', val: `KES ${profile.pricing.video.toLocaleString()}`,     icon: Flame },
                  ].map(({ label, val, icon: Icon }) => (
                    <div key={label} className="bg-card-bg border border-color rounded-xl p-3 text-center">
                      <Icon size={16} className="text-[#FFD700] mx-auto mb-1" />
                      <p className="font-bold text-[#FFD700] text-sm">{val}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/booking" className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#8B0000]/30 hover:from-[#a00000] hover:to-[#8B0000]">
                    <Calendar size={15} /> Book Now
                  </Link>
                  <Link href="/messages" className="flex items-center justify-center gap-2 py-3 bg-card-bg border border-color text-text-light font-semibold rounded-xl text-sm transition-all hover:border-text-muted">
                    <MessageCircle size={15} /> Message
                  </Link>
                  <a href={`tel:+254700000000`} className="flex items-center justify-center gap-2 py-2.5 bg-card-bg border border-color text-text-light font-medium rounded-xl text-sm transition-all hover:border-text-muted text-xs">
                    <Phone size={14} /> Call
                  </a>
                  <button onClick={() => setLiked(v => !v)} className={`flex items-center justify-center gap-2 py-2.5 border rounded-xl text-sm font-medium transition-all text-xs ${liked ? 'bg-[#E91E63]/10 border-[#E91E63]/40 text-[#E91E63]' : 'bg-card-bg border-color text-text-muted hover:border-text-muted'}`}>
                    <Heart size={14} className={liked ? 'fill-[#E91E63]' : ''} /> Favourite
                  </button>
                </div>

                {/* Tabs */}
                <div className="bg-card-bg rounded-2xl border border-color overflow-hidden">
                  <div className="flex border-b border-color">
                    {['about','services','reviews'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs font-semibold transition-all capitalize ${activeTab === tab ? 'text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-text-muted hover:text-text-light'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="p-4">
                    {activeTab === 'about' && (
                      <div className="space-y-4">
                        <p className="text-sm text-text-light leading-relaxed">{profile.bio}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                          {[
                            ['Languages', profile.languages.join(', ')],
                            ['Height',    profile.height],
                            ['Body Type', profile.bodyType],
                            ['Ethnicity', profile.ethnicity],
                            ['Hair',      profile.hairColor],
                          ].map(([l, v]) => (
                            <div key={l}>
                              <p className="text-[10px] text-text-muted uppercase tracking-widest">{l}</p>
                              <p className="text-sm font-semibold text-text-light mt-0.5">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeTab === 'services' && (
                      <div className="space-y-2">
                        {profile.services.map((s: any) => (
                          <div key={s.name} className="flex items-center justify-between p-2.5 bg-dark-bg rounded-xl border border-color/50 text-sm">
                            <span className="text-text-light font-medium">{s.name}</span>
                            {s.available
                              ? <span className="flex items-center gap-1 text-[#28a745] text-xs font-semibold"><Check size={13} /> Available</span>
                              : <span className="flex items-center gap-1 text-[#EF4444] text-xs font-semibold"><X size={13} /> Not Available</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === 'reviews' && (
                      <div className="space-y-3">
                        {profile.reviews_data.map((r: any) => (
                          <div key={r.id} className="p-3 bg-dark-bg rounded-xl border border-color/50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-text-light text-sm">{r.client}</p>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(i => <Star key={i} size={11} className={i <= r.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />)}
                              </div>
                            </div>
                            <p className="text-text-light text-xs leading-relaxed">{r.text}</p>
                            <p className="text-text-muted text-[10px] mt-1.5">{r.date}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
