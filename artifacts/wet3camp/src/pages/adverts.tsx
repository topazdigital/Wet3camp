import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { TrendingUp, Eye, Star, CheckCircle2, Zap, Crown, BarChart2, Mail, X, CreditCard, Loader2, AlertCircle, Smartphone, RefreshCw } from 'lucide-react'
import { useSEO } from '@/lib/useSEO'
import { useMpesaPayment } from '@/lib/mpesa'

const PACKAGES = [
  {
    name: 'Basic', price: 5000, duration: '7 days', color: '#6B7280',
    perks: ['Profile boost in search', '50% more visibility', 'City-level promotion', 'Email support'],
  },
  {
    name: 'Premium', price: 15000, duration: '30 days', color: '#B8860B', popular: true,
    perks: ['Top of search results', '300% more visibility', 'City + national promotion', 'Homepage feature', 'Priority support', 'Analytics dashboard'],
  },
  {
    name: 'Elite', price: 35000, duration: '30 days', color: '#8B0000',
    perks: ['#1 in all searches', '500% more visibility', 'Full national + international', 'Homepage banner', 'Dedicated account manager', 'Video feature slot', 'WhatsApp support'],
  },
]

const STATS = [
  { icon: Eye,        label: 'Average Profile Views',  value: '+340%', desc: 'vs non-promoted profiles' },
  { icon: TrendingUp, label: 'Booking Rate Increase',  value: '+280%', desc: 'for elite advertisers' },
  { icon: BarChart2,  label: 'Active Advertisers',     value: '247',   desc: 'on the platform right now' },
  { icon: Star,       label: 'Avg Advertiser Rating',  value: '4.9',   desc: 'from satisfied promotions' },
]

interface PaymentModalProps {
  pkg: typeof PACKAGES[0]
  onClose: () => void
}

