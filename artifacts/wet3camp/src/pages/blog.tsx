import React, { useState, useEffect } from 'react'
import { Link } from 'wouter'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import SeoFooter from '@/components/SeoFooter'
import { useSEO } from '@/lib/useSEO'
import type { BlogPost } from '@/types/blog'
import { Clock, Tag, ChevronRight, Search, Rss } from 'lucide-react'

export default function Blog() {
  useSEO({
    title: 'Blog | Wet3Camp',
    description: 'Read stories, advice and updates from Wet3Camp.',
    keywords: 'Wet3Camp blog, stories, advice, updates',
    canonicalPath: '/blog',
  })

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selected, setSelected] = useState<string>('All')
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/blog?limit=50')
      .then(r => {
        if (!r.ok) throw new Error('Could not load articles')
        return r.json()
      })
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
          imageUrl:       p.imageUrl ?? p.image_url ?? '',
          readTime:       Number(p.read_time ?? p.readTime ?? 3),
          published:      true,
          seoTitle:       p.seo_title ?? p.seoTitle,
          seoDescription: p.seo_description ?? p.seoDescription,
        }))
        setPosts(apiPosts)
        setCategories([...new Set(apiPosts.map(post => post.category.trim()).filter(Boolean))].sort())
        setLoadError('')
      })
      .catch(() => {
        setPosts([])
        setCategories([])
        setLoadError('Articles could not be loaded. Please try again later.')
      })
      .finally(() => setLoading(false))
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
      <div className="flex-1 min-w-0 mobile-bottom-safe lg:pb-0">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Rss size={15} className="shrink-0 text-[#8B0000]" />
              <div>
                <h1 className="text-xl font-black leading-tight text-text-light">Blog</h1>
                <p className="text-xs text-text-muted">Stories, advice and updates from Wet3Camp</p>
              </div>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search articles…"
                className="w-full rounded-xl border border-color bg-card-bg py-2 pl-9 pr-4 text-sm text-text-light placeholder:text-text-muted transition-all focus:border-[#8B0000] focus:outline-none"
              />
            </div>
          </div>

          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${selected === cat ? 'bg-[#8B0000] text-white' : 'border border-color bg-card-bg text-text-muted hover:border-[#8B0000]/50 hover:text-text-light'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && <p className="py-12 text-center text-sm text-text-muted" role="status">Loading articles…</p>}
          {loadError && <p className="py-12 text-center text-sm text-text-muted" role="alert">{loadError}</p>}
          {!loading && !loadError && filtered.length === 0 && (
            <div className="text-center py-16 text-text-muted">No articles found.</div>
          )}

          {/* Featured post */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="group mb-5 block">
              <div className="overflow-hidden rounded-2xl border border-color bg-card-bg transition-all hover:border-[#8B0000]/40 md:grid md:grid-cols-[0.9fr_1.1fr]">
                <div className="h-40 overflow-hidden sm:h-52 md:h-full md:min-h-[220px]">
                  {featured.imageUrl
                    ? <img src={featured.imageUrl} alt={featured.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="flex h-full items-center justify-center bg-dark-bg text-xs font-bold uppercase tracking-widest text-text-muted">{featured.category}</div>}
                </div>
                <div className="p-4 sm:p-5 md:self-center">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="max-w-full truncate rounded-full bg-[#8B0000]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8B0000]">{featured.category}</span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock size={10} />{featured.readTime} min read</span>
                    <span className="text-[10px] text-text-muted">{featured.publishedAt}</span>
                  </div>
                  <h2 className="mb-2 text-lg font-black leading-tight text-text-light transition-colors group-hover:text-[#FFD700] sm:text-xl">{featured.title}</h2>
                  <p className="mb-3 line-clamp-2 text-sm text-text-muted">{featured.excerpt}</p>
                  <div className="flex items-center gap-2 text-[#8B0000] text-xs font-bold">
                    Read Article <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Rest of posts */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {rest.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-color bg-card-bg transition-all hover:border-[#8B0000]/40">
                    <div className="aspect-[16/8] overflow-hidden">
                      {post.imageUrl
                        ? <img src={post.imageUrl} alt={post.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="flex h-full items-center justify-center bg-dark-bg text-[10px] font-bold uppercase tracking-widest text-text-muted">{post.category}</div>}
                    </div>
                    <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="max-w-[70%] truncate rounded-full bg-[#8B0000]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8B0000]">{post.category}</span>
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
        <SeoFooter />
      </div>
    </div>
  )
}
