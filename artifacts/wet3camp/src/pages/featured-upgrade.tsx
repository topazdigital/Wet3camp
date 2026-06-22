import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Crown, CheckCircle2, Smartphone, Loader2, AlertCircle, Star, TrendingUp, Eye, ArrowRight, RefreshCw, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Link } from 'wouter'
import { useMpesaPayment } from '@/lib/mpesa'

const PLANS = [
  {
    id: 'basic',
    name: '3-Day Boost',
    price: 500,
    duration: '3 days',
    color: '#6B7280',
    perks: ['Top of search results', 'Featured badge on profile', '2× more visibility', 'City-level promotion'],
    popular: false,
  },
  {
    id: 'weekly',
    name: 'Weekly Featured',
    price: 1500,
    duration: '7 days',
    color: '#B8860B',
    perks: ['Homepage carousel spot', 'Top of all searches', '5× more visibility', 'City + national exposure', '"Featured" verified badge'],
    popular: true,
  },
  {
    id: 'monthly',
    name: 'Monthly Elite',
    price: 4500,
    duration: '30 days',
    color: '#8B0000',
    perks: ['Permanent top position', 'Homepage banner slot', '10× more visibility', 'Full national promotion', 'Priority support', 'Analytics dashboard', '"Elite Featured" badge'],
    popular: false,
  },
]

