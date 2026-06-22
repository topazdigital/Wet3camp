import React, { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useSEO } from '@/lib/useSEO'
import { useAuth } from '@/lib/auth-context'
import { getToken } from '@/lib/api'
import { CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

interface Payment {
  id: number
  plan: string
  amount: number
  phone: string
  status: 'pending' | 'paid' | 'failed' | string
  tx_ref: string
  expires_at: string | null
  created_at: string
  escort_name?: string
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'paid') return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-bold">
      <CheckCircle size={10} /> Paid
    </span>
  )
  if (s === 'failed') return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold">
      <XCircle size={10} /> Failed
    </span>
  )
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[10px] font-bold">
      <Clock size={10} /> Pending
    </span>
  )
}

function formatDate(str: string) {
  try {
    return new Date(str).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return str
  }
}

function planLabel(plan: string) {
  const labels: Record<string, string> = {
    standard: 'Standard Listing',
    premium: 'Premium Listing',
    vip: 'VIP Listing',
    elite: 'Elite Listing',
    featured: 'Featured Boost',
    subscription: 'Subscription',
  }
  return labels[plan?.toLowerCase()] ?? plan ?? 'Plan'
}

export default function PaymentHistory() {
  useSEO({ title: 'Payment History', description: 'Your M-Pesa payment history on Wet3Camp.' })
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payments/history', {
        headers: { 'Authorization': `Bearer ${getToken() ?? ''}` },
      })
      if (!res.ok) throw new Error('Could not load payment history')
      const data = await res.json()
      setPayments(data.payments ?? [])
    } catch (e: any) {
      setError(e.message ?? 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount ?? 0), 0)

  return (
    <div className="flex flex-col min-h-screen bg-dark-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-black text-text-light flex items-center gap-2">
                  <CreditCard size={20} className="text-[#8B0000]" />
                  Payment History
                </h1>
                <p className="text-xs text-text-muted mt-0.5">Your M-Pesa payments and subscription records</p>
              </div>
              <button onClick={load} className="p-2 rounded-lg border border-color hover:border-[#8B0000]/50 transition-colors">
                <RefreshCw size={14} className={`text-text-muted ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Summary card */}
            {!loading && payments.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-card-bg border border-color rounded-xl p-3 text-center">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Payments</p>
                  <p className="text-xl font-black text-text-light">{payments.length}</p>
                </div>
                <div className="bg-card-bg border border-color rounded-xl p-3 text-center">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Successful</p>
                  <p className="text-xl font-black text-green-400">{payments.filter(p => p.status === 'paid').length}</p>
                </div>
                <div className="bg-card-bg border border-color rounded-xl p-3 text-center">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total Paid</p>
                  <p className="text-xl font-black text-text-light">KES {totalPaid.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-card-bg border border-color rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-dark-bg rounded w-1/3 mb-2" />
                    <div className="h-3 bg-dark-bg rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm font-semibold mb-2">{error}</p>
                <button onClick={load} className="text-xs text-red-300 hover:underline">Try again</button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && payments.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">💳</div>
                <h3 className="text-lg font-bold text-text-light mb-2">No payments yet</h3>
                <p className="text-text-muted text-sm">When you make a payment it will appear here.</p>
              </div>
            )}

            {/* Payment list */}
            {!loading && payments.length > 0 && (
              <div className="space-y-3">
                {payments.map(p => (
                  <div key={p.id} className="bg-card-bg border border-color rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-text-light">{planLabel(p.plan)}</p>
                          <StatusBadge status={p.status} />
                        </div>
                        {p.escort_name && (
                          <p className="text-xs text-text-muted mb-1">For: <span className="text-text-light">{p.escort_name}</span></p>
                        )}
                        <p className="text-[10px] text-text-muted">{formatDate(p.created_at)}</p>
                        {p.expires_at && p.status === 'paid' && (
                          <p className="text-[10px] text-text-muted mt-0.5">
                            Active until: <span className="text-green-400">{formatDate(p.expires_at)}</span>
                          </p>
                        )}
                        <p className="text-[9px] text-text-muted mt-1 font-mono opacity-60">Ref: {p.tx_ref}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-black text-text-light">KES {(p.amount ?? 0).toLocaleString()}</p>
                        {p.phone && <p className="text-[10px] text-text-muted">{p.phone}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
