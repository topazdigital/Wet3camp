import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Heart, MessageCircle, Share2, Eye, Bookmark, MoreHorizontal, TrendingUp, Crown, Flame } from 'lucide-react'
import { Link } from 'wouter'
import { ESCORTS } from '@/data/escorts'
import { useFollow } from '@/lib/follow-context'
import { useAuth } from '@/lib/auth-context'
import { useSEO } from '@/lib/useSEO'

interface Post {
  id: string; escortId: string; name: string; handle: string; avatar: string
  timestamp: string; text: string; image?: string
  likes: number; comments: number; shares: number; views: number
  trending: boolean; verified: boolean; tier: string; tipEnabled: boolean
}

const POSTS: Post[] = [
  { id:'p1', escortId:'1', name:'Amara K.', handle:'@amaraK', avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', timestamp:'2 hours ago', text:"Good evening, Nairobi 🌙\n\nAvailable for dinner dates tonight — Westlands, Kilimani, or I can come to you. Let's make this Friday unforgettable. Contact via WhatsApp or Telegram on my profile 💋", image:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', likes:284, comments:18, shares:5, views:1420, trending:true, verified:true, tier:'Elite', tipEnabled:true },
  { id:'p2', escortId:'2', name:'Zara M.', handle:'@zara_west', avatar:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face', timestamp:'4 hours ago', text:"Just wrapped up a beautiful dinner date at Radisson 🥂 Thank you to my amazing client. Bookings open for this weekend — limited slots. Message me now!", image:'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop', likes:193, comments:12, shares:3, views:980, trending:false, verified:true, tier:'VIP', tipEnabled:true },
  { id:'p3', escortId:'5', name:'Priya S.', handle:'@priya_nrb', avatar:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face', timestamp:'5 hours ago', text:"New week, new look ✨ Now available for video calls from anywhere in the world. KES 3,000 for 30 mins — perfect for getting to know each other before we meet. DM me on my profile 💕", image:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=400&fit=crop', likes:412, comments:34, shares:11, views:2310, trending:true, verified:true, tier:'Elite', tipEnabled:true },
  { id:'p4', escortId:'3', name:'Wanjiku G.', handle:'@wanjiku_msa', avatar:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face', timestamp:'Yesterday', text:"Coast life 🌊 Available in Mombasa — Nyali, Bamburi and Diani this weekend. Overnight packages available. Message me via WhatsApp for rates. Already 8 of 10 slots taken for this month 🔥", image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop', likes:356, comments:27, shares:8, views:1870, trending:true, verified:true, tier:'Elite', tipEnabled:false },
  { id:'p5', escortId:'7', name:'Adhiambo O.', handle:'@adhiambo_k', avatar:'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face', timestamp:'Yesterday', text:"Kisumu darlings! 🦁 Now taking bookings for June. Lakeside dates, hotel visits, and travel escort packages. Rates starting KES 2,500/hr. Verified profile — check my gallery 📸", likes:128, comments:9, shares:2, views:633, trending:false, verified:true, tier:'Premium', tipEnabled:true },
  { id:'p6', escortId:'6', name:'Diana V.', handle:'@diana_vip', avatar:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&crop=face', timestamp:'2 days ago', text:"Nairobi CBD available NOW 🔴 Short notice welcome. Outcalls preferred. Rates negotiable for regulars. Message me on Telegram — faster response! 💌", image:'https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=600&h=400&fit=crop', likes:89, comments:6, shares:1, views:445, trending:false, verified:true, tier:'VIP', tipEnabled:true },
  { id:'p7', escortId:'8', name:'Fatuma H.', handle:'@fatuma_coast', avatar:'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop&crop=face', timestamp:'2 days ago', text:"Alhamdulillah for another week 🙏\n\nFor those asking — yes I'm back and taking bookings for Coast and Nairobi trips. Very discreet, professional service. Let me know your requirements 💎", likes:234, comments:19, shares:7, views:1230, trending:false, verified:true, tier:'Premium', tipEnabled:false },
  { id:'p8', escortId:'4', name:'Luna K.', handle:'@luna_karen', avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', timestamp:'3 days ago', text:"Karen and Lavington ladies — I'm your girl 💅 Corporate dinner escort, hotel dates, travel. Very upscale, very discreet. References available. New gallery photos just uploaded!", image:'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop', likes:178, comments:14, shares:4, views:890, trending:false, verified:true, tier:'VIP', tipEnabled:true },
]

const TIER_COLOR: Record<string, string> = { Elite:'#8B0000', VIP:'#FF4500', Premium:'#B8860B', Standard:'#3a6da8' }

function FollowBtn({ escortId, escortUserId, small = false }: { escortId: string; escortUserId?: string; small?: boolean }) {
  const { isFollowing, toggleFollow } = useFollow()
  const { isLoggedIn, user } = useAuth()
  const following = isFollowing(escortId)
  // Don't show follow button for own escort profile
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

export default function FeedsPage() {
  useSEO({
    title: 'Escort Feeds — Social Updates',
    description: 'Follow your favourite escorts and see their latest updates, photos, and posts. Real-time social feed from verified escorts in Kenya.',
    keywords: 'escort feeds Kenya, escort social media, escort updates Nairobi',
    canonicalPath: '/feeds',
  })
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [tipOpen, setTipOpen] = useState<string | null>(null)
  const { followerCount } = useFollow()

  const toggleLike = (id: string) => setLiked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSave = (id: string) => setSaved(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  const recommended = ESCORTS.filter(e => ['Elite', 'VIP'].includes(e.tier)).slice(0, 7)

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
                <div className="flex gap-1.5">
                  {['All', 'Following', 'Trending'].map((f, i) => (
                    <button key={f} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${i === 0 ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-text-muted'}`}>{f}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {POSTS.map(post => {
                  const isLiked = liked.has(post.id)
                  const isSaved = saved.has(post.id)
                  return (
                    <div key={post.id} className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#8B0000]/30 transition-all">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        <Link href={`/profile/${post.escortId}`}>
                          <img src={post.avatar} alt={post.name} className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0 cursor-pointer" style={{ borderColor: TIER_COLOR[post.tier] }} />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/profile/${post.escortId}`} className="font-bold text-text-light text-sm hover:underline">{post.name}</Link>
                            {post.verified && (
                              <span className="w-3.5 h-3.5 bg-[#28a745] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[7px] font-black">✓</span>
                              </span>
                            )}
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: TIER_COLOR[post.tier] + '25', color: TIER_COLOR[post.tier] }}>{post.tier}</span>
                            {post.trending && (
                              <span className="flex items-center gap-0.5 px-2 py-0.5 bg-[#FF4500]/10 border border-[#FF4500]/20 rounded-full text-[9px] font-black text-[#FF4500]">
                                <TrendingUp size={8} /> TRENDING
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-text-muted">{post.handle}</span>
                            <span className="text-[10px] text-text-muted">·</span>
                            <span className="text-[10px] text-text-muted">{post.timestamp}</span>
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
                              <span className="font-semibold">{post.comments}</span>
                            </button>
                            <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-light transition-colors">
                              <Share2 size={15} />
                              <span className="font-semibold">{post.shares}</span>
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
                          <div className="mt-3 p-3 bg-dark-bg border border-[#FFD700]/20 rounded-xl">
                            <p className="text-[10px] text-text-muted mb-1">Want to tip {post.name.split(' ')[0]}?</p>
                            <Link href={`/profile/${post.escortId}`} className="text-xs text-[#FFD700] font-bold hover:underline">
                              Contact her directly via WhatsApp or Telegram on her profile →
                            </Link>
                          </div>
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
                <div className="flex items-center justify-center gap-3 mt-2">
                  {['👁 Visibility', '🎯 Targeting', '📈 Results'].map(t => (
                    <span key={t} className="text-[8px] text-text-muted">{t}</span>
                  ))}
                </div>
              </div>

              {/* Recommended */}
              <div className="bg-card-bg border border-color rounded-2xl p-4">
                <h3 className="text-sm font-bold text-text-light mb-4">Recommended for You</h3>
                <div className="space-y-3">
                  {recommended.map(e => (
                    <div key={e.id} className="flex items-center gap-2.5">
                      <Link href={`/profile/${e.id}`} className="flex-shrink-0">
                        <img src={e.image} alt={e.name} className="w-9 h-9 rounded-full object-cover border border-color" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${e.id}`} className="font-bold text-text-light text-xs hover:underline block truncate">{e.name}</Link>
                        <p className="text-[10px] text-text-muted truncate">@{e.name.replace(/[\s.]/g, '').toLowerCase()} · {followerCount(e.id).toLocaleString()} followers</p>
                      </div>
                      <FollowBtn escortId={e.id} small />
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending */}
              <div className="bg-card-bg border border-color rounded-2xl p-4">
                <h3 className="text-sm font-bold text-text-light mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#FF4500]" /> Trending
                </h3>
                <div className="space-y-2.5">
                  {['#NairobiBabes', '#MombasaEscorts', '#EliteCompanion', '#KisumuLadies', '#Wet3Camp'].map((tag, i) => (
                    <div key={tag} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-text-light">{tag}</p>
                        <p className="text-[9px] text-text-muted">{[892, 674, 523, 341, 289][i]} posts</p>
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
