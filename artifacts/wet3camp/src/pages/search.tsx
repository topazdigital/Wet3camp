import React, { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { useSEO } from '@/lib/useSEO'
import { Search, SlidersHorizontal, MapPin, Star, Check, X, Heart, MessageCircle, Crown, ChevronDown } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { api } from '@/lib/api'
import type { ApiEscort } from '@/lib/api'
import { useFavorites } from '@/lib/favorites-context'
import { getSlug } from '@/data/escorts'

// ─── Constants ─────────────────────────────────────────────────────────────────

const KENYA_CITIES = ['All Cities', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Nyeri', 'Machakos', 'Kitale']
const GENDERS = ['All', 'Female', 'Male', 'Transgender']
const SERVICES_LIST = ['GFE', 'BDSM', 'Massage', 'Outcall', 'Incall', 'Overnight', 'Video Call', 'Tour Guide', 'Roleplay', 'Duo']

const TIER_META: Record<string, { label: string; color: string; bg: string; order: number; badge?: string }> = {
  elite:    { label: 'Elite',    color: '#FFD700', bg: '#FFD700',   order: 0, badge: '👑 Elite'   },
  vip:      { label: 'VIP',      color: '#FF4500', bg: '#FF4500',   order: 1, badge: '⭐ VIP'     },
  premium:  { label: 'Premium',  color: '#B8860B', bg: '#B8860B',   order: 2, badge: '💎 Premium' },
  standard: { label: 'Standard', color: '#888',    bg: '#888',      order: 3 },
  free:     { label: 'Free',     color: '#555',    bg: '#555',      order: 4 },
}

// ─── Card components ────────────────────────────────────────────────────────────

function EscortPlaceholder({ name, size = 'lg' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const letter = (name || '?').charAt(0).toUpperCase()
  const sizeClass = size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-3xl' : 'text-5xl'
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a]">
      <span className={`${sizeClass} font-black text-[#8B0000]/60 select-none`}>{letter}</span>
    </div>
  )
}

function EliteCard({ escort, isFav, onFav }: { escort: ApiEscort; isFav: boolean; onFav: () => void }) {
  return (
    <div className="relative col-span-2 md:col-span-1 rounded-2xl overflow-hidden border-2 border-[#FFD700]/40 shadow-xl shadow-[#FFD700]/10 group hover:border-[#FFD700]/70 transition-all">
      <div className="aspect-[4/5] relative">
        {escort.image ? (
          <>
            <img
              src={escort.image}
              alt={escort.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(ev) => { ev.currentTarget.style.display='none'; const fb=ev.currentTarget.parentElement?.querySelector<HTMLElement>('.img-fallback'); if(fb) fb.style.display='flex' }}
            />
            <div className="img-fallback w-full h-full absolute inset-0 items-center justify-center" style={{ display:'none' }}><EscortPlaceholder name={escort.name} size="lg" /></div>
          </>
        ) : (
          <EscortPlaceholder name={escort.name} size="lg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black text-black" style={{ background: '#FFD700' }}>
            👑 ELITE
          </span>
          {escort.online && (
            <span className="w-2.5 h-2.5 rounded-full bg-[#28a745] ring-2 ring-black/40" />
          )}
        </div>

        <button onClick={onFav} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors">
          <Heart size={15} className={isFav ? 'fill-[#E91E63] text-[#E91E63]' : 'text-white'} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{escort.name}</h3>
                {escort.verified && <span className="w-5 h-5 rounded-full bg-[#2196F3] flex items-center justify-center"><Check size={10} className="text-white" /></span>}
              </div>
              <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5"><MapPin size={10} />{escort.area ? `${escort.area}, ` : ''}{escort.city}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} size={11} className={i <= Math.round(escort.rating || 0) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-white/30'} />)}
                </div>
                <span className="text-[10px] text-white/60">({escort.reviews_count || 0})</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#FFD700]/70">From</p>
              <p className="text-lg font-black text-[#FFD700]">KES {(escort.price_incall || escort.price_hourly || 0).toLocaleString()}</p>
              <p className="text-[9px] text-white/50">/ hr</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Link href={`/@${getSlug(escort.name)}`} className="flex-1 py-2 bg-[#FFD700] text-black text-xs font-black rounded-xl text-center hover:bg-[#FFC200] transition-colors">
              View Profile
            </Link>
            <Link href="/messages" className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
              <MessageCircle size={15} className="text-white" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function VIPCard({ escort, isFav, onFav }: { escort: ApiEscort; isFav: boolean; onFav: () => void }) {
  const tier = TIER_META[escort.tier] ?? TIER_META.standard
  return (
    <div className="relative rounded-xl overflow-hidden border border-[#FF4500]/30 shadow-lg group hover:border-[#FF4500]/60 transition-all">
      <div className="aspect-[3/4] relative">
        {escort.image ? (
          <>
            <img
              src={escort.image}
              alt={escort.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(ev) => { ev.currentTarget.style.display='none'; const fb=ev.currentTarget.parentElement?.querySelector<HTMLElement>('.img-fallback'); if(fb) fb.style.display='flex' }}
            />
            <div className="img-fallback w-full h-full absolute inset-0 items-center justify-center" style={{ display:'none' }}><EscortPlaceholder name={escort.name} size="md" /></div>
          </>
        ) : (
          <EscortPlaceholder name={escort.name} size="md" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: tier.color + '30', color: tier.color, border: `1px solid ${tier.color}50` }}>
            {tier.badge ?? tier.label}
          </span>
        </div>

        {escort.online && (
          <div className="absolute top-2 right-8 w-2 h-2 rounded-full bg-[#28a745] ring-2 ring-black/40" />
        )}
        <button onClick={onFav} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
          <Heart size={13} className={isFav ? 'fill-[#E91E63] text-[#E91E63]' : 'text-white'} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-sm font-black text-white">{escort.name}</h3>
            {escort.verified && <Check size={9} className="text-[#2196F3]" />}
          </div>
          <p className="text-[10px] text-white/60 flex items-center gap-1"><MapPin size={9} />{escort.city}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-black" style={{ color: tier.color }}>KES {(escort.price_incall || escort.price_hourly || 0).toLocaleString()}<span className="text-[9px] text-white/40">/hr</span></p>
            <Link href={`/@${getSlug(escort.name)}`} className="px-2.5 py-1 text-[10px] font-bold rounded-lg text-black" style={{ background: tier.color }}>
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StandardCard({ escort, isFav, onFav }: { escort: ApiEscort; isFav: boolean; onFav: () => void }) {
  return (
    <div className="flex gap-3 p-3 bg-card-bg border border-color rounded-xl hover:border-[#8B0000]/40 transition-all group">
      <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
        {escort.image ? (
          <>
            <img
              src={escort.image}
              alt={escort.name}
              className="w-full h-full object-cover"
              onError={(ev) => { ev.currentTarget.style.display='none'; const fb=ev.currentTarget.parentElement?.querySelector<HTMLElement>('.img-fallback'); if(fb) fb.style.display='flex' }}
            />
            <div className="img-fallback w-full h-full absolute inset-0 items-center justify-center" style={{ display:'none' }}><EscortPlaceholder name={escort.name} size="sm" /></div>
          </>
        ) : (
          <EscortPlaceholder name={escort.name} size="sm" />
        )}
        {escort.online && <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#28a745] ring-2 ring-card-bg" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-text-light truncate">{escort.name}</h3>
          {escort.verified && <Check size={10} className="text-[#2196F3] flex-shrink-0" />}
        </div>
        <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5"><MapPin size={9} />{escort.city}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex">
            {[1,2,3,4,5].map(i => <Star key={i} size={9} className={i <= Math.round(escort.rating || 0) ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'} />)}
          </div>
          <span className="text-[9px] text-text-muted">({escort.reviews_count || 0})</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button onClick={onFav}>
          <Heart size={14} className={isFav ? 'fill-[#E91E63] text-[#E91E63]' : 'text-text-muted hover:text-[#E91E63] transition-colors'} />
        </button>
        <p className="text-xs font-bold text-[#8B0000]">KES {(escort.price_incall || escort.price_hourly || 0).toLocaleString()}</p>
        <Link href={`/@${getSlug(escort.name)}`} className="text-[10px] px-2 py-1 bg-[#8B0000]/15 text-[#8B0000] rounded-lg font-semibold hover:bg-[#8B0000]/25 transition-colors">
          View
        </Link>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [location] = useLocation()

  // Parse URL params on every navigation so header search stays in sync
  const urlParams = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '')

  const [query, setQuery] = useState(urlParams.get('q') ?? '')
  const [city, setCity] = useState(urlParams.get('city') ?? 'All Cities')
  const [tier, setTier] = useState(urlParams.get('tier') ?? 'all')
  const [service, setService] = useState(urlParams.get('service') ?? '')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'newest'>('featured')
  const [showFilters, setShowFilters] = useState(false)
  const [escorts, setEscorts] = useState<ApiEscort[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Sync from URL when navigating from header search
  useEffect(() => {
    const p = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '')
    setQuery(p.get('q') ?? '')
    if (p.get('city')) setCity(p.get('city') ?? 'All Cities')
    if (p.get('service')) setService(p.get('service') ?? '')
  }, [location])

  useSEO({
    title: service ? `${service.replace(/-/g,' ')} Escorts Kenya` : query ? `Search: ${query} — Kenya Escorts` : 'Search Escorts — Kenya',
    description: `Browse verified escorts in Nairobi, Mombasa and across Kenya. Filter by city, service, tier, and availability.`,
    keywords: service ? `${service} escort Kenya, ${service} escort Nairobi, ${service} escort Mombasa, ${service} services Kenya` : undefined,
    city: city !== 'All Cities' ? city : undefined,
  })

  const { isFavorite, toggleFavorite } = useFavorites()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const PER_PAGE = 24

  const fetchEscorts = useCallback(async (pg = 0, replace = true) => {
    setLoading(true)
    try {
      const params: any = { limit: PER_PAGE, offset: pg * PER_PAGE, sort: sortBy }
      if (city !== 'All Cities') params.city = city
      if (tier !== 'all') params.tier = tier
      if (availableOnly) params.available = '1'
      if (service) params.service = service
      if (query.trim().length >= 2) params.q = query.trim()
      const res = await api.escorts.list(params)
      const data = res.data ?? []

      setEscorts(prev => replace ? data : [...prev, ...data])
      setTotal(res.total ?? data.length)
      setHasMore((pg + 1) * PER_PAGE < (res.total ?? 0))
      setPage(pg)
    } catch {
      if (replace) setEscorts([])
    } finally {
      setLoading(false)
    }
  }, [city, tier, availableOnly, sortBy, query, service])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchEscorts(0, true), query ? 400 : 0)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [fetchEscorts])

  const elites   = escorts.filter(e => e.tier === 'elite')
  const vips     = escorts.filter(e => e.tier === 'vip')
  const premiums = escorts.filter(e => e.tier === 'premium')
  const others   = escorts.filter(e => !['elite', 'vip', 'premium'].includes(e.tier))

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full min-w-0 pb-16 lg:pb-0">
        <Header />

        {/* Hero Search Bar */}
        <div className="bg-card-bg border-b border-color px-4 py-4 sticky top-14 z-30">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, area or service…"
                className="w-full pl-9 pr-4 py-2.5 bg-dark-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000]/60 transition-all"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-light">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters ? 'bg-[#8B0000] border-[#8B0000] text-white' : 'bg-dark-bg border-color text-text-muted hover:border-[#8B0000]/50'}`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="max-w-3xl mx-auto mt-3 p-4 bg-dark-bg border border-color rounded-xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* City */}
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">City</label>
                  <div className="relative">
                    <select
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2 bg-card-bg border border-color rounded-lg text-xs text-text-light focus:outline-none focus:border-[#8B0000]/60"
                    >
                      {KENYA_CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Tier */}
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Tier</label>
                  <div className="relative">
                    <select
                      value={tier}
                      onChange={e => setTier(e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2 bg-card-bg border border-color rounded-lg text-xs text-text-light focus:outline-none focus:border-[#8B0000]/60"
                    >
                      <option value="all">All Tiers</option>
                      <option value="elite">👑 Elite</option>
                      <option value="vip">⭐ VIP</option>
                      <option value="premium">💎 Premium</option>
                      <option value="standard">Standard</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Sort By</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="w-full appearance-none pl-3 pr-8 py-2 bg-card-bg border border-color rounded-lg text-xs text-text-light focus:outline-none focus:border-[#8B0000]/60"
                    >
                      <option value="featured">🔥 Featured</option>
                      <option value="rating">⭐ Top Rated</option>
                      <option value="newest">🆕 Newest</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Available */}
                <div className="flex flex-col justify-end">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5 block">Available</label>
                  <button
                    onClick={() => setAvailableOnly(v => !v)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${availableOnly ? 'bg-[#28a745]/20 border-[#28a745]/50 text-[#28a745]' : 'bg-card-bg border-color text-text-muted'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${availableOnly ? 'border-[#28a745] bg-[#28a745]' : 'border-text-muted'}`}>
                      {availableOnly && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    Available Now
                  </button>
                </div>
              </div>

              {/* Service filter pills */}
              <div className="mt-4 pt-3 border-t border-color">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Filter by Service</label>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICES_LIST.map(svc => (
                    <button
                      key={svc}
                      onClick={() => setService(service === svc ? '' : svc)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${service === svc ? 'bg-[#8B0000] border-[#8B0000] text-white' : 'bg-card-bg border-color text-text-muted hover:border-[#8B0000]/50 hover:text-text-light'}`}
                    >
                      {svc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-color">
                <p className="text-xs text-text-muted">
                  {loading ? 'Searching…' : `${total.toLocaleString()} escorts found`}
                  {service && <span className="ml-2 px-2 py-0.5 bg-[#8B0000]/20 text-[#8B0000] rounded-full text-[10px] font-bold">{service}</span>}
                </p>
                <button
                  onClick={() => { setCity('All Cities'); setTier('all'); setAvailableOnly(false); setSortBy('featured'); setQuery(''); setService('') }}
                  className="text-xs text-[#EF4444] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Stats bar */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">
              {loading ? <span className="animate-pulse">Searching…</span> : (
                <><span className="text-text-light font-bold">{escorts.length}</span>{total > escorts.length ? ` of ${total.toLocaleString()}` : ''} escorts {query ? `matching "${query}"` : city !== 'All Cities' ? `in ${city}` : 'available'}</>
              )}
            </p>
            <div className="flex items-center gap-2">
              {tier === 'all' && <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                <span className="w-2 h-2 rounded-full bg-[#FFD700]" />👑 Elite first
              </div>}
            </div>
          </div>

          {loading && escorts.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-card-bg rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Active service banner */}
          {service && !loading && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#8B0000]/10 border border-[#8B0000]/30 rounded-xl">
              <Check size={14} className="text-[#8B0000]" />
              <span className="text-xs text-text-light font-semibold flex-1">
                Showing escorts offering <span className="text-[#8B0000] font-black">{service}</span>
                {city !== 'All Cities' && <> in <span className="text-[#8B0000] font-black">{city}</span></>}
              </span>
              <button onClick={() => setService('')} className="text-text-muted hover:text-[#EF4444]"><X size={12} /></button>
            </div>
          )}

          {!loading && escorts.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-text-light mb-2">No escorts found</h3>
              <p className="text-text-muted text-sm mb-6">Try adjusting your filters or search in a different city.</p>
              <button onClick={() => { setCity('All Cities'); setTier('all'); setAvailableOnly(false); setQuery(''); setService('') }} className="px-6 py-2.5 bg-[#8B0000] text-white font-bold rounded-xl hover:bg-[#a00000] transition-colors">
                Clear Filters
              </button>
            </div>
          )}

          {/* Elite Section */}
          {elites.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Crown size={16} className="text-[#FFD700]" />
                <h2 className="text-sm font-black text-[#FFD700] uppercase tracking-widest">Elite Escorts</h2>
                <div className="flex-1 h-px bg-[#FFD700]/20" />
                <span className="text-[10px] text-[#FFD700]/60">{elites.length} elite escorts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {elites.map(e => (
                  <EliteCard key={e.id} escort={e} isFav={isFavorite(e.id)} onFav={() => toggleFavorite(e.id)} />
                ))}
              </div>
            </div>
          )}

          {/* VIP Section */}
          {vips.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star size={15} className="text-[#FF4500] fill-[#FF4500]" />
                <h2 className="text-sm font-black text-[#FF4500] uppercase tracking-widest">VIP Escorts</h2>
                <div className="flex-1 h-px bg-[#FF4500]/20" />
                <span className="text-[10px] text-[#FF4500]/60">{vips.length} VIP escorts</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {vips.map(e => (
                  <VIPCard key={e.id} escort={e} isFav={isFavorite(e.id)} onFav={() => toggleFavorite(e.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Premium Section */}
          {premiums.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">💎</span>
                <h2 className="text-sm font-black text-[#B8860B] uppercase tracking-widest">Premium Escorts</h2>
                <div className="flex-1 h-px bg-[#B8860B]/20" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {premiums.map(e => (
                  <VIPCard key={e.id} escort={e} isFav={isFavorite(e.id)} onFav={() => toggleFavorite(e.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Standard / Others */}
          {others.length > 0 && (
            <div className="mb-8">
              {(elites.length + vips.length + premiums.length) > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-black text-text-muted uppercase tracking-widest">More Escorts</h2>
                  <div className="flex-1 h-px bg-color" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {others.map(e => (
                  <StandardCard key={e.id} escort={e} isFav={isFavorite(e.id)} onFav={() => toggleFavorite(e.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchEscorts(page + 1, false)}
                className="px-8 py-3 bg-card-bg border border-color text-text-light font-semibold rounded-xl hover:border-[#8B0000]/50 transition-all text-sm"
              >
                Load more escorts ({total - escorts.length} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
