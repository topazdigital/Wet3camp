import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useSEO } from '@/lib/useSEO'
import { Crown, Star, Diamond, Check, X, Zap, Eye, BarChart2, Shield, ArrowRight, Flame } from 'lucide-react'
import { Link } from 'wouter'
import { useAuth } from '@/lib/auth-context'

// ─── Tier data ────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'elite',
    name: 'Elite',
    emoji: '👑',
    tagline: 'The highest tier — maximum exposure',
    color: '#FFD700',
    darkColor: '#B8860B',
    glowColor: '#FFD700',
    price: 'KES 8,500 / mo',
    popular: true,
    icon: Crown,
    benefits: [
      { text: '#1 position in ALL search results',     highlight: true },
      { text: 'Daily featured slot in homepage carousel', highlight: true },
      { text: 'Exclusive "Elite" gold verified badge' },
      { text: 'Featured in the Exclusive section'     },
      { text: 'Profile auto-boosted every 48 hours'   },
      { text: 'Up to 30 gallery photos'               },
      { text: 'Video call availability badge'          },
      { text: 'Full analytics: views, clicks, saves'  },
      { text: 'Priority support (24-hour response)'   },
      { text: 'Appear in "Elite Only" client filter'  },
      { text: 'Dedicated profile manager'             },
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    emoji: '⭐',
    tagline: 'Top placement, premium visibility',
    color: '#FF4500',
    darkColor: '#c93500',
    glowColor: '#FF4500',
    price: 'KES 4,500 / mo',
    popular: false,
    icon: Star,
    benefits: [
      { text: 'Top 3 placement in search results',    highlight: true },
      { text: 'Featured in city & category listings', highlight: true },
      { text: '"VIP" orange badge on profile'         },
      { text: 'Profile boost every 72 hours'         },
      { text: 'Up to 20 gallery photos'              },
      { text: 'Appears in "VIP" client filter'       },
      { text: 'Monthly analytics report'             },
      { text: 'Email support'                        },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    emoji: '💎',
    tagline: 'Stand out above standard escorts',
    color: '#B8860B',
    darkColor: '#8B6914',
    glowColor: '#B8860B',
    price: 'KES 2,200 / mo',
    popular: false,
    icon: Zap,
    benefits: [
      { text: 'Above-standard search placement',    highlight: true },
      { text: '"Premium" badge on profile',         highlight: true },
      { text: 'Up to 15 gallery photos'            },
      { text: 'Appears in "Premium" filter'        },
      { text: 'Weekly profile visibility boost'    },
      { text: 'Basic analytics (views count)'      },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    emoji: '🌟',
    tagline: 'Everything you need to get started',
    color: '#9E9E9E',
    darkColor: '#757575',
    glowColor: '#9E9E9E',
    price: 'FREE',
    popular: false,
    icon: Shield,
    benefits: [
      { text: 'Listed in search results'          },
      { text: 'Up to 10 gallery photos'           },
      { text: 'Standard placement'                },
      { text: 'Messaging with clients'            },
    ],
  },
]

const COMPARISON_ROWS = [
  { label: 'Search Placement',     elite: '#1 Always',     vip: 'Top 3',       premium: 'Above standard', standard: 'Standard' },
  { label: 'Homepage Carousel',    elite: 'Daily',         vip: '—',           premium: '—',              standard: '—'        },
  { label: 'Gallery Photos',       elite: '30 photos',     vip: '20 photos',   premium: '15 photos',      standard: '10 photos'},
  { label: 'Profile Badge',        elite: '👑 Gold Elite', vip: '⭐ VIP',       premium: '💎 Premium',     standard: '—'        },
  { label: 'Auto Profile Boost',   elite: 'Every 48h',     vip: 'Every 72h',   premium: 'Weekly',         standard: '—'        },
  { label: 'Analytics Dashboard',  elite: 'Full',          vip: 'Monthly',     premium: 'Views only',     standard: '—'        },
  { label: 'Exclusive Section',    elite: true,            vip: false,         premium: false,            standard: false      },
  { label: 'Priority Support',     elite: true,            vip: false,         premium: false,            standard: false      },
  { label: 'Video Call Badge',     elite: true,            vip: false,         premium: false,            standard: false      },
  { label: 'Client Tier Filter',   elite: 'Elite filter',  vip: 'VIP filter',  premium: 'Premium filter', standard: '—'        },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function TierCard({ tier, isCurrentTier }: { tier: typeof TIERS[number]; isCurrentTier?: boolean }) {
  const Icon = tier.icon
  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all ${
        tier.popular
          ? 'border-[#FFD700]/60 shadow-2xl shadow-[#FFD700]/20'
          : 'border-color hover:border-opacity-60'
      }`}
      style={tier.popular ? { borderColor: tier.color + '80' } : {}}
    >
      {tier.popular && (
        <div className="absolute top-0 left-0 right-0 py-1.5 text-center text-[10px] font-black text-black" style={{ background: tier.color }}>
          ✨ MOST POPULAR — MAXIMUM EXPOSURE
        </div>
      )}

      <div className={`p-6 ${tier.popular ? 'pt-10' : ''}`} style={{ background: `linear-gradient(135deg, ${tier.color}12, transparent)` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: tier.color + '20', border: `2px solid ${tier.color}40` }}>
            <span className="text-2xl">{tier.emoji}</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-text-light">{tier.name}</h3>
            <p className="text-xs text-text-muted">{tier.tagline}</p>
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-black" style={{ color: tier.color }}>{tier.price.split(' / ')[0]}</span>
          <span className="text-sm text-text-muted">/ month</span>
        </div>

        {isCurrentTier ? (
          <div className="w-full py-2.5 rounded-xl text-sm font-bold text-center mt-4" style={{ background: tier.color + '20', color: tier.color, border: `1px solid ${tier.color}40` }}>
            ✓ Your Current Tier
          </div>
        ) : (
          <Link
            href="/featured-upgrade"
            className="w-full py-2.5 rounded-xl text-sm font-black text-center mt-4 block hover:opacity-90 transition-opacity"
            style={{ background: tier.color, color: tier.id === 'elite' ? '#000' : '#fff' }}
          >
            Upgrade to {tier.name} <ArrowRight size={13} className="inline ml-1" />
          </Link>
        )}
      </div>

      <div className="px-6 pb-6 flex-1">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 mt-2">What's Included</p>
        <ul className="space-y-2.5">
          {tier.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: tier.color + '25' }}>
                <Check size={9} style={{ color: tier.color }} />
              </div>
              <span className={`text-xs leading-snug ${b.highlight ? 'text-text-light font-semibold' : 'text-text-muted'}`}>
                {b.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TierBenefitsPage() {
  useSEO({ title: 'Tier Benefits — Wet3Camp', noIndex: true })
  const { user } = useAuth()
  const [showComparison, setShowComparison] = useState(false)

  const currentTier = 'standard'

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full min-w-0 pb-16 lg:pb-0">
        <Header />

        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Page header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full text-[#FFD700] text-xs font-bold mb-4">
              <Crown size={13} /> Escort Subscription Tiers
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-text-light mb-3">
              Grow Your Business on<br />
              <span className="text-[#8B0000]">Wet3</span><span className="text-[#FFD700]">Camp</span>
            </h1>
            <p className="text-text-muted max-w-xl mx-auto text-sm leading-relaxed">
              Higher tiers mean more visibility, more clients, and more earnings. Elite escorts earn on average <span className="text-[#FFD700] font-semibold">3–5× more</span> than standard profiles.
            </p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {TIERS.map(tier => (
              <TierCard key={tier.id} tier={tier} isCurrentTier={tier.id === currentTier} />
            ))}
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { emoji: '👁️', value: '10×',      label: 'More profile views for Elite vs Free' },
              { emoji: '💬', value: '5×',       label: 'More messages for VIP vs Standard'   },
              { emoji: '📅', value: '3–5×',     label: 'More bookings for premium tiers'     },
              { emoji: '💰', value: 'KES 8,500+', label: 'Average Elite monthly earnings gain' },
            ].map(stat => (
              <div key={stat.label} className="bg-card-bg border border-color rounded-xl p-4 text-center">
                <p className="text-2xl mb-1">{stat.emoji}</p>
                <p className="text-xl font-black text-[#FFD700]">{stat.value}</p>
                <p className="text-[10px] text-text-muted mt-1 leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Comparison table toggle */}
          <div className="text-center mb-4">
            <button
              onClick={() => setShowComparison(v => !v)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light hover:border-[#8B0000]/50 transition-all"
            >
              <BarChart2 size={15} />
              {showComparison ? 'Hide' : 'Show'} Full Comparison Table
            </button>
          </div>

          {showComparison && (
            <div className="bg-card-bg border border-color rounded-2xl overflow-hidden mb-10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-color">
                      <th className="text-left p-4 text-xs font-bold text-text-muted uppercase tracking-wider w-40">Feature</th>
                      {TIERS.map(t => (
                        <th key={t.id} className="p-4 text-center">
                          <span className="text-sm font-black" style={{ color: t.color }}>{t.emoji} {t.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr key={row.label} className={`border-b border-color/40 ${i % 2 === 0 ? 'bg-dark-bg/30' : ''}`}>
                        <td className="p-4 text-xs text-text-muted font-semibold">{row.label}</td>
                        {(['elite', 'vip', 'premium', 'standard'] as const).map(tid => {
                          const val = row[tid]
                          return (
                            <td key={tid} className="p-4 text-center">
                              {typeof val === 'boolean' ? (
                                val
                                  ? <Check size={14} className="mx-auto" style={{ color: TIERS.find(t => t.id === tid)?.color }} />
                                  : <X size={14} className="mx-auto text-text-muted/30" />
                              ) : (
                                <span className={`text-xs ${val === '—' ? 'text-text-muted/40' : 'text-text-light font-medium'}`}>{val as string}</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="bg-card-bg border border-color rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-black text-text-light mb-4 flex items-center gap-2">
              <Flame size={16} className="text-[#8B0000]" /> Common Questions
            </h2>
            <div className="space-y-4">
              {[
                { q: 'Can I change my tier at any time?', a: 'Yes. Upgrade or downgrade anytime. Changes take effect immediately.' },
                { q: 'How are payments handled with clients?', a: 'Wet3Camp does not process booking payments. You arrange payment directly with each client — cash, M-Pesa, or whatever you prefer. The platform only charges escorts for their subscription tier.' },
                { q: 'What happens if I cancel my subscription?', a: 'Your profile drops to the Free tier. Your profile stays visible but loses placement and badges.' },
                { q: 'Is the Elite tier really worth it?', a: "Elite escorts get daily carousel features, homepage placement, and the client 'Elite filter' — making you the first escort clients see when browsing. Most Elite escorts see a significant increase in enquiries within the first week." },
              ].map(item => (
                <div key={item.q} className="border-b border-color/40 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-bold text-text-light mb-1">{item.q}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/featured-upgrade"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#8B0000] to-[#FF4500] text-white font-black text-lg rounded-2xl hover:from-[#a00000] hover:to-[#e03c00] transition-all shadow-xl shadow-[#8B0000]/30"
            >
              <Crown size={20} /> Upgrade My Tier Now
            </Link>
            <p className="text-xs text-text-muted mt-3">No long-term contracts. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
