import { Router } from 'express'
import { getPool } from '../lib/db.js'

const router = Router()

// ── Helper ────────────────────────────────────────────────────────────────────
const slugOf = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function mapEscort(row: any) {
  return {
    ...row,
    id:        String(row.id),
    available: !!row.available,
    verified:  !!row.verified,
    online:    !!row.online,
    featured:  !!row.featured,
    gender:    row.gender ?? 'Female',
    instagram: row.instagram ?? null,
    facebook:  row.facebook ?? null,
    // Pricing object for the frontend
    pricing: {
      incall:          Number(row.price_incall  || row.price_hourly    || 0),
      outcall:         Number(row.price_outcall || Math.round((row.price_hourly || 0) * 1.2) || 0),
      incallOvernight: Number(row.price_incall_overnight || row.price_overnight || 0),
      outcallOvernight:Number(row.price_outcall_overnight || Math.round((row.price_overnight || 0) * 1.2) || 0),
      video:           Number(row.price_video   || 0),
      hourly:          Number(row.price_hourly  || 0),
      overnight:       Number(row.price_overnight || 0),
    },
    languages: Array.isArray(row.languages) ? row.languages
               : row.languages_csv ? row.languages_csv.split(',').filter(Boolean)
               : [],
  }
}

// ── GET /services/popular ─────────────────────────────────────────────────────
router.get('/services/popular', async (_req, res) => {
  const pool = getPool()
  if (!pool) { res.json([]); return }
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT es.name, COUNT(*) AS cnt
       FROM escort_services es
       JOIN escorts e ON e.id = es.escort_id AND e.is_active = 1
       GROUP BY es.name
       ORDER BY cnt DESC
       LIMIT 20`
    )
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.json((rows as any[]).map((r: any) => ({ name: r.name, count: Number(r.cnt) })))
  } catch {
    res.json([])
  }
})

// ── GET /escorts ──────────────────────────────────────────────────────────────
router.get('/escorts', async (req, res) => {
  try {
    const {
      city, tier, available, featured, online,
      limit = '100', offset = '0', sort = 'featured',
      q, service, gender,
    } = req.query as Record<string, string>

    const lim = Math.min(parseInt(limit, 10) || 100, 200)
    const off = parseInt(offset, 10) || 0

    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const conditions: string[] = ['e.is_active = 1']
    const params: unknown[] = []

    // Hierarchical city→area lookup: filtering by "Nairobi" also matches Kilimani, Westlands, etc.
    const CITY_AREAS: Record<string, string[]> = {
      nairobi: ['nairobi','nairobi cbd','westlands','karen','kilimani','lavington','parklands','upperhill','langata','south b','south c','gigiri','runda','eastleigh','embakasi','ngong road','thika road','nairobi west','kasarani','ruaka','kileleshwa','hurlingham','spring valley','loresho','muthaiga','ridgeways','roysambu','zimmerman','ruaraka','buru buru','mwiki','outering','juja','ongata rongai','kitengela','syokimau','utawala','kahawa','kariobangi','mathare','kayole','dandora','githurai','clay city','kahawa west','kamiti road'],
      mombasa: ['mombasa','mombasa cbd','nyali','bamburi','diani','mtwapa','likoni','kisauni','shanzu','malindi','watamu','kilifi'],
      kisumu: ['kisumu','kisumu cbd','milimani','kondele','mamboleo','nyalenda','kolwa','riat','airport'],
      nakuru: ['nakuru','nakuru cbd','milimani nakuru','lanet','section 58','bahati','bondeni','free area'],
      eldoret: ['eldoret','eldoret cbd','elgon view','kipkorir','huruma','kapsabet'],
    }

    if (city) {
      const key = city.toLowerCase()
      const areas = CITY_AREAS[key]
      if (areas && areas.length) {
        const placeholders = areas.map(() => '?').join(', ')
        conditions.push(`LOWER(e.city) IN (${placeholders})`)
        params.push(...areas)
      } else {
        // Worldwide fallback: match city OR area with LIKE so "London" matches "London West" etc.
        conditions.push('(LOWER(e.city) LIKE LOWER(?) OR LOWER(e.area) LIKE LOWER(?))')
        params.push(`%${city}%`, `%${city}%`)
      }
    }
    if (tier)      { conditions.push('LOWER(e.tier) = LOWER(?)'); params.push(tier) }
    if (available) { conditions.push('e.available = 1') }
    if (featured)  { conditions.push('e.featured = 1') }
    if (online)    { conditions.push('e.online = 1') }
    if (gender)    { conditions.push('LOWER(e.gender) = LOWER(?)'); params.push(gender) }
    if (service)   {
      conditions.push('EXISTS (SELECT 1 FROM escort_services es WHERE es.escort_id = e.id AND LOWER(es.name) LIKE LOWER(?) AND es.available = 1)')
      params.push(`%${service}%`)
    }
    if (q)         { conditions.push('(e.name LIKE ? OR e.area LIKE ? OR e.bio LIKE ? OR EXISTS (SELECT 1 FROM escort_services es2 WHERE es2.escort_id = e.id AND LOWER(es2.name) LIKE LOWER(?)))'); params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`) }

    const where = conditions.join(' AND ')
    const orderBy = sort === 'featured'
      ? `e.featured DESC, FIELD(e.tier,'elite','vip','premium','standard','free'), e.rating DESC, e.id DESC`
      : sort === 'rating'   ? 'e.rating DESC, e.id DESC'
      : sort === 'price_asc'? 'e.price_incall ASC, e.id DESC'
      : sort === 'newest'   ? 'e.created_at DESC'
      : 'e.id DESC'

    const [rows] = await pool.query<any[]>(
      `SELECT e.*, GROUP_CONCAT(DISTINCT el.language ORDER BY el.language SEPARATOR ',') AS languages_csv
       FROM escorts e
       LEFT JOIN escort_languages el ON el.escort_id = e.id
       WHERE ${where}
       GROUP BY e.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, lim, off]
    )

    const [[{ total }]]       = await pool.query<any[]>(`SELECT COUNT(*) AS total FROM escorts e WHERE ${where}`, params)
    const [[{ verified }]]    = await pool.query<any[]>(`SELECT COUNT(*) AS verified FROM escorts e WHERE e.is_active=1 AND e.verified=1`)
    const [[{ online_count }]]= await pool.query<any[]>(`SELECT COUNT(*) AS online_count FROM escorts e WHERE e.is_active=1 AND e.online=1`)
    const [[{ cities }]]      = await pool.query<any[]>(`SELECT COUNT(DISTINCT city) AS cities FROM escorts WHERE is_active=1`)

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
    res.json({
      data:  rows.map(mapEscort),
      total: Number(total ?? 0),
      meta: {
        total:    Number(total ?? 0),
        verified: Number(verified ?? 0),
        online:   Number(online_count ?? 0),
        cities:   Number(cities ?? 12),
      }
    })
  } catch (err) {
    console.error('[escorts] list error:', err)
    res.status(500).json({ message: 'Failed to fetch escorts' })
  }
})

// ── GET /escorts/search ───────────────────────────────────────────────────────
router.get('/escorts/search', async (req, res) => {
  const q = (req.query.q as string ?? '').trim()
  if (q.length < 2) { res.json([]); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
  try {
    const [rows] = await pool.query<any[]>(
      `SELECT id, name, city, area, image, tier, verified, featured
       FROM escorts
       WHERE (name LIKE ? OR area LIKE ? OR city LIKE ?) AND is_active = 1
       ORDER BY featured DESC, rating DESC
       LIMIT 10`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    )
    res.json(rows.map((e: any) => ({
      id: String(e.id), name: e.name, city: e.city, area: e.area,
      image: e.image, tier: e.tier, verified: !!e.verified, featured: !!e.featured,
    })))
  } catch {
    res.status(500).json({ message: 'Search failed' })
  }
})

// ── GET /escorts/stats ────────────────────────────────────────────────────────
router.get('/escorts/stats', async (_req, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'No DB', code: 'NO_DB' }); return }
  try {
    const [[{ total }]]        = await pool.query<any[]>(`SELECT COUNT(*) AS total FROM escorts WHERE is_active=1`)
    const [[{ verified }]]     = await pool.query<any[]>(`SELECT COUNT(*) AS verified FROM escorts WHERE is_active=1 AND verified=1`)
    const [[{ online_count }]] = await pool.query<any[]>(`SELECT COUNT(*) AS online_count FROM escorts WHERE is_active=1 AND online=1`)
    const [[{ cities }]]       = await pool.query<any[]>(`SELECT COUNT(DISTINCT city) AS cities FROM escorts WHERE is_active=1`)
    const [cityRows]           = await pool.query<any[]>(`SELECT city, COUNT(*) AS cnt FROM escorts WHERE is_active=1 GROUP BY city ORDER BY cnt DESC`)
    res.setHeader('Cache-Control', 'public, max-age=120')
    res.json({
      total: Number(total ?? 0),
      verified: Number(verified ?? 0),
      online: Number(online_count ?? 0),
      cities: Number(cities ?? 0),
      byCity: cityRows.map((r: any) => ({ city: r.city, count: Number(r.cnt) })),
    })
  } catch {
    res.status(500).json({ message: 'Stats error' })
  }
})

// ── GET /escorts/:id ──────────────────────────────────────────────────────────
router.get('/escorts/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    let row: any = null

    if (/^\d+$/.test(id)) {
      const [[byId]] = await pool.query<any[]>('SELECT * FROM escorts WHERE id = ? AND is_active = 1', [id])
      row = byId ?? null
    }

    if (!row) {
      const [[byUsername]] = await pool.query<any[]>(
        'SELECT e.* FROM escorts e JOIN users u ON u.id = e.user_id WHERE u.username = ? AND e.is_active = 1 LIMIT 1',
        [id]
      ).catch(() => [[null]])
      row = byUsername ?? null
    }

    if (!row) {
      const [allEscorts] = await pool.query<any[]>('SELECT * FROM escorts WHERE is_active = 1 LIMIT 2000')
      row = (allEscorts as any[]).find(r => slugOf(r.name) === id.toLowerCase()) ?? null
    }

    if (!row) return res.status(404).json({ message: 'Escort not found' })

    const escortId = String(row.id)
    const [gallery]   = await pool.query<any[]>('SELECT image_url FROM escort_gallery WHERE escort_id = ? ORDER BY sort_order', [escortId])
    const [services]  = await pool.query<any[]>('SELECT name, MAX(available) AS available FROM escort_services WHERE escort_id = ? GROUP BY name ORDER BY name', [escortId])
    const [languages] = await pool.query<any[]>('SELECT DISTINCT language FROM escort_languages WHERE escort_id = ?', [escortId])

    const [[followerRow]] = await pool.query<any[]>(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE escort_id = ?',
      [escortId]
    ).catch(() => [[{ cnt: 0 }]])

    const [[reviewRow]] = await pool.query<any[]>(
      'SELECT COUNT(*) AS cnt, AVG(rating) AS avg FROM reviews WHERE escort_id = ? AND is_visible = 1',
      [escortId]
    ).catch(() => [[{ cnt: 0, avg: 0 }]])

    const [recentReviews] = await pool.query<any[]>(
      `SELECT r.*, u.display_name AS reviewer_name, u.username AS reviewer_username
       FROM reviews r LEFT JOIN users u ON u.id = r.user_id
       WHERE r.escort_id = ? AND r.is_visible = 1
       ORDER BY r.created_at DESC LIMIT 10`,
      [escortId]
    ).catch(() => [[]])

    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
    res.json({
      ...mapEscort({
        ...row,
        languages_csv: languages.map((l: any) => l.language).join(','),
      }),
      follower_count: Number((followerRow as any)?.cnt ?? 0),
      reviews_count:  Number((reviewRow as any)?.cnt ?? row.reviews_count ?? 0),
      rating:         Number((reviewRow as any)?.avg ?? row.rating ?? 0) || Number(row.rating ?? 0),
      gallery:        (gallery as any[]).map((g: any) => g.image_url),
      services:       (services as any[]).map((s: any) => ({ name: s.name, available: !!s.available })),
      reviews:        (recentReviews as any[]).map((r: any) => ({
        id: r.id, rating: r.rating, content: r.content,
        reviewer: r.reviewer_name || r.reviewer_username || 'Anonymous',
        created_at: r.created_at,
      })),
    })
  } catch (err) {
    console.error('[escorts] profile error:', err)
    res.status(500).json({ message: 'Failed to fetch escort' })
  }
})

// ── POST /escorts/:id/claim ───────────────────────────────────────────────────
router.post('/escorts/:id/claim', async (req, res) => {
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'No DB' }); return }
  try {
    const escortId = req.params.id
    const userId = (req as any).user?.id ?? null
    if (!userId) { res.status(401).json({ message: 'Login required' }); return }
    await pool.query(
      `INSERT INTO claims (escort_id, user_id, status, message) VALUES (?, ?, 'pending', ?) ON DUPLICATE KEY UPDATE status='pending'`,
      [escortId, userId, req.body?.message ?? '']
    ).catch(() => {})
    res.json({ message: 'Claim submitted successfully' })
  } catch {
    res.status(500).json({ message: 'Claim failed' })
  }
})

export default router
