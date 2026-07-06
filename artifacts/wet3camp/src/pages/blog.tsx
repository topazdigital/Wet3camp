import React, { useState, useEffect } from 'react'
import { Link } from 'wouter'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useSEO } from '@/lib/useSEO'
import { getPublishedPosts, BLOG_CATEGORIES, type BlogPost } from '@/data/blog'
import { Clock, Tag, ChevronRight, Search, Rss } from 'lucide-react'

export default function Blog() {
  useSEO({
    title: 'Escort Blog Kenya — Tips, Guides & News | Wet3Camp',
    description: 'Read the latest escort guides, safety tips, city-by-city directories and news from Wet3Camp — Kenya\'s #1 escort directory.',
    keywords: 'escort blog Kenya, Nairobi escort guide, Mombasa escort guide, escort safety tips, Kenya escort news, escort directory blog',
    canonicalPath: '/blog',
  })

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [selected, setSelected] = useState<string>('All')
  const [query, setQuery] = useState('')

  useEffect(() => {
    // Try API first, fall back to static data
    fetch('/api/blog?limit=50')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const apiPosts: BlogPost[] = (data?.posts ?? []).map((p: any) => ({
          id:             String(p.id),
          slug:           p.slug,
          title:          p.title,
          excerpt:        p.excerpt ?? '',
          content:        p.content ?? '',
          author:         p.author ?? 'Wet3Camp Editorial',
          category:       p.category ?? 'Kenya Escorts Guide',
          tags:           Array.isArray(p.tags) ? p.tags : [],
          publishedAt:    p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
          updatedAt:      p.updatedAt ?? p.publishedAt ?? '',
          imageUrl:       p.imageUrl ?? p.image_url ?? 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&h=450&fit=crop',
          readTime:       Number(p.read_time ?? p.readTime ?? 3),
          published:      true,
          seoTitle:       p.seo_title ?? p.seoTitle,
          seoDescription: p.seo_description ?? p.seoDescription,
        }))
        // Merge: API posts + static posts not already covered, then sort newest-first
        const staticPosts = getPublishedPosts()
        const apiSlugs = new Set(apiPosts.map((p: any) => p.slug))
        const uniqueStatic = staticPosts.filter(p => !apiSlugs.has(p.slug))
        const merged = [...apiPosts, ...uniqueStatic].sort((a, b) => {
          const da = new Date(a.publishedAt || 0).getTime()
          const db = new Date(b.publishedAt || 0).getTime()
          return db - da
        })
        setPosts(merged)
      })
      .catch(() => setPosts(getPublishedPosts()))
  }, [])

  const filtered = posts.filter(p => {
    const matchCat = selected === 'All' || p.category === selected
    const matchQ = !query || p.title.toLowerCase().includes(query.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
    return matchCat && matchQ
  })

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Rss size={16} className="text-[#8B0000]" />
                <span className="text-[10px] text-[#8B0000] font-bold uppercase tracking-widest">Wet3Camp Blog</span>
              </div>
              <h1 className="text-2xl font-black text-text-light">Escort Guides & News</h1>
              <p className="text-sm text-text-muted mt-1">Tips, city guides, safety advice and platform news</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-9 pr-4 py-2.5 bg-card-bg border border-color rounded-xl text-sm text-text-light placeholder-text-muted focus:outline-none focus:border-[#8B0000] transition-all"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap mb-8">
            {['All', ...BLOG_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selected === cat ? 'bg-[#8B0000] text-white' : 'bg-card-bg border border-color text-text-muted hover:border-[#8B0000]/50 hover:text-text-light'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-text-muted">No articles found.</div>
          )}

          {/* Featured post */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="block mb-8 group">
              <div className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#8B0000]/40 transition-all">
                <div className="h-52 overflow-hidden">
                  <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-0.5 bg-[#8B0000]/20 text-[#8B0000] text-[10px] font-bold uppercase tracking-wider rounded-full">{featured.category}</span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock size={10} />{featured.readTime} min read</span>
                    <span className="text-[10px] text-text-muted">{featured.publishedAt}</span>
                  </div>
                  <h2 className="text-xl font-black text-text-light mb-2 group-hover:text-[#FFD700] transition-colors leading-tight">{featured.title}</h2>
                  <p className="text-sm text-text-muted line-clamp-2 mb-4">{featured.excerpt}</p>
                  <div className="flex items-center gap-2 text-[#8B0000] text-xs font-bold">
                    Read Article <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Rest of posts */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {rest.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                  <div className="bg-card-bg border border-color rounded-2xl overflow-hidden hover:border-[#8B0000]/40 transition-all h-full flex flex-col">
                    <div className="h-36 overflow-hidden">
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-[#8B0000]/20 text-[#8B0000] text-[9px] font-bold uppercase tracking-wider rounded-full">{post.category}</span>
                        <span className="text-[9px] text-text-muted flex items-center gap-1"><Clock size={9} />{post.readTime} min</span>
                      </div>
                      <h3 className="text-sm font-black text-text-light mb-2 group-hover:text-[#FFD700] transition-colors leading-snug line-clamp-2">{post.title}</h3>
                      <p className="text-xs text-text-muted line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="flex items-center gap-0.5 text-[9px] text-text-muted px-1.5 py-0.5 bg-dark-bg rounded-full">
                            <Tag size={8} />{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
