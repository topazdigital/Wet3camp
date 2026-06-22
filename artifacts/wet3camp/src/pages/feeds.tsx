import React, { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Heart, MessageCircle, Share2, Eye, Bookmark, TrendingUp, Crown, Flame, CheckCircle2 } from 'lucide-react'
import { Link } from 'wouter'
import { useFollow } from '@/lib/follow-context'
import { useAuth } from '@/lib/auth-context'
import { useAllEscorts } from '@/hooks/useEscorts'
import { useSEO } from '@/lib/useSEO'
import { getSlug } from '@/data/escorts'

const TIER_COLOR: Record<string, string> = { elite:'#8B0000', vip:'#FF4500', premium:'#B8860B', standard:'#3a6da8' }

// Deterministic fake engagement numbers (stable per escort id)
function fakeNum(id: string | number, offset = 0, max = 500) {
  const n = typeof id === 'string' ? parseInt(id, 10) || 1 : id
  return Math.floor(((n * 137 + offset * 31) % max) + 10)
}

function FollowBtn({ escortId, escortUserId, small = false }: { escortId: string; escortUserId?: string; small?: boolean }) {
  const { isFollowing, toggleFollow } = useFollow()
  const { isLoggedIn, user } = useAuth()
  const following = isFollowing(escortId)
  const isOwn = !!(user?.id && escortUserId && user.id === String(escortUserId))
  if (isOwn) return null
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); if (isLoggedIn) toggleFollow(escortId) }}
      className={`font-bold transition-all rounded-full border whitespace-nowrap ${
        small ? 'px-3 py-1 text-[10px]' : 'px-4 py-1.5 text-xs'
      } ${
        following
          ? 'bg-transparent border-color text-text-muted hover:border-[#EF4444] hover:text-[#EF4444]'
          : 'bg-[#8B0000] border-[#8B0000] text-white hover:bg-[#a00000]'
      }`}
    >
      {following ? 'Following' : '+ Follow'}
    </button>
  )
}

