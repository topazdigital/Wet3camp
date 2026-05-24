import React, { useState } from 'react'
import { Heart, Share2, MessageCircle, MapPin, Star, Check, X, Phone, Calendar, Clock, CheckCircle2, ChevronLeft, Flame, Shield, Eye, Ruler } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Link, useRoute } from 'wouter'
import { ESCORTS } from '@/data/escorts'
import { useAuth } from '@/lib/auth-context'

const TIER_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  Elite:    { bg: '#8B0000',  text: '#fff', label: '★ ELITE'    },
  VIP:      { bg: '#FF4500',  text: '#fff', label: '◆ VIP'      },
  Premium:  { bg: '#B8860B',  text: '#fff', label: '◈ PREMIUM'  },
  Standard: { bg: '#3a6da8',  text: '#fff', label: 'STANDARD'   },
}

export default function ProfilePage() {
  const [, params] = useRoute('/profile/:id')
  const { isLoggedIn } = useAuth()

  const escort = ESCORTS.find(e => e.id === params?.id) ?? ESCORTS[0]
  const similar = ESCORTS.filter(e => e.id !== escort.id && e.city === escort.city).slice(0, 6)

  const [liked, setLiked] = useState(false)
  const [activeTab, setActiveTab] = useState<'about'|'services'|'reviews'>('about')
  const [selectedImg, setSelectedImg] = useState<string|null>(null)
  const tier = TIER_STYLE[escort.tier] ?? TIER_STYLE.Elite

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>

        {/* Lightbox */}
        {selectedImg && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={()=>setSelectedImg(null)}>
            <img src={selectedImg} alt="Gallery" className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"/>
            <button className="absolute top-5 right-5 p-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><X size={20}/></button>
          </div>
        )}

        {/* Full-width hero */}
        <div className="relative w-full h-[55vw] max-h-[520px] min-h-[280px] overflow-hidden">
          <img src={escort.image} alt={escort.name} className="absolute inset-0 w-full h-full object-cover object-top"/>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/30 to-transparent"/>
          <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/50 to-transparent"/>

          {/* Back button */}
          <div className="absolute top-4 left-4">
            <Link href="/" className="flex items-center gap-1.5 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-xl text-white text-xs font-medium hover:bg-black/70 transition-colors">
              <ChevronLeft size={14}/> Browse
            </Link>
          </div>

          {/* Action buttons top-right */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button onClick={()=>setLiked(v=>!v)} className={`p-2.5 rounded-full backdrop-blur-sm transition-all border ${liked?'bg-[#E91E63]/20 border-[#E91E63]/50':'bg-black/50 border-white/10'}`}>
              <Heart size={18} className={liked?'fill-[#E91E63] text-[#E91E63]':'text-white'}/>
            </button>
            <button className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white hover:bg-black/70 transition-all">
              <Share2 size={18}/>
            </button>
          </div>

          {/* Tier + verified badges */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-[11px] font-black text-white shadow-lg" style={{backgroundColor:tier.bg}}>{tier.label}</span>
            {escort.verified && (
              <span className="flex items-center gap-1 px-2.5 py-1.5 bg-[#28a745]/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
                <Shield size={9}/> Verified
              </span>
            )}
            <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${escort.available?'bg-[#28a745]/80 text-white':'bg-black/60 text-white/60'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${escort.available?'bg-white animate-pulse':'bg-gray-400'}`}/>
              {escort.available?'Available Now':'Busy'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 -mt-6 relative z-10">

            {/* LEFT: main info */}
            <div className="lg:col-span-2 space-y-5">
              {/* Name + location */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-black text-text-light">{escort.name}<span className="text-text-muted font-light text-xl">, {escort.age}</span></h1>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={13} className="text-text-muted"/>
                      <span className="text-sm text-text-muted">{escort.area}, {escort.city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-0.5">
                      {[1,2,3,4,5].map(i=><Star key={i} size={13} className={i<=Math.round(escort.rating)?'fill-[#FFD700] text-[#FFD700]':'text-text-muted'}/>)}
                      <span className="font-bold text-text-light text-sm ml-1">{escort.rating}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Eye size={11} className="text-text-muted"/>
                      <span className="text-[11px] text-text-muted">{escort.reviews} reviews</span>
                      {escort.verified && <CheckCircle2 size={12} className="text-[#28a745]" fill="#28a745"/>}
                    </div>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="flex flex-wrap gap-2">
                  {[
                    [Ruler,escort.height],
                    [Shield,escort.bodyType],
                    [Flame,escort.ethnicity],
                    [Star,escort.languages.join(' · ')],
                  ].map(([Icon,val],i)=>(
                    <div key={i} className="flex items-center gap-1 px-2.5 py-1 bg-dark-bg border border-color rounded-lg text-[10px] text-text-muted">
                      {React.createElement(Icon as any,{size:10,className:'text-text-muted'})} {val}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:'Per Hour',   val:`KES ${escort.pricing.hourly.toLocaleString()}`,    icon:Clock,    color:'#8B0000' },
                  { label:'Overnight',  val:`KES ${escort.pricing.overnight.toLocaleString()}`,  icon:Calendar, color:'#FFD700' },
                  { label:'Video Call', val:`KES ${escort.pricing.video.toLocaleString()}`,      icon:Flame,    color:'#E91E63' },
                ].map(({label,val,icon:Icon,color})=>(
                  <div key={label} className="bg-card-bg border border-color rounded-2xl p-4 text-center hover:border-[#8B0000]/40 transition-all">
                    <Icon size={18} className="mx-auto mb-2" style={{color}}/>
                    <p className="font-black text-text-light text-sm">{val}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                <div className="flex border-b border-color">
                  {(['about','services','reviews'] as const).map(tab=>(
                    <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 py-3 text-xs font-semibold transition-all capitalize border-b-2 ${activeTab===tab?'text-[#FFD700] border-[#FFD700]':'text-text-muted border-transparent hover:text-text-light'}`}>{tab}</button>
                  ))}
                </div>
                <div className="p-5">
                  {activeTab === 'about' && (
                    <div className="space-y-5">
                      <p className="text-sm text-text-light leading-relaxed">{escort.bio}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          ['Languages', escort.languages.join(', ')],
                          ['Height',    escort.height],
                          ['Body Type', escort.bodyType],
                          ['Ethnicity', escort.ethnicity],
                          ['Hair',      escort.hairColor],
                          ['City',      escort.city],
                        ].map(([l,v])=>(
                          <div key={l}>
                            <p className="text-[9px] text-text-muted uppercase tracking-widest mb-0.5">{l}</p>
                            <p className="text-sm font-semibold text-text-light">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === 'services' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {escort.services.map(s=>(
                        <div key={s.name} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${s.available?'bg-dark-bg border-color':'bg-dark-bg/50 border-color/30 opacity-50'}`}>
                          <span className={`font-medium ${s.available?'text-text-light':'text-text-muted'}`}>{s.name}</span>
                          {s.available
                            ? <span className="flex items-center gap-1 text-[#28a745] font-semibold"><Check size={11}/> Yes</span>
                            : <span className="flex items-center gap-1 text-[#EF4444] font-semibold"><X size={11}/> No</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'reviews' && (
                    <div className="space-y-3">
                      {escort.reviews_data.map(r=>(
                        <div key={r.id} className="p-4 bg-dark-bg rounded-xl border border-color/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-xs font-bold text-[#8B0000]">{r.client.charAt(0)}</div>
                              <p className="font-bold text-text-light text-sm">{r.client}</p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={11} className={i<=r.rating?'fill-[#FFD700] text-[#FFD700]':'text-text-muted'}/>)}</div>
                              <span className="text-[9px] text-text-muted">{r.date}</span>
                            </div>
                          </div>
                          <p className="text-sm text-text-muted leading-relaxed">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-3">Photo Gallery</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {escort.gallery.map((img,i)=>(
                    <button key={i} onClick={()=>setSelectedImg(img)} className="aspect-square rounded-xl overflow-hidden border border-color hover:border-[#8B0000]/60 transition-all group">
                      <img src={img} alt={`Gallery ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy"/>
                    </button>
                  ))}
                </div>
              </div>

              {/* Similar escorts */}
              {similar.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-light mb-3">More in {escort.city}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {similar.map(s=>(
                      <Link key={s.id} href={`/profile/${s.id}`} className="group">
                        <div className="bg-card-bg border border-color rounded-xl overflow-hidden hover:border-[#8B0000]/40 transition-all">
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              <p className="text-white text-[9px] font-bold truncate">{s.name}</p>
                              <div className="flex items-center gap-0.5"><Star size={8} className="fill-[#FFD700] text-[#FFD700]"/><span className="text-[8px] text-white/80">{s.rating}</span></div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: sticky booking card */}
            <div className="space-y-4">
              <div className="lg:sticky lg:top-20 space-y-4">
                <div className="bg-card-bg border border-[#8B0000]/30 rounded-2xl p-5 shadow-xl shadow-black/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${escort.available?'bg-[#28a745] animate-pulse':'bg-gray-500'}`}/>
                    <span className={`text-xs font-bold ${escort.available?'text-[#28a745]':'text-text-muted'}`}>{escort.available?'Available Now':'Currently Busy'}</span>
                  </div>

                  <div className="mb-4 pb-4 border-b border-color">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Starting Rate</p>
                    <p className="text-2xl font-black text-[#FFD700]">KES {escort.pricing.hourly.toLocaleString()}<span className="text-sm font-normal text-text-muted">/hr</span></p>
                  </div>

                  <div className="space-y-2.5">
                    {isLoggedIn ? (
                      <>
                        <button className="w-full py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] hover:from-[#a00000] hover:to-[#8B0000] text-white font-black rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 flex items-center justify-center gap-2">
                          <Calendar size={15}/> Book Now
                        </button>
                        <Link href="/messages" className="w-full py-3 bg-card-bg border border-color text-text-light font-semibold rounded-xl transition-all hover:border-[#FFD700]/50 flex items-center justify-center gap-2 text-sm">
                          <MessageCircle size={14}/> Send Message
                        </Link>
                        <a href="tel:+254700000000" className="w-full py-2.5 border border-color text-text-muted font-medium rounded-xl transition-all hover:border-text-muted flex items-center justify-center gap-2 text-sm">
                          <Phone size={13}/> Call Now
                        </a>
                        <button onClick={()=>setLiked(v=>!v)} className={`w-full py-2.5 border rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${liked?'bg-[#E91E63]/10 border-[#E91E63]/40 text-[#E91E63]':'bg-dark-bg border-color text-text-muted hover:border-text-muted'}`}>
                          <Heart size={13} className={liked?'fill-[#E91E63]':''}/> {liked?'Saved':'Save to Favorites'}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2.5">
                        <Link href="/register" className="w-full py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 flex items-center justify-center gap-2">
                          Sign Up to Book
                        </Link>
                        <Link href="/login" className="w-full py-3 bg-card-bg border border-color text-text-light text-sm font-semibold rounded-xl flex items-center justify-center transition-all hover:border-text-muted">
                          Already a member? Sign In
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Safety notice */}
                <div className="bg-dark-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2"><Shield size={13} className="text-[#28a745]"/><span className="text-xs font-bold text-text-light">Safety Tips</span></div>
                  <ul className="space-y-1.5">
                    {['Always verify identity before meeting','Book through the platform for protection','Read reviews from previous clients','Trust your instincts — safety first'].map(tip=>(
                      <li key={tip} className="flex items-start gap-1.5 text-[10px] text-text-muted">
                        <Check size={9} className="text-[#28a745] mt-0.5 flex-shrink-0"/>{tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats mini */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    [escort.reviews,'Reviews'],
                    [escort.rating+'★','Rating'],
                    [(Math.floor(Math.random()*500+100)),'Profile Views'],
                    [escort.available?'Now':'Later','Availability'],
                  ].map(([v,l])=>(
                    <div key={l as string} className="bg-card-bg border border-color rounded-xl p-3 text-center">
                      <p className="font-black text-text-light text-sm">{v}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-8"/>
      </div>
    </div>
  )
}
