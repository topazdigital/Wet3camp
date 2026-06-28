/**
 * Adult Toys Shop Scraper
 * Scrapes adult product listings from public e-commerce sites and populates
 * the shop_products table in the database.
 *
 * Usage:
 *   node scrape-shop.mjs
 *
 * Set DATABASE_URL or DB_* env vars before running.
 *
 * Sources:
 *   - Jumia Kenya adult/lingerie section (public HTML)
 *   - Category mapping: Lingerie, Toys, Wellness, Accessories
 */

import pg from 'pg'
const { Pool } = pg

// ── DB setup ──────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function query(sql, params = []) {
  const client = await pool.connect()
  try { return client.query(sql, params) } finally { client.release() }
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS shop_products (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(300) NOT NULL,
      description TEXT,
      price       INTEGER      NOT NULL DEFAULT 0,
      image       VARCHAR(500),
      category    VARCHAR(100) NOT NULL DEFAULT 'General',
      brand       VARCHAR(100),
      rating      DECIMAL(2,1) DEFAULT 0,
      in_stock    SMALLINT     NOT NULL DEFAULT 1,
      is_active   SMALLINT     NOT NULL DEFAULT 1,
      source_url  VARCHAR(500),
      created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `)
  console.log('[db] Table shop_products ready')
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
  return res.text()
}

function extractPrice(text) {
  const m = text.replace(/,/g, '').match(/[\d]+(\.\d{1,2})?/)
  return m ? Math.round(parseFloat(m[0])) : 0
}

// ── Jumia Kenya scraper ───────────────────────────────────────────────────────
async function scrapeJumiaCategory(path, category) {
  const url = `https://www.jumia.co.ke${path}`
  console.log(`[jumia] Scraping ${url}`)
  const html = await fetchHtml(url)
  const products = []

  const articleReg = /<article[^>]*class="[^"]*prd[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
  let match
  while ((match = articleReg.exec(html)) !== null) {
    const block = match[1]

    const nameM = block.match(/data-name="([^"]+)"/) || block.match(/class="name"[^>]*>([^<]+)</)
    const priceM = block.match(/data-price="([^"]+)"/) || block.match(/class="prc"[^>]*>([^<]+)</)
    const imgM   = block.match(/data-image="([^"]+)"/) || block.match(/<img[^>]+data-src="([^"]+)"/) || block.match(/<img[^>]+src="([^"]+jumia[^"]+)"/)
    const linkM  = block.match(/href="(\/[^"]+)"/)
    const rateM  = block.match(/data-rate="([^"]+)"/)

    const name = nameM ? nameM[1].trim() : null
    if (!name) continue

    const rawPrice = priceM ? extractPrice(priceM[1]) : 0
    const price = rawPrice > 0 ? rawPrice : 0

    products.push({
      name: name.slice(0, 280),
      description: `${name} — available in Kenya. Discreet packaging.`,
      price,
      image: imgM ? imgM[1] : null,
      category,
      rating: rateM ? parseFloat(rateM[1]).toFixed(1) : null,
      source_url: linkM ? `https://www.jumia.co.ke${linkM[1]}` : url,
    })
  }
  return products
}

