import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Mail, Phone, MessageCircle, MapPin, Send, CheckCircle2, Clock, Shield } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'

const TOPICS = ['General Inquiry','Booking Support','Account Issues','Payment Problem','Report a User','Escort Verification','Press & Media','Other']

export default function ContactPage() {
  useSEO({
    title: 'Contact Us — Wet3 Camp Support',
    description: 'Get in touch with the Wet3 Camp team in Kenya. Support for escorts and clients — available 24/7.',
    keywords: 'contact Wet3 Camp Kenya, escort platform support, companion booking help Kenya',
    canonicalPath: '/contact',
  })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!name||!email||!topic||!message) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setTimeout(() => { setSent(true); setLoading(false) }, 1200)
  }

  const contacts = [
    { icon: Mail,           label:'Email Support',  value:'support@wet3camp.com', sub:'Replies within 2 hours', color:'#2196F3' },
    { icon: Phone,          label:'WhatsApp',        value:'+254 700 000 000',    sub:'Available 8 AM – 10 PM', color:'#25D366' },
    { icon: MessageCircle,  label:'Live Chat',       value:'Available on site',   sub:'Typical wait: 2 minutes', color:'#8B0000' },
  ]

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>
        <div className="w-full relative py-8 px-5 sm:px-12 border-b border-color text-center" style={{background:'linear-gradient(135deg,#8B000015,#2196F315)'}}>
          <h1 className="text-3xl font-black text-text-light mb-2">Contact Us</h1>
          <p className="text-sm text-text-muted">Our support team is here for you 24/7. We typically respond within 2 hours.</p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-color divide-y sm:divide-y-0 sm:divide-x divide-color">
          {contacts.map(c=>{
            const Icon = c.icon
            return (
              <div key={c.label} className="px-6 py-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{backgroundColor:c.color+'20'}}><Icon size={18} style={{color:c.color}}/></div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">{c.label}</p>
                  <p className="font-bold text-text-light text-sm">{c.value}</p>
                  <div className="flex items-center gap-1 mt-0.5"><Clock size={9} className="text-text-muted"/><span className="text-[10px] text-text-muted">{c.sub}</span></div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="text-base font-bold text-text-light mb-5">Send us a message</h2>
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#28a745]/20 flex items-center justify-center"><CheckCircle2 size={32} className="text-[#28a745]"/></div>
                <div>
                  <p className="text-base font-bold text-text-light">Message sent!</p>
                  <p className="text-xs text-text-muted mt-1">We'll get back to you at <strong className="text-text-light">{email}</strong> within 2 hours.</p>
                </div>
                <button onClick={()=>setSent(false)} className="text-xs text-[#FFD700] hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl text-xs text-[#EF4444]">{error}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Your Name *</label>
                    <input value={name} onChange={e=>setName(e.target.value)} placeholder="John Kamau" className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#2196F3] transition-all"/>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Email *</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#2196F3] transition-all"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Topic *</label>
                  <select value={topic} onChange={e=>setTopic(e.target.value)} className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#2196F3] transition-all appearance-none">
                    <option value="">Select a topic</option>
                    {TOPICS.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">Message *</label>
                  <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={6} placeholder="Describe your issue or question in detail…" className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#2196F3] transition-all resize-none"/>
                  <p className="text-[10px] text-text-muted mt-1">{message.length}/1000 characters</p>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-[#2196F3] to-[#1976D2] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#2196F3]/20 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Send size={14}/>}
                  {loading?'Sending…':'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card-bg border border-color rounded-2xl p-5">
              <h3 className="text-sm font-bold text-text-light mb-4">Office Locations</h3>
              <div className="space-y-3">
                {[['Nairobi HQ','Westlands, Nairobi'],['Mombasa Office','Nyali, Mombasa']].map(([name,addr])=>(
                  <div key={name} className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-[#8B0000] mt-0.5 flex-shrink-0"/>
                    <div><p className="text-xs font-semibold text-text-light">{name}</p><p className="text-[11px] text-text-muted">{addr}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card-bg border border-color rounded-2xl p-5">
              <h3 className="text-sm font-bold text-text-light mb-3">Response Times</h3>
              <div className="space-y-2">
                {[['Email Support','≤ 2 hours','#2196F3'],['Live Chat','≤ 2 minutes','#25D366'],['Phone / WhatsApp','Instant','#8B0000']].map(([type,time,c])=>(
                  <div key={type} className="flex items-center justify-between py-2 border-b border-color/40 last:border-0">
                    <span className="text-xs text-text-muted">{type}</span>
                    <span className="text-xs font-bold" style={{color:c}}>{time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#8B0000]/20 to-transparent border border-[#8B0000]/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2"><Shield size={14} className="text-[#8B0000]"/><span className="text-xs font-bold text-text-light">Confidentiality Guaranteed</span></div>
              <p className="text-[11px] text-text-muted leading-relaxed">All support conversations are 100% confidential. We never share your personal information or the nature of your inquiry with third parties.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
