import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Play, Lock, Eye, Clock, Star, Zap, Crown } from 'lucide-react'
import { Link } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'

const VIDEOS = [
  { id:1, title:'Private Session with Amara K.', escort:'Amara K.', duration:'18:24', views:12450, rating:4.9, thumbnail:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=250&fit=crop', tier:'elite', locked:true, price:2500 },
  { id:2, title:'Zara M. — VIP Exclusive', escort:'Zara M.', duration:'22:10', views:8920, rating:4.8, thumbnail:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=250&fit=crop', tier:'vip', locked:true, price:1500 },
  { id:3, title:'Luna K. Room Tour',escort:'Luna K.', duration:'8:45', views:5340, rating:4.7, thumbnail:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=250&fit=crop', tier:'free', locked:false, price:0 },
  { id:4, title:'Sophia N. Introduction',escort:'Sophia N.', duration:'5:20', views:3210, rating:4.6, thumbnail:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=250&fit=crop', tier:'free', locked:false, price:0 },
  { id:5, title:'Priya S. — Premium Content', escort:'Priya S.', duration:'31:05', views:21000, rating:5.0, thumbnail:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=250&fit=crop', tier:'elite', locked:true, price:3500 },
  { id:6, title:'Fatuma H. — Coast Session', escort:'Fatuma H.', duration:'15:33', views:9870, rating:4.8, thumbnail:'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=250&fit=crop', tier:'premium', locked:true, price:1200 },
  { id:7, title:'Grace W. — Upperhill Intro', escort:'Grace W.', duration:'6:12', views:2340, rating:4.5, thumbnail:'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=250&fit=crop', tier:'free', locked:false, price:0 },
  { id:8, title:'Naomi J. — International Client', escort:'Naomi J.', duration:'24:50', views:14200, rating:4.9, thumbnail:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=250&fit=crop', tier:'vip', locked:true, price:2000 },
]

const CATS = ['All','Free','Premium','VIP','Elite']
const tierStyle: Record<string,{bg:string,label:string}> = {
  elite:   {bg:'#8B0000',label:'ELITE'},
  vip:     {bg:'#FF4500',label:'VIP'},
  premium: {bg:'#B8860B',label:'PREMIUM'},
  free:    {bg:'#28a745',label:'FREE'},
}

export default function VideosPage() {
  useSEO({
    title: 'Escort Videos Kenya',
    description: 'Watch premium escort and companion videos in Kenya. Exclusive content from verified escorts in Nairobi and Mombasa.',
    keywords: 'escort videos Kenya, companion video content Nairobi, adult videos Kenya',
    canonicalPath: '/videos',
  })
  const [cat, setCat] = useState('All')
  const { isLoggedIn } = useAuth()
  const filtered = VIDEOS.filter(v => cat==='All'||(cat==='Free'&&!v.locked)||(cat.toLowerCase()===v.tier))

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>
        <div className="w-full relative h-40 border-b border-color overflow-hidden flex items-end" style={{background:'linear-gradient(135deg,#E91E6320,#8B000020)'}}>
          <div className="relative px-5 sm:px-8 pb-5 w-full">
            <div className="flex items-center gap-2 mb-2"><Play size={13} className="text-[#E91E63]"/><span className="text-xs text-[#E91E63] font-bold uppercase tracking-widest">Exclusive Videos</span></div>
            <h1 className="text-3xl font-black text-text-light">Escort Videos</h1>
            <p className="text-sm text-text-muted mt-1">Exclusive content from our verified escort community. Lock content requires subscription.</p>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 bg-gradient-to-r from-[#8B0000]/20 to-[#FFD700]/10 border border-[#8B0000]/30 rounded-2xl flex items-center gap-3">
            <Crown size={20} className="text-[#FFD700] flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-bold text-text-light">Unlock All Premium Videos</p>
              <p className="text-xs text-text-muted">Sign up to access exclusive escort content and unlock VIP/Elite videos</p>
            </div>
            <Link href="/register" className="px-4 py-2 bg-[#8B0000] text-white text-xs font-bold rounded-xl hover:bg-[#a00000] transition-all flex-shrink-0">Join Free</Link>
          </div>
        )}

        <div className="px-4 sm:px-6 py-3 border-b border-color">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CATS.map(c=><button key={c} onClick={()=>setCat(c)} className={`px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all ${cat===c?'bg-[#E91E63] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(v=>{
              const ts = tierStyle[v.tier]
              return (
                <div key={v.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#E91E63]/40 transition-all group cursor-pointer">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                      {v.locked && !isLoggedIn ? (
                        <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center border border-white/20"><Lock size={16} className="text-white"/></div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#E91E63]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={16} className="text-white"/></div>
                      )}
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold text-white" style={{backgroundColor:ts.bg}}>{ts.label}</div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/70 rounded-md"><Clock size={9} className="text-white"/><span className="text-[9px] text-white ml-0.5">{v.duration}</span></div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-text-light leading-snug mb-1 line-clamp-2">{v.title}</p>
                    <p className="text-[10px] text-text-muted mb-1.5">{v.escort}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-0.5 text-[10px] text-text-muted"><Eye size={9}/>{(v.views/1000).toFixed(1)}k</span>
                      {v.locked && v.price>0 ? <span className="text-[10px] font-bold text-[#FFD700]">KES {v.price.toLocaleString()}</span> : <span className="text-[10px] font-bold text-[#28a745]">Free</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
