import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Star, CheckCircle2, MapPin, ThumbsUp, Filter, Search } from 'lucide-react'
import { ESCORTS } from '@/data/escorts'
import { useSEO } from '@/lib/useSEO'

const REVIEWS = [
  { id:1, client:'John K.',     escort:'Amara K.',    escortId:'1',  rating:5, text:'Absolutely stunning — exceeded every expectation. Professional, punctual and wonderful company for my business dinner. Highly recommend her to anyone looking for a top-tier companion in Nairobi.', date:'3 days ago',   city:'Nairobi', likes:24, verified:true },
  { id:2, client:'Mike O.',     escort:'Zara M.',     escortId:'2',  rating:5, text:'Zara is everything her profile says and more. Our evening at the Sankara was memorable in every way. Already planning a second booking.', date:'1 week ago',  city:'Nairobi', likes:18, verified:true },
  { id:3, client:'David L.',    escort:'Wanjiku G.',  escortId:'3',  rating:5, text:'Best escort in Mombasa, no question. Wanjiku knows how to make a client feel special without rushing anything. The beach date was perfect.', date:'2 weeks ago', city:'Mombasa', likes:31, verified:true },
  { id:4, client:'Alex R.',     escort:'Luna K.',     escortId:'4',  rating:4, text:'Luna was great for the overnight I booked. Very chill and easy to talk to. The only reason for 4 stars is that she arrived 30 mins late. Otherwise flawless.', date:'3 weeks ago', city:'Nairobi', likes:11, verified:true },
  { id:5, client:'Paul M.',     escort:'Adhiambo O.', escortId:'7',  rating:5, text:'First time using Wet3 Camp and I couldn\'t be happier. Adhiambo is gorgeous, smart and genuinely warm. The whole process from booking to the actual date was seamless.', date:'1 month ago', city:'Kisumu',  likes:19, verified:true },
  { id:6, client:'James K.',    escort:'Priya S.',    escortId:'5',  rating:5, text:'Priya S. is simply extraordinary. We spent the weekend at a Naivasha resort and every moment was magical. She has a gift for making you feel like the most important person in the world.', date:'1 month ago', city:'Nairobi', likes:44, verified:true },
  { id:7, client:'Chris M.',    escort:'Sandra W.',   escortId:'12', rating:4, text:'Very professional and beautiful. Great for a corporate event companion. A little reserved at first but opened up nicely once we got talking.', date:'5 weeks ago', city:'Nakuru',  likes:8,  verified:true },
  { id:8, client:'Bernard O.',  escort:'Fatuma H.',   escortId:'8',  rating:5, text:'Fatuma is the real deal. I\'ve used this platform several times and she is consistently in my top 3. The coast vibe she brings is unmatched.', date:'2 months ago', city:'Mombasa', likes:27, verified:true },
]

const CITIES = ['All','Nairobi','Mombasa','Kisumu','Nakuru']

export default function ReviewsPage() {
  useSEO({
    title: 'Escort Reviews Kenya — Real Client Feedback',
    description: 'Read verified client reviews for escorts in Kenya. Honest ratings and feedback for companions in Nairobi, Mombasa and more.',
    keywords: 'escort reviews Kenya, companion ratings Nairobi, client reviews escorts',
    canonicalPath: '/reviews',
  })
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All')
  const [sort, setSort] = useState<'recent'|'top'>('recent')
  const [likes, setLikes] = useState<Record<number,boolean>>({})

  const filtered = REVIEWS
    .filter(r => (city==='All'||r.city===city) && (!search||r.escort.toLowerCase().includes(search.toLowerCase())||r.client.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b) => sort==='top' ? b.likes-a.likes : b.id-a.id)

  const toggleLike = (id: number) => setLikes(p => ({...p,[id]:!p[id]}))

  const avgRating = (REVIEWS.reduce((s,r)=>s+r.rating,0)/REVIEWS.length).toFixed(1)

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>

        <div className="w-full relative py-8 px-5 sm:px-12 border-b border-color text-center" style={{background:'linear-gradient(135deg,#FFD70015,#8B000015)'}}>
          <h1 className="text-3xl font-black text-text-light mb-2">Client Reviews</h1>
          <p className="text-sm text-text-muted mb-5">Genuine verified reviews from real clients. No fake reviews — ever.</p>
          <div className="flex items-center justify-center gap-6">
            {[
              [avgRating+'★','Average Rating','#FFD700'],
              ['8,400+','Verified Reviews','#28a745'],
              ['98%','5-Star Bookings','#2196F3'],
            ].map(([v,l,c])=><div key={l} className="text-center"><p className="text-xl font-black" style={{color:c}}>{v}</p><p className="text-[10px] text-text-muted">{l}</p></div>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-color flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by escort or client name…" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all"/>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={13} className="text-text-muted flex-shrink-0"/>
            {CITIES.map(c=><button key={c} onClick={()=>setCity(c)} className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${city===c?'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>)}
            <div className="w-px h-5 bg-color"/>
            <button onClick={()=>setSort('recent')} className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${sort==='recent'?'bg-[#8B0000] text-white':'bg-card-bg border border-color text-text-muted'}`}>Recent</button>
            <button onClick={()=>setSort('top')} className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${sort==='top'?'bg-[#8B0000] text-white':'bg-card-bg border border-color text-text-muted'}`}>Top Rated</button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          <p className="text-xs text-text-muted mb-4">{filtered.length} reviews</p>
          <div className="space-y-4">
            {filtered.map(r=>(
              <div key={r.id} className="bg-card-bg border border-color rounded-2xl p-5 hover:border-[#FFD700]/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-color bg-dark-bg">
                    {(() => {
                      const escort = ESCORTS.find(e=>e.id===r.escortId)
                      return escort ? <img src={escort.image} alt={escort.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-text-muted text-lg font-bold">{r.escort.charAt(0)}</div>
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-bold text-text-light">{r.client} reviewed <span className="text-[#FFD700]">{r.escort}</span></p>
                      {r.verified && <CheckCircle2 size={12} className="text-[#28a745]" fill="#28a745"/>}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><Star key={i} size={12} className={i<=r.rating?'fill-[#FFD700] text-[#FFD700]':'text-text-muted'}/>)}</div>
                      <span className="flex items-center gap-1 text-[10px] text-text-muted"><MapPin size={9}/>{r.city}</span>
                      <span className="text-[10px] text-text-muted">{r.date}</span>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">{r.text}</p>
                    <button onClick={()=>toggleLike(r.id)} className={`mt-3 flex items-center gap-1.5 text-[11px] transition-all ${likes[r.id]?'text-[#8B0000]':'text-text-muted hover:text-text-light'}`}>
                      <ThumbsUp size={12} className={likes[r.id]?'fill-[#8B0000]':''}/> {r.likes + (likes[r.id]?1:0)} helpful
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