function PaymentModal({ pkg, onClose }: PaymentModalProps) {
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const mpesa = useMpesaPayment()

  const handleSend = async () => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 9) { setPhoneError('Enter a valid Safaricom number.'); return }
    setPhoneError('')
    await mpesa.initiate({
      phone: clean.startsWith('254') ? clean : '254' + (clean.startsWith('0') ? clean.slice(1) : clean),
      amount: pkg.price,
      type: `advert_${pkg.name.toLowerCase()}`,
    })
  }

  const handleRetry = () => { mpesa.reset(); setPhone('') }

  const busy = mpesa.stage === 'sending' || mpesa.stage === 'waiting'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={mpesa.stage === 'success' ? onClose : undefined}
    >
      <div className="w-full sm:max-w-md bg-card-bg border border-color rounded-t-3xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-color">
          <div>
            <h2 className="font-black text-text-light">{pkg.name} Package</h2>
            <p className="text-xs text-text-muted">KES {pkg.price.toLocaleString()} · {pkg.duration}</p>
          </div>
          {!busy && (
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-light rounded-lg transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-5">

          {/* ── Success ── */}
          {mpesa.stage === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#28a745]/15 border-2 border-[#28a745]/40 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-[#28a745]" />
              </div>
              <div>
                <p className="text-xl font-black text-text-light">Payment Confirmed!</p>
                <p className="text-sm text-text-muted mt-1">Your {pkg.name} package is now active.</p>
                <p className="text-[10px] text-text-muted font-mono mt-2 bg-dark-bg px-3 py-1.5 rounded-lg border border-color">
                  Ref: {mpesa.txRef}
                </p>
              </div>
              <button onClick={onClose} className="px-8 py-2.5 bg-[#8B0000] text-white font-bold rounded-xl hover:bg-[#a00000] transition-all">
                Done
              </button>
            </div>
          )}

          {/* ── Failed / cancelled ── */}
          {mpesa.stage === 'failed' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 border-2 border-[#EF4444]/30 flex items-center justify-center">
                <X size={28} className="text-[#EF4444]" />
              </div>
              <div>
                <p className="text-lg font-black text-text-light">Payment Failed</p>
                <p className="text-sm text-text-muted mt-1">{mpesa.error || 'The payment was not completed.'}</p>
              </div>
              <button onClick={handleRetry} className="w-full py-3 bg-[#28a745] text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <RefreshCw size={14} /> Try Again
              </button>
              <button onClick={onClose} className="text-xs text-text-muted hover:text-text-light">Cancel</button>
            </div>
          )}

          {/* ── Sending / waiting ── */}
          {(mpesa.stage === 'sending' || mpesa.stage === 'waiting') && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#28a745]/10 border-2 border-[#28a745]/30 flex items-center justify-center">
                <Loader2 size={28} className="text-[#28a745] animate-spin" />
              </div>
              <div>
                <p className="font-black text-text-light text-lg">
                  {mpesa.stage === 'sending' ? 'Sending STK Push…' : 'Check Your Phone'}
                </p>
                <p className="text-sm text-text-muted mt-1">
                  {mpesa.stage === 'sending'
                    ? 'Contacting M-Pesa…'
                    : `An M-Pesa PIN prompt has been sent to +254 ${phone.replace(/^254/, '')}`}
                </p>
              </div>
              {mpesa.stage === 'waiting' && (
                <>
                  <div className="w-full p-4 bg-dark-bg border border-[#28a745]/20 rounded-2xl text-left space-y-2">
                    {['Open the M-Pesa prompt on your phone', 'Enter your 4-digit M-Pesa PIN', 'Confirm the payment', 'This screen updates automatically'].map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#28a745]/20 text-[#28a745] text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-xs text-text-muted">{s}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-text-muted">Waiting for M-Pesa confirmation (up to 2 min)…</p>
                </>
              )}
            </div>
          )}

          {/* ── Phone input (idle) ── */}
          {mpesa.stage === 'idle' && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-2xl bg-[#28a745]/10 mx-auto mb-3 flex items-center justify-center">
                  <Smartphone size={24} className="text-[#28a745]" />
                </div>
                <p className="font-black text-text-light">Pay via M-Pesa</p>
                <p className="text-xs text-text-muted mt-1">Enter your Safaricom number to receive an STK push</p>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">M-Pesa Phone Number</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-muted">+254</span>
                  <input
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setPhoneError('') }}
                    placeholder="7XX XXX XXX"
                    maxLength={9}
                    className="flex-1 px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#28a745] transition-all"
                  />
                </div>
              </div>
              {(phoneError || mpesa.error) && (
                <div className="flex items-center gap-2 text-[#EF4444] text-xs bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-3 py-2">
                  <AlertCircle size={13} /><span>{phoneError || mpesa.error}</span>
                </div>
              )}
              <div className="p-3 bg-[#28a745]/10 border border-[#28a745]/20 rounded-xl text-xs text-text-muted">
                <p className="font-bold text-[#28a745] mb-1">How it works:</p>
                <p>1. Enter your Safaricom number above</p>
                <p>2. We send an M-Pesa STK push to your phone</p>
                <p>3. Enter your PIN — this screen confirms automatically</p>
              </div>
              <button onClick={handleSend} className="w-full py-3.5 bg-[#28a745] hover:bg-[#20ba5a] text-white font-black rounded-xl transition-all flex items-center justify-center gap-2">
                <Smartphone size={16} />
                Pay KES {pkg.price.toLocaleString()} via M-Pesa
              </button>
              <div className="flex items-center gap-2 p-3 bg-dark-bg border border-color rounded-xl">
                <CheckCircle2 size={13} className="text-[#28a745] flex-shrink-0" />
                <p className="text-[10px] text-text-muted">Payment processed securely via PayHero · You are only credited after M-Pesa confirms</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AdvertsPage() {
  useSEO({
    title: 'Advertise on Wet3 Camp — Promote Your Escort Profile',
    description: 'Boost your escort profile visibility with our advertising packages. M-Pesa and card payments accepted.',
    canonicalPath: '/adverts',
  })
  const [contactOpen, setContactOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [payTarget, setPayTarget] = useState<typeof PACKAGES[0] | null>(null)

  const handleSend = () => {
    if (!name || !email) return
    setSent(true); setTimeout(() => setSent(false), 3000)
    setName(''); setEmail(''); setMessage('')
  }

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />
        <div className="w-full relative h-44 border-b border-color overflow-hidden flex items-end" style={{ background: 'linear-gradient(135deg,#FFD70020,#8B000020)' }}>
          <div className="relative px-5 sm:px-8 pb-6 w-full">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={13} className="text-[#FFD700]" />
              <span className="text-xs text-[#FFD700] font-bold uppercase tracking-widest">Advertising</span>
            </div>
            <h1 className="text-3xl font-black text-text-light">Promote Your Profile</h1>
            <p className="text-sm text-text-muted mt-1">Reach thousands of verified clients across Kenya with our advertising packages</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-color">
          {STATS.map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="p-4 border-r border-color last:border-r-0 sm:last:border-r-0 sm:even:border-r-0 sm:odd:border-r sm:[&:nth-child(3)]:border-r">
                <Icon size={14} className="text-[#FFD700] mb-1.5" />
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
            {PACKAGES.map(p => (
              <div key={p.name} className={`relative bg-card-bg border-2 rounded-2xl p-6 transition-all hover:scale-[1.01] ${p.popular ? 'border-[#FFD700] shadow-xl shadow-[#FFD700]/10' : 'border-color hover:border-text-muted'}`}>
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFD700] text-black text-[10px] font-black rounded-full flex items-center gap-1">
                    <Crown size={10} /> MOST POPULAR
                  </div>
                )}
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: p.color + '20' }}>
                  <Zap size={18} style={{ color: p.color }} />
                </div>
                <h3 className="text-lg font-black text-text-light mb-0.5">{p.name}</h3>
                <p className="text-2xl font-black mt-2 mb-0.5" style={{ color: p.color }}>KES {p.price.toLocaleString()}</p>
                <p className="text-[11px] text-text-muted mb-5">per {p.duration}</p>
                <div className="space-y-2.5 mb-6">
                  {p.perks.map(perk => (
                    <div key={perk} className="flex items-center gap-2">
                      <CheckCircle2 size={13} style={{ color: p.color }} />
                      <span className="text-xs text-text-muted">{perk}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setPayTarget(p)}
                    className="w-full py-3 font-bold text-sm rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: `linear-gradient(to right,${p.color},${p.color}cc)`, color: '#fff' }}
                  >
                    Get {p.name}
                  </button>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                      <Smartphone size={10} className="text-[#28a745]" /> M-Pesa
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                      <CreditCard size={10} className="text-[#B8860B]" /> Card
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-lg mx-auto bg-card-bg border border-color rounded-2xl p-6">
            <h3 className="text-base font-bold text-text-light mb-1">Need a Custom Package?</h3>
            <p className="text-xs text-text-muted mb-4">Contact us for agency rates, bulk discounts, or custom advertising solutions.</p>
            {sent ? (
              <div className="flex items-center gap-2 p-4 bg-[#28a745]/10 border border-[#28a745]/20 rounded-xl">
                <CheckCircle2 size={16} className="text-[#28a745]" />
                <p className="text-sm text-[#28a745] font-semibold">Message sent! We'll respond within 2 hours.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" className="px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all" />
                </div>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Tell us what you need…" className="w-full px-3.5 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all resize-none" />
                <button onClick={handleSend} className="w-full py-3 bg-[#FFD700] text-black font-bold text-sm rounded-xl hover:bg-[#e6c000] transition-all flex items-center justify-center gap-2">
                  <Mail size={14} /> Send Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {payTarget && (
        <PaymentModal pkg={payTarget} onClose={() => setPayTarget(null)} />
      )}
    </main>
  )
}
