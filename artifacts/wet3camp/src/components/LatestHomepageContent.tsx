import { useEffect, useState } from 'react'
import { ArrowUpRight, BookOpen, CheckCircle2, MapPin } from 'lucide-react'
import { Link } from 'wouter'
import { api, type ApiEscort } from '@/lib/api'
import { getSlug } from '@/data/escorts'

interface BlogPreview {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  imageUrl: string
  readTime: number
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function chooseFresh<T>(items: T[], count: number, keepNewest: number): T[] {
  if (items.length <= count) return items
  const pinned = items.slice(0, keepNewest)
  return [...pinned, ...shuffle(items.slice(keepNewest)).slice(0, count - pinned.length)]
}

function escortImage(image?: string | null) {
  if (!image) return ''
  return image.startsWith('http')
    ? `/api/image-proxy?url=${encodeURIComponent(image)}`
    : image
}

function EscortCard({ escort }: { escort: ApiEscort }) {
  const image = escortImage(escort.image)
  const tierColor = escort.tier?.toLowerCase() === 'elite'
    ? '#8B0000'
    : escort.tier?.toLowerCase() === 'vip'
    ? '#B8860B'
    : escort.tier?.toLowerCase() === 'premium'
    ? '#9A7B00'
    : ''

  return (
    <Link
      href={`/@${getSlug(escort.name)}`}
      className="group w-[148px] flex-shrink-0 overflow-hidden rounded-xl border border-color bg-card-bg transition hover:border-[#B8860B]/50 sm:w-[170px]"
      data-testid={`link-new-escort-${escort.id}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-dark-bg">
        {image ? (
          <img
            src={image}
            alt={escort.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2a1a1a] text-4xl font-black text-[#8B0000]/60">
            {(escort.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {tierColor && (
          <span className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: tierColor }}>
            {escort.tier}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5 pt-8">
          <div className="flex items-center gap-1">
            <span className="truncate text-xs font-bold text-white">{escort.name}</span>
            {escort.verified && <CheckCircle2 size={11} className="flex-shrink-0 text-green-400" />}
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-white/75">
            <MapPin size={9} /> {escort.area ? `${escort.area}, ${escort.city}` : escort.city}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function LatestHomepageContent() {
  const [escorts, setEscorts] = useState<ApiEscort[]>([])
  const [blogs, setBlogs] = useState<BlogPreview[]>([])
  const [escortsLoading, setEscortsLoading] = useState(true)
  const [blogsLoading, setBlogsLoading] = useState(true)
  const [escortsError, setEscortsError] = useState(false)
  const [blogsError, setBlogsError] = useState(false)

  useEffect(() => {
    let active = true

    const loadEscorts = () => {
      api.escorts.list({ sort: 'newest', limit: 24 })
        .then(result => {
          if (active) {
            setEscorts(chooseFresh(result.data ?? [], 8, 3))
            setEscortsError(false)
          }
        })
        .catch(() => {
          if (active) setEscortsError(true)
        })
        .finally(() => {
          if (active) setEscortsLoading(false)
        })
    }

    const loadBlogs = () => {
      fetch('/api/blog?limit=12', { cache: 'no-store' })
        .then(response => {
          if (!response.ok) throw new Error('Could not load recent articles')
          return response.json()
        })
        .then(data => {
          if (!active) return
          const recent: BlogPreview[] = (Array.isArray(data?.posts) ? data.posts : [])
            .filter((post: any) => post?.slug && post?.title)
            .map((post: any) => ({
              id: String(post.id ?? post.slug),
              slug: String(post.slug),
              title: String(post.title),
              excerpt: String(post.excerpt ?? ''),
              category: String(post.category ?? 'Wet3Camp Blog'),
              imageUrl: String(post.imageUrl ?? post.image_url ?? ''),
              readTime: Number(post.read_time ?? post.readTime ?? 3),
            }))
          setBlogs(chooseFresh(recent, 3, 1))
          setBlogsError(false)
        })
        .catch(() => {
          if (active) setBlogsError(true)
        })
        .finally(() => {
          if (active) setBlogsLoading(false)
        })
    }

    const loadFreshContent = () => {
      loadEscorts()
      loadBlogs()
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadFreshContent()
    }

    loadFreshContent()
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  return (
    <section
      className="w-full border-y border-color bg-dark-bg px-3 py-5 sm:px-5"
      aria-label="Latest profiles and articles"
      data-testid="section-latest-homepage"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-text-light">Fresh on Wet3Camp</h2>
          <p className="mt-0.5 text-[10px] text-text-muted">New profiles and recent reads</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-text-light">Newest profiles</h3>
            <Link href="/search" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B8860B] hover:text-[#FFD700]">
              Browse all <ArrowUpRight size={12} />
            </Link>
          </div>
          {escortsLoading ? (
            <div className="flex gap-3 overflow-hidden" aria-label="Loading new profiles">
              {[0, 1, 2, 3].map(index => <div key={index} className="h-40 w-[148px] flex-shrink-0 animate-pulse rounded-xl bg-card-bg sm:w-[170px]" />)}
            </div>
          ) : escorts.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {escorts.map(escort => <EscortCard key={escort.id} escort={escort} />)}
            </div>
          ) : (
            <p className="py-5 text-xs text-text-muted" role="status">
              {escortsError ? 'New profiles could not be loaded right now.' : 'No new profiles are available yet.'}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-text-light">Latest articles</h3>
            <Link href="/blog" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B8860B] hover:text-[#FFD700]">
              All articles <ArrowUpRight size={12} />
            </Link>
          </div>
          {blogsLoading ? (
            <div className="space-y-2" aria-label="Loading latest articles">
              {[0, 1, 2].map(index => <div key={index} className="h-[68px] animate-pulse rounded-xl bg-card-bg" />)}
            </div>
          ) : blogs.length > 0 ? (
            <div className="space-y-2">
              {blogs.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="flex min-h-[68px] items-center gap-3 rounded-xl border border-color bg-card-bg p-2.5 transition hover:border-[#B8860B]/50"
                  data-testid={`link-home-blog-${post.slug}`}
                >
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="" loading="lazy" className="h-12 w-14 flex-shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-[#8B0000]/15 text-[#B8860B]">
                      <BookOpen size={18} />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[9px] font-semibold uppercase tracking-wide text-[#B8860B]">{post.category}</span>
                    <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-snug text-text-light">{post.title}</span>
                    <span className="mt-1 block text-[9px] text-text-muted">{post.readTime} min read</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-5 text-xs text-text-muted" role="status">
              {blogsError ? 'Recent articles could not be loaded right now.' : 'No published articles yet.'}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
