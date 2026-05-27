import React, { useState } from 'react'
import { Heart, Share2, MessageCircle, MapPin, Star, Check, X, Calendar, Clock, CheckCircle2, ChevronLeft, Flame, Shield, Eye, Ruler, UserPlus, UserCheck, Users } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Link, useRoute } from 'wouter'
import { ESCORTS, getSlug } from '@/data/escorts'
import { useEscort } from '@/hooks/useEscorts'
import { useAuth } from '@/lib/auth-context'
import { useFollow } from '@/lib/follow-context'
import { useSEO } from '@/lib/useSEO'
import BookingModal from '@/components/BookingModal'

const TIER_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  Elite:    { bg: '#8B0000',  text: '#fff', label: '★ ELITE'   },
  VIP:      { bg: '#FF4500',  text: '#fff', label: '◆ VIP'     },
  Premium:  { bg: '#B8860B',  text: '#fff', label: '◈ PREMIUM' },
  Standard: { bg: '#3a6da8',  text: '#fff', label: 'STANDARD'  },
}

function waLink(phone: string | undefined, name: string, hourlyRate?: number) {
  const num = (phone ?? '').replace(/\D/g, '') || '254700000000'
  const firstName = name.split(' ')[0]
  const rateText = hourlyRate ? ` at KES ${hourlyRate.toLocaleString()}/hr` : ''
  const msg = encodeURIComponent(
    `Hi ${firstName}! I found your profile on Wet3Camp and I'd like to book you${rateText}. Are you available? Please let me know your schedule.`
  )
  return `https://wa.me/${num}?text=${msg}`
}

function tgLink(name: string) {
  return `https://t.me/${name.replace(/[\s.]/g,'').toLowerCase()}_wet3camp`
}