export default function FeaturedUpgradePage() {
  const { user } = useAuth()
  const [selected, setSelected] = useState<typeof PLANS[0] | null>(null)
  const [step, setStep] = useState<'select' | 'pay'>('select')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const mpesa = useMpesaPayment()

  const handlePay = async () => {
    const clean = phone.replace(/\D/g, '')
    if (!clean || clean.length < 9) { setPhoneError('Enter a valid M-Pesa phone number.'); return }
    setPhoneError('')
    await mpesa.initiate({
      phone: clean.startsWith('254') ? clean : '254' + (clean.startsWith('0') ? clean.slice(1) : clean),
      amount: selected!.price,
      type: `featured_${selected!.id}`,
    })
  }

  const handleRetry = () => { mpesa.reset(); setPhone('') }

  const busy = mpesa.stage === 'sending' || mpesa.stage === 'waiting'

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        <div className="w-full relative py-8 px-5 sm:px-12 border-b border-color text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#FFD70015,#8B000020)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown size={16} className="text-[#FFD700]" />
            <span className="text-xs text-[#FFD700] font-bold uppercase tracking-widest">Featured Placement</span>
          </div>
          <h1 className="text-3xl font-black text-text-light mb-2">Get Featured Today</h1>
          <p className="text-sm text-text-muted max-w-md mx-auto">
            Pay via M-Pesa and get placed at the top of search results and our homepage carousel — admin approval within 1 hour.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {!user ? (
            <div className="text-center py-12">
              <Crown size={48} className="text-[#FFD700] mx-auto mb-4" />
              <p className="text-base font-bold text-text-light mb-2">Sign in to upgrade your listing</p>
              <p className="text-sm text-text-muted mb-5">You must be logged in as an escort to purchase a featured placement.</p>
              <Link href="/login" className="px-6 py-3 bg-[#8B0000] text-white font-bold text-sm rounded-xl hover:bg-[#a00000] transition-all inline-flex items-center gap-2">
                Sign In <ArrowRight size={14} />
              </Link>
            </div>

          ) : step === 'select' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => setSelected(plan)}
                    className={`relative text-left bg-card-bg border-2 rounded-2xl p-6 transition-all hover:scale-[1.02] ${selected?.id === plan.id ? 'border-[#8B0000] ring-1 ring-[#8B0000]/50' : plan.popular ? 'border-[#FFD700]' : 'border-color hover:border-text-muted'}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFD700] text-black text-[10px] font-black rounded-full">
                        MOST POPULAR
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: plan.color + '20' }}>
                      <Crown size={18} style={{ color: plan.color }} />
                    </div>
                    <p className="text-xs text-text-muted uppercase tracking-widest mb-1">{plan.name}</p>
                    <p className="text-2xl font-black mb-0.5" style={{ color: plan.color }}>KES {plan.price.toLocaleString()}</p>
                    <p className="text-[11px] text-text-muted mb-4">for {plan.duration}</p>
                    <div className="space-y-2">
                      {plan.perks.map(p => (
                        <div key={p} className="flex items-center gap-2">
                          <CheckCircle2 size={12} style={{ color: plan.color }} />
                          <span className="text-xs text-text-muted">{p}</span>
                        </div>
                      ))}
                    </div>
                    {selected?.id === plan.id && (
                      <div className="mt-4 flex items-center gap-1.5 text-[#8B0000] text-xs font-bold">
                        <CheckCircle2 size={12} fill="#8B0000" className="text-white" /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[[Eye, '+500%', 'More Profile Views'], [Star, '3hrs', 'Avg Approval Time'], [TrendingUp, '8×', 'More Bookings']].map(([Icon, v, l]) => (
                  <div key={l as string} className="bg-card-bg border border-color rounded-2xl p-4 text-center">
                    {React.createElement(Icon as any, { size: 16, className: 'text-[#FFD700] mx-auto mb-1.5' })}
                    <p className="text-lg font-black text-text-light">{v as string}</p>
                    <p className="text-[10px] text-text-muted">{l as string}</p>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => selected && setStep('pay')}
                  disabled={!selected}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black text-sm rounded-xl disabled:opacity-40 hover:from-[#a00000] hover:to-[#8B0000] transition-all shadow-lg shadow-[#8B0000]/30 flex items-center gap-2 mx-auto"
                >
                  <Smartphone size={16} /> Pay via M-Pesa — KES {selected?.price.toLocaleString() ?? '0'}
                </button>
              </div>
            </>

          ) : (
            <div className="max-w-sm mx-auto">

              {/* ── Success ── */}
              {mpesa.stage === 'success' && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#28a745]/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={36} className="text-[#28a745]" />
                  </div>
                  <h2 className="text-xl font-black text-text-light mb-2">Payment Confirmed!</h2>
                  <p className="text-sm text-text-muted mb-4">
                    Your M-Pesa payment has been received. Our team will approve your featured placement within 1–3 hours.
                  </p>
                  <div className="bg-card-bg border border-color rounded-2xl p-4 mb-5 text-left space-y-2">
                    <div className="flex justify-between"><span className="text-xs text-text-muted">Plan</span><span className="text-xs font-bold text-text-light">{selected?.name}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-muted">Amount</span><span className="text-xs font-bold text-[#28a745]">KES {selected?.price.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-muted">Reference</span><span className="text-xs font-mono text-[#FFD700]">{mpesa.txRef}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-text-muted">Status</span><span className="text-xs font-bold text-[#28a745]">✓ Payment Received</span></div>
                  </div>
                  <Link href="/my-profile" className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B0000] text-white font-bold text-sm rounded-xl hover:bg-[#a00000] transition-all">
                    Back to My Profile
                  </Link>
                </div>
              )}

              {/* ── Failed ── */}
              {mpesa.stage === 'failed' && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center mx-auto mb-4">
                    <X size={36} className="text-[#EF4444]" />
                  </div>
                  <h2 className="text-xl font-black text-text-light mb-2">Payment Failed</h2>
                  <p className="text-sm text-text-muted mb-4">{mpesa.error || 'The payment was not completed. Please try again.'}</p>
                  <button onClick={handleRetry} className="w-full py-3.5 bg-[#28a745] text-white font-black rounded-xl flex items-center justify-center gap-2 mb-3">
                    <RefreshCw size={14} /> Try Again
                  </button>
                  <button onClick={() => { mpesa.reset(); setStep('select') }} className="w-full py-2.5 text-text-muted text-xs hover:text-text-light transition-colors">
                    ← Change Plan
                  </button>
                </div>
              )}

              {/* ── Sending / waiting ── */}
              {(mpesa.stage === 'sending' || mpesa.stage === 'waiting') && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-2xl bg-[#28a745]/10 flex items-center justify-center mx-auto mb-4">
                    <Loader2 size={36} className="text-[#28a745] animate-spin" />
                  </div>
                  <h2 className="text-lg font-black text-text-light mb-2">
                    {mpesa.stage === 'sending' ? 'Sending STK Push…' : 'Check Your Phone'}
                  </h2>
                  <p className="text-sm text-text-muted mb-4">
                    {mpesa.stage === 'sending'
                      ? 'Contacting M-Pesa…'
                      : `Enter your M-Pesa PIN on your phone (+254 ${phone.replace(/^254/, '')})`}
                  </p>
                  {mpesa.stage === 'waiting' && (
                    <div className="bg-card-bg border border-color rounded-2xl p-4 text-left space-y-2 mb-4">
                      <div className="flex justify-between"><span className="text-xs text-text-muted">Plan</span><span className="text-xs font-bold text-text-light">{selected?.name}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-text-muted">Amount</span><span className="text-xs font-bold text-[#28a745]">KES {selected?.price.toLocaleString()}</span></div>
                    </div>
                  )}
                  <p className="text-[10px] text-text-muted">Waiting for M-Pesa confirmation (up to 2 min)…</p>
                </div>
              )}

              {/* ── Phone input (idle) ── */}
              {mpesa.stage === 'idle' && (
                <div className="bg-card-bg border border-color rounded-2xl p-6">
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#28a745]/20 flex items-center justify-center mx-auto mb-3">
                      <Smartphone size={24} className="text-[#28a745]" />
                    </div>
                    <h2 className="text-base font-bold text-text-light">M-Pesa STK Push</h2>
                    <p className="text-xs text-text-muted mt-1">Enter your Safaricom number. You'll get a payment prompt.</p>
                  </div>

                  <div className="bg-dark-bg border border-color rounded-xl p-3 mb-4 text-center">
                    <p className="text-[10px] text-text-muted">Paying for</p>
                    <p className="text-sm font-bold text-text-light">{selected?.name}</p>
                    <p className="text-xl font-black text-[#28a745]">KES {selected?.price.toLocaleString()}</p>
                  </div>

                  {(phoneError || mpesa.error) && (
                    <div className="mb-3 flex items-center gap-2 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl">
                      <AlertCircle size={13} className="text-[#EF4444]" />
                      <p className="text-xs text-[#EF4444]">{phoneError || mpesa.error}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">M-Pesa Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">🇰🇪</span>
                      <input
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setPhoneError('') }}
                        placeholder="0712 345 678"
                        className="w-full pl-9 pr-3 py-3 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#28a745] transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-text-muted mt-1">Enter the number registered with M-Pesa</p>
                  </div>

                  <div className="p-3 bg-[#28a745]/10 border border-[#28a745]/20 rounded-xl text-[10px] text-text-muted mb-4">
                    Your profile is only credited after M-Pesa confirms the payment — cancelling or declining the prompt will not charge you.
                  </div>

                  <button
                    onClick={handlePay}
                    className="w-full py-3.5 bg-[#28a745] hover:bg-[#218838] text-white font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Smartphone size={16} /> Send Payment Prompt
                  </button>

                  <button onClick={() => { mpesa.reset(); setStep('select') }} className="w-full mt-2 py-2.5 text-text-muted text-xs hover:text-text-light transition-colors">← Change Plan</button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </main>
  )
}
