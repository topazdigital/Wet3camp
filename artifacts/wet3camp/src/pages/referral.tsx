import React, { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { Copy, Check, Users, Gift, TrendingUp, Share2, ChevronRight, ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/hooks/useSEO'
import Layout from '@/components/Layout'

interface ReferralStats {
  code: string
  link: string
  total_referrals: number
  confirmed_referrals: number
  earned_kes: number
}

interface ReferralEntry {
  id: number
  referred_name: string | null
  referred_email: string | null
  status: string
  reward_kes: number
  created_at: string
  converted_at: string | null
}

export default function ReferralPage() {
  useSEO({ title: 'Refer & Earn | Wet3Camp' })
  const { isLoggedIn, token } = useAuth()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [history, setHistory] = useState<ReferralEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'overview' | 'history'>('overview')

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return }
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/referral/my', { headers: h }).then(r => r.json()),
      fetch('/api/referral/history', { headers: h }).then(r => r.json()),
    ]).then(([s, hist]) => {
      if (s.code) setStats(s)
      if (hist.referrals) setHistory(hist.referrals)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isLoggedIn, token])

  const copyLink = () => {
    if (!stats?.link) return
    navigator.clipboard.writeText(stats.link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareLink = () => {
    if (!stats?.link) return
    if (navigator.share) {
      navigator.share({ title: 'Join Wet3Camp', url: stats.link })
    } else {
      copyLink()
    }
  }

  const whatsappShare = () => {
    const text = encodeURIComponent(`Join me on Wet3Camp — Kenya's #1 escort directory 🔥 ${stats?.link ?? ''}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-[#8B0000]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift size={28} className="text-[#8B0000]" />
            </div>
            <h2 className="text-xl font-bold text-text-light mb-2">Refer & Earn</h2>
            <p className="text-text-muted text-sm mb-6">Login to get your unique referral link and start earning KES 500 for every friend you bring to Wet3Camp.</p>
            <Link href="/login" className="px-6 py-3 bg-[#8B0000] text-white rounded-xl font-semibold text-sm">Login to Continue</Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-dark-bg pb-24">
        <div className="max-w-lg mx-auto px-4 pt-6">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8B0000] to-[#FFD700]/30 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Gift size={28} className="text-[#FFD700]" />
            </div>
            <h1 className="text-2xl font-black text-text-light">Refer & Earn</h1>
            <p className="text-text-muted text-sm mt-1">Share your link. Earn <span className="text-[#FFD700] font-bold">KES 500</span> per confirmed referral.</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-card-bg rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-card-bg border border-color rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-text-light">{stats?.total_referrals ?? 0}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mt-0.5">Referred</div>
                </div>
                <div className="bg-card-bg border border-color rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-[#28a745]">{stats?.confirmed_referrals ?? 0}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mt-0.5">Confirmed</div>
                </div>
                <div className="bg-card-bg border border-color rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-[#FFD700]">{(stats?.earned_kes ?? 0).toLocaleString()}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mt-0.5">KES Earned</div>
                </div>
              </div>

              {/* Referral link card */}
              <div className="bg-card-bg border border-color rounded-2xl p-4 mb-5">
                <p className="text-xs text-text-muted mb-2 font-medium">Your referral link</p>
                <div className="flex items-center gap-2 bg-dark-bg border border-color rounded-xl px-3 py-2.5 mb-3">
                  <span className="text-xs text-[#FFD700] font-mono flex-1 truncate">{stats?.link ?? 'Loading…'}</span>
                  <button onClick={copyLink} className="flex-shrink-0 p-1.5 rounded-lg bg-[#8B0000]/20 hover:bg-[#8B0000]/40 transition-all">
                    {copied ? <Check size={14} className="text-[#28a745]" /> : <Copy size={14} className="text-[#8B0000]" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyLink} className="flex-1 py-2.5 bg-[#8B0000] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#6B0000] transition-all">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button onClick={whatsappShare} className="flex-1 py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all">
                    <Share2 size={14} />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-card-bg border border-color rounded-2xl p-4 mb-5">
                <h3 className="text-sm font-bold text-text-light mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#FFD700]" /> How It Works
                </h3>
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Share your unique link with friends via WhatsApp, Telegram, or social media' },
                    { step: '2', text: 'Your friend registers on Wet3Camp using your link' },
                    { step: '3', text: 'You earn KES 500 credit automatically when they sign up' },
                    { step: '4', text: 'Earn KES 1,000 bonus when an escort joins using your link and goes live' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#8B0000] text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                      <p className="text-xs text-text-muted leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* History */}
              <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-color flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-light flex items-center gap-2">
                    <Users size={14} className="text-[#8B0000]" /> Referral History
                  </h3>
                  <span className="text-xs text-text-muted">{history.length} total</span>
                </div>
                {history.length === 0 ? (
                  <div className="py-10 text-center">
                    <Users size={24} className="text-text-muted mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-text-muted">No referrals yet — share your link to start earning!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#ffffff08]">
                    {history.map(r => (
                      <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-text-light">{r.referred_name ?? 'New Member'}</div>
                          <div className="text-xs text-text-muted mt-0.5">{new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'confirmed' ? 'bg-[#28a745]/15 text-[#28a745]' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {r.status === 'confirmed' ? `+KES ${r.reward_kes.toLocaleString()}` : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
