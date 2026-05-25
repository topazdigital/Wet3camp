import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Star, Quote, MapPin, CheckCircle2 } from 'lucide-react'
import { Link } from 'wouter'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'

const TESTIMONIALS = [
  { id:1, name:'John K.',  city:'Nairobi CBD',   role:'Client',  rating:5, date:'2 days ago',  text:'Best platform in Kenya by far. Amara K. was absolutely stunning, professional and made the whole evening extraordinary. Booking was seamless and discreet.', verified:true, avatar:'J' },
  { id:2, name:'Mike O.',  city:'Westlands',     role:'Client',  rating:5, date:'1 week ago',  text:'Used the platform three times now. Each time exceeded expectations. Zara M. is a goddess — beautiful, intelligent and wonderful company at my business dinner.', verified:true, avatar:'M' },
  { id:3, name:'Amara K.',city:'Nairobi CBD',   role:'Escort',  rating:5, date:'3 days ago',  text:'As an escort, this platform has transformed my business. I went from struggling to find clients to being fully booked weeks ahead. The verification process also makes me feel safe.', verified:true, avatar:'A' },
  { id:4, name:'David L.', city:'Karen',          role:'Client',  rating:5, date:'2 weeks ago', text:'I was skeptical at first but Wet3 Camp is the real deal. All profiles are genuine and verified. Luna K. was everything her profile said and more. 10/10.', verified:true, avatar:'D' },
  { id:5, name:'Priya S.', city:'Lavington',     role:'Escort',  rating:5, date:'5 days ago',  text:'The admin team is very responsive. I had a question about pricing and they helped me within the hour. My bookings have increased by 400% since joining.', verified:true, avatar:'P' },
  { id:6, name:'Paul M.',  city:'Kisumu',        role:'Client',  rating:4, date:'1 month ago', text:'Great experience with Adhiambo from Kisumu. The geo-filtering feature showed me local escorts first which saved time. Only minor suggestion: add more payment options.', verified:true, avatar:'P' },
  { id:7, name:'Wanjiku G.',city:'Mombasa',    role:'Escort',  rating:5, date:'1 week ago',  text:'Being at the coast, I was worried I would only get tourist clients. But the platform brings me a great mix of locals and visitors. My profile gets 500+ views daily.', verified:true, avatar:'W' },
  { id:8, name:'Chris R.', city:'Nakuru',        role:'Client',  rating:5, date:'3 weeks ago', text:'Sandra from Nakuru was absolutely perfect for my conference event. Professional, elegant and totally discreet. Will definitely use this platform again on my next trip.', verified:true, avatar:'C' },
]

export default function TestimonialsPage() {
  useSEO({
    title: 'Client Testimonials — Wet3 Camp Reviews',
    description: 'Read real testimonials from clients and escorts on Wet3 Camp. Discover why Kenya trusts us for premium companion bookings.',
    keywords: 'Wet3 Camp reviews, escort platform testimonials Kenya, companion booking reviews',
    canonicalPath: '/testimonials',
  })
  const [filter, setFilter] = useState('All')
  const { isLoggedIn } = useAuth()
  const [writeOpen, setWriteOpen] = useState(false)
  const [myText, setMyText] = useState('')
  const [myRating, setMyRating] = useState(5)
  const [submitted, setSubmitted] = useState(false)

  const filtered = TESTIMONIALS.filter(t => filter==='All'||t.role===filter)
  const avgRating = (TESTIMONIALS.reduce((s,t)=>s+t.rating,0)/TESTIMONIALS.length).toFixed(1)

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>

        {/* Hero quote */}
        <div className="w-full relative py-10 px-5 sm:px-12 border-b border-color overflow-hidden text-center" style={{background:'linear-gradient(135deg,#8B000015,#FFD70010)'}}>
          <Quote size={40} className="text-[#FFD700]/30 mx-auto mb-3"/>
          <h1 className="text-3xl font-black text-text-light mb-2">Real Experiences</h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto">Over 50,000 satisfied clients and escorts share their stories. Real reviews from real people.</p>
          <div className="flex items-center justify-center gap-6 mt-5">
            <div className="text-center"><p className="text-2xl font-black text-[#FFD700]">{avgRating}★</p><p className="text-[10px] text-text-muted">Average Rating</p></div>
            <div className="w-px h-8 bg-color"/>
            <div className="text-center"><p className="text-2xl font-black text-text-light">50K+</p><p className="text-[10px] text-text-muted">Reviews</p></div>
            <div className="w-px h-8 bg-color"/>
            <div className="text-center"><p className="text-2xl font-black text-[#28a745]">98%</p><p className="text-[10px] text-text-muted">Positive</p></div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-b border-color flex items-center justify-between">
          <div className="flex items-center gap-2">
            {['All','Client','Escort'].map(f=><button key={f} onClick={()=>setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter===f?'bg-[#8B0000] text-white':'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{f}</button>)}
          </div>
          {isLoggedIn && (
            <button onClick={()=>setWriteOpen(v=>!v)} className="px-4 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold rounded-xl hover:bg-[#FFD700]/20 transition-all">Write a Review</button>
          )}
        </div>

        <div className="px-4 sm:px-6 py-5">
          {writeOpen && (
            <div className="mb-6 bg-card-bg border border-[#FFD700]/20 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-text-light mb-4">Share Your Experience</h3>
              {submitted ? (
                <div className="flex items-center gap-2 text-[#28a745]"><CheckCircle2 size={16}/>Thank you! Your review is pending approval.</div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Your Rating</p>
                    <div className="flex gap-2">{[1,2,3,4,5].map(i=><button key={i} onClick={()=>setMyRating(i)}><Star size={22} className={i<=myRating?'fill-[#FFD700] text-[#FFD700]':'text-text-muted'}/></button>)}</div>
                  </div>
                  <textarea value={myText} onChange={e=>setMyText(e.target.value)} rows={4} placeholder="Share your honest experience…" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all resize-none"/>
                  <button onClick={()=>{if(myText.length>20){setSubmitted(true);setTimeout(()=>{setSubmitted(false);setWriteOpen(false);setMyText('');setMyRating(5)},3000)}}} className="px-6 py-2.5 bg-[#FFD700] text-black font-bold text-xs rounded-xl hover:bg-[#e6c000] transition-all">Submit Review</button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t=>(
              <div key={t.id} className="bg-card-bg border border-color rounded-2xl p-5 hover:border-[#FFD700]/30 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B0000] to-[#FFD700] flex items-center justify-center text-white font-black text-sm flex-shrink-0">{t.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-text-light text-sm">{t.name}</p>
                      {t.verified && <CheckCircle2 size={12} className="text-[#28a745]" fill="#28a745"/>}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${t.role==='Client'?'bg-[#2196F3]/20 text-[#2196F3]':'bg-[#8B0000]/20 text-[#8B0000]'}`}>{t.role}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin size={9} className="text-text-muted"/>
                      <span className="text-[10px] text-text-muted">{t.city}</span>
                      <span className="text-[10px] text-text-muted">· {t.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(i=><Star key={i} size={12} className={i<=t.rating?'fill-[#FFD700] text-[#FFD700]':'text-text-muted'}/>)}</div>
                <p className="text-xs text-text-muted leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>

          {!isLoggedIn && (
            <div className="mt-8 text-center p-6 bg-card-bg border border-color rounded-2xl">
              <p className="text-sm font-bold text-text-light mb-2">Want to share your experience?</p>
              <p className="text-xs text-text-muted mb-4">Create an account to leave a review and help the community.</p>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B0000] text-white font-bold text-sm rounded-xl hover:bg-[#a00000] transition-all">Join Free & Review</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
