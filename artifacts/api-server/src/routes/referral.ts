import { Router } from 'express'
import { getPool } from '../lib/db.js'
import { requireAuth } from '../middlewares/requireAuth.js'

const router = Router()

// Generate a short unique referral code
function makeCode(userId: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `W3-${suffix}`
}

// GET /api/referral/my — get (or create) the caller's referral code + summary stats
router.get('/api/referral/my', requireAuth, async (req: any, res) => {
  const pool = getPool()
  if (!pool) return res.status(503).json({ error: 'DB unavailable' })
  const userId = req.user.id

  try {
    let [rows] = await pool.query<any[]>(
      'SELECT `id`, `code`, `created_at` FROM `referrals` WHERE `user_id` = ? AND `referred_user_id` IS NULL LIMIT 1',
      [userId]
    )
    let myRow = (rows as any[])[0]

    if (!myRow) {
      let code = makeCode(userId)
      // Retry on collision
      for (let i = 0; i < 5; i++) {
        try {
          await pool.query(
            'INSERT INTO `referrals` (`user_id`, `code`) VALUES (?, ?)',
            [userId, code]
          )
          break
        } catch {
          code = makeCode(userId)
        }
      }
      ;[rows] = await pool.query<any[]>(
        'SELECT `id`, `code`, `created_at` FROM `referrals` WHERE `user_id` = ? AND `referred_user_id` IS NULL LIMIT 1',
        [userId]
      )
      myRow = (rows as any[])[0]
    }

    // Stats
    const [statsRows] = await pool.query<any[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
         SUM(CASE WHEN status = 'confirmed' THEN reward_kes ELSE 0 END) AS earned_kes
       FROM \`referrals\`
       WHERE \`user_id\` = ? AND \`referred_user_id\` IS NOT NULL`,
      [userId]
    )
    const stats = (statsRows as any[])[0] ?? { total: 0, confirmed: 0, earned_kes: 0 }

    const siteUrl = process.env['SITE_URL'] ?? 'https://wet3.camp'
    res.json({
      code: myRow?.code ?? '',
      link: `${siteUrl}/join?ref=${myRow?.code ?? ''}`,
      total_referrals: Number(stats.total ?? 0),
      confirmed_referrals: Number(stats.confirmed ?? 0),
      earned_kes: Number(stats.earned_kes ?? 0),
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load referral info' })
  }
})

// GET /api/referral/history — list referrals made by this user
router.get('/api/referral/history', requireAuth, async (req: any, res) => {
  const pool = getPool()
  if (!pool) return res.status(503).json({ error: 'DB unavailable' })
  const userId = req.user.id

  try {
    const [rows] = await pool.query<any[]>(
      `SELECT r.id, r.status, r.reward_kes, r.created_at, r.converted_at,
              u.display_name AS referred_name, u.email AS referred_email
       FROM \`referrals\` r
       LEFT JOIN \`users\` u ON u.id = r.referred_user_id
       WHERE r.user_id = ? AND r.referred_user_id IS NOT NULL
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [userId]
    )
    res.json({ referrals: rows as any[] })
  } catch {
    res.status(500).json({ error: 'Failed to load history' })
  }
})

// POST /api/referral/convert — called during registration when ?ref=CODE is present
// Body: { code: string, referred_user_id: number }
router.post('/api/referral/convert', async (req: any, res) => {
  const pool = getPool()
  if (!pool) return res.status(503).json({ error: 'DB unavailable' })
  const { code, referred_user_id } = req.body ?? {}
  if (!code || !referred_user_id) return res.status(400).json({ error: 'code and referred_user_id required' })

  try {
    // Find the master referral record (the one without a referred_user_id)
    const [rows] = await pool.query<any[]>(
      'SELECT `id`, `user_id` FROM `referrals` WHERE `code` = ? AND `referred_user_id` IS NULL LIMIT 1',
      [code]
    )
    const master = (rows as any[])[0]
    if (!master) return res.status(404).json({ error: 'Invalid or expired referral code' })

    // Don't let someone refer themselves
    if (master.user_id === Number(referred_user_id)) {
      return res.status(400).json({ error: 'Cannot refer yourself' })
    }

    // Check if this user was already referred
    const [existing] = await pool.query<any[]>(
      'SELECT id FROM `referrals` WHERE `referred_user_id` = ? LIMIT 1',
      [referred_user_id]
    )
    if ((existing as any[]).length > 0) {
      return res.status(409).json({ error: 'User already referred' })
    }

    // Create conversion record
    await pool.query(
      `INSERT INTO \`referrals\` (\`user_id\`, \`code\`, \`referred_user_id\`, \`type\`, \`reward_kes\`, \`status\`, \`converted_at\`)
       VALUES (?, ?, ?, 'registration', 500, 'confirmed', NOW())`,
      [master.user_id, code, referred_user_id]
    )

    // Send a notification to the referrer
    try {
      await pool.query(
        `INSERT INTO \`notifications\` (\`user_id\`, \`type\`, \`title\`, \`text\`, \`link\`, \`dot\`)
         VALUES (?, 'referral', 'New Referral!', 'Someone just joined using your referral link. KES 500 credit added!', '/referral', '#28a745')`,
        [master.user_id]
      )
    } catch { /* notifications are optional */ }

    res.json({ ok: true, referrer_user_id: master.user_id, reward_kes: 500 })
  } catch (err) {
    res.status(500).json({ error: 'Failed to process referral' })
  }
})

export default router
