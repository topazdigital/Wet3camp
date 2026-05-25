import React, { useState } from 'react'
import { Link, useLocation } from 'wouter'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Calendar, Clock, MapPin, MessageSquare, CreditCard, Smartphone, Banknote, Check, ChevronRight, Star, CheckCircle2, ArrowLeft } from 'lucide-react'

const PROFILE = {
  name: 'Amara K.', tier: 'elite', rating: 4.9, reviews: 156, price: 8000, location: 'Nairobi CBD',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
  verified: true,
}

const DURATIONS = [
  { val: 1,   label: '1 hour',       price: 8000  },
  { val: 2,   label: '2 hours',      price: 15000 },
  { val: 3,   label: '3 hours',      price: 20000 },
  { val: 8,   label: 'Overnight',    price: 50000 },
]

const PAYMENT_METHODS = [
  { id: 'mpesa',  label: 'M-Pesa', icon: Smartphone, sub: 'Instant payment via M-Pesa' },
  { id: 'card',   label: 'Card',   icon: CreditCard,  sub: 'Visa / Mastercard' },
  { id: 'cash',   label: 'Cash',   icon: Banknote,    sub: 'Pay on arrival' },
]

const STEPS = ['Details', 'Payment', 'Confirm']

export default function BookingPage() {
  const [, setLocation] = useLocation()
  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(1)
  const [location_, setLocation_] = useState('')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState('mpesa')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dur = DURATIONS.find(d => d.val === duration) ?? DURATIONS[0]
  const fee = Math.round(dur.price * 0.05)
  const total = dur.price + fee

  const next = () => {
    if (step === 0 && (!date || !time)) { setError('Please select a date and time.'); return }
    setError('')
    setStep(s => s + 1)
  }

  const confirm = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setConfirmed(true) }, 1500)
  }

  if (confirmed) return (
    <div className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:pb-0 pb-24">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-[#28a745]/15 border-2 border-[#28a745]/40 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-[#28a745]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-light">Booking Confirmed!</h2>
              <p className="text-text-muted text-sm mt-2">Your booking reference is <span className="text-[#FFD700] font-bold">#W3{Math.random().toString(36).slice(2,8).toUpperCase()}</span></p>
            </div>
            <div className="bg-card-bg border border-color rounded-2xl p-4 text-left space-y-3">
              {[['Escort', PROFILE.name],['Date', date],['Time', time],['Duration', dur.label],['Total', `KES ${total.toLocaleString()}`]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-text-muted text-xs">{l}</span>
                  <span className="text-text-light text-xs font-bold">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted">A confirmation message has been sent. You can track your booking in the Messages tab.</p>
            <div className="flex gap-3">
              <Link href="/messages" className="flex-1 py-3 bg-card-bg border border-color text-text-light font-semibold rounded-xl text-sm text-center hover:border-text-muted transition-all">
                Messages
              </Link>
              <Link href="/" className="flex-1 py-3 bg-[#8B0000] text-white font-bold rounded-xl text-sm text-center hover:bg-[#a00000] transition-all">
                Browse More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:pb-0 pb-24">
        <Header />
        <main className="flex-1 px-3 sm:px-5 py-5">
          <div className="max-w-2xl mx-auto">

            <div className="flex items-center gap-2 mb-5">
              <Link href="/profile" className="flex items-center gap-1.5 text-text-muted hover:text-text-light text-xs transition-colors">
                <ArrowLeft size={14} /> Back
              </Link>
            </div>

            {/* Profile summary */}
            <div className="flex items-center gap-4 bg-card-bg border border-color rounded-2xl p-4 mb-5">
              <img src={PROFILE.image} alt={PROFILE.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-black text-text-light text-lg">{PROFILE.name}</h2>
                  {PROFILE.verified && <CheckCircle2 size={15} className="text-[#28a745]" fill="#28a745" />}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#8B0000] text-white">ELITE</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1"><Star size={11} className="fill-[#FFD700] text-[#FFD700]" /><span className="text-xs font-bold text-text-light">{PROFILE.rating}</span></div>
                  <div className="flex items-center gap-1"><MapPin size={11} className="text-text-muted" /><span className="text-xs text-text-muted">{PROFILE.location}</span></div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#FFD700] font-black text-lg">KES {PROFILE.price.toLocaleString()}</p>
                <p className="text-text-muted text-[10px]">per hour</p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-0 mb-6">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < step ? 'bg-[#8B0000] border-[#8B0000] text-white' : i === step ? 'bg-transparent border-[#FFD700] text-[#FFD700]' : 'bg-transparent border-color text-text-muted'}`}>
                      {i < step ? <Check size={13} /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 ${i === step ? 'text-[#FFD700]' : i < step ? 'text-[#8B0000]' : 'text-text-muted'}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-2 mb-4 ${i < step ? 'bg-[#8B0000]' : 'bg-color'}`} />}
                </React.Fragment>
              ))}
            </div>

            {error && <div className="mb-4 px-4 py-3 bg-[#8B0000]/15 border border-[#8B0000]/40 rounded-xl text-xs text-red-300">{error}</div>}

            {/* Step 0: Details */}
            {step === 0 && (
              <div className="space-y-5 bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="font-bold text-text-light text-base">Booking Details</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5"><Calendar size={11} className="inline mr-1" />Date *</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5"><Clock size={11} className="inline mr-1" />Time *</label>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-2">Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATIONS.map(d => (
                      <button key={d.val} onClick={() => setDuration(d.val)} className={`py-2.5 px-2 rounded-xl border text-center transition-all ${duration === d.val ? 'border-[#8B0000] bg-[#8B0000]/15 text-[#FFD700]' : 'border-color bg-dark-bg text-text-muted hover:border-text-muted'}`}>
                        <p className="text-xs font-bold">{d.label}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">KES {(d.price/1000).toFixed(0)}k</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5"><MapPin size={11} className="inline mr-1" />Location / Venue</label>
                  <input type="text" value={location_} onChange={e => setLocation_(e.target.value)} placeholder="Hotel name, address or area…" className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all" />
                </div>

                <div>
                  <label className="text-xs text-text-muted font-semibold uppercase tracking-widest block mb-1.5"><MessageSquare size={11} className="inline mr-1" />Special Requests</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any preferences or requests (optional)…" className="w-full px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700]/60 transition-all resize-none" />
                </div>
              </div>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <div className="space-y-4 bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="font-bold text-text-light text-base">Payment Method</h3>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(pm => {
                    const Icon = pm.icon
                    return (
                      <button key={pm.id} onClick={() => setPayment(pm.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${payment === pm.id ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-color bg-dark-bg hover:border-text-muted'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${payment === pm.id ? 'bg-[#8B0000]/20' : 'bg-card-bg'}`}>
                          <Icon size={20} className={payment === pm.id ? 'text-[#8B0000]' : 'text-text-muted'} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-text-light text-sm">{pm.label}</p>
                          <p className="text-text-muted text-xs">{pm.sub}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payment === pm.id ? 'border-[#8B0000] bg-[#8B0000]' : 'border-color'}`}>
                          {payment === pm.id && <Check size={11} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="bg-dark-bg rounded-xl border border-color p-4 space-y-2.5 mt-4">
                  <p className="text-xs font-bold text-text-light uppercase tracking-widest">Order Summary</p>
                  {[['Service fee', `KES ${dur.price.toLocaleString()}`],['Platform fee (5%)', `KES ${fee.toLocaleString()}`]].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">{l}</span>
                      <span className="text-text-light">{v}</span>
                    </div>
                  ))}
                  <div className="h-px bg-color" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-light text-sm">Total</span>
                    <span className="font-black text-[#FFD700] text-lg">KES {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
              <div className="space-y-4 bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="font-bold text-text-light text-base">Confirm Booking</h3>
                <div className="space-y-2.5">
                  {[['Escort', PROFILE.name],['Date', date],['Time', time],['Duration', dur.label],['Location', location_ || 'Not specified'],['Payment', PAYMENT_METHODS.find(p => p.id === payment)?.label ?? ''],['Total', `KES ${total.toLocaleString()}`]].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between py-2 border-b border-color/40 last:border-0">
                      <span className="text-text-muted text-xs">{l}</span>
                      <span className={`text-xs font-bold ${l === 'Total' ? 'text-[#FFD700]' : 'text-text-light'}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed border border-color/40 bg-dark-bg rounded-xl p-3">
                  By confirming, you agree to our <a href="#" className="text-[#FFD700] underline">Booking Terms</a>. Cancellations within 2 hours of the booked time may incur a 50% fee. All bookings are strictly confidential.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-5">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-3 border border-color rounded-xl text-text-muted hover:text-text-light hover:border-text-muted transition-all text-sm font-medium">
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              {step < 2 ? (
                <button onClick={next} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold rounded-xl transition-all text-sm hover:from-[#a00000] hover:to-[#8B0000] shadow-lg shadow-[#8B0000]/30">
                  Continue <ChevronRight size={15} />
                </button>
              ) : (
                <button onClick={confirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-[#8B0000]/30 disabled:opacity-60">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={15} /> Confirm Booking</>}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
