import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Crown, Lock, Star, Eye, CheckCircle2 } from 'lucide-react'
import { Link } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getSlug } from '@/data/escorts'

const PACKAGES = [
  { name:'Silver', price:2500, period:'month', perks:['Exclusive profiles access','Priority messaging','No ads','HD photos'], color:'#9E9E9E' },
  { name:'Gold',   price:5000, period:'month', perks:['All Silver perks','1 free hour voucher','VIP event invites','Private live feeds','Dedicated support'], color:'#FFD700', popular:true },
  { name:'Platinum',price:12000,period:'month', perks:['All Gold perks','Unlimited bookings','Meet & greet events','Airport pickup service','24/7 concierge'], color:'#E5E4E2' },
]

export default function ExclusivePage() {
  useSEO({
    title: 'Exclusive VIP Escorts Kenya',
    description: 'Browse exclusive VIP and Elite escorts in Kenya. Premium escort packages in Nairobi, Mombasa & beyond. Verified, discreet, and top-tier.',
    keywords: 'exclusive escorts Kenya, VIP escorts Nairobi, elite escort Kenya, premium escort packages',
    canonicalPath: '/exclusive',
  })
  const [tab, setTab] = useState<'escorts'|'packages'>('escorts')
  const { isLoggedIn } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['escorts', 'elite'],
    queryFn: () => api.escorts.list({ tier: 'elite', limit: 12 }),
    staleTime: 5 * 60 * 1000,
  })
  const eliteEscorts = data?.data ?? []

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>

        <div className="w-full relative py-10 px-5 sm:px-12 border-b border-color text-center overflow-hidden" style={{background:'linear-gradient(135deg,#FFD70015,#8B000020)'}}>
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 30% 50%,#FFD700,transparent 60%),radial-gradient(circle at 70% 50%,#8B0000,transparent 60%)'}}/>
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-3"><Crown size={18} className="text-[#FFD700]"/><span className="text-xs text-[#FFD700] font-bold uppercase tracking-widest">Exclusive Members</span></div>
            <h1 className="text-3xl font-black text-text-light mb-2">Elite Escort Access</h1>
            <p className="text-sm text-text-muted max-w-md mx-auto">A curated collection of Kenya's most sought-after escorts, accessible only to exclusive members.</p>
          </div>
        </div>

        <div className="px-4 sm:px-6 border-b border-color flex gap-1">
          {[['escorts','Elite Escorts'],['packages','Membership']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t as 'escorts'|'packages')} className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all ${tab===t?'text-[#FFD700] border-[#FFD700]':'text-text-muted border-transparent hover:text-text-light'}`}>{l}</button>
          ))}
        </div>

        <div className="px-4 sm:px-6 py-5">
          {tab === 'escorts' && (
            <div>
              {!isLoggedIn && (
                <div className="mb-5 p-4 bg-gradient-to-r from-[#FFD700]/10 to-[#8B0000]/10 border border-[#FFD700]/20 rounded-2xl flex items-center gap-3">
                  <Crown size={20} className="text-[#FFD700] flex-shrink-0"/>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-light">Unlock Elite Profiles</p>
                    <p className="text-xs text-text-muted">Sign up for free to view full profiles, photos, and contact elite escorts</p>
                  </div>
                  <Link href="/register" className="flex-shrink-0 px-4 py-2 bg-[#FFD700] text-black text-xs font-black rounded-xl hover:bg-[#e6c000] transition-all">Join Free</Link>
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-card-bg border border-color rounded-2xl overflow-hidden animate-pulse">
                      <div className="aspect-[3/4] bg-dark-bg" />
                      <div className="p-2.5 h-8 bg-dark-bg" />
                    </div>
                  ))}
                </div>
              ) : eliteEscorts.length === 0 ? (
                <div className="text-center py-16">
                  <Crown size={40} className="text-[#FFD700]/30 mx-auto mb-3" />
                  <p className="text-text-muted text-sm">No elite escorts available right now.</p>
                  <p className="text-text-muted text-xs mt-1">Check back soon.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {eliteEscorts.map(e => (
                    <Link href={isLoggedIn ? `/@${getSlug(e.name)}` : '/register'} key={e.id} className="block">
                      <div className="bg-card-bg border border-[#FFD700]/20 rounded-2xl overflow-hidden group hover:border-[#FFD700]/50 hover:shadow-lg hover:shadow-[#FFD700]/10 transition-all">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          {e.image ? (
                            <img src={e.image} alt={e.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isLoggedIn?'blur-[2px]':''}`}/>
                          ) : (
                            <div className="w-full h-full bg-dark-bg flex items-center justify-center">
                              <span className="text-text-muted text-xs">No photo</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"/>
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#FFD700] text-black text-[9px] font-black rounded-md flex items-center gap-0.5"><Crown size={8}/>ELITE</div>
                          {!isLoggedIn && <div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"><Lock size={18} className="text-white"/></div></div>}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="flex items-center gap-1">
                              <p className="text-white font-black text-xs truncate">{e.name}{e.age ? `, ${e.age}` : ''}</p>
                              {e.verified && <CheckCircle2 size={9} className="text-[#28a745] flex-shrink-0" />}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <div className="flex items-center gap-0.5"><Star size={9} className="fill-[#FFD700] text-[#FFD700]"/><span className="text-[9px] text-white/80">{Number(e.rating || 0).toFixed(1)}</span></div>
                              {(e.price_hourly ?? 0) > 0 && <span className="text-[9px] text-[#FFD700] font-bold">KES {e.price_hourly.toLocaleString()}/hr</span>}
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 flex items-center justify-between">
                          <span className="text-[10px] text-text-muted truncate">{e.area ? `${e.area}, ${e.city}` : e.city}</span>
                          {e.online && <div className="w-1.5 h-1.5 bg-[#28a745] rounded-full animate-pulse flex-shrink-0"/>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'packages' && (
            <div className="max-w-3xl mx-auto">
              <p className="text-center text-sm text-text-muted mb-8">Get exclusive access to premium escorts, events and perks with a membership.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {PACKAGES.map(p=>(
                  <div key={p.name} className={`relative bg-card-bg border-2 rounded-2xl p-6 transition-all hover:scale-[1.01] ${p.popular?'border-[#FFD700] shadow-xl shadow-[#FFD700]/10':'border-color hover:border-text-muted'}`}>
                    {p.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFD700] text-black text-[10px] font-black rounded-full flex items-center gap-1"><Crown size={10}/>MOST POPULAR</div>}
                    <p className="text-xs text-text-muted uppercase tracking-widest mb-1">{p.name}</p>
                    <p className="text-2xl font-black mb-0.5" style={{color:p.color}}>KES {p.price.toLocaleString()}</p>
                    <p className="text-[11px] text-text-muted mb-5">per {p.period}</p>
                    <div className="space-y-2.5 mb-6">
                      {p.perks.map(perk=><div key={perk} className="flex items-center gap-2"><span style={{color:p.color}}>✓</span><span className="text-xs text-text-muted">{perk}</span></div>)}
                    </div>
                    <Link href="/register" className="block w-full py-3 text-center font-bold text-sm rounded-xl transition-all" style={{background:p.color,color:'#000'}}>
                      Get {p.name}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
