import React, { useState } from 'react'
import { X, Calendar, Clock, MapPin, CheckCircle2, Smartphone, Loader2 } from 'lucide-react'
import { useBookings } from '@/lib/bookings-context'
import { useLocation } from 'wouter'

const DURATIONS = [
  { label: '1 Hour',    hrs: 1  },
  { label: '2 Hours',   hrs: 2  },
  { label: '3 Hours',   hrs: 3  },
  { label: 'Overnight', hrs: 12 },
]

const TIME_SLOTS = [
  '10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM',
  '4:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM',
]

interface EscortInfo {
  id: string
  name: string
  avatar: string
  tier: string
  city: string
  pricing: { hourly: number; overnight: number }
}

interface Props {
  open: boolean
  onClose: () => void
  escort: EscortInfo
}

const TIER_COLOR: Record<string, string> = {
  Elite: '#8B0000', VIP: '#FF4500', Premium: '#B8860B',
}

export default function BookingModal({ open, onClose, escort }: Props) {
  const { requestBooking, payBooking } = useBookings()
  const [, navigate] = useLocation()
  const [step, setStep] = useState(1)
  const [type, setType] = useState<'incall' | 'outcall'>('incall')
  const [duration, setDuration] = useState(DURATIONS[0])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [phone, setPhone] = useState('+254')
  const [mpesaState, setMpesaState] = useState<'idle' | 'pending' | 'checking' | 'success'>('idle')
  const [txRef, setTxRef] = useState('')
  const [bookingId, setBookingId] = useState('')

  const amount = duration.hrs === 12
    ? escort.pricing.overnight
    : escort.pricing.hourly * duration.hrs

  const tierColor = TIER_COLOR[escort.tier] ?? '#8B0000'

  const handleConfirmBooking = async () => {
    const id = await requestBooking({
      escortId: escort.id,
      escortName: escort.name,
      escortAvatar: escort.avatar,
      escortTier: escort.tier,
      escortCity: escort.city,
      date,
      time,
      duration: duration.label,
      durationHrs: duration.hrs,
      type,
      location: type === 'outcall' ? location : undefined,
      notes: notes || undefined,
      amount,
    })
    setBookingId(id)
    setStep(4)
  }

  const handleMpesaPay = () => {
    if (phone.length < 10) return
    setMpesaState('pending')
    setTimeout(() => {
      setMpesaState('checking')
      setTimeout(() => {
        const ref = 'MPE' + Date.now().toString().slice(-9)
        setTxRef(ref)
        payBooking(bookingId, ref)
        setMpesaState('success')
      }, 3000)
    }, 2000)
  }

  const handleClose = () => {
    setStep(1); setType('incall'); setDuration(DURATIONS[0])
    setDate(''); setTime(''); setLocation(''); setNotes('')
    setPhone('+254'); setMpesaState('idle'); setTxRef(''); setBookingId('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card-bg border border-color rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-color flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src={escort.avatar} alt={escort.name} className="w-9 h-9 rounded-full object-cover border-2" style={{ borderColor: tierColor }} />
            <div>
              <p className="font-bold text-text-light text-sm leading-tight">{escort.name}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: tierColor + '30', color: tierColor }}>{escort.tier}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step <= 3 && (
              <div className="flex items-center gap-1">
                {[1,2,3].map(s => (
                  <div key={s} className="w-5 h-1 rounded-full transition-all" style={{ backgroundColor: s <= step ? '#8B0000' : '#333' }} />
                ))}
              </div>
            )}
            <button onClick={handleClose} className="p-1.5 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* ── STEP 1: Type + Duration ── */}
            {step === 1 && (
              <>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Service Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['incall', 'outcall'] as const).map(t => (
                      <button key={t} onClick={() => setType(t)}
                        className={`p-3.5 rounded-xl border text-sm font-bold transition-all ${type === t ? 'border-[#8B0000] bg-[#8B0000]/15 text-white' : 'border-color bg-dark-bg text-text-muted hover:border-text-muted'}`}>
                        {t === 'incall' ? '🏠  Incall' : '🚗  Outcall'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-text-muted mt-2">
                    {type === 'incall' ? 'Visit her at her private location.' : "She'll come to your location."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Duration</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DURATIONS.map(d => {
                      const cost = d.hrs === 12 ? escort.pricing.overnight : escort.pricing.hourly * d.hrs
                      return (
                        <button key={d.label} onClick={() => setDuration(d)}
                          className={`p-3.5 rounded-xl border text-left transition-all ${duration.label === d.label ? 'border-[#8B0000] bg-[#8B0000]/15' : 'border-color bg-dark-bg hover:border-text-muted'}`}>
                          <p className={`text-sm font-bold ${duration.label === d.label ? 'text-white' : 'text-text-light'}`}>{d.label}</p>
                          <p className="text-[11px] text-[#FFD700] font-bold mt-0.5">KES {cost.toLocaleString()}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button onClick={() => setStep(2)} className="w-full py-3.5 bg-[#8B0000] hover:bg-[#a00000] text-white font-black rounded-xl transition-all">
                  Continue →
                </button>
              </>
            )}

            {/* ── STEP 2: Date + Time ── */}
            {step === 2 && (
              <>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Select Date</p>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light focus:outline-none focus:border-[#8B0000] [color-scheme:dark] transition-all"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Select Time</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(t => (
                      <button key={t} onClick={() => setTime(t)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${time === t ? 'border-[#8B0000] bg-[#8B0000]/15 text-white' : 'border-color bg-dark-bg text-text-muted hover:border-text-muted'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 bg-dark-bg border border-color text-text-muted font-semibold rounded-xl hover:border-text-muted transition-all">← Back</button>
                  <button onClick={() => setStep(3)} disabled={!date || !time} className="flex-1 py-3 bg-[#8B0000] hover:bg-[#a00000] text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
                </div>
              </>
            )}

            {/* ── STEP 3: Notes + Summary ── */}
            {step === 3 && (
              <>
                {type === 'outcall' && (
                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Your Location</p>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Westlands, Nairobi"
                        className="w-full pl-9 pr-4 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Special Notes <span className="normal-case font-normal">(optional)</span></p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any requests or preferences…"
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] resize-none transition-all"
                  />
                </div>

                <div className="bg-dark-bg rounded-2xl p-4 border border-color">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Booking Summary</p>
                  <div className="space-y-2">
                    {[
                      ['Escort', escort.name],
                      ['Date', date ? new Date(date + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'],
                      ['Time', time || '—'],
                      ['Duration', duration.label],
                      ['Type', type === 'incall' ? '🏠 Incall' : '🚗 Outcall'],
                      ...(type === 'outcall' && location ? [['Location', location]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-text-muted">{k}</span>
                        <span className="text-text-light font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-2 border-t border-color">
                    <span className="text-sm font-bold text-text-light">Total</span>
                    <span className="text-xl font-black text-[#FFD700]">KES {amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 bg-dark-bg border border-color text-text-muted font-semibold rounded-xl hover:border-text-muted transition-all">← Back</button>
                  <button onClick={handleConfirmBooking} className="flex-1 py-3 bg-[#8B0000] hover:bg-[#a00000] text-white font-black rounded-xl transition-all">
                    Pay Now
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 4: M-Pesa Payment ── */}
            {step === 4 && (
              <>
                {mpesaState === 'success' ? (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-20 h-20 bg-[#28a745]/15 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={36} className="text-[#28a745]" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-text-light">Booking Confirmed!</p>
                      <p className="text-sm text-text-muted mt-1">Payment received via M-Pesa</p>
                    </div>
                    <div className="bg-[#28a745]/10 border border-[#28a745]/30 rounded-xl p-4 space-y-1">
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Transaction Reference</p>
                      <p className="text-lg font-black text-[#28a745] tracking-widest">{txRef}</p>
                      <p className="text-xs text-text-muted">KES {amount.toLocaleString()} paid · {duration.label} with {escort.name.split(' ')[0]}</p>
                    </div>
                    <p className="text-xs text-text-muted">{escort.name} has been notified and will confirm shortly.</p>
                    <button onClick={() => { handleClose(); navigate('/bookings') }} className="w-full py-3.5 bg-[#8B0000] text-white font-black rounded-xl transition-all hover:bg-[#a00000]">
                      View My Bookings →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#28a745]/15 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Smartphone size={28} className="text-[#28a745]" />
                      </div>
                      <p className="font-black text-text-light text-lg">M-Pesa Payment</p>
                      <p className="text-sm text-text-muted mt-1">
                        <span className="text-[#FFD700] font-bold">KES {amount.toLocaleString()}</span> for {duration.label} with {escort.name.split(' ')[0]}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest block mb-2">M-Pesa Phone Number</label>
                      <div className="relative">
                        <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#28a745]" />
                        <input
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+254712345678"
                          className="w-full pl-9 pr-4 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#28a745] transition-all"
                          disabled={mpesaState !== 'idle'}
                        />
                      </div>
                    </div>

                    {(mpesaState === 'pending' || mpesaState === 'checking') && (
                      <div className={`rounded-xl p-3 text-center border ${mpesaState === 'pending' ? 'bg-[#28a745]/10 border-[#28a745]/30' : 'bg-[#FFD700]/10 border-[#FFD700]/30'}`}>
                        <Loader2 size={18} className={`animate-spin mx-auto mb-1.5 ${mpesaState === 'pending' ? 'text-[#28a745]' : 'text-[#FFD700]'}`} />
                        {mpesaState === 'pending' ? (
                          <>
                            <p className="text-xs text-[#28a745] font-bold">STK Push sent to {phone}</p>
                            <p className="text-[10px] text-text-muted mt-0.5">Enter your M-Pesa PIN on your phone…</p>
                          </>
                        ) : (
                          <p className="text-xs text-[#FFD700] font-bold">Confirming payment with M-Pesa…</p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleMpesaPay}
                      disabled={mpesaState !== 'idle' || phone.length < 10}
                      className="w-full py-3.5 bg-[#28a745] hover:bg-[#20ba5a] text-white font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {mpesaState !== 'idle' ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                      {mpesaState === 'idle' ? 'Send STK Push' : 'Processing…'}
                    </button>

                    <button
                      onClick={() => setStep(3)}
                      disabled={mpesaState !== 'idle'}
                      className="w-full py-2.5 bg-dark-bg border border-color text-text-muted text-sm font-semibold rounded-xl hover:border-text-muted transition-all disabled:opacity-40"
                    >
                      ← Change Booking Details
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
