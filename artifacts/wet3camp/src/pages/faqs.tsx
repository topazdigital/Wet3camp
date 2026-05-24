import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { ChevronDown, Search, Shield, CreditCard, Phone, Star, MapPin, Lock } from 'lucide-react'

const FAQS = [
  { cat:'Getting Started', icon: Star, faqs:[
    { q:'What is Wet3 Camp?', a:'Wet3 Camp is Kenya\'s #1 premium escort booking platform. We connect verified, professional escorts with discerning clients across Nairobi, Mombasa, Kisumu, Nakuru, Eldoret and beyond.' },
    { q:'How do I create an account?', a:'Click "Join Free" at the top of the page. Choose whether you\'re a client or escort, fill in your details including your location, and confirm your account via email. It takes under 2 minutes.' },
    { q:'Is Wet3 Camp free to join?', a:'Creating a client account is completely free. Escorts have a free basic tier and can upgrade to Premium or Elite packages for more visibility and bookings.' },
    { q:'What age do I need to be to use the platform?', a:'You must be 18 years of age or older to use Wet3 Camp. We enforce this strictly and require age verification for all accounts.' },
  ]},
  { cat:'Booking & Payments', icon: CreditCard, faqs:[
    { q:'How do I book an escort?', a:'Browse profiles, select one you like, and click "Book Now". Choose your date, time and duration. Send a message to confirm details, then complete payment. The escort will confirm your booking.' },
    { q:'What payment methods are accepted?', a:'We accept M-Pesa, Airtel Money, Visa/Mastercard, and bank transfers. All transactions are encrypted and discreet — charges will appear as "Digital Services" on your statement.' },
    { q:'Can I cancel a booking?', a:'Yes. You can cancel up to 4 hours before the booking for a full refund. Cancellations within 4 hours forfeit 50% of the booking fee as a cancellation fee to the escort.' },
    { q:'What if the escort doesn\'t show up?', a:'If an escort fails to honor a confirmed booking, you receive a full refund immediately. You can also leave a review about the experience to warn other clients.' },
    { q:'Are prices negotiable?', a:'Escorts set their own rates and pricing is transparent on their profiles. You may message an escort to discuss custom arrangements, but always respect their listed rates.' },
  ]},
  { cat:'Safety & Privacy', icon: Shield, faqs:[
    { q:'How are escorts verified?', a:'Every escort goes through a manual verification process: ID check, face verification against profile photo, and a phone interview. Verified escorts display a ✓ badge. Unverified profiles cannot accept bookings.' },
    { q:'Is my personal information safe?', a:'Absolutely. We use end-to-end encryption for all messages. Your personal details are never shared with escorts or third parties. We are GDPR-compliant and delete data on request.' },
    { q:'Can I remain anonymous as a client?', a:'Yes. You can use a username instead of your real name. Messages are anonymous and your contact details are only shared after a confirmed booking, with your consent.' },
    { q:'What is the blacklist for?', a:'The blacklist is a community safety tool where verified users can report bad actors — clients who don\'t pay, escorts who are fraudulent, or anyone who behaves dangerously. All reports are investigated.' },
  ]},
  { cat:'For Escorts', icon: Star, faqs:[
    { q:'How do I list my profile as an escort?', a:'Register as an escort, complete your profile with photos, bio, services and pricing, and submit for verification. Once verified (usually within 24 hours), your profile goes live to thousands of clients.' },
    { q:'How much can I earn?', a:'Earnings vary by tier and location. Elite escorts in Nairobi typically earn KES 150,000–300,000 per month. Our platform dashboard gives you real-time earnings analytics.' },
    { q:'How do I get paid?', a:'Payments are released to your M-Pesa or bank account within 24 hours of a completed booking. We take a 15% platform fee from each booking.' },
    { q:'Can I set my own rates?', a:'Yes, completely. You control your hourly, overnight, video call and custom rates. We recommend pricing based on your city and tier for maximum bookings.' },
  ]},
  { cat:'Technical', icon: Phone, faqs:[
    { q:'Is there a mobile app?', a:'Yes! The Wet3 Camp mobile app is available for both iOS and Android. Search "Wet3 Camp" in your app store, or visit the /install page for a direct link and QR code.' },
    { q:'The site is slow or not loading. What do I do?', a:'Try refreshing the page or clearing your browser cache. For mobile, try disabling your VPN if you\'re using one. If issues persist, contact support@wet3camp.com.' },
    { q:'How do I report a bug or give feedback?', a:'Use the Contact page or email dev@wet3camp.com. We respond to all bug reports within 24 hours and credit your account with a discount for valid bug reports.' },
  ]},
]