export default function ProfilePage() {
  const [, params] = useRoute('/profile/:slug')
  const { isLoggedIn, user } = useAuth()
  const { isFollowing, toggleFollow, followerCount } = useFollow()

  const slug = params?.slug
  const { escort: apiEscort, isLoading } = useEscort(slug)

  // Only fall back to static ESCORTS for name-slug URLs; never fall back to ESCORTS[0]
  const escort = (apiEscort as any) ??
    (!isLoading && slug ? (
      ESCORTS.find(e => getSlug(e.name) === slug) ??
      ESCORTS.find(e => e.id === slug) ??
      null
    ) : null)

  const similar = ESCORTS.filter(e => e.id !== escort?.id && e.city === escort?.city).slice(0, 6)

  useSEO({
    title: escort ? `${escort.name} — ${escort.tier} Escort in ${escort.city} | Wet3Camp` : 'Verified Escort Profile Kenya | Wet3Camp',
    description: escort ? `Book ${escort.name}, verified ${escort.tier} escort in ${escort.area}, ${escort.city}. ${escort.bio?.slice(0, 130)}` : "Verified escort profiles on Wet3Camp — Kenya's #1 escort directory.",
    keywords: escort ? `${escort.name}, ${escort.city} escort, ${escort.area} escort Kenya, ${escort.tier} escort ${escort.city}, book escort ${escort.city}, female escort ${escort.area}` : undefined,
  })

  const [liked, setLiked] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews'>('about')
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [mainImg, setMainImg] = useState<string | null>(escort?.image ?? null)
  const tier = TIER_STYLE[(escort?.tier as string)] ?? TIER_STYLE.Standard
  const following = isFollowing(escort?.id ?? '')
  const [claimSent, setClaimSent] = useState(false)
  const [claimLoading, setClaimLoading] = useState(false)

  const handleClaim = async () => {
    if (!isLoggedIn) { window.location.href = `/login?redirect=/profile/${escort?.id}`; return }
    setClaimLoading(true)
    try {
      const token = localStorage.getItem('w3c_token') ?? ''
      const resp = await fetch(`/api/escorts/${escort?.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })
      if (resp.ok) setClaimSent(true)
    } catch {}
    setClaimLoading(false)
  }

  // Sync main image when escort data loads
  React.useEffect(() => {
    if (escort?.image) setMainImg(escort.image)
  }, [escort?.image])

  // Detect if viewer is looking at their own profile
  const isOwnProfile = !!(user?.id && (escort as any)?.user_id && String((escort as any).user_id) === user.id)

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-[#8B0000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-text-muted">Loading profile…</p>
            </div>
          </div>
        )}

        {/* Not found state */}
        {!isLoading && !escort && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-sm">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-black text-text-light mb-2">Profile Not Found</h2>
              <p className="text-sm text-text-muted mb-6">This escort profile doesn't exist or may have been removed.</p>
              <Link href="/" className="px-6 py-2.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors inline-block">Browse Escorts</Link>
            </div>
          </div>
        )}

        {/* Main content — only rendered when escort exists */}
        {!isLoading && escort && <>

        {/* Lightbox */}
        {selectedImg && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setSelectedImg(null)}>
            <img src={selectedImg} alt="Gallery" className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl" />
            <button className="absolute top-5 right-5 p-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><X size={20} /></button>
          </div>
        )}

        {/* Full-width hero — creative: blurred bg + full portrait + gallery strip */}
        <div className="relative w-full overflow-hidden" style={{ minHeight: '420px', maxHeight: '600px', height: '65vw' }}>
          {/* Blurred background fill */}
          <img
            src={mainImg ?? undefined}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ filter: 'blur(28px) brightness(0.45) saturate(1.2)', transform: 'scale(1.15)' }}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/20 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/60 via-transparent to-dark-bg/30" />

          {/* Full portrait — centered, fully visible */}
          <div className="absolute inset-0 flex items-center justify-center">
            {mainImg ? (
              <img
                src={mainImg}
                alt={escort.name}
                onClick={() => setSelectedImg(mainImg)}
                className="h-full w-auto max-w-[65%] sm:max-w-[45%] lg:max-w-[35%] object-contain drop-shadow-2xl cursor-zoom-in"
                style={{ filter: 'drop-shadow(0 8px 40px rgba(0,0,0,0.7))' }}
                draggable={false}
              />
            ) : (
              <div className="w-48 h-64 bg-dark-bg/50 rounded-2xl flex items-center justify-center">
                <span className="text-6xl">👤</span>
              </div>
            )}
          </div>

          {/* Gallery filmstrip — bottom of hero */}
          {escort.gallery && escort.gallery.length > 0 && (
            <div className="absolute bottom-14 left-0 right-0 px-4 flex gap-2 overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}>
              {escort.gallery.slice(0, 6).map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setMainImg(img)}
                  className={`flex-shrink-0 w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden border-2 transition-all shadow-lg backdrop-blur-sm ${mainImg === img ? 'border-[#FFD700]/90 ring-1 ring-[#FFD700]/50' : 'border-white/20 hover:border-[#FFD700]/70'}`}
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                >
                  <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
              {escort.gallery.length > 6 && (
                <button
                  onClick={() => setMainImg(escort.gallery[6])}
                  className="flex-shrink-0 w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden border-2 border-white/20 hover:border-[#FFD700]/70 transition-all shadow-lg relative"
                >
                  <img src={escort.gallery[6]} alt="more" className="w-full h-full object-cover opacity-40" draggable={false} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xs font-black">+{escort.gallery.length - 6}</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Top-left: browse back */}
          <div className="absolute top-4 left-4">
            <Link href="/" className="flex items-center gap-1.5 px-3 py-2 bg-black/50 backdrop-blur-sm rounded-xl text-white text-xs font-medium hover:bg-black/70 transition-colors">
              <ChevronLeft size={14} /> Browse
            </Link>
          </div>

          {/* Top-right: actions */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isOwnProfile ? (
              <Link href="/my-profile" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-sm transition-all border bg-black/50 border-white/20 text-white hover:bg-black/70">
                Edit My Profile
              </Link>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (!isLoggedIn) { window.location.href = `/login?redirect=/profile/${escort.id}`; return }
                    toggleFollow(escort.id)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-sm transition-all border ${following ? 'bg-[#8B0000]/40 border-[#8B0000]/60 text-white' : 'bg-black/50 border-white/20 text-white hover:bg-black/70'}`}
                >
                  {following ? <UserCheck size={13} /> : <UserPlus size={13} />}
                  {following ? 'Following' : 'Follow'}
                </button>
                <button onClick={() => setLiked(v => !v)} className={`p-2.5 rounded-full backdrop-blur-sm transition-all border ${liked ? 'bg-[#E91E63]/20 border-[#E91E63]/50' : 'bg-black/50 border-white/10'}`}>
                  <Heart size={18} className={liked ? 'fill-[#E91E63] text-[#E91E63]' : 'text-white'} />
                </button>
              </>
            )}
            <button className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white hover:bg-black/70 transition-all">
              <Share2 size={18} />
            </button>
          </div>

          {/* Bottom-left: badges */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-[11px] font-black text-white shadow-lg" style={{ backgroundColor: tier.bg }}>{tier.label}</span>
            {escort.verified && (
              <span className="flex items-center gap-1 px-2.5 py-1.5 bg-[#28a745]/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
                <Shield size={9} /> Verified
              </span>
            )}
            <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${escort.available ? 'bg-[#28a745]/80 text-white' : 'bg-black/60 text-white/60'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${escort.available ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
              {escort.available ? 'Available Now' : 'Busy'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 -mt-6 relative z-10">

            {/* LEFT: main info */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-black text-text-light">{escort.name}<span className="text-text-muted font-light text-xl">, {escort.age}</span></h1>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={13} className="text-text-muted" />
                      <span className="text-sm text-text-muted">{escort.area}, {escort.city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 mb-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} size={13} className={i <= Math.round(escort.rating) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />)}
                      <span className="font-bold text-text-light text-sm ml-1">{escort.rating}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Eye size={11} className="text-text-muted" />
                      <span className="text-[11px] text-text-muted">{escort.reviews} reviews</span>
                      {escort.verified && <CheckCircle2 size={12} className="text-[#28a745]" fill="#28a745" />}
                    </div>
                  </div>
                </div>

                {/* Social stats row */}
                <div className="flex items-center gap-4 mb-3 py-3 border-t border-b border-color/50">
                  <div className="text-center">
                    <p className="text-sm font-black text-text-light">{followerCount(escort.id).toLocaleString()}</p>
                    <p className="text-[9px] text-text-muted">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-text-light">{escort.reviews}</p>
                    <p className="text-[9px] text-text-muted">Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-text-light">{escort.rating}★</p>
                    <p className="text-[9px] text-text-muted">Rating</p>
                  </div>
                  {!isOwnProfile && (
                  <div className="ml-auto">
                    <button
                      onClick={() => {
                        if (!isLoggedIn) { window.location.href = `/login?redirect=/profile/${escort.id}`; return }
                        toggleFollow(escort.id)
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${following ? 'bg-card-bg border-color text-text-muted hover:border-[#EF4444] hover:text-[#EF4444]' : 'bg-[#8B0000] border-[#8B0000] text-white hover:bg-[#a00000]'}`}
                    >
                      {following ? <><UserCheck size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
                    </button>
                  </div>
                  )}
                </div>

                {!(escort as any).user_id && !isOwnProfile && (
                  <div className={`mt-1 mb-3 flex items-center gap-3 px-3 py-2.5 rounded-xl border ${claimSent ? 'bg-[#28a745]/10 border-[#28a745]/20' : 'bg-[#FFD700]/5 border-[#FFD700]/20'}`}>
                    {claimSent ? (
                      <>
                        <CheckCircle2 size={13} className="text-[#28a745] flex-shrink-0"/>
                        <p className="text-xs text-[#28a745] font-semibold flex-1">Claim submitted — pending admin review.</p>
                      </>
                    ) : (
                      <>
                        <Shield size={13} className="text-[#FFD700] flex-shrink-0"/>
                        <p className="text-xs text-text-muted flex-1">Is this your profile?</p>
                        <button
                          onClick={handleClaim}
                          disabled={claimLoading}
                          className="px-3 py-1.5 bg-[#FFD700] text-black text-[10px] font-black rounded-lg hover:bg-[#e6c000] disabled:opacity-60 transition-all flex items-center gap-1.5 flex-shrink-0"
                        >
                          {claimLoading && <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"/>}
                          Claim Profile
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {[
                    [Ruler, escort.height],
                    [Shield, escort.bodyType],
                    [Flame, escort.ethnicity],
                    [Star, escort.languages.join(' · ')],
                  ].map(([Icon, val], i) => (
                    <div key={i} className="flex items-center gap-1 px-2.5 py-1 bg-dark-bg border border-color rounded-lg text-[10px] text-text-muted">
                      {React.createElement(Icon as any, { size: 10, className: 'text-text-muted' })} {val}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing — 2-column incall/outcall grid */}
              <div className="bg-card-bg border border-color rounded-2xl p-4">
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Rates (KES)</p>
                {/* Header */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div/>
                  <p className="text-[10px] font-bold text-[#8B0000] uppercase tracking-widest text-center">Incall</p>
                  <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest text-center">Outcall</p>
                </div>
                {/* Short 1hr */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-color/50 items-center">
                  <p className="text-[11px] text-text-muted">Short (1hr)</p>
                  <p className="text-center text-sm font-black text-text-light">{escort.pricing?.incall ? `KES ${escort.pricing.incall.toLocaleString()}` : '—'}</p>
                  <p className="text-center text-sm font-black text-text-light">{escort.pricing?.outcall ? `KES ${escort.pricing.outcall.toLocaleString()}` : '—'}</p>
                </div>
                {/* Overnight */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-color/50 items-center">
                  <p className="text-[11px] text-text-muted">Overnight</p>
                  <p className="text-center text-sm font-black text-text-light">{escort.pricing?.incallOvernight ? `KES ${escort.pricing.incallOvernight.toLocaleString()}` : '—'}</p>
                  <p className="text-center text-sm font-black text-text-light">{escort.pricing?.outcallOvernight ? `KES ${escort.pricing.outcallOvernight.toLocaleString()}` : '—'}</p>
                </div>
                {/* Video Call */}
                {!!escort.pricing?.video && (
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-color/50 items-center">
                    <p className="text-[11px] text-text-muted">Video Call</p>
                    <p className="col-span-2 text-center text-sm font-black text-[#E91E63]">KES {escort.pricing.video.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="bg-card-bg border border-color rounded-2xl overflow-hidden">
                <div className="flex border-b border-color">
                  {(['about', 'services', 'reviews'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-semibold transition-all capitalize border-b-2 ${activeTab === tab ? 'text-[#FFD700] border-[#FFD700]' : 'text-text-muted border-transparent hover:text-text-light'}`}>{tab}</button>
                  ))}
                </div>
                <div className="p-5">
                  {activeTab === 'about' && (
                    <div className="space-y-5">
                      <p className="text-sm text-text-light leading-relaxed">{escort.bio}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          ['Languages', escort.languages.join(', ')],
                          ['Height',    escort.height],
                          ['Body Type', escort.bodyType],
                          ['Ethnicity', escort.ethnicity],
                          ['Hair',      escort.hairColor],
                          ['City',      escort.city],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-[9px] text-text-muted uppercase tracking-widest mb-0.5">{l}</p>
                            <p className="text-sm font-semibold text-text-light">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === 'services' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {escort.services.map((s: any) => (
                        <div key={s.name} className={`flex items-center justify-between p-3 rounded-xl border text-xs ${s.available ? 'bg-dark-bg border-color' : 'bg-dark-bg/50 border-color/30 opacity-50'}`}>
                          <span className={`font-medium ${s.available ? 'text-text-light' : 'text-text-muted'}`}>{s.name}</span>
                          {s.available
                            ? <span className="flex items-center gap-1 text-[#28a745] font-semibold"><Check size={11} /> Yes</span>
                            : <span className="flex items-center gap-1 text-[#EF4444] font-semibold"><X size={11} /> No</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'reviews' && (
                    <div className="space-y-3">
                      {(escort.reviews_data ?? []).map((r: any) => (
                        <div key={r.id} className="p-4 bg-dark-bg rounded-xl border border-color/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-xs font-bold text-[#8B0000]">{r.client.charAt(0)}</div>
                              <p className="font-bold text-text-light text-sm">{r.client}</p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={11} className={i <= r.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />)}</div>
                              <span className="text-[9px] text-text-muted">{r.date}</span>
                            </div>
                          </div>
                          <p className="text-sm text-text-muted leading-relaxed">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <div className="bg-card-bg border border-color rounded-2xl p-5">
                <h3 className="text-sm font-bold text-text-light mb-3">Photo Gallery</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {escort.gallery.map((img: string, i: number) => (
                    <button key={i} onClick={() => setSelectedImg(img)} title="View larger" className="aspect-square rounded-xl overflow-hidden border border-color hover:border-[#8B0000]/60 transition-all group">
                      <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Similar escorts */}
              {similar.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-light mb-3">More in {escort.city}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {similar.map(s => (
                      <Link key={s.id} href={`/profile/${s.id}`} className="group">
                        <div className="bg-card-bg border border-color rounded-xl overflow-hidden hover:border-[#8B0000]/40 transition-all">
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              <p className="text-white text-[9px] font-bold truncate">{s.name}</p>
                              <div className="flex items-center gap-0.5"><Star size={8} className="fill-[#FFD700] text-[#FFD700]" /><span className="text-[8px] text-white/80">{s.rating}</span></div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Contact card */}
            <div className="space-y-4">
              <div className="lg:sticky lg:top-20 space-y-4">
                <div className="bg-card-bg border border-[#8B0000]/30 rounded-2xl p-5 shadow-xl shadow-black/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${escort.available ? 'bg-[#28a745] animate-pulse' : 'bg-gray-500'}`} />
                    <span className={`text-xs font-bold ${escort.available ? 'text-[#28a745]' : 'text-text-muted'}`}>{escort.available ? 'Available Now' : 'Currently Busy'}</span>
                  </div>

                  <div className="mb-4 pb-4 border-b border-color">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Starting Rate</p>
                    <p className="text-2xl font-black text-[#FFD700]">KES {(escort.pricing?.incall || escort.pricing?.hourly || 0).toLocaleString()}<span className="text-sm font-normal text-text-muted">/hr</span></p>
                    <p className="text-[10px] text-text-muted mt-1">Contact her directly to arrange</p>
                  </div>

                  <div className="space-y-2.5">
                      {/* WhatsApp — visible to everyone */}
                      <a
                        href={waLink(escort.phone, escort.name, escort.pricing?.incall || escort.pricing?.hourly)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black rounded-xl transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp {escort.name.split(' ')[0]}
                      </a>

                      {/* Telegram — visible to everyone */}
                      <a
                        href={tgLink(escort.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-[#229ED9] hover:bg-[#1a8fc2] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.820 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        Telegram
                      </a>

                      {/* Members-only actions */}
                      {isOwnProfile ? (
                        <Link href="/my-profile" className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 flex items-center justify-center gap-2 text-sm hover:shadow-[#8B0000]/50 active:scale-[0.98]">
                          Edit My Profile
                        </Link>
                      ) : isLoggedIn ? (
                        <>
                          <button
                            onClick={() => setBookingOpen(true)}
                            className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 flex items-center justify-center gap-2 text-sm hover:shadow-[#8B0000]/50 active:scale-[0.98]"
                          >
                            <Calendar size={14} /> Book {escort.name.split(' ')[0]} Now
                          </button>

                          <Link href="/messages" className="w-full py-2.5 bg-card-bg border border-color text-text-light font-semibold rounded-xl transition-all hover:border-[#FFD700]/50 flex items-center justify-center gap-2 text-sm">
                            <MessageCircle size={14} /> Send Platform Message
                          </Link>

                          <button
                            onClick={() => toggleFollow(escort.id)}
                            className={`w-full py-2.5 border rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${following ? 'bg-[#8B0000]/10 border-[#8B0000]/40 text-[#8B0000]' : 'bg-dark-bg border-color text-text-muted hover:border-text-muted'}`}
                          >
                            {following ? <><UserCheck size={13} /> Following</> : <><Users size={13} /> Follow {escort.name.split(' ')[0]}</>}
                          </button>

                          <button onClick={() => setLiked(v => !v)} className={`w-full py-2.5 border rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${liked ? 'bg-[#E91E63]/10 border-[#E91E63]/40 text-[#E91E63]' : 'bg-dark-bg border-color text-text-muted hover:border-text-muted'}`}>
                            <Heart size={13} className={liked ? 'fill-[#E91E63]' : ''} /> {liked ? 'Saved' : 'Save to Favorites'}
                          </button>
                        </>
                      ) : (
                        <div className="pt-1 border-t border-color space-y-2">
                          <Link
                            href={`/login?redirect=/profile/${escort.id}`}
                            className="w-full py-3.5 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-black rounded-xl transition-all shadow-lg shadow-[#8B0000]/30 flex items-center justify-center gap-2 text-sm hover:shadow-[#8B0000]/50 active:scale-[0.98]"
                          >
                            <MessageCircle size={14} /> Message {escort.name.split(' ')[0]}
                          </Link>
                          <Link href={`/login?redirect=/profile/${escort.id}`} className="w-full py-2 bg-card-bg border border-color text-text-muted text-xs font-semibold rounded-xl flex items-center justify-center transition-all hover:border-text-muted">
                            Sign in to book or save
                          </Link>
                        </div>
                      )}
                    </div>
                </div>

                {/* Safety notice */}
                <div className="bg-dark-bg border border-color rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2"><Shield size={13} className="text-[#28a745]" /><span className="text-xs font-bold text-text-light">Safety Tips</span></div>
                  <ul className="space-y-1.5">
                    {['Always verify identity before meeting', 'Never send money in advance', 'Meet in public places first', 'Trust your instincts — safety first'].map(tip => (
                      <li key={tip} className="flex items-start gap-1.5 text-[10px] text-text-muted">
                        <Check size={9} className="text-[#28a745] mt-0.5 flex-shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats mini */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    [followerCount(escort.id).toLocaleString(), 'Followers'],
                    [escort.rating + '★', 'Rating'],
                    [escort.reviews, 'Reviews'],
                    [escort.available ? 'Now' : 'Later', 'Availability'],
                  ].map(([v, l]) => (
                    <div key={l as string} className="bg-card-bg border border-color rounded-xl p-3 text-center">
                      <p className="font-black text-text-light text-sm">{v}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-8" />
        </>}
      </div>

      {escort && (
        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          escort={{
            id: escort.id,
            name: escort.name,
            avatar: escort.image,
            tier: escort.tier,
            city: escort.city,
            pricing: { hourly: escort.pricing?.incall || escort.pricing?.hourly || 0, overnight: escort.pricing?.incallOvernight || escort.pricing?.overnight || 0 },
          }}
        />
      )}
    </div>
  )
}