// ── Hardcoded seed products as fallback ───────────────────────────────────────
// Real products with realistic Kenyan pricing. Used when scraping is unavailable.
const SEED_PRODUCTS = [
  { name: 'Red Lace Lingerie Set — Push-Up Bra & Thong', description: 'Sexy lace bra and matching thong in red. Available in sizes S–XL. Discreet packaging guaranteed.', price: 1200, category: 'Lingerie', image: 'https://images.unsplash.com/photo-1617551307578-6b8c8dae8c30?w=400&q=80' },
  { name: 'Black Satin Corset Bodysuit', description: 'Elegant satin corset with adjustable lacing. Perfect for bedroom play. Available S–XXL.', price: 2500, category: 'Lingerie', image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&q=80' },
  { name: 'Sheer Babydoll Negligee — White', description: 'Sheer mesh babydoll with matching panty. Soft, delicate fabric. Ships discreetly.', price: 1800, category: 'Lingerie', image: 'https://images.unsplash.com/photo-1585565804112-f201f68c48b4?w=400&q=80' },
  { name: 'Wireless Mini Bullet Vibrator', description: 'Compact and powerful vibrator with 10 vibration modes. USB rechargeable. Waterproof.', price: 3500, category: 'Toys', image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&q=80' },
  { name: 'Silicone Couples Vibrating Ring', description: 'Stretchy couples ring with built-in vibration. Enhances pleasure for both partners. Rechargeable.', price: 2800, category: 'Toys', image: 'https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=400&q=80' },
  { name: 'Warming Massage Oil — Rose Scent 100ml', description: 'Premium warming massage oil with rose fragrance. Body-safe, non-greasy formula.', price: 950, category: 'Wellness', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80' },
  { name: 'Lavender Massage Candle 150g', description: 'Dual-purpose massage candle — burns as a candle, melts into massage oil. Lavender scent.', price: 1100, category: 'Wellness', image: 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=400&q=80' },
  { name: 'Satin Blindfold & Restraint Set', description: 'Soft satin blindfold with matching wrist cuffs. Beginners bondage set. Easy-release design.', price: 1650, category: 'Accessories', image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80' },
  { name: 'Feather Tickler — Red & Black', description: 'Soft ostrich feather tickler on a faux leather handle. 35cm length. Great for foreplay.', price: 850, category: 'Accessories', image: 'https://images.unsplash.com/photo-1563208723-68eb3f54a3bc?w=400&q=80' },
  { name: 'Personal Water-Based Lubricant 200ml', description: 'Premium water-based lubricant. Compatible with all toy materials and condoms. Fragrance-free.', price: 750, category: 'Wellness', image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80' },
  { name: 'Naughty Dice Game Set (2 dice)', description: 'Couple naughty dice game. Two dice — one for actions, one for body parts. Hours of fun!', price: 600, category: 'Accessories', image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&q=80' },
  { name: 'Thigh High Fishnet Stockings', description: 'Classic fishnet thigh-high stockings. One size fits most. Available in black & red.', price: 450, category: 'Lingerie', image: 'https://images.unsplash.com/photo-1617469165786-8007eda3caa7?w=400&q=80' },
  { name: 'Remote-Controlled Vibrating Panties', description: 'Wireless remote control up to 10m range. 12 vibration modes. Waterproof. USB charging.', price: 5500, category: 'Toys', image: 'https://images.unsplash.com/photo-1617551307578-6b8c8dae8c30?w=400&q=80' },
  { name: 'Aphrodisiac Chocolate Truffles (Box of 12)', description: 'Premium Belgian chocolate truffles infused with natural aphrodisiac herbs. Made in Kenya.', price: 1400, category: 'Wellness', image: 'https://images.unsplash.com/photo-1548741487-18d363dc4469?w=400&q=80' },
  { name: 'Red Room Beginner Kit (5-piece)', description: 'Complete starter kit: blindfold, cuffs, tickler, paddle, and bondage tape. Great gift set.', price: 4200, category: 'Accessories', image: 'https://images.unsplash.com/photo-1563208723-68eb3f54a3bc?w=400&q=80' },
  { name: 'Faux Leather Harness Bra Set', description: 'Adjustable faux leather harness bra with matching G-string. One size fits most.', price: 2200, category: 'Lingerie', image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&q=80' },
  { name: 'Pheromone Perfume for Women 30ml', description: 'Science-backed pheromone spray to attract and captivate. Long-lasting floral scent.', price: 2800, category: 'Wellness', image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&q=80' },
  { name: 'Vibrating Cock Ring — Triple Action', description: 'Triple stimulation cock ring with 3 vibration points. Stretchy silicone. USB rechargeable.', price: 3200, category: 'Toys', image: 'https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=400&q=80' },
  { name: 'Erotic Massage Gift Set (4 items)', description: 'Set includes massage oil, massage candle, feather tickler, and silk ties. Perfect gift set.', price: 3800, category: 'Wellness', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80' },
  { name: 'Sexy Nurse Costume (Complete Set)', description: 'Full nurse roleplay costume: dress, cap, and accessories. Available S–XL. Discreet shipping.', price: 2600, category: 'Accessories', image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80' },
]

async function insertProduct(product) {
  try {
    await query(
      `INSERT INTO shop_products (name, description, price, image, category, rating, source_url, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,1)
       ON CONFLICT DO NOTHING`,
      [product.name, product.description, product.price, product.image, product.category, product.rating ?? null, product.source_url ?? null]
    )
  } catch (err) {
    console.error('[insert]', product.name, err.message)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await ensureTable()

  // Try live scraping first
  let scraped = []
  try {
    const [lingerie, toys] = await Promise.allSettled([
      scrapeJumiaCategory('/womens-clothing/lingerie/', 'Lingerie'),
      scrapeJumiaCategory('/health-beauty/sexual-wellness/', 'Toys'),
    ])
    if (lingerie.status === 'fulfilled') scraped.push(...lingerie.value)
    if (toys.status === 'fulfilled') scraped.push(...toys.value)
    console.log(`[scrape] Got ${scraped.length} products from Jumia`)
  } catch (e) {
    console.warn('[scrape] Live scraping failed, using seed products:', e.message)
  }

  const products = scraped.length > 0 ? scraped : SEED_PRODUCTS
  console.log(`[insert] Inserting ${products.length} products...`)

  for (const p of products) {
    await insertProduct(p)
  }

  const { rows } = await query('SELECT COUNT(*) AS cnt FROM shop_products WHERE is_active = 1')
  console.log(`[done] Total active shop products: ${rows[0].cnt}`)
  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