export default function FAQsPage() {
  const [search, setSearch] = useState('')
  const [openCat, setOpenCat] = useState<string|null>('Getting Started')
  const [openQ, setOpenQ] = useState<string|null>(null)

  const allFaqs = FAQS.flatMap(c=>c.faqs.map(f=>({...f,cat:c.cat})))
  const filtered = search ? allFaqs.filter(f=>f.q.toLowerCase().includes(search.toLowerCase())||f.a.toLowerCase().includes(search.toLowerCase())) : null

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>
        <div className="w-full relative py-8 px-5 sm:px-12 border-b border-color text-center" style={{background:'linear-gradient(135deg,#2196F320,#8B000015)'}}>
          <h1 className="text-3xl font-black text-text-light mb-2">Frequently Asked Questions</h1>
          <p className="text-sm text-text-muted mb-5">Find quick answers to common questions about Wet3 Camp</p>
          <div className="max-w-sm mx-auto relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions…" className="w-full pl-9 pr-4 py-3 bg-card-bg border border-color rounded-2xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#2196F3] transition-all"/>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {search && filtered ? (
            <div>
              <p className="text-xs text-text-muted mb-4">{filtered.length} results for "{search}"</p>
              <div className="space-y-2">
                {filtered.map((f,i)=>(
                  <div key={i} className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                    <button onClick={()=>setOpenQ(openQ===f.q?null:f.q)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-3">
                      <span className="text-sm font-semibold text-text-light">{f.q}</span>
                      <ChevronDown size={16} className={`text-text-muted flex-shrink-0 transition-transform ${openQ===f.q?'rotate-180':''}`}/>
                    </button>
                    {openQ===f.q && <div className="px-5 pb-4 text-sm text-text-muted leading-relaxed border-t border-color pt-4">{f.a}</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {FAQS.map(cat=>{
                const Icon = cat.icon
                return (
                  <div key={cat.cat} className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                    <button onClick={()=>setOpenCat(openCat===cat.cat?null:cat.cat)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
                      <div className="w-8 h-8 rounded-xl bg-[#2196F3]/20 flex items-center justify-center flex-shrink-0"><Icon size={15} className="text-[#2196F3]"/></div>
                      <span className="flex-1 font-bold text-text-light text-sm">{cat.cat}</span>
                      <span className="text-[10px] text-text-muted mr-2">{cat.faqs.length} questions</span>
                      <ChevronDown size={16} className={`text-text-muted transition-transform ${openCat===cat.cat?'rotate-180':''}`}/>
                    </button>
                    {openCat===cat.cat && (
                      <div className="border-t border-color divide-y divide-color/40">
                        {cat.faqs.map((f,i)=>(
                          <div key={i}>
                            <button onClick={()=>setOpenQ(openQ===f.q?null:f.q)} className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-3 hover:bg-dark-bg transition-colors">
                              <span className="text-xs font-semibold text-text-light">{f.q}</span>
                              <ChevronDown size={13} className={`text-text-muted flex-shrink-0 transition-transform ${openQ===f.q?'rotate-180':''}`}/>
                            </button>
                            {openQ===f.q && <div className="px-5 pb-4 text-xs text-text-muted leading-relaxed">{f.a}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8 text-center p-6 bg-card-bg border border-color rounded-2xl">
            <Lock size={24} className="text-text-muted mx-auto mb-2"/>
            <p className="font-bold text-text-light text-sm mb-1">Didn't find your answer?</p>
            <p className="text-xs text-text-muted mb-4">Our support team is available 24/7 to help you with any questions.</p>
            <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#2196F3] text-white font-bold text-xs rounded-xl hover:bg-[#1976D2] transition-all">Contact Support</a>
          </div>
        </div>
      </div>
    </main>
  )
}
