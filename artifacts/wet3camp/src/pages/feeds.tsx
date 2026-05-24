import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Image, Video, CheckCircle2 } from 'lucide-react'

const STORIES = [
  { id: 1, name: 'Amara K.',  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', live: true  },
  { id: 2, name: 'Zara M.',   image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop', live: false },
  { id: 3, name: 'Luna K.',   image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop', live: false },
  { id: 4, name: 'Priya S.',  image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop', live: true  },
  { id: 5, name: 'Fatuma H.', image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop', live: false },
]

const POSTS = [
  { id: 1, name: 'Amara K.',  location: 'Nairobi CBD',  verified: true, tier: 'elite',   image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=700&fit=crop', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop', caption: 'Available for evening bookings this week! Drop me a message 🔥 #Nairobi #Escort #Elite', likes: 234, comments: 45, time: '2h', bookmarked: false, type: 'image' },
  { id: 2, name: 'Zara M.',   location: 'Westlands',    verified: true, tier: 'vip',     image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=700&fit=crop', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop', caption: 'New gallery photos just dropped 📸 Check out my profile for more. Bookings open for the weekend!', likes: 567, comments: 89, time: '4h', bookmarked: true, type: 'image' },
  { id: 3, name: 'Luna K.',   location: 'Karen',        verified: true, tier: 'premium', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=700&fit=crop', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&h=60&fit=crop', caption: 'Luxury experiences await ✨ I offer dinner dates, travel companionship and more. KES 5,000/hr.', likes: 345, comments: 67, time: '6h', bookmarked: false, type: 'image' },
]

const TIER_COLORS: Record<string, string> = { elite: '#8B0000', vip: '#FF4500', premium: '#B8860B', free: '#555' }

export default function FeedsPage() {
  const [posts, setPosts] = useState(POSTS.map(p => ({ ...p, liked: false })))

  const toggleLike = (id: number) =>
    setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
  const toggleBookmark = (id: number) =>
    setPosts(ps => ps.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p))

  return (
    <div className="flex min-h-screen bg-dark-bg flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 w-full overflow-x-hidden lg:pb-0 pb-24 min-w-0">
        <Header />

        <main className="w-full">
          <div className="max-w-xl mx-auto">

            {/* Stories */}
            <div className="px-3 sm:px-5 py-4 border-b border-color">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                {STORIES.map(s => (
                  <div key={s.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                    <div className={`relative w-16 h-16 rounded-full p-0.5 ${s.live ? 'bg-gradient-to-tr from-[#E91E63] to-[#8B0000]' : 'bg-gradient-to-tr from-[#FFD700] to-[#8B0000]'}`}>
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover rounded-full border-2 border-dark-bg group-hover:scale-105 transition-transform" />
                      {s.live && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-[#E91E63] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-dark-bg">
                          LIVE
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted font-medium max-w-[60px] text-center truncate">{s.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Posts */}
            <div className="divide-y divide-color">
              {posts.map(post => (
                <article key={post.id} className="bg-dark-bg">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={post.avatar} alt={post.name} className="w-10 h-10 rounded-full object-cover border-2" style={{ borderColor: TIER_COLORS[post.tier] }} />
                        {post.verified && <CheckCircle2 size={13} className="absolute -bottom-0.5 -right-0.5 text-[#28a745]" fill="#28a745" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-light text-sm">{post.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: TIER_COLORS[post.tier] }}>{post.tier.toUpperCase()}</span>
                        </div>
                        <span className="text-[11px] text-text-muted">{post.location} · {post.time} ago</span>
                      </div>
                    </div>
                    <button className="p-1.5 text-text-muted hover:text-text-light rounded-lg hover:bg-card-bg transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Image */}
                  <div className="w-full overflow-hidden">
                    <img src={post.image} alt={post.name} className="w-full object-cover max-h-[500px]" loading="lazy" />
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? 'text-[#E91E63]' : 'text-text-muted hover:text-[#E91E63]'}`}>
                          <Heart size={20} className={post.liked ? 'fill-[#E91E63]' : ''} />
                          <span className="font-semibold text-xs">{post.likes.toLocaleString()}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-text-muted hover:text-text-light text-sm transition-colors">
                          <MessageCircle size={20} />
                          <span className="font-semibold text-xs">{post.comments}</span>
                        </button>
                        <button className="text-text-muted hover:text-text-light transition-colors">
                          <Share2 size={20} />
                        </button>
                      </div>
                      <button onClick={() => toggleBookmark(post.id)} className={`transition-colors ${post.bookmarked ? 'text-[#FFD700]' : 'text-text-muted hover:text-text-light'}`}>
                        <Bookmark size={20} className={post.bookmarked ? 'fill-[#FFD700]' : ''} />
                      </button>
                    </div>

                    <p className="text-sm text-text-light leading-relaxed">
                      <span className="font-bold mr-1.5">{post.name.split(' ')[0]}</span>
                      {post.caption}
                    </p>

                    <button className="mt-2 block text-xs text-text-muted hover:text-text-light transition-colors font-medium">
                      View all {post.comments} comments
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
