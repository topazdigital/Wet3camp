import { Router } from 'express'
import { getPool } from '../lib/db.js'

const router = Router()

router.get('/escorts', async (req, res) => {
  try {
    const { city, tier, available, featured, limit = '100', offset = '0', sort = 'featured' } = req.query as Record<string, string>
    const lim = Math.min(parseInt(limit, 10) || 100, 200)
    const off = parseInt(offset, 10) || 0

    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    const conditions: string[] = ['e.is_active = 1']
    const params: unknown[] = []
    if (city)      { conditions.push('e.city = ?');     params.push(city) }
    if (tier)      { conditions.push('e.tier = ?');     params.push(tier) }
    if (available) { conditions.push('e.available = 1') }
    if (featured)  { conditions.push('e.featured = 1') }

    const where = conditions.join(' AND ')
    const orderBy = sort === 'featured'
      ? `e.featured DESC, FIELD(e.tier,'elite','vip','premium','standard','free'), e.rating DESC, e.id DESC`
      : sort === 'rating' ? 'e.rating DESC, e.id DESC' : 'e.id DESC'

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
    const [[{ total }]] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM escorts e WHERE ${where}`,
      params
    )

    const data = rows.map(row => ({
      ...row,
      id:        String(row.id),
      available: !!row.available,
      verified:  !!row.verified,
      online:    !!row.online,
      featured:  !!row.featured,
      languages: row.languages_csv ? row.languages_csv.split(',') : [],
    }))

    res.json({ data, total: total ?? 0 })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch escorts' })
  }
})

router.get('/escorts/search', async (req, res) => {
  const q = (req.query.q as string ?? '').trim()
  if (q.length < 2) { res.json([]); return }
  const pool = getPool()
  if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }
  try {
    const [rows] = await pool.query<any[]>(
      'SELECT id, name, city, area, image, tier, verified FROM escorts WHERE name LIKE ? AND is_active = 1 LIMIT 8',
      [`%${q}%`]
    )
    res.json(rows.map((e: any) => ({
      id: String(e.id), name: e.name, city: e.city, area: e.area,
      image: e.image, tier: e.tier, verified: !!e.verified,
    })))
  } catch {
    res.status(500).json({ message: 'Search failed' })
  }
})

const slugOf = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

router.get('/escorts/:id', async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    if (!pool) { res.status(503).json({ message: 'Database not configured', code: 'NO_DB' }); return }

    let row: any = null

    if (/^\d+$/.test(id)) {
      const [[byId]] = await pool.query<any[]>('SELECT * FROM escorts WHERE id = ?', [id])
      row = byId ?? null
    }

    if (!row) {
      const [[byUsername]] = await pool.query<any[]>(
        'SELECT e.* FROM escorts e JOIN users u ON u.id = e.user_id WHERE u.username = ? LIMIT 1',
        [id]
      ).catch(() => [[null]])
      row = byUsername ?? null
    }

    if (!row) {
      const [allEscorts] = await pool.query<any[]>('SELECT * FROM escorts LIMIT 2000')
      row = (allEscorts as any[]).find(r => slugOf(r.name) === id.toLowerCase()) ?? null
    }

    if (!row) return res.status(404).json({ message: 'Escort not found' })

    const escortId = String(row.id)
    const [gallery]   = await pool.query<any[]>('SELECT image_url FROM escort_gallery WHERE escort_id = ? ORDER BY sort_order', [escortId])
    const [services]  = await pool.query<any[]>('SELECT name, available FROM escort_services WHERE escort_id = ?', [escortId])
    const [languages] = await pool.query<any[]>('SELECT language FROM escort_languages WHERE escort_id = ?', [escortId])

    const [[followerRow]] = await pool.query<any[]>(
      'SELECT COUNT(*) AS cnt FROM user_follows WHERE escort_id = ?',
      [escortId]
    ).catch(() => [[{ cnt: 0 }]])

    res.json({
      ...row,
      id:             escortId,
      available:      !!row.available,
      verified:       !!row.verified,
      online:         !!row.online,
      featured:       !!row.featured,
      follower_count: Number((followerRow as any)?.cnt ?? 0),
      gallery:        gallery.map((g: any) => g.image_url),
      services:       services.map((s: any) => ({ name: s.name, available: !!s.available })),
      languages:      languages.map((l: any) => l.language),
    })
  } catch {
    res.status(500).json({ message: 'Failed to fetch escort' })
  }
})

export default router
