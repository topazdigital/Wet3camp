import React, { useEffect, useState } from 'react'
import { Link, useRoute } from 'wouter'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useSEO } from '@/lib/useSEO'
import { getPostBySlug, getPublishedPosts, type BlogPost } from '@/data/blog'
import { Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react'

function renderMarkdown(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-black text-text-light mt-8 mb-3">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-[#FFD700] mt-6 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-light font-bold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-text-muted text-sm ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-text-muted text-sm leading-relaxed mb-4">')
    .replace(/^(?!<[h|l])(.+)$/gm, (line) => {
      if (!line.trim() || line.startsWith('<')) return line
      return `<span>${line}</span>`
    })
}

export default function BlogPost() {
  const [, params] = useRoute('/blog/:slug')
  const [post, setPost] = useState<BlogPost | undefined>()
  const [related, setRelated] = useState<BlogPost[]>([])

  useEffect(() => {
    if (!params?.slug) return
    const slug = params.slug

    // Try API first, then fall back to static data
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.slug) {
          const p: BlogPost = {
            id:             String(data.id),
            slug:           data.slug,
            title:          data.title,
            excerpt:        data.excerpt ?? '',
            content:        data.content ?? '',
            author:         data.author ?? 'Wet3Camp Editorial',
            category:       data.category ?? 'Kenya Escorts Guide',
            tags:           Array.isArray(data.tags) ? data.tags : [],
            publishedAt:    data.publishedAt ? new Date(data.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
            updatedAt:      data.updatedAt ?? data.publishedAt ?? '',
            imageUrl:       data.imageUrl ?? data.image_url ?? 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
            readTime:       Number(data.read_time ?? data.readTime ?? 3),
            published:      true,
            seoTitle:       data.seo_title ?? data.seoTitle,
            seoDescription: data.seo_description ?? data.seoDescription,
          }
          setPost(p)
          // Fetch related posts
          fetch(`/api/blog?category=${encodeURIComponent(p.category)}&limit=10`)
            .then(r => r.ok ? r.json() : null)
            .then(rel => {
              const relPosts: BlogPost[] = (rel?.posts ?? [])
                .filter((r: any) => r.slug !== slug)
                .slice(0, 2)
                .map((r: any) => ({
                  id: String(r.id), slug: r.slug, title: r.title, excerpt: r.excerpt ?? '',
                  content: '', author: r.author ?? 'Wet3Camp Editorial',
                  category: r.category ?? '', tags: Array.isArray(r.tags) ? r.tags : [],
                  publishedAt: '', updatedAt: '',
                  imageUrl: r.imageUrl ?? r.image_url ?? 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=400&h=300&fit=crop',
                  readTime: Number(r.read_time ?? r.readTime ?? 3), published: true,
                }))
              setRelated(relPosts.length > 0 ? relPosts : getPublishedPosts().filter(x => x.category === p.category && x.slug !== slug).slice(0, 2))
            })
            .catch(() => setRelated(getPublishedPosts().filter(x => x.category === p.category && x.slug !== slug).slice(0, 2)))
        } else {
          throw new Error('not found')
        }
      })
      .catch(() => {
        const found = getPostBySlug(slug)
        setPost(found)
        if (found) {
          setRelated(getPublishedPosts().filter(p => p.id !== found.id && p.category === found.category).slice(0, 2))
        }
      })
  }, [params?.slug])

  useSEO({
    title: post?.seoTitle ?? post?.title ?? 'Escort Blog | Wet3Camp',
    description: post?.seoDescription ?? post?.excerpt ?? '',
    keywords: post?.tags.join(', '),
    ogImage: post?.imageUrl,
    canonicalPath: post ? `/blog/${post.slug}` : '/blog',
    type: 'article',
  })

  if (!post) {
    return (
      <div className="flex min-h-screen bg-dark-bg">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Header />
          <div className="flex items-center justify-center h-64 text-text-muted">Article not found.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8">

          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-light mb-6 transition-colors">
            <ChevronLeft size={13} /> Back to Blog
          </Link>

          {/* Hero image */}
          <div className="rounded-2xl overflow-hidden mb-6 h-56">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-2.5 py-1 bg-[#8B0000]/20 text-[#8B0000] text-[10px] font-bold uppercase tracking-wider rounded-full">{post.category}</span>
            <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={11} />{post.readTime} min read</span>
            <span className="text-xs text-text-muted">{post.publishedAt}</span>
            <span className="text-xs text-text-muted">By {post.author}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-text-light leading-tight mb-4">{post.title}</h1>

          {/* Excerpt */}
          <p className="text-base text-text-muted border-l-4 border-[#8B0000] pl-4 mb-8 italic">{post.excerpt}</p>

          {/* Content */}
          <article className="prose-content space-y-2 text-text-muted text-sm leading-relaxed">
            {post.content.split('\n').map((line, i) => {
              if (line.startsWith('## '))
                return <h2 key={i} className="text-xl font-black text-text-light mt-8 mb-3">{line.slice(3)}</h2>
              if (line.startsWith('### '))
                return <h3 key={i} className="text-base font-bold text-[#FFD700] mt-6 mb-2">{line.slice(4)}</h3>
              if (line.startsWith('- '))
                return <li key={i} className="text-text-muted text-sm ml-5 list-disc">{line.slice(2).replace(/\*\*(.+?)\*\*/g, (_, t) => t)}</li>
              if (!line.trim()) return <div key={i} className="h-2" />
              const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-light font-semibold">$1</strong>')
              return <p key={i} className="text-text-muted text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
            })}
          </article>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-color">
            {post.tags.map(tag => (
              <Link key={tag} href={`/blog?q=${encodeURIComponent(tag)}`} className="flex items-center gap-1 text-xs text-text-muted px-2.5 py-1 bg-card-bg border border-color rounded-full hover:border-[#8B0000]/50 hover:text-text-light transition-all">
                <Tag size={10} />{tag}
              </Link>
            ))}
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-10">
              <h4 className="text-sm font-black text-text-light mb-4">Related Articles</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map(r => (
                  <Link key={r.id} href={`/blog/${r.slug}`} className="block group">
                    <div className="bg-card-bg border border-color rounded-xl overflow-hidden hover:border-[#8B0000]/40 transition-all flex gap-3 p-3">
                      <img src={r.imageUrl} alt={r.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-text-light group-hover:text-[#FFD700] transition-colors line-clamp-2 leading-snug">{r.title}</p>
                        <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1"><Clock size={9} />{r.readTime} min</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 p-6 bg-gradient-to-br from-[#8B0000]/20 to-transparent border border-[#8B0000]/30 rounded-2xl text-center">
            <p className="text-sm font-bold text-text-light mb-1">Ready to browse verified escorts in Kenya?</p>
            <p className="text-xs text-text-muted mb-4">1,200+ verified profiles across Nairobi, Mombasa, Kisumu & more</p>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B0000] text-white text-sm font-black rounded-xl hover:bg-[#a00000] transition-all">
              Browse Escorts <ChevronRight size={14} />
            </Link>
          </div>

        </main>
      </div>
    </div>
  )
}
