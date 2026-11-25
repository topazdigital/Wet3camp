import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getPool } from '../lib/db.js'
import { downloadAndStoreImage } from '../lib/image-download.js'
import {
  BLOG_IMPORT_SOURCES,
  MAX_BLOG_ARTICLES_PER_SOURCE,
  importBlogArticlesFromApprovedSources,
  type BlogImportSourceResult,
} from '../lib/blog-source-importer.mjs'
import OpenAI from 'openai'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { submitToIndexNow, blogPostUrl } from './sitemap.js'

const router = Router()

function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (req.userRole !== 'admin') { res.status(403).json({ message: 'Admin access required' }); return }
  next()
}

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String)
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean)
  return []
}

function getOpenAI(): OpenAI | null {
  const apiKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  if (!apiKey) return null
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

interface BlogImportJob {
  jobId: string
  status: 'running' | 'complete' | 'failed'
  startedAt: string
  completedAt?: string
  imported: number
  skipped: number
  sources: Array<BlogImportSourceResult & { imported: number; skipped: number }>
  error?: string
}

const blogImportJobs = new Map<string, BlogImportJob>()
let activeBlogImportJobId: string | null = null

function uniqueImportedSlug(title: string, usedSlugs: Set<string>): string {
  const base = slugify(title) || 'imported-article'
  let slug = base
  let suffix = 2
  while (usedSlugs.has(slug)) {
    const suffixText = `-${suffix++}`
    slug = `${base.slice(0, 80 - suffixText.length)}${suffixText}`
  }
  usedSlugs.add(slug)
  return slug
}

function serializeBlogImportJob(job: BlogImportJob) {
  return {
    jobId: job.jobId,
    status: job.status,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    imported: job.imported,
    skipped: job.skipped,
    sources: job.sources,
    error: job.error,
  }
}

async function runBlogSourceImport(job: BlogImportJob, sourceId: string) {
  const pool = getPool()
  if (!pool) throw new Error('Database unavailable')

  const [existingRows] = await pool.query<any[]>('SELECT slug, source_url FROM blog_posts')
  const rows = existingRows as any[]
  const existingSources = new Set(rows.map((row) => String(row.source_url || '').trim()).filter(Boolean))
  const usedSlugs = new Set(rows.map((row) => String(row.slug || '').trim()).filter(Boolean))

  await importBlogArticlesFromApprovedSources({
    sourceId,
    maxPerSource: MAX_BLOG_ARTICLES_PER_SOURCE,
    excludeSourceUrls: [...existingSources],
    downloadImage: downloadAndStoreImage,
    onSourceComplete: async ({ articles, ...sourceResult }) => {
      let imported = 0
      let skipped = 0
      for (const article of articles) {
        const sourceUrl = String(article.source_url || '').trim()
        if (!sourceUrl || existingSources.has(sourceUrl)) {
          skipped++
          continue
        }

        existingSources.add(sourceUrl)
        const slug = uniqueImportedSlug(article.title, usedSlugs)
        const tags = Array.isArray(article.tags) ? article.tags : []
        const publishedDate = article.published_at ? new Date(article.published_at) : new Date()
        const validPublishedDate = Number.isNaN(publishedDate.getTime()) ? new Date() : publishedDate
        try {
          await pool.query(
            `INSERT INTO blog_posts
               (slug, title, excerpt, content, category, tags, image_url, read_time,
                seo_title, seo_description, source_url, author, published, published_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              slug,
              article.title,
              article.excerpt,
              article.content,
              article.category || 'Kenya Escorts Guide',
              JSON.stringify(tags),
              article.image_url || '',
              article.read_time,
              article.seo_title || article.title,
              article.seo_description || article.excerpt,
              sourceUrl,
              article.author || 'Wet3Camp Editorial',
              validPublishedDate,
            ]
          )
          imported++
        } catch {
          skipped++
        }
      }

      job.imported += imported
      job.skipped += skipped
      job.sources.push({ ...sourceResult, imported, skipped })
    },
  })
}

// ── Rotating Kenya escort blog topics for AI generation ──────────────────────
const BLOG_TOPICS = [
  { title: 'Complete Guide to Escorts in Westlands, Nairobi', category: 'Kenya Escorts Guide', tags: ['Westlands', 'Nairobi', 'escort guide'] },
  { title: 'Nairobi CBD Escort Scene: What to Know Before Booking', category: 'Kenya Escorts Guide', tags: ['Nairobi CBD', 'escort booking', 'tips'] },
  { title: 'Kilimani Escorts: Top Picks and How to Book', category: 'Kenya Escorts Guide', tags: ['Kilimani', 'Nairobi', 'VIP escorts'] },
  { title: 'Karen Nairobi Escorts: Elite Companion Experience', category: 'Kenya Escorts Guide', tags: ['Karen', 'elite escorts', 'luxury'] },
  { title: 'Mombasa Coastal Escorts Guide: Nyali, Bamburi, Diani', category: 'Mombasa Escorts', tags: ['Mombasa', 'Nyali', 'Diani'] },
  { title: 'How Kenyan Escorts Verify Their Identity on Wet3Camp', category: 'Safety Tips', tags: ['verification', 'safety', 'Kenya'] },
  { title: 'Top 10 Safety Tips When Booking an Escort in Nairobi', category: 'Safety Tips', tags: ['safety', 'Nairobi', 'booking'] },
  { title: 'GFE Escorts in Nairobi: The Girlfriend Experience Guide', category: 'Kenya Escorts Guide', tags: ['GFE', 'girlfriend experience', 'Nairobi'] },
  { title: 'VIP vs Elite Escorts in Kenya: What Is the Difference?', category: 'Booking Tips', tags: ['VIP', 'Elite', 'tier comparison'] },
  { title: 'Escort Rates in Nairobi 2025: Full Price Guide', category: 'Booking Tips', tags: ['rates', 'prices', 'Nairobi 2025'] },
  { title: 'Nairobi Nightlife with Escorts: A Complete Guide', category: 'Nairobi Nightlife', tags: ['nightlife', 'Nairobi', 'companion'] },
  { title: 'Incall vs Outcall Escorts in Kenya: Which Is Better?', category: 'Booking Tips', tags: ['incall', 'outcall', 'Kenya'] },
  { title: 'Premium Escorts in Lavington & Parklands, Nairobi', category: 'Kenya Escorts Guide', tags: ['Lavington', 'Parklands', 'premium'] },
  { title: 'Escort Travel Companions for Kenya Safaris and Trips', category: 'Travel Escorts', tags: ['travel', 'safari', 'Kenya'] },
  { title: 'Kisumu Escort Scene: What You Need to Know in 2025', category: 'Kenya Escorts Guide', tags: ['Kisumu', 'escort guide', '2025'] },
  { title: 'How to Spot Fake Escort Profiles in Kenya', category: 'Safety Tips', tags: ['fake profiles', 'safety', 'verification'] },
  { title: 'Nakuru and Eldoret Escorts: Rift Valley Guide 2025', category: 'Kenya Escorts Guide', tags: ['Nakuru', 'Eldoret', 'Rift Valley'] },
  { title: 'Overnight Escort Bookings in Nairobi: Full Guide', category: 'Booking Tips', tags: ['overnight', 'Nairobi', 'booking guide'] },
  { title: 'BDSM and Specialty Escorts in Kenya: What to Expect', category: 'Kenya Escorts Guide', tags: ['BDSM', 'specialty', 'Kenya'] },
  { title: 'Massage Escort Services in Nairobi: Complete Guide', category: 'Kenya Escorts Guide', tags: ['massage', 'erotic massage', 'Nairobi'] },
  { title: 'Using WhatsApp to Book Escorts Safely in Kenya', category: 'Booking Tips', tags: ['WhatsApp', 'booking', 'safety'] },
  { title: 'Hotel Escort Meetups in Nairobi: Top Hotels Guide', category: 'Nairobi Nightlife', tags: ['hotel', 'Nairobi', 'meetup'] },
  { title: 'Elite Escort Experiences in Karen and Gigiri, Nairobi', category: 'Kenya Escorts Guide', tags: ['Karen', 'Gigiri', 'elite'] },
  { title: 'BBW Escorts in Kenya: Celebrating All Body Types', category: 'Kenya Escorts Guide', tags: ['BBW', 'body type', 'Kenya'] },
  { title: 'Why Wet3Camp Is Kenya\'s Most Trusted Escort Directory', category: 'Platform News', tags: ['Wet3Camp', 'verified', 'trusted'] },
]

// ── Generate a full blog post via OpenAI ────────────────────────────────────
async function generateBlogPost(topic: { title: string; category: string; tags: string[] }): Promise<{
  title: string; slug: string; excerpt: string; content: string;
  category: string; tags: string[]; seo_title: string; seo_description: string;
  read_time: number; image_url: string;
} | null> {
  const openai = getOpenAI()
  if (!openai) return null

  const prompt = `Write a comprehensive, SEO-rich blog post for an escort directory website serving Kenya.

Title: "${topic.title}"
Category: ${topic.category}
Target keywords: ${topic.tags.join(', ')}, escorts Kenya, Nairobi escorts, verified escorts Kenya

Requirements:
- Write in UK English
- 600-900 words of real, practical content
- Use Markdown: ## subheadings, **bold**, bullet lists
- First paragraph must hook the reader immediately
- Include practical tips, local area knowledge, and safety guidance
- Mention wet3.camp naturally 2-3 times as the best directory to use
- Include calls to action like "Browse verified escorts on Wet3Camp"
- SEO-focused: use target keywords naturally throughout
- Do NOT use explicit sexual content — keep it tasteful, professional, editorial

Respond with ONLY valid JSON (no markdown wrapper), this exact structure:
{
  "excerpt": "2-sentence summary under 160 chars",
  "content": "full markdown content here",
  "seo_title": "SEO page title under 65 chars",
  "seo_description": "meta description under 155 chars"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1800,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const wordCount = (parsed.content ?? '').split(/\s+/).length
    const readTime  = Math.max(2, Math.ceil(wordCount / 200))

    // Pick a stock photo from Unsplash matching the topic
    const unsplashQuery = topic.tags[0]?.replace(/\s+/g, '+') ?? 'Nairobi+city'
    const imageUrl = `https://images.unsplash.com/photo-${Date.now() % 3 === 0 ? '1611348586804-61bf6c080437' : Date.now() % 3 === 1 ? '1504214208698-ea1916a2195a' : '1573496359142-b8d87734a5a2'}?w=1200&h=630&fit=crop&q=${unsplashQuery}`

    return {
      title:           topic.title,
      slug:            slugify(topic.title),
      excerpt:         parsed.excerpt ?? '',
      content:         parsed.content ?? '',
      category:        topic.category,
      tags:            topic.tags,
      seo_title:       parsed.seo_title ?? topic.title,
      seo_description: parsed.seo_description ?? parsed.excerpt ?? '',
      read_time:       readTime,
      image_url:       imageUrl,
    }
  } catch (err: any) {
    console.error('[blog/generate] OpenAI error:', err?.message ?? err)
    return null
  }
}

// ── Scrape an external blog URL and rewrite with OpenAI ──────────────────────
async function scrapeAndRewrite(url: string): Promise<{
  title: string; slug: string; excerpt: string; content: string;
  category: string; tags: string[]; read_time: number; image_url: string;
  seo_title: string; seo_description: string; source_url: string;
} | null> {
  const openai = getOpenAI()
  if (!openai) return null

  try {
    // Fetch the page
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Wet3CampBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null

    const html = await res.text()

    // Strip HTML tags, extract visible text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{3,}/g, '\n\n')
      .trim()
      .slice(0, 4000)

    if (text.length < 200) return null

    const prompt = `You are an SEO content writer for an escort directory (wet3.camp) serving Kenya.

I've scraped the following text from an adult blog or escort story site. Rewrite it as a high-quality, SEO-friendly blog post for wet3.camp. 

Source text:
---
${text}
---

Requirements:
- Rewrite entirely in your own words (avoid copyright issues)
- Keep it tasteful and editorial (no explicit sexual content)
- 500-800 words
- Relevant to Kenya escorts, Nairobi nightlife, or escort industry
- Mention wet3.camp naturally 2-3 times
- Use Markdown formatting
- UK English

Respond with ONLY valid JSON:
{
  "title": "SEO blog post title",
  "excerpt": "2-sentence excerpt under 160 chars",
  "content": "full markdown content",
  "category": "one of: Safety Tips, Kenya Escorts Guide, Nairobi Nightlife, Mombasa Escorts, Booking Tips, Escort Reviews, Travel Escorts",
  "tags": ["tag1", "tag2", "tag3"],
  "seo_title": "SEO page title under 65 chars",
  "seo_description": "meta description under 155 chars"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.75,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const wordCount = (parsed.content ?? '').split(/\s+/).length
    const readTime  = Math.max(2, Math.ceil(wordCount / 200))

    return {
      title:           parsed.title ?? 'Escort Guide Kenya',
      slug:            slugify(parsed.title ?? 'escort-guide-kenya'),
      excerpt:         parsed.excerpt ?? '',
      content:         parsed.content ?? '',
      category:        parsed.category ?? 'Kenya Escorts Guide',
      tags:            parsed.tags ?? [],
      seo_title:       parsed.seo_title ?? parsed.title ?? '',
      seo_description: parsed.seo_description ?? parsed.excerpt ?? '',
      read_time:       readTime,
      image_url:       'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=630&fit=crop',
      source_url:      url,
    }
  } catch (err: any) {
    console.error('[blog/scrape] fetch/parse error:', err?.message ?? err)
    return null
  }
}

// ── Save post to DB ───────────────────────────────────────────────────────────
async function saveBlogPost(post: {
  title: string; slug: string; excerpt: string; content: string;
  category: string; tags: string[]; seo_title: string; seo_description: string;
  read_time: number; image_url: string; source_url?: string;
}): Promise<boolean> {
  const pool = getPool()
  if (!pool) return false
  try {
    await pool.query(
      `INSERT INTO blog_posts
         (slug, title, excerpt, content, category, tags, image_url, read_time,
          seo_title, seo_description, source_url, published, author, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Wet3Camp Editorial', NOW())
       ON DUPLICATE KEY UPDATE
         title = VALUES(title), excerpt = VALUES(excerpt), content = VALUES(content),
         image_url = VALUES(image_url), updated_at = NOW()`,
      [
        post.slug, post.title, post.excerpt, post.content,
        post.category, JSON.stringify(post.tags), post.image_url,
        post.read_time, post.seo_title, post.seo_description,
        post.source_url ?? null,
      ]
    )
    return true
  } catch (err: any) {
    console.error('[blog/save] DB error:', err?.message ?? err)
    return false
  }
}

// ── Auto-generate daily — runs on startup and every 24 hours ─────────────────
let _autoGenStarted = false
export function startBlogAutoGen() {
  if (_autoGenStarted) return
  _autoGenStarted = true

  const runGen = async () => {
    const pool = getPool()
    if (!pool) return
    try {
      // Count existing posts
      const [rows] = await pool.query<any[]>('SELECT COUNT(*) AS cnt FROM blog_posts WHERE published = 1')
      const count = Number((rows as any[])[0]?.cnt ?? 0)

      if (count >= 50) return // Cap at 50 AI posts to avoid runaway generation

      // Pick a topic not yet used (by checking slugs)
      const [slugRows] = await pool.query<any[]>('SELECT slug FROM blog_posts')
      const usedSlugs = new Set((slugRows as any[]).map((r: any) => r.slug))

      const unused = BLOG_TOPICS.filter(t => !usedSlugs.has(slugify(t.title)))
      if (unused.length === 0) return

      // Generate the first unused topic
      const topic = unused[0]
      console.log(`[blog/autogen] Generating post: "${topic.title}"`)
      const post = await generateBlogPost(topic)
      if (post) {
        const saved = await saveBlogPost(post)
        if (saved) console.log(`[blog/autogen] Saved: ${post.slug}`)
      }
    } catch (err: any) {
      console.error('[blog/autogen] error:', err?.message ?? err)
    }
  }

  // Run after 30s startup delay, then every 12 hours
  setTimeout(runGen, 30_000)
  setInterval(runGen, 12 * 60 * 60 * 1000)
}

// ── GET /api/blog ─────────────────────────────────────────────────────────────
router.get('/blog', async (req, res) => {
  const { category, q, limit = '20', offset = '0' } = req.query as Record<string, string>
  const lim = Math.min(parseInt(limit, 10) || 20, 50)
  const off = parseInt(offset, 10) || 0

  const pool = getPool()
  if (!pool) { res.json({ posts: [], total: 0 }); return }

  try {
    const conditions = ['published = 1']
    const params: any[] = []
    if (category && category !== 'All') {
      conditions.push('category = ?'); params.push(category)
    }
    if (q) {
      conditions.push('(title LIKE ? OR excerpt LIKE ? OR content LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }
    const where = conditions.join(' AND ')
    const [rows]  = await pool.query<any[]>(`SELECT id, slug, title, excerpt, category, tags, image_url, read_time, author, published_at, seo_title, seo_description FROM blog_posts WHERE ${where} ORDER BY published_at DESC LIMIT ? OFFSET ?`, [...params, lim, off])
    const [total] = await pool.query<any[]>(`SELECT COUNT(*) AS cnt FROM blog_posts WHERE ${where}`, params)

    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json({
      posts: (rows as any[]).map((r: any) => ({
        ...r,
        tags:      typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : (r.tags ?? []),
        imageUrl:  r.image_url,
        publishedAt: r.published_at,
      })),
      total: Number((total as any[])[0]?.cnt ?? 0),
    })
  } catch (err: any) {
    console.error('[GET /api/blog]', err?.message)
    res.json({ posts: [], total: 0 })
  }
})

// ── GET /api/blog/:slug ───────────────────────────────────────────────────────
router.get('/blog/:slug', async (req, res) => {
  const { slug } = req.params
  const pool = getPool()
  if (!pool) { res.status(404).json({ message: 'Not found' }); return }
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1',
      [slug]
    )
    const post = (rows as any[])[0]
    if (!post) { res.status(404).json({ message: 'Post not found' }); return }
    res.setHeader('Cache-Control', 'public, max-age=600')
    res.json({
      ...post,
      tags:      typeof post.tags === 'string' ? JSON.parse(post.tags || '[]') : (post.tags ?? []),
      imageUrl:  post.image_url,
      publishedAt: post.published_at,
      updatedAt:   post.updated_at,
    })
  } catch {
    res.status(404).json({ message: 'Not found' })
  }
})

// ── GET /api/admin/blog — list ALL posts (incl. drafts) for the admin UI ──────
router.get('/admin/blog', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.json({ posts: [] }); return }
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT id, slug, title, excerpt, category, tags, image_url, source_url, read_time, author,
              published, published_at, updated_at, seo_title, seo_description
       FROM blog_posts ORDER BY COALESCE(updated_at, published_at) DESC, id DESC LIMIT 500`
    )
    res.json({
      posts: (rows as any[]).map((r: any) => ({
        ...r,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : (r.tags ?? []),
        published: !!r.published,
      })),
    })
  } catch (err: any) {
    console.error('[GET /api/admin/blog]', err?.message)
    res.status(500).json({ posts: [], message: 'Failed to load posts' })
  }
})

// ── GET /api/admin/blog/:id — fetch one post (incl. draft) for editing ────────
router.get('/admin/blog/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(404).json({ message: 'Not found' }); return }
  try {
    const [rows] = await pool.query<any[]>('SELECT * FROM blog_posts WHERE id = ? LIMIT 1', [req.params.id])
    const post = (rows as any[])[0]
    if (!post) { res.status(404).json({ message: 'Post not found' }); return }
    res.json({ ...post, tags: typeof post.tags === 'string' ? JSON.parse(post.tags || '[]') : (post.tags ?? []), published: !!post.published })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to load post' })
  }
})

// ── POST /api/admin/blog — create a post authored via the admin editor ────────
router.post('/admin/blog', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'No DB' }); return }
  try {
    const b = req.body as Record<string, any>
    if (!b.title || !String(b.title).trim()) { res.status(400).json({ message: 'Title is required' }); return }

    const slug = slugify(b.slug || b.title)
    const wordCount = String(b.content ?? '').split(/\s+/).filter(Boolean).length
    const readTime = Math.max(2, Math.ceil(wordCount / 200))
    const published = !!b.published

    const [result] = await pool.query<any>(
      `INSERT INTO blog_posts
         (slug, title, excerpt, content, category, tags, image_url, read_time,
          seo_title, seo_description, author, published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug, b.title, b.excerpt ?? '', b.content ?? '', b.category ?? 'Kenya Escorts Guide',
        JSON.stringify(parseTags(b.tags)), b.imageUrl ?? b.image_url ?? '', readTime,
        b.seoTitle ?? b.title, b.seoDescription ?? b.excerpt ?? '',
        b.author ?? 'Wet3Camp Editorial', published ? 1 : 0,
        new Date(),
      ]
    )
    const id = (result as any)?.insertId

    if (published) {
      submitToIndexNow([blogPostUrl(slug)]).catch(() => {})
    }

    res.json({ success: true, id, slug })
  } catch (err: any) {
    console.error('[POST /api/admin/blog]', err?.message)
    res.status(500).json({ message: 'Failed to create post', detail: err?.message })
  }
})

// ── PUT /api/admin/blog/:id — update an existing post ──────────────────────────
async function updateAdminBlogPost(req: AuthRequest, res: any) {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'No DB' }); return }
  try {
    const { id } = req.params
    const b = req.body as Record<string, any>
    if (!b.title || !String(b.title).trim()) { res.status(400).json({ message: 'Title is required' }); return }

    const [existingRows] = await pool.query<any[]>('SELECT slug, published FROM blog_posts WHERE id = ? LIMIT 1', [id])
    const existing = (existingRows as any[])[0]
    if (!existing) { res.status(404).json({ message: 'Post not found' }); return }

    const slug = slugify(b.slug || b.title)
    const wordCount = String(b.content ?? '').split(/\s+/).filter(Boolean).length
    const readTime = Math.max(2, Math.ceil(wordCount / 200))
    const wasPublished = !!existing.published
    const nowPublished = !!b.published
    const justPublished = nowPublished && !wasPublished

    await pool.query(
      `UPDATE blog_posts SET
         slug = ?, title = ?, excerpt = ?, content = ?, category = ?, tags = ?,
         image_url = ?, read_time = ?, seo_title = ?, seo_description = ?,
         published = ?, published_at = ${justPublished ? 'NOW()' : 'published_at'},
         updated_at = NOW()
       WHERE id = ?`,
      [
        slug, b.title, b.excerpt ?? '', b.content ?? '', b.category ?? 'Kenya Escorts Guide',
        JSON.stringify(parseTags(b.tags)), b.imageUrl ?? b.image_url ?? '', readTime,
        b.seoTitle ?? b.title, b.seoDescription ?? b.excerpt ?? '', nowPublished ? 1 : 0, id,
      ]
    )

    if (nowPublished) {
      submitToIndexNow([blogPostUrl(slug)]).catch(() => {})
    }

    res.json({ success: true, id, slug })
  } catch (err: any) {
    console.error('[PUT /api/admin/blog/:id]', err?.message)
    res.status(500).json({ message: 'Failed to update post', detail: err?.message })
  }
}

router.put('/admin/blog/:id', requireAuth, requireAdmin, updateAdminBlogPost)
router.post('/admin/blog/:id/update', requireAuth, requireAdmin, updateAdminBlogPost)

// ── PATCH /api/admin/blog/:id/publish — toggle publish state quickly ──────────
async function setAdminBlogPublishState(req: AuthRequest, res: any) {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'No DB' }); return }
  try {
    const { id } = req.params
    const { published } = req.body as { published?: unknown }
    if (typeof published !== 'boolean') {
      res.status(400).json({ message: 'A published boolean is required' })
      return
    }
    const [rows] = await pool.query<any[]>('SELECT slug, published, published_at FROM blog_posts WHERE id = ? LIMIT 1', [id])
    const post = (rows as any[])[0]
    if (!post) { res.status(404).json({ message: 'Post not found' }); return }

    await pool.query(
      `UPDATE blog_posts SET published = ?, published_at = ${!post.published_at && published ? 'NOW()' : 'published_at'}, updated_at = NOW() WHERE id = ?`,
      [published ? 1 : 0, id]
    )

    if (published && !post.published) submitToIndexNow([blogPostUrl(post.slug)]).catch(() => {})
    res.json({ success: true, published })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to toggle publish state' })
  }
}

router.patch('/admin/blog/:id/publish', requireAuth, requireAdmin, setAdminBlogPublishState)
router.post('/admin/blog/:id/publish', requireAuth, requireAdmin, setAdminBlogPublishState)

// ── DELETE /api/admin/blog/:id ──────────────────────────────────────────────────
async function deleteAdminBlogPost(req: AuthRequest, res: any) {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'No DB' }); return }
  try {
    await pool.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete post' })
  }
}

router.delete('/admin/blog/:id', requireAuth, requireAdmin, deleteAdminBlogPost)
router.post('/admin/blog/:id/delete', requireAuth, requireAdmin, deleteAdminBlogPost)

// ── POST /api/admin/blog/generate — manually trigger AI post generation ───────
router.post('/admin/blog/generate', requireAuth, requireAdmin, async (req, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'No DB' }); return }

  const { topic_index } = req.body as { topic_index?: number }
  const idx = typeof topic_index === 'number' ? topic_index % BLOG_TOPICS.length : Math.floor(Math.random() * BLOG_TOPICS.length)
  const topic = BLOG_TOPICS[idx]

  const post = await generateBlogPost(topic)
  if (!post) { res.status(500).json({ message: 'AI generation failed — check OPENAI_API_KEY' }); return }

  const saved = await saveBlogPost(post)
  res.json({ success: saved, slug: post.slug, title: post.title })
})

// ── POST /api/admin/blog/scrape — scrape + rewrite a URL ─────────────────────
router.post('/admin/blog/scrape', requireAuth, requireAdmin, async (req, res) => {
  const { url } = req.body as { url?: string }
  if (!url) { res.status(400).json({ message: 'url required' }); return }

  const post = await scrapeAndRewrite(url)
  if (!post) { res.status(500).json({ message: 'Scrape/rewrite failed' }); return }

  const saved = await saveBlogPost(post)
  res.json({ success: saved, slug: post.slug, title: post.title })
})

// ── POST /api/admin/blog/import-sources — import drafts from approved sites ──
router.post('/admin/blog/import-sources', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  if (!getPool()) { res.status(503).json({ message: 'No DB' }); return }
  const sourceId = String(req.body?.sourceId || 'all')
  if (sourceId !== 'all' && !BLOG_IMPORT_SOURCES.some((source) => source.id === sourceId)) {
    res.status(400).json({ message: 'Unknown approved blog source' }); return
  }
  if (activeBlogImportJobId) {
    const activeJob = blogImportJobs.get(activeBlogImportJobId)
    if (activeJob?.status === 'running') {
      res.status(409).json({ message: 'A blog import is already running', jobId: activeJob.jobId }); return
    }
  }

  const job: BlogImportJob = {
    jobId: randomUUID(),
    status: 'running',
    startedAt: new Date().toISOString(),
    imported: 0,
    skipped: 0,
    sources: [],
  }
  blogImportJobs.set(job.jobId, job)
  activeBlogImportJobId = job.jobId

  void runBlogSourceImport(job, sourceId)
    .then(() => { job.status = 'complete' })
    .catch((error) => {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message.slice(0, 200) : 'Blog import failed'
      console.error('[blog/import-sources]', error)
    })
    .finally(() => {
      job.completedAt = new Date().toISOString()
      if (activeBlogImportJobId === job.jobId) activeBlogImportJobId = null
      if (blogImportJobs.size > 20) {
        const oldestCompleted = [...blogImportJobs.values()]
          .filter((candidate) => candidate.status !== 'running')
          .sort((a, b) => a.startedAt.localeCompare(b.startedAt))[0]
        if (oldestCompleted) blogImportJobs.delete(oldestCompleted.jobId)
      }
    })

  res.status(202).json(serializeBlogImportJob(job))
})

// ── GET /api/admin/blog/import-sources/:jobId — poll an import job ───────────
router.get('/admin/blog/import-sources/:jobId', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const job = blogImportJobs.get(String(req.params.jobId))
  if (!job) { res.status(404).json({ message: 'Blog import job not found' }); return }
  res.json(serializeBlogImportJob(job))
})

// ── POST /api/admin/blog/bulk-generate — generate multiple posts ──────────────
router.post('/admin/blog/bulk-generate', requireAuth, requireAdmin, async (req, res) => {
  const { count = 5 } = req.body as { count?: number }
  const n = Math.min(Number(count) || 5, 25)

  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'No DB' }); return }

  const [slugRows] = await pool.query<any[]>('SELECT slug FROM blog_posts')
  const usedSlugs = new Set((slugRows as any[]).map((r: any) => r.slug))
  const unused = BLOG_TOPICS.filter(t => !usedSlugs.has(slugify(t.title)))

  const results: { slug: string; title: string; saved: boolean }[] = []
  for (let i = 0; i < Math.min(n, unused.length); i++) {
    const post = await generateBlogPost(unused[i])
    if (post) {
      const saved = await saveBlogPost(post)
      results.push({ slug: post.slug, title: post.title, saved })
    }
    // Small delay to avoid rate limits
    if (i < Math.min(n, unused.length) - 1) await new Promise(r => setTimeout(r, 1500))
  }

  res.json({ generated: results.length, results })
})

export default router
