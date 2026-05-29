import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Star, CheckCircle2, MapPin, ThumbsUp, Filter, Search, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useSEO } from '@/lib/useSEO'

interface Review {
  id: number; client: string; escort: string; escortId: string
  rating: number; text: string; date: string; city: string
  likes: number; verified: boolean
  escortAvatar?: string | null
}

function mapApiReview(r: any): Review {
  return {
    id:           r.id,
    client:       r.client_name ?? r.username ?? 'Anonymous',
    escort:       r.escort_name ?? r.name ?? '—',
    escortId:     String(r.escort_id ?? r.escortId ?? ''),
    rating:       Number(r.rating) || 5,
    text:         r.text ?? r.comment ?? '',
    date:         r.created_at ? new Date(r.created_at).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : '—',
    city:         r.city ?? 'Nairobi',
    likes:        Number(r.likes) || 0,
    verified:     true,
    escortAvatar: r.escort_image ?? r.avatar ?? null,
  }
}

const CITIES = ['All','Nairobi','Mombasa','Kisumu','Nakuru']

export default function ReviewsPage() {
  useSEO({
    title: 'Escort Reviews Kenya — Real Client Feedback',
    description: 'Read verified client reviews for escorts in Kenya. Honest ratings and feedback for companions in Nairobi, Mombasa and more.',
    keywords: 'escort reviews Kenya, companion ratings Nairobi, client reviews escorts',
    canonicalPath: '/reviews',
  })
  const [reviews, setReviews]   = useState<Review[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [city, setCity]         = useState('All')
  const [sort, setSort]         = useState<'recent'|'top'>('recent')
  const [likes, setLikes]       = useState<Record<number,boolean>>({})

  useEffect(() => {
    setLoading(true)
    api.reviews.list()
      .then((rows: any[]) => {
        setReviews(rows.map(mapApiReview))
      })
      .catch(() => {
        setReviews([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = reviews
    .filter(r =>
      (city === 'All' || r.city === city) &&
      (!search || r.escort.toLowerCase().includes(search.toLowerCase()) || r.client.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => sort === 'top' ? b.likes - a.likes : b.id - a.id)

  const toggleLike = (id: number) => setLikes(p => ({...p, [id]: !p[id]}))
  const avgRating  = reviews.length ? (reviews.reduce((s,r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar/>
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header/>

        <div className="w-full relative py-8 px-5 sm:px-12 border-b border-color text-center" style={{background:'linear-gradient(135deg,#FFD70015,#8B000015)'}}>
          <h1 className="text-3xl font-black text-text-light mb-2">Client Reviews</h1>
          <p className="text-sm text-text-muted mb-5">Genuine verified reviews from real clients. No fake reviews — ever.</p>
          {!loading && reviews.length > 0 && (
            <div className="flex items-center justify-center gap-6">
              {[
                [avgRating + '★', 'Average Rating', '#FFD700'],
                [reviews.length.toLocaleString() + '+', 'Verified Reviews', '#28a745'],
              ].map(([v,l,c]) => (
                <div key={l as string} className="text-center">
                  <p className="text-xl font-black" style={{color: c as string}}>{v}</p>
                  <p className="text-[10px] text-text-muted">{l}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-color flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by escort or client name…" className="w-full pl-9 pr-3 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#FFD700] transition-all"/>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={13} className="text-text-muted flex-shrink-0"/>
            {CITIES.map(c => (
              <button key={c} onClick={() => setCity(c)} className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${city===c ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{c}</button>
            ))}
            <div className="w-px h-5 bg-color"/>
            <button onClick={() => setSort('recent')} className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${sort==='recent' ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted'}`}>Recent</button>
            <button onClick={() => setSort('top')}    className={`px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${sort==='top'    ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted'}`}>Top Rated</button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-[#8B0000]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="text-5xl">⭐</div>
              <div>
                <p className="font-bold text-text-light text-base">
                  {reviews.length === 0 ? 'No reviews yet' : 'No reviews match your search'}
                </p>
                <p className="text-sm text-text-muted mt-1">
                  {reviews.length === 0
                    ? 'Be the first to leave a review after booking an escort.'
                    : 'Try clearing your filters or searching for something else.'}
                </p>
              </div>
              {reviews.length === 0 && (
                <a href="/" className="px-6 py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all inline-block">
                  Browse Escorts →
                </a>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-text-muted mb-4">{filtered.length} review{filtered.length !== 1 ? 's' : ''}</p>
              <div className="space-y-4">
                {filtered.map(r => (
                  <div key={r.id} className="bg-card-bg border border-color rounded-2xl p-5 hover:border-[#FFD700]/30 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-color bg-dark-bg">
                        {r.escortAvatar
                          ? <img src={r.escortAvatar} alt={r.escort} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center text-text-muted text-lg font-bold">{r.escort.charAt(0)}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-sm font-bold text-text-light">{r.client} reviewed <span className="text-[#FFD700]">{r.escort}</span></p>
                          {r.verified && <CheckCircle2 size={12} className="text-[#28a745]" fill="#28a745"/>}
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= r.rating ? 'fill-[#FFD700] text-[#FFD700]' : 'text-text-muted'}/>)}</div>
                          <span className="flex items-center gap-1 text-[10px] text-text-muted"><MapPin size={9}/>{r.city}</span>
                          <span className="text-[10px] text-text-muted">{r.date}</span>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">{r.text}</p>
                        <button onClick={() => toggleLike(r.id)} className={`mt-3 flex items-center gap-1.5 text-[11px] transition-all ${likes[r.id] ? 'text-[#8B0000]' : 'text-text-muted hover:text-text-light'}`}>
                          <ThumbsUp size={12} className={likes[r.id] ? 'fill-[#8B0000]' : ''}/> {r.likes + (likes[r.id] ? 1 : 0)} helpful
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