export default function FeedsPage() {
  useSEO({
    title: 'Escort Feeds — Latest Updates',
    description: 'Follow your favourite escorts and see their latest updates and photos. Real-time social feed from verified escorts in Kenya.',
    keywords: 'escort feeds Kenya, escort social media, escort updates Nairobi',
    canonicalPath: '/feeds',
  })
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { followerCount } = useFollow()
  const { escorts: apiEscorts } = useAllEscorts()

  useEffect(() => {
    fetch('/api/feeds')
      .then(r => r.json())
      .then(d => { setPosts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const recommended = (apiEscorts as any[]).filter(e => ['elite', 'vip'].includes((e.tier ?? '').toLowerCase())).slice(0, 7)

  const toggleLike = (id: string) => setLiked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSave = (id: string) => setSaved(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <main className="min-h-screen bg-dark-bg flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 py-5">
          <div className="flex gap-5 items-start">

            {/* CENTER: Feed */}
            <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-[#8B0000]" />
                  <h1 className="text-base font-black text-text-light">Escort Feeds</h1>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-pulse" />
                    <span className="text-[9px] text-[#EF4444] font-bold">LIVE</span>
                  </div>
                </div>
              </div>

              {loading && (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-card-bg border border-color rounded-2xl overflow-hidden animate-pulse">
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        <div className="w-10 h-10 rounded-full bg-dark-bg" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-dark-bg rounded w-32" />
                          <div className="h-2 bg-dark-bg rounded w-20" />
                        </div>
                      </div>
                      <div className="px-4 pb-3 space-y-1.5">
                        <div className="h-3 bg-dark-bg rounded" />
                        <div className="h-3 bg-dark-bg rounded w-4/5" />
                      </div>
                      <div className="aspect-video bg-dark-bg" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && posts.length === 0 && (
                <div className="text-center py-16">
                  <Flame size={40} className="text-[#8B0000]/30 mx-auto mb-3" />
                  <p className="text-sm text-text-muted mb-4">No posts yet. Escorts will appear here as they join the platform.</p>
                  <Link href="/register?role=escort" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B0000] text-white text-sm font-bold rounded-xl hover:bg-[#a00000] transition-colors">
                    <Crown size={14} /> Join as Escort
                  </Link>
                </div>
              )}

              <div className="space-y-4">
                {posts.map(escort => {
                  const pid = String(escort.id)
                  const isLiked = liked.has(pid)
                  const isSaved = saved.has(pid)
                  const tier = (escort.tier ?? 'standard').charAt(0).toUpperCase() + (escort.tier ?? 'standard').slice(1)
                  const likes = fakeNum(escort.id, 1, 400)
                  const comments = fakeNum(escort.id, 2, 50)
                  const views = fakeNum(escort.id, 3, 2000)
                  const handle = `@${(escort.name || 'escort').replace(/[\s.]/g, '').toLowerCase()}`

                  return (
                    <div key={pid} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#8B0000]/30 transition-all">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        <Link href={`/@${getSlug(escort.name)}`}>
                          {escort.image
                            ? <img src={escort.image} alt={escort.name} className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0 cursor-pointer" style={{ borderColor: TIER_COLOR[escort.tier] ?? '#555' }} />
                            : <div className="w-10 h-10 rounded-full border-2 bg-gradient-to-br from-[#1a0000] to-[#2a1a1a] flex items-center justify-center text-[#8B0000]/60 text-sm font-black flex-shrink-0 cursor-pointer" style={{ borderColor: TIER_COLOR[escort.tier] ?? '#555' }}>{(escort.name || '?')[0]}</div>
                          }
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/@${getSlug(escort.name)}`} className="font-bold text-text-light text-sm hover:underline">{escort.name}</Link>
                            {escort.verified && (
                              <span className="w-3.5 h-3.5 bg-[#28a745] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[7px] font-black">✓</span>
                              </span>
                            )}
                            {escort.tier && escort.tier !== 'standard' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: (TIER_COLOR[escort.tier] ?? '#555') + '25', color: TIER_COLOR[escort.tier] ?? '#555' }}>{tier}</span>
                            )}
                            {escort.online && (
                              <span className="flex items-center gap-0.5 px-2 py-0.5 bg-[#28a745]/10 border border-[#28a745]/20 rounded-full text-[9px] font-black text-[#28a745]">
                                🟢 Online
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-text-muted">{handle}</span>
                            <span className="text-[10px] text-text-muted">·</span>
                            <span className="text-[10px] text-text-muted">{escort.area ?? escort.city}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <FollowBtn escortId={pid} escortUserId={escort.user_id} />
                        </div>
                      </div>

                      {/* Bio as post text */}
                      <div className="px-4 pb-3">
                        <p className="text-sm text-text-light leading-relaxed whitespace-pre-line line-clamp-4">{escort.bio}</p>
                        <Link href={`/@${getSlug(escort.name)}`} className="text-[11px] text-[#8B0000] hover:underline mt-1 block">View full profile →</Link>
                      </div>

                      {/* Photo */}
                      {escort.image && (
                        <Link href={`/@${getSlug(escort.name)}`} className="block w-full aspect-video overflow-hidden">
                          <img src={escort.image} alt={escort.name} className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500 cursor-pointer" />
                        </Link>
                      )}

                      {/* Engagement */}
                      <div className="px-4 py-3 border-t border-color/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button onClick={() => toggleLike(pid)} className={`flex items-center gap-1.5 text-xs transition-all ${isLiked ? 'text-[#E91E63]' : 'text-text-muted hover:text-text-light'}`}>
                              <Heart size={15} className={isLiked ? 'fill-[#E91E63]' : ''} />
                              <span className="font-semibold">{likes + (isLiked ? 1 : 0)}</span>
                            </button>
                            <Link href={`/@${getSlug(escort.name)}`} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-light transition-colors">
                              <MessageCircle size={15} />
                              <span className="font-semibold">{comments}</span>
                            </Link>
                            <div className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Eye size={14} />
                              <span>{views.toLocaleString()}</span>
                            </div>
                          </div>
                          <button onClick={() => toggleSave(pid)} className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'text-[#FFD700]' : 'text-text-muted hover:text-text-light'}`}>
                            <Bookmark size={14} className={isSaved ? 'fill-[#FFD700]' : ''} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {!loading && posts.length > 0 && (
                  <div className="text-center py-6">
                    <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B0000] text-white font-bold text-sm rounded-xl hover:bg-[#a00000] transition-all">
                      <Crown size={14} /> Join to see more
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="hidden lg:flex flex-col w-72 flex-shrink-0 gap-4">
              <div className="bg-card-bg border border-[#FFD700]/20 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-2 h-2 bg-[#28a745] rounded-full" />
                  <span className="text-[9px] text-[#28a745] font-bold uppercase tracking-widest">AD SLOT OPEN</span>
                </div>
                <div className="aspect-video bg-gradient-to-br from-[#8B0000]/30 to-[#FFD700]/10 rounded-xl flex flex-col items-center justify-center mb-3 border border-[#FFD700]/10">
                  <span className="text-3xl mb-1">📢</span>
                  <p className="text-xs font-bold text-text-light">Your Business Ad</p>
                  <p className="text-[10px] text-text-muted">Could Be Here</p>
                </div>
                <Link href="/adverts" className="w-full flex items-center justify-center gap-1 py-2 bg-[#FFD700] text-black text-xs font-black rounded-xl hover:bg-[#e6c000] transition-all">
                  Advertise Here →
                </Link>
              </div>

              {recommended.length > 0 && (
                <div className="bg-card-bg border border-color rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-text-light mb-4">Recommended</h3>
                  <div className="space-y-3">
                    {recommended.map((e: any) => (
                      <div key={e.id} className="flex items-center gap-2.5">
                        <Link href={`/@${getSlug(e.name)}`} className="flex-shrink-0">
                          {e.image
                            ? <img src={e.image} alt={e.name} className="w-9 h-9 rounded-full object-cover border border-color" />
                            : <div className="w-9 h-9 rounded-full border border-color bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a] flex items-center justify-center text-[#8B0000]/60 text-sm font-black">{(e.name || '?')[0]}</div>
                          }
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/@${getSlug(e.name)}`} className="font-bold text-text-light text-xs hover:underline block truncate">{e.name}</Link>
                          <p className="text-[10px] text-text-muted truncate">{e.city} · {followerCount(e.id).toLocaleString()} followers</p>
                        </div>
                        <FollowBtn escortId={String(e.id)} small />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-card-bg border border-color rounded-2xl p-4">
                <h3 className="text-sm font-bold text-text-light mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#FF4500]" /> Trending
                </h3>
                <div className="space-y-2.5">
                  {['#NairobiBabes', '#MombasaEscorts', '#EliteCompanion', '#KisumuLadies', '#Wet3Camp'].map((tag, i) => (
                    <div key={tag} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-text-light">{tag}</p>
                        <p className="text-[9px] text-text-muted">{[892, 674, 523, 341, 289][i]} profiles</p>
                      </div>
                      <span className="text-[9px] text-[#FF4500] font-bold">#{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[9px] text-text-muted text-center leading-relaxed">
                © 2026 Wet3 Camp · Adults 18+ only · All profiles manually verified
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
