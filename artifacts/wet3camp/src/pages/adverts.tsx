import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { TrendingUp, Eye, Star, CheckCircle2, Zap, Crown, BarChart2, Mail, Phone } from 'lucide-react'

const PACKAGES = [
  { name:'Basic', price:5000, duration:'7 days', color:'#6B7280', perks:['Profile boost in search','50% more visibility','City-level promotion','Email support'] },
  { name:'Premium', price:15000, duration:'30 days', color:'#B8860B', popular:true, perks:['Top of search results','300% more visibility','City + national promotion','Homepage feature','Priority support','Analytics dashboard'] },
  { name:'Elite', price:35000, duration:'30 days', color:'#8B0000', perks:['#1 in all searches','500% more visibility','Full national + international','Homepage banner','Dedicated account manager','Video feature slot','WhatsApp support'] },
]

const STATS = [
  { icon: Eye,      label: 'Average Profile Views',    value: '+340%', desc: 'vs non-promoted profiles' },
  { icon: TrendingUp,label: 'Booking Rate Increase',  value: '+280%', desc: 'for elite advertisers' },
  { icon: BarChart2, label: 'Active Advertisers',     value: '247',   desc: 'on the platform right now' },
  { icon: Star,      label: 'Avg Advertiser Rating',  value: '4.9',   desc: 'from satisfied promotions' },
]

export default function AdvertsPage() {
  const [contactOpen, setContactOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!name||!email) return
    setSent(true); setTimeout(()=>setSent(false),3000)
    setName(''); setEmail(''); setMessage('')
  }

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>
        <div className="w-full relative h-44 border-b border-color overflow-hidden flex items-end" style={{background:'linear-gradient(135deg,#FFD70020,#8B000020)'}}>
          <div className="relative px-5 sm:px-8 pb-6 w-full">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={13} className="text-[#FFD700]"/><span className="text-xs text-[#FFD700] font-bold uppercase tracking-widest">Advertising</span></div>
            <h1 className="text-3xl font-black text-text-light">Promote Your Profile</h1>
            <p className="text-sm text-text-muted mt-1">Reach thousands of verified clients across Kenya with our advertising packages</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-color">
          {STATS.map(s=>{
            const Icon = s.icon
            return (
              <div key={s.label} className="p-4 border-r border-color last:border-r-0 sm:last:border-r-0 sm:even:border-r-0 sm:odd:border-r sm:[&:nth-child(3)]:border-r">
                <Icon size={14} className="text-[#FFD700] mb-1.5"/>
                <p className="text-xl font-black text-text-light">{s.value}</p>
                <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{s.label}</p>
                <p className="text-[9px] text-[#28a745] mt-0.5">{s.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="px-4 sm:px-8 py-8">
          <h2 className="text-xl font-black text-text-light text-center mb-2">Choose Your Package</h2>
          <p className="text-sm text-text-muted text-center mb-8">Boost your visibility and get more bookings today</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {PACKAGES.map(p=>(
              <div key={p.name} className={`relative bg-card-bg border-2 rounded-2xl p-6 transition-all hover:scale-[1.01] ${p.popular?'border-[#FFD700] shadow-xl shadow-[#FFD700]/10':'border-color hover:border-text-muted'}`}>
                {p.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFD700] text-black text-[10px] font-black rounded-full flex items-center gap-1"><Crown size={10}/>MOST POPULAR</div>}
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{backgroundColor:p.color+'20'}}><Zap size={18} style={{color:p.color}}/></div>
                <h3 className="text-lg font-black text-text-light mb-0.5">{p.name}</h3>
                <p className="text-2xl font-black mt-2 mb-0.5" style={{color:p.color}}>KES {p.price.toLocaleString()}</p>
                <p className="text-[11px] text-text-muted mb-5">per {p.duration}</p>
                <div className="space-y-2.5 mb-6">
                  {p.perks.map(perk=><div key={perk} className="flex items-center gap-2"><CheckCircle2 size={13} style={{color:p.color}}/><span className="text-xs text-text-muted">{perk}</span></div>)}
                </div>
                <button className="w-full py-3 font-bold text-sm rounded-xl transition-all" style={{background:`linear-gradient(to right,${p.color},${p.color}cc)`,color:'#fff'}}>
                  Get {p.name}
                </button>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="max-w-lg mx-auto bg-card-bg border border-color rounded-2xl p-6">
            <h3 className="text-base font-bold text-text-light mb-1">Need a Custom Package?</h3>
            <p className="text-xs text-text-muted mb-4">Contact us for agency rates, bulk discounts, or custom advertising solutions.</p>
            {sent ? (
              <div className="flex items-center gap-2 p-4 bg-[#28a745]/10 border border-[#28a745]/20 rounded-xl"><CheckCircle2 size={16} className="text-[#28a745]"/><p className="text-sm text-[#28a745] font-semibold">Message sent! We'll respond within 2 hours.</p></div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your Name" className="px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all"/>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all"/>
                </div>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} placeholder="Tell us what you need…" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all resize-none"/>
                <button onClick={handleSend} className="w-full py-3 bg-[#FFD700] text-black font-bold text-sm rounded-xl hover:bg-[#e6c000] transition-all flex items-center justify-center gap-2">
                  <Mail size={14}/> Send Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
