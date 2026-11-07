import React, { useCallback, useEffect, useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useMpesaPayment } from '@/lib/mpesa'
import { formatKes, usePublicPricing } from '@/lib/pricing'
import { getToken } from '@/lib/api'
import { useSEO } from '@/lib/useSEO'
import { AlertCircle, ArrowLeft, CheckCircle2, Crown, Loader2, RefreshCw, Smartphone } from 'lucide-react'
import { Link } from 'wouter'

const TIERS = [
  { id: 'premium', name: 'Premium', color: '#FFD700', summary: 'Higher placement, Premium badge, and more gallery space.' },
  { id: 'vip', name: 'VIP', color: '#B8860B', summary: 'Top-tier placement, VIP badge, and expanded profile visibility.' },
  { id: 'elite', name: 'Elite', color: '#8B0000', summary: 'The highest profile tier with Elite placement and benefits.' },
] as const

type TierId = typeof TIERS[number]['id']
type TierStatus = { tier: string; expiresAt: string | null }

function isTierId(value: string | null): value is TierId {
  return TIERS.some(tier => tier.id === value)
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
}

export default function TierUpgradePage() {
  useSEO({ title: 'Monthly Profile Tier Upgrade — Wet3Camp', noIndex: true })
  const requestedTier = new URLSearchParams(window.location.search).get('tier')
  const [selectedId, setSelectedId] = useState<TierId>(isTierId(requestedTier) ? requestedTier : 'premium')
  const [step, setStep] = useState<'select' | 'pay'>('select')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [notice, setNotice] = useState('')
  const [tierStatus, setTierStatus] = useState<TierStatus>({ tier: 'standard', expiresAt: null })
  const [tierStatusLoading, setTierStatusLoading] = useState(true)
  const [tierStatusError, setTierStatusError] = useState('')
  const mpesa = useMpesaPayment()
  const { pricing, loading: pricingLoading, error: pricingError, refresh: refreshPricing } = usePublicPricing()

  const selectedTier = TIERS.find(tier => tier.id === selectedId)!
  const selectedPrice = pricing?.profileTiers[selectedId] ?? null
  const activeExpiryLabel = formatDate(tierStatus.expiresAt)
  const isSameActiveTier = tierStatus.tier === selectedId
    && (!tierStatus.expiresAt || new Date(tierStatus.expiresAt).getTime() > Date.now())
  const extendsExistingTerm = tierStatus.tier === selectedId
    && !!tierStatus.expiresAt
    && new Date(tierStatus.expiresAt).getTime() > Date.now()

  const loadTierStatus = useCallback(async () => {
    setTierStatusLoading(true)
    const token = getToken()
    try {
      const response = await fetch('/api/payments/profile-tier', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Could not load your current tier.')
      setTierStatus({
        tier: String(data.tier ?? 'standard').toLowerCase(),
        expiresAt: data.expiresAt ?? null,
      })
      setTierStatusError('')
    } finally {
      setTierStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTierStatus().catch((error: unknown) => {
      setTierStatusError(error instanceof Error ? error.message : 'Could not load your current tier.')
    })
  }, [loadTierStatus])

  useEffect(() => {
    if (mpesa.stage === 'success') {
      void loadTierStatus().catch((error: unknown) => {
        setTierStatusError(error instanceof Error ? error.message : 'Could not refresh your current tier.')
      })
    }
  }, [mpesa.stage, loadTierStatus])

  const handlePay = async () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 9) {
      setPhoneError('Enter a valid M-Pesa phone number.')
      return
    }
    setPhoneError('')
    setNotice('')
    const latestPricing = await refreshPricing()
    if (!latestPricing) {
      setNotice('We could not confirm the current price. Please try again before paying.')
      return
    }

    const latestAmount = latestPricing.profileTiers[selectedId]
    if (latestAmount !== selectedPrice) {
      setStep('select')
      setNotice('The price has changed. Review the updated price before continuing.')
      return
    }

    const normalizedPhone = cleanPhone.startsWith('254')
      ? cleanPhone
      : `254${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`
    await mpesa.initiate({
      phone: normalizedPhone,
      amount: latestAmount,
      type: `tier_${selectedId}`,
    })
  }

  const retryPayment = () => {
    mpesa.reset()
    setPhone('')
    setPhoneError('')
  }

  const busy = mpesa.stage === 'sending' || mpesa.stage === 'waiting'

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full min-w-0 overflow-x-hidden pb-24 lg:pb-0">
        <Header />

        <div className="border-b border-color px-5 py-8 text-center sm:px-10"
          style={{ background: 'linear-gradient(135deg,#FFD70018,#8B000020)' }}>
          <div className="mb-2 flex items-center justify-center gap-2">
            <Crown size={16} className="text-[#FFD700]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#FFD700]">Monthly Profile Tiers</span>
          </div>
          <h1 className="mb-2 text-2xl font-black text-text-light sm:text-3xl">Choose Your Profile Tier</h1>
          <p className="mx-auto max-w-xl text-sm leading-6 text-text-muted">
            A separate monthly upgrade from Featured Placement. Each confirmed M-Pesa payment covers 30 days.
            It does not auto-renew, and tiers do not guarantee enquiries or bookings.
          </p>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6">
          <div className="mb-6 rounded-2xl border border-color bg-card-bg p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Your current tier</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-black capitalize text-text-light">{tierStatusLoading ? 'Loading…' : tierStatus.tier}</p>
              {activeExpiryLabel && (
                <p className="text-xs text-text-muted">Active until {activeExpiryLabel}</p>
              )}
            </div>
            {tierStatusError && <p className="mt-2 text-xs text-[#EF4444]" role="status">{tierStatusError}</p>}
          </div>

          {mpesa.stage === 'success' ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-[#28a745]/30 bg-card-bg p-6 text-center">
              <CheckCircle2 size={42} className="mx-auto mb-3 text-[#28a745]" />
              <h2 className="text-xl font-black text-text-light">Tier payment confirmed</h2>
              <p className="mt-2 text-sm text-text-muted">
                Your {selectedTier.name} profile tier is active.
                {activeExpiryLabel ? ` It is active until ${activeExpiryLabel}.` : ' Your active period is being refreshed.'}
              </p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Link href="/my-profile" className="rounded-xl bg-[#8B0000] px-5 py-3 text-sm font-bold text-white">
                  Back to My Profile
                </Link>
                <Link href="/payment-history" className="rounded-xl border border-color px-5 py-3 text-sm font-bold text-text-light">
                  View Payment History
                </Link>
              </div>
            </div>
          ) : busy ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-color bg-card-bg p-8 text-center">
              <Loader2 size={38} className="mx-auto mb-4 animate-spin text-[#28a745]" />
              <h2 className="text-lg font-black text-text-light">
                {mpesa.stage === 'sending' ? 'Sending M-Pesa prompt…' : 'Check your phone'}
              </h2>
              <p className="mt-2 text-sm text-text-muted">
                {mpesa.stage === 'sending'
                  ? 'Contacting M-Pesa.'
                  : 'Enter your M-Pesa PIN to confirm the payment. This tier will activate after confirmation.'}
              </p>
              <p className="mt-4 text-[10px] text-text-muted">Waiting for payment confirmation (up to 2 minutes).</p>
            </div>
          ) : mpesa.stage === 'failed' ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-[#EF4444]/30 bg-card-bg p-6 text-center">
              <AlertCircle size={36} className="mx-auto mb-3 text-[#EF4444]" />
              <h2 className="text-lg font-black text-text-light">Payment not confirmed</h2>
              <p className="mt-2 text-sm text-text-muted">{mpesa.error || 'The payment did not complete.'}</p>
              <button onClick={retryPayment} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#28a745] px-5 py-3 text-sm font-bold text-white">
                <RefreshCw size={14} /> Try Again
              </button>
              <button
                onClick={() => { mpesa.reset(); setStep('select') }}
                className="mt-2 block w-full py-2 text-xs text-text-muted hover:text-text-light"
              >
                Choose another tier
              </button>
            </div>
          ) : step === 'select' ? (
            <>
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {pricing ? TIERS.map(tier => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => { setSelectedId(tier.id); setNotice('') }}
                    aria-pressed={selectedId === tier.id}
                    className={`rounded-2xl border-2 bg-card-bg p-5 text-left transition-all hover:-translate-y-0.5 ${
                      selectedId === tier.id ? 'border-[#FFD700] ring-1 ring-[#FFD700]/30' : 'border-color hover:border-text-muted'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: tier.color }}>{tier.name}</p>
                    <p className="mt-1 text-2xl font-black text-text-light">{formatKes(pricing.profileTiers[tier.id])}</p>
                    <p className="text-[11px] text-text-muted">per 30-day term</p>
                    <p className="mt-4 text-xs leading-5 text-text-muted">{tier.summary}</p>
                    {tierStatus.tier === tier.id && (
                      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#FFD700]">
                        Current tier — renew or keep it
                      </p>
                    )}
                  </button>
                )) : (
                  <div className="rounded-2xl border border-color bg-card-bg p-6 text-center text-sm text-text-muted md:col-span-3" role="status">
                    {pricingLoading ? 'Loading current prices…' : pricingError || 'Current prices are temporarily unavailable.'}
                  </div>
                )}
              </div>

              {notice && <p className="mb-4 text-center text-xs text-[#FFD700]" role="status">{notice}</p>}
              {pricing && (
                <>
                  <div className="mb-5 rounded-xl border border-color bg-card-bg p-4 text-xs leading-5 text-text-muted">
                    {extendsExistingTerm
                      ? 'Renewing the same active tier early adds 30 days after its current expiry.'
                      : 'A tier change takes effect when payment is confirmed and starts a new 30-day period; unused time on another tier is not credited.'}
                    {' '}M-Pesa payments are one-time; renew manually before your tier expires.
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep('pay'); setNotice('') }}
                    disabled={pricingLoading}
                    className="mx-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#a00000] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-[#8B0000]/30 transition-all hover:from-[#a00000] hover:to-[#8B0000] disabled:opacity-50"
                  >
                    <Crown size={16} /> Continue with {selectedTier.name} · {formatKes(selectedPrice!)}
                  </button>
                </>
              )}
              <div className="mt-5 text-center">
                <Link href="/tier-benefits" className="text-xs font-semibold text-text-muted underline underline-offset-4 hover:text-text-light">
                  Compare all tier benefits
                </Link>
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-color bg-card-bg p-6">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="mb-5 inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-light"
              >
                <ArrowLeft size={13} /> Change tier
              </button>
              <div className="mb-5 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#28a745]/15">
                  <Smartphone size={24} className="text-[#28a745]" />
                </div>
                <h2 className="text-base font-black text-text-light">Pay with M-Pesa</h2>
                <p className="mt-1 text-xs text-text-muted">Enter the Safaricom number that should receive the payment prompt.</p>
              </div>

              <div className="mb-4 rounded-xl border border-color bg-dark-bg p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-text-muted">Monthly profile tier</p>
                <p className="mt-1 text-sm font-bold text-text-light">{selectedTier.name}</p>
                <p className="mt-1 text-xl font-black text-[#28a745]">{selectedPrice === null ? '—' : formatKes(selectedPrice)}</p>
                <p className="text-[10px] text-text-muted">30 days · renew manually</p>
              </div>

              {(phoneError || mpesa.error) && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/10 p-3">
                  <AlertCircle size={13} className="mt-0.5 shrink-0 text-[#EF4444]" />
                  <p className="text-xs text-[#EF4444]">{phoneError || mpesa.error}</p>
                </div>
              )}
              <label htmlFor="tier-mpesa-phone" className="mb-1.5 block text-[10px] uppercase tracking-widest text-text-muted">
                M-Pesa phone number
              </label>
              <input
                id="tier-mpesa-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={event => { setPhone(event.target.value); setPhoneError('') }}
                placeholder="0712 345 678"
                className="mb-2 w-full rounded-xl border border-color bg-dark-bg px-3 py-3 text-sm text-text-light placeholder:text-text-muted focus:border-[#28a745] focus:outline-none"
              />
              <p className="mb-4 text-[10px] text-text-muted">The tier activates only after the payment is confirmed. This is not an automatic recurring charge.</p>
              <button
                type="button"
                onClick={() => void handlePay()}
                disabled={selectedPrice === null || pricingLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28a745] py-3.5 text-sm font-black text-white transition-colors hover:bg-[#218838] disabled:opacity-50"
              >
                <Smartphone size={16} /> Send M-Pesa Prompt
              </button>
              <button
                type="button"
                onClick={() => { mpesa.reset(); setStep('select') }}
                className="mt-2 w-full py-2 text-xs text-text-muted hover:text-text-light"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
