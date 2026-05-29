import React, { useState, useRef } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Heart, MessageCircle, Share2, Eye, Bookmark, MoreHorizontal, TrendingUp, Crown, Flame, Rss, Send, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { api, type ApiPost } from '@/lib/api'
import { useAllEscorts } from '@/hooks/useEscorts'
import { useFollow } from '@/lib/follow-context'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'

const TIER_COLOR: Record<string, string> = {
  elite: '#8B0000', Elite: '#8B0000',
  vip: '#FF4500',   VIP: '#FF4500',
  premium: '#B8860B', Premium: '#B8860B',
  standard: '#3a6da8', Standard: '#3a6da8',
}

const QUICK_AMOUNTS = [50, 100, 200, 500]

function TipPanel({ postId, escortFirstName, onClose }: { postId: string; escortFirstName: string; onClose: () => void }) {
  const [phone,    setPhone]    = useState('')
  const [amount,   setAmount]   = useState<number | null>(null)
  const [custom,   setCustom]   = useState('')
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg,      setMsg]      = useState('')

  const finalAmount = amount ?? (custom ? parseInt(custom, 10) : null)

  const send = async () => {
    if (!phone.trim()) { setStatus('error'); setMsg('Enter your M-Pesa phone number'); return }
    if (!finalAmount || finalAmount < 10) { setStatus('error'); setMsg('Select or enter an amount (min KES 10)'); return }
    setStatus('loading'); setMsg('')
    try {
      const res = await api.posts.tip(postId, { phone: phone.trim(), amount: finalAmount })
      setStatus('success')
      setMsg(res.message)
    } catch (err: any) {
      setStatus('error')
      setMsg(err.message ?? 'Failed to send tip. Please try again.')
    }
  }

  return (
    <div className="mt-3 p-4 bg-dark-bg border border-[#FFD700]/25 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-light">💰 Tip {escortFirstName} via M-Pesa</p>
        <button onClick={onClose} className="text-text-muted hover:text-text-light transition-colors"><X size={14} /></button>
      </div>

      {status === 'success' ? (
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <CheckCircle2 size={28} className="text-[#28a745]" />
          <p className="text-sm font-bold text-text-light">Check your phone!</p>
          <p className="text-[11px] text-text-muted">{msg}</p>
          <button onClick={onClose} className="mt-1 text-xs text-[#FFD700] hover:underline">Close</button>
        </div>
      ) : (
        <>
          {/* Amount picker */}
          <div>
            <p className="text-[10px] text-text-muted mb-2 uppercase tracking-widest">Amount (KES)</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustom('') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                    ${amount === a && !custom
                      ? 'bg-[#FFD700] text-black border-[#FFD700]'
                      : 'bg-dark-bg border-color text-text-muted hover:border-[#FFD700]/40'}`}
                >
                  {a}
                </button>
              ))}
              <input
                type="number"
                min="10"
                max="70000"
                placeholder="Other"
                value={custom}
                onChange={e => { setCustom(e.target.value); setAmount(null) }}
                className="w-20 px-2.5 py-1.5 bg-dark-bg border border-color rounded-lg text-xs text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#FFD700]/60"
              />
            </div>
          </div>

          {/* Phone input */}
          <div>
            <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-widest">M-Pesa Phone</p>
            <input
              type="tel"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted/40 focus:outline-none focus:border-[#28a745]/60 transition-all"
            />
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#EF4444]">
              <AlertCircle size={13} />
              {msg}
            </div>
          )}

          <button
            onClick={send}
            disabled={status === 'loading'}
            className="w-full py-2.5 bg-[#28a745] hover:bg-[#218838] disabled:opacity-60 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending STK Push…</>
            ) : (
              <><Send size={12} /> Send KES {finalAmount ?? '—'} Tip</>
            )}
          </button>
          <p className="text-[9px] text-text-muted text-center">M-Pesa STK Push — you'll get a prompt on your phone to confirm</p>
        </>
      )}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 1000)
  if (diff < 60)       return 'just now'
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

function FollowBtn({ escortId, escortUserId, small = false }: { escortId: string; escortUserId?: string; small?: boolean }) {
  const { isFollowing, toggleFollow } = useFollow()
  const { isLoggedIn, user } = useAuth()
  const following = isFollowing(escortId)
  const isOwn = !!(user?.id && escortUserId && user.id === escortUserId)
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

function PostSkeleton() {
  return (
    <div className="bg-card-bg border border-color rounded-2xl overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-dark-bg flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-dark-bg rounded w-32" />
          <div className="h-2.5 bg-dark-bg rounded w-20" />
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <div className="h-3 bg-dark-bg rounded w-full" />
        <div className="h-3 bg-dark-bg rounded w-3/4" />
      </div>
      <div className="w-full aspect-video bg-dark-bg" />
      <div className="px-4 py-3 border-t border-color/50 flex gap-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-3 bg-dark-bg rounded w-12" />)}
      </div>
    </div>
  )
}

export default function FeedsPage() {
  useSEO({
    title: 'Escort Feeds — Social Updates',
    description: 'Follow your favourite escorts and see their latest updates, photos, and posts. Real-time social feed from verified companions in Kenya.',
    keywords: 'escort feeds Kenya, escort social media, companion updates Nairobi',
    canonicalPath: '/feeds',
  })

  const [liked, setLiked]   = useState<Set<string>>(new Set())
  const [saved, setSaved]   = useState<Set<string>>(new Set())
  const [tipOpen, setTipOpen] = useState<string | null>(null)

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'feed'],
    queryFn:  () => api.posts.list({ limit: 20 }),
    staleTime: 60 * 1000,
    retry: 1,
  })

  const { escorts: recommended, isLoading: escortsLoading } = useAllEscorts({ limit: 7 })
  const { followerCount } = useFollow()

  const posts: ApiPost[] = postsData?.data ?? []

  const toggleLike = async (id: string) => {
    setLiked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
    try { await api.posts.like(id) } catch {}
  }
  const toggleSave = (id: string) => setSaved(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  const eliteVip = recommended.filter(e => ['Elite', 'VIP', 'elite', 'vip'].includes(e.tier)).slice(0, 7)

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

              {postsLoading && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
                </div>
              )}

              {!postsLoading && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-card-bg border border-color flex items-center justify-center">
                    <Rss size={36} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="font-bold text-text-light text-base">No posts yet</p>
                    <p className="text-sm text-text-muted mt-1">Escorts will post updates here once they join. Check back soon!</p>
                  </div>
                  <Link href="/" className="px-6 py-3 bg-gradient-to-r from-[#8B0000] to-[#a00000] text-white font-bold text-sm rounded-xl hover:from-[#a00000] hover:to-[#8B0000] transition-all">
                    Browse Escorts →
                  </Link>
                </div>
              )}

              {posts.length > 0 && (
                <div className="space-y-4">
                  {posts.map(post => {
                    const isLiked = liked.has(post.id)
                    const isSaved = saved.has(post.id)
                    const tierColor = TIER_COLOR[post.tier] ?? '#555'
                    const tierLabel = (post.tier ?? '').charAt(0).toUpperCase() + (post.tier ?? '').slice(1).toLowerCase()
                    const handle = '@' + post.name.replace(/[\s.]/g, '').toLowerCase()
                    return (
                      <div key={post.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#8B0000]/30 transition-all">
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                          <Link href={`/profile/${post.escortId}`}>
                            {post.avatar
                              ? <img src={post.avatar} alt={post.name} className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0 cursor-pointer" style={{ borderColor: tierColor }} />
                              : <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm cursor-pointer border-2" style={{ backgroundColor: tierColor + '40', borderColor: tierColor }}>{post.name.charAt(0)}</div>
                            }
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link href={`/profile/${post.escortId}`} className="font-bold text-text-light text-sm hover:underline">{post.name}</Link>
                              {post.verified && (
                                <span className="w-3.5 h-3.5 bg-[#28a745] rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-[7px] font-black">✓</span>
                                </span>
                              )}
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: tierColor + '25', color: tierColor }}>{tierLabel}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-text-muted">{handle}</span>
                              <span className="text-[10px] text-text-muted">·</span>
                              <span className="text-[10px] text-text-muted">{timeAgo(post.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <FollowBtn escortId={post.escortId} />
                            <button className="p-1.5 text-text-muted hover:text-text-light rounded-lg hover:bg-dark-bg transition-colors">
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Text */}
                        <div className="px-4 pb-3">
                          <p className="text-sm text-text-light leading-relaxed whitespace-pre-line">{post.text}</p>
                        </div>

                        {/* Media */}
                        {post.image && (
                          <div className="w-full aspect-video overflow-hidden">
                            <img src={post.image} alt="Post" className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500 cursor-pointer" />
                          </div>
                        )}

                        {/* Engagement */}
                        <div className="px-4 py-3 border-t border-color/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-xs transition-all ${isLiked ? 'text-[#E91E63]' : 'text-text-muted hover:text-text-light'}`}>
                                <Heart size={15} className={isLiked ? 'fill-[#E91E63]' : ''} />
                                <span className="font-semibold">{post.likes + (isLiked ? 1 : 0)}</span>
                              </button>
                              <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-light transition-colors">
                                <MessageCircle size={15} />
                              </button>
                              <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-light transition-colors">
                                <Share2 size={15} />
                              </button>
                              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                <Eye size={14} />
                                <span>{post.views.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {post.tipEnabled && (
                                <button
                                  onClick={() => setTipOpen(tipOpen === post.id ? null : post.id)}
                                  className="px-3 py-1.5 bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-[10px] font-black rounded-full hover:bg-[#FFD700]/20 transition-all"
                                >
                                  💰 Tip
                                </button>
                              )}
                              <button onClick={() => toggleSave(post.id)} className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'text-[#FFD700]' : 'text-text-muted hover:text-text-light'}`}>
                                <Bookmark size={14} className={isSaved ? 'fill-[#FFD700]' : ''} />
                              </button>
                            </div>
                          </div>
                          {tipOpen === post.id && (
                            <TipPanel
                              postId={post.id}
                              escortFirstName={post.name.split(' ')[0]}
                              onClose={() => setTipOpen(null)}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}

                  <div className="text-center py-6">
                    <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B0000] text-white font-bold text-sm rounded-xl hover:bg-[#a00000] transition-all">
                      <Crown size={14} /> Join to see more posts
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="hidden lg:flex flex-col w-72 flex-shrink-0 gap-4">
              {/* Ad Slot */}
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

              {/* Recommended */}
              <div className="bg-card-bg border border-color rounded-2xl p-4">
                <h3 className="text-sm font-bold text-text-light mb-4">Recommended for You</h3>
                {escortsLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-dark-bg flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 bg-dark-bg rounded w-24" />
                          <div className="h-2 bg-dark-bg rounded w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : eliteVip.length > 0 ? (
                  <div className="space-y-3">
                    {eliteVip.map(e => (
                      <div key={e.id} className="flex items-center gap-2.5">
                        <Link href={`/profile/${e.id}`} className="flex-shrink-0">
                          {e.image
                            ? <img src={e.image} alt={e.name} className="w-9 h-9 rounded-full object-cover border border-color" />
                            : <div className="w-9 h-9 rounded-full bg-[#8B0000]/20 flex items-center justify-center text-[#8B0000] font-black text-sm border border-color">{e.name.charAt(0)}</div>
                          }
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${e.id}`} className="font-bold text-text-light text-xs hover:underline block truncate">{e.name}</Link>
                          <p className="text-[10px] text-text-muted truncate">{e.area} · {followerCount(e.id).toLocaleString()} followers</p>
                        </div>
                        <FollowBtn escortId={e.id} small />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted text-center py-4">No escorts yet</p>
                )}
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
