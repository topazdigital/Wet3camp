/**
 * Adult Toys Shop Scraper — v2
 *
 * Scrapes real adult product listings from Kenyan e-commerce sites.
 * Downloads product images locally for reliable serving.
 *
 * Sources (tried in order):
 *   1. passionspice.co.ke — Kenyan adult shop (WooCommerce)
 *   2. sextoy254.co.ke    — Kenyan adult shop
 *   3. adultsonly.co.ke   — Kenyan adult shop
 *   4. Jumia Kenya health/sexual wellness section
 *   5. Comprehensive adult-product seed fallback
 *
 * Works with MySQL (live server) and PostgreSQL (Replit dev).
 *
 * Usage (from artifacts/api-server/):
 *   node scrape-shop.mjs                 — scrape + seed
 *   node scrape-shop.mjs --force-seed    — skip scraping, use seed only
 *   node scrape-shop.mjs --clear         — delete existing products first
 *   node scrape-shop.mjs --dry-run       — parse only, no DB writes
 *
 * Live server:
 *   cd /home/admin/wet3camp-build/artifacts/api-server
 *   DATABASE_URL="mysql://admin_wet3camp:PASS@localhost/admin_wet3camp" node scrape-shop.mjs
 */

import { mkdirSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads')
const DATABASE_URL = process.env.DATABASE_URL
const IS_MYSQL   = DATABASE_URL?.startsWith('mysql://') || DATABASE_URL?.startsWith('mysql2://')

const args       = process.argv.slice(2)
const DRY_RUN    = args.includes('--dry-run')
const CLEAR      = args.includes('--clear')
const FORCE_SEED = args.includes('--force-seed')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// ── Dual-DB adapter ───────────────────────────────────────────────────────────
class DbAdapter {
  constructor(pool, isMysql) { this.pool = pool; this.isMysql = isMysql }

  #pg2mysql(sql) { return sql.replace(/\$\d+/g, '?').replace(/\s+RETURNING\s+id\s*;?\s*$/i, '') }

  async query(sql, params = []) {
    if (this.isMysql) {
      const [rows] = await this.pool.query(this.#pg2mysql(sql), params)
      return { rows: Array.isArray(rows) ? rows : [rows] }
    }
    return this.pool.query(sql, params)
  }

  async run(sql, params = []) {
    if (this.isMysql) await this.pool.query(this.#pg2mysql(sql), params)
    else await this.pool.query(sql, params)
  }

  async insert(sql, params = []) {
    if (this.isMysql) {
      const [result] = await this.pool.query(this.#pg2mysql(sql), params)
      return result.insertId
    }
    const pgSql = /RETURNING\s+id/i.test(sql) ? sql : sql.trimEnd() + ' RETURNING id'
    return (await this.pool.query(pgSql, params)).rows[0]?.id
  }

  async end() { try { await this.pool.end() } catch {} }
}

async function createDb() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is not set')
  if (IS_MYSQL) {
    const mysql = (await import('mysql2/promise')).default
    return new DbAdapter(mysql.createPool(DATABASE_URL), true)
  }
  const { default: pg } = await import('pg')
  return new DbAdapter(new pg.Pool({ connectionString: DATABASE_URL, max: 3 }), false)
}

// ── DB table setup ────────────────────────────────────────────────────────────
async function ensureTable(db) {
  if (db.isMysql) {
    await db.run(`
      CREATE TABLE IF NOT EXISTS \`shop_products\` (
        \`id\`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\`         VARCHAR(300) NOT NULL,
        \`description\`  TEXT,
        \`price_kes\`    INT UNSIGNED NOT NULL DEFAULT 0,
        \`image_url\`    TEXT,
        \`category\`     VARCHAR(100) NOT NULL DEFAULT 'General',
        \`rating\`       DECIMAL(2,1) DEFAULT 4.0,
        \`review_count\` INT UNSIGNED NOT NULL DEFAULT 0,
        \`tag\`          VARCHAR(50)  DEFAULT NULL,
        \`features\`     TEXT         DEFAULT NULL,
        \`in_stock\`     TINYINT(1)   NOT NULL DEFAULT 1,
        \`is_active\`    TINYINT(1)   NOT NULL DEFAULT 1,
        \`source_url\`   VARCHAR(500) DEFAULT NULL,
        \`created_at\`   DATETIME     NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`idx_category\` (\`category\`),
        KEY \`idx_is_active\` (\`is_active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    // Add columns for existing tables that might be missing them
    const alterCols = [
      'ALTER TABLE `shop_products` ADD COLUMN IF NOT EXISTS `tag`          VARCHAR(50) DEFAULT NULL',
      'ALTER TABLE `shop_products` ADD COLUMN IF NOT EXISTS `features`     TEXT        DEFAULT NULL',
      'ALTER TABLE `shop_products` ADD COLUMN IF NOT EXISTS `review_count` INT UNSIGNED NOT NULL DEFAULT 0',
      'ALTER TABLE `shop_products` ADD COLUMN IF NOT EXISTS `price_kes`    INT UNSIGNED NOT NULL DEFAULT 0',
      'ALTER TABLE `shop_products` ADD COLUMN IF NOT EXISTS `image_url`    TEXT',
    ]
    for (const sql of alterCols) {
      try { await db.run(sql) } catch { /* already exists */ }
    }
    // Migrate old `price` column → `price_kes` and `image` → `image_url`
    try { await db.run('UPDATE `shop_products` SET `price_kes` = `price` WHERE `price_kes` = 0 AND `price` > 0') } catch {}
    try { await db.run('UPDATE `shop_products` SET `image_url` = `image` WHERE `image_url` IS NULL AND `image` IS NOT NULL') } catch {}
  } else {
    await db.run(`
      CREATE TABLE IF NOT EXISTS shop_products (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(300) NOT NULL,
        description  TEXT,
        price_kes    INTEGER NOT NULL DEFAULT 0,
        image_url    TEXT,
        category     VARCHAR(100) NOT NULL DEFAULT 'General',
        rating       DECIMAL(2,1) DEFAULT 4.0,
        review_count INTEGER NOT NULL DEFAULT 0,
        tag          VARCHAR(50) DEFAULT NULL,
        features     TEXT DEFAULT NULL,
        in_stock     SMALLINT NOT NULL DEFAULT 1,
        is_active    SMALLINT NOT NULL DEFAULT 1,
        source_url   VARCHAR(500) DEFAULT NULL,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    const pgAlter = [
      'ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS tag          VARCHAR(50) DEFAULT NULL',
      'ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS features     TEXT DEFAULT NULL',
      'ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS price_kes    INTEGER NOT NULL DEFAULT 0',
    ]
    for (const sql of pgAlter) {
      try { await db.run(sql) } catch {}
    }
    try { await db.run('UPDATE shop_products SET price_kes = price WHERE price_kes = 0 AND price > 0') } catch {}
    try { await db.run('UPDATE shop_products SET image_url = image WHERE image_url IS NULL AND image IS NOT NULL') } catch {}
  }
  console.log('[db] shop_products table ready')
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  } catch (err) {
    console.warn(`  [WARN] fetch failed ${url}: ${err.message}`)
    return null
  }
}

async function downloadImage(imageUrl, filename, referer) {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
  const dest = path.join(UPLOADS_DIR, filename)
  if (existsSync(dest)) return `/api/uploads/${filename}`
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, Referer: referer || imageUrl },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 500) throw new Error('Image too small')
    await writeFile(dest, buf)
    return `/api/uploads/${filename}`
  } catch (err) {
    console.warn(`    [img] download failed ${filename}: ${err.message}`)
    return null
  }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

function extractPrice(text) {
  if (!text) return 0
  const t = String(text).replace(/,/g, '').replace(/KES|Ksh|KSh/gi, '').trim()
  const m = t.match(/\d+(\.\d{1,2})?/)
  return m ? Math.round(parseFloat(m[0])) : 0
}

// ── passionspice.co.ke scraper ────────────────────────────────────────────────
async function scrapePassionSpice() {
  const products = []
  const pages = [
    'https://www.passionspice.co.ke/product-category/sex-toys/',
    'https://www.passionspice.co.ke/product-category/vibrators/',
    'https://www.passionspice.co.ke/product-category/dildos/',
    'https://www.passionspice.co.ke/product-category/anal-toys/',
    'https://www.passionspice.co.ke/product-category/lubricants/',
    'https://www.passionspice.co.ke/product-category/bondage/',
    'https://www.passionspice.co.ke/product-category/lingerie/',
  ]

  for (const pageUrl of pages) {
    const html = await fetchHtml(pageUrl)
    if (!html) continue
    console.log(`  [passionspice] Fetched ${pageUrl.split('/').slice(-2, -1)[0]}`)

    const cat = pageUrl.split('/').slice(-2, -1)[0]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    // WooCommerce product grid pattern
    const productRe = /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
    let match
    while ((match = productRe.exec(html)) !== null) {
      const block = match[1]
      const nameM  = block.match(/class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([^<]+)</)
                  || block.match(/<h2[^>]*>([^<]+)</)
      const priceM = block.match(/class="[^"]*amount[^"]*"[^>]*>.*?KSh\s*([0-9,]+)/)
                  || block.match(/class="[^"]*price[^"]*"[^>]*>[\s\S]*?([0-9,]{3,})</)
      const imgM   = block.match(/data-src="([^"]+)"/)
                  || block.match(/src="(https?:\/\/[^"]+(?:jpg|jpeg|png|webp))"/)
      const linkM  = block.match(/href="(https?:\/\/www\.passionspice\.co\.ke\/product\/[^"]+)"/)

      const name = nameM ? nameM[1].trim() : null
      if (!name || name.length < 3) continue

      const rawPrice = priceM ? extractPrice(priceM[1] || priceM[0]) : 0
      const price = rawPrice > 100 ? rawPrice : 0

      products.push({
        name: name.slice(0, 280),
        description: `${name}. Discreet packaging. Fast delivery across Kenya.`,
        price_kes: price,
        category: mapCategory(cat),
        imageUrl: imgM ? imgM[1] : null,
        source_url: linkM ? linkM[1] : pageUrl,
      })
    }
    await sleep(800)
  }
  return products
}

// ── sextoy254.co.ke scraper ───────────────────────────────────────────────────
async function scrapeSexToy254() {
  const products = []
  const pages = [
    'https://www.sextoy254.co.ke/product-category/vibrators/',
    'https://www.sextoy254.co.ke/product-category/dildos/',
    'https://www.sextoy254.co.ke/product-category/anal-toys/',
    'https://www.sextoy254.co.ke/product-category/lubricants/',
    'https://www.sextoy254.co.ke/',
  ]

  for (const pageUrl of pages) {
    const html = await fetchHtml(pageUrl)
    if (!html) continue
    const seg = pageUrl.split('/').slice(-2, -1)[0]
    console.log(`  [sextoy254] Fetched ${seg || 'home'}`)

    const cat = seg ? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Toys'

    const productRe = /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
    let match
    while ((match = productRe.exec(html)) !== null) {
      const block = match[1]
      const nameM  = block.match(/class="[^"]*product_title[^"]*"[^>]*>([^<]+)</)
                  || block.match(/<h2[^>]*>([^<]+)</)
      const priceM = block.match(/class="[^"]*amount[^"]*"[^>]*>[\s\S]*?([0-9,]{3,})/)
      const imgM   = block.match(/data-src="([^"]+)"/) || block.match(/src="(https?:\/\/[^"]+(?:jpg|jpeg|png|webp))"/)
      const linkM  = block.match(/href="(https?:\/\/[^"]+product[^"]+)"/)

      const name = nameM ? nameM[1].trim() : null
      if (!name || name.length < 3) continue
      const price = priceM ? extractPrice(priceM[1]) : 0

      products.push({
        name: name.slice(0, 280),
        description: `${name}. Discreet delivery across Kenya.`,
        price_kes: price,
        category: mapCategory(cat),
        imageUrl: imgM ? imgM[1] : null,
        source_url: linkM ? linkM[1] : pageUrl,
      })
    }
    await sleep(800)
  }
  return products
}

// ── adultsonly.co.ke scraper ──────────────────────────────────────────────────
async function scrapeAdultsOnly() {
  const products = []
  const pages = [
    'https://adultsonly.co.ke/shop/',
    'https://adultsonly.co.ke/product-category/sex-toys/',
    'https://adultsonly.co.ke/product-category/lingerie/',
  ]
  for (const pageUrl of pages) {
    const html = await fetchHtml(pageUrl)
    if (!html) continue
    const seg = pageUrl.split('/').slice(-2, -1)[0]
    console.log(`  [adultsonly] Fetched ${seg}`)
    const cat = seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    const productRe = /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
    let match
    while ((match = productRe.exec(html)) !== null) {
      const block = match[1]
      const nameM  = block.match(/<h2[^>]*>([^<]+)</)
      const priceM = block.match(/([0-9,]{3,})/)
      const imgM   = block.match(/data-src="([^"]+)"/) || block.match(/src="(https?:\/\/[^"]+(?:jpg|jpeg|png|webp))"/)
      const linkM  = block.match(/href="(https?:\/\/adultsonly\.co\.ke\/product\/[^"]+)"/)

      const name = nameM ? nameM[1].trim() : null
      if (!name || name.length < 3) continue

      products.push({
        name: name.slice(0, 280),
        description: `${name}. Discreet delivery across Kenya.`,
        price_kes: priceM ? extractPrice(priceM[1]) : 0,
        category: mapCategory(cat),
        imageUrl: imgM ? imgM[1] : null,
        source_url: linkM ? linkM[1] : pageUrl,
      })
    }
    await sleep(800)
  }
  return products
}

// ── Category normalizer ───────────────────────────────────────────────────────
function mapCategory(raw) {
  const r = (raw || '').toLowerCase()
  if (r.includes('vibrat') || r.includes('bullet') || r.includes('wand'))  return 'Vibrators'
  if (r.includes('dildo') || r.includes('realistic'))                       return 'Dildos'
  if (r.includes('anal') || r.includes('butt') || r.includes('plug'))      return 'Anal Toys'
  if (r.includes('toy') || r.includes('masturbat'))                        return 'Toys'
  if (r.includes('lube') || r.includes('lubric') || r.includes('gel'))    return 'Lubricants'
  if (r.includes('condom') || r.includes('prophylact'))                    return 'Wellness'
  if (r.includes('massage') || r.includes('oil') || r.includes('wellness')) return 'Wellness'
  if (r.includes('bondage') || r.includes('bdsm') || r.includes('kink'))  return 'Bondage'
  if (r.includes('linger') || r.includes('bra') || r.includes('stocking')
    || r.includes('bodysuit') || r.includes('corset') || r.includes('babydoll')) return 'Lingerie'
  if (r.includes('costume') || r.includes('roleplay'))                     return 'Accessories'
  if (r.includes('strap') || r.includes('harness'))                        return 'Accessories'
  return 'Toys'
}

// ── Comprehensive adult product seed data ─────────────────────────────────────
// Images are downloaded at runtime from reliable public CDNs.
// price_kes in Kenya Shillings (realistic market pricing 2025).
const SEED_PRODUCTS = [
  // ─── Vibrators ───
  {
    name: 'Wireless Bullet Vibrator — 10 Speed Modes',
    description: 'Compact rechargeable bullet vibrator with 10 vibration patterns. Whisper-quiet motor. USB charging. Waterproof silicone body. Ships in discreet packaging.',
    price_kes: 3500, category: 'Vibrators', rating: 4.8, review_count: 124, tag: 'Best Seller',
    features: 'Rechargeable USB\nWaterproof IPX7\n10 vibration modes\nWhisper-quiet\nBody-safe silicone',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'G-Spot Vibrator — Curved Silicone',
    description: 'Precisely angled G-spot vibrator with powerful rumbly vibrations. 8 patterns. Fully waterproof. Comes with satin storage pouch.',
    price_kes: 4800, category: 'Vibrators', rating: 4.7, review_count: 89,
    features: 'Curved G-spot tip\n8 vibration patterns\nFully waterproof\nBody-safe silicone\nUSB rechargeable',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Rabbit Vibrator — Dual Stimulation',
    description: 'Classic rabbit-style vibrator with internal shaft and external clitoral stimulator. 12 modes. Rechargeable. Perfect for beginners and experienced users.',
    price_kes: 6500, category: 'Vibrators', rating: 4.6, review_count: 201, tag: 'Popular',
    features: 'Dual stimulation\n12 vibration modes\nFlexible rabbit ears\nRechargeable\nWaterproof',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Air Pulse Clitoral Stimulator',
    description: 'Revolutionary air-pulse technology for intense clitoral orgasms without direct contact. 11 intensity levels. Whisper-quiet. Waterproof.',
    price_kes: 7800, category: 'Vibrators', rating: 4.9, review_count: 312, tag: 'Top Rated',
    features: 'Air-pulse technology\n11 intensity levels\nNo direct contact\nWaterproof\nUSB rechargeable',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Wand Massager — Powerful Full Body',
    description: 'Cordless wand massager with deep rumbling vibrations. 20 patterns. Great for body massage and personal pleasure. Flexible head.',
    price_kes: 5500, category: 'Vibrators', rating: 4.5, review_count: 78,
    features: '20 vibration patterns\nFlexible massaging head\nCordless rechargeable\nMultiple uses\nSilicone head',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // ─── Dildos ───
  {
    name: 'Realistic Silicone Dildo — 7 Inch',
    description: 'Body-safe silicone dildo with realistic design. Suction cup base for hands-free play. Harness compatible. Easy to clean.',
    price_kes: 3800, category: 'Dildos', rating: 4.4, review_count: 56,
    features: 'Suction cup base\nHarness compatible\nBody-safe silicone\nEasy to clean\n18cm / 7 inches',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Glass Dildo — Smooth Pleasure Wand',
    description: 'Premium borosilicate glass pleasure wand. Can be used warm or cold for temperature play. Body-safe, non-porous, easy to sterilize.',
    price_kes: 4200, category: 'Dildos', rating: 4.6, review_count: 44,
    features: 'Temperature play\nBorosilicate glass\nSterilizable\nNon-porous\nElegant design',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Double-Ended Dildo — Flexible 12 Inch',
    description: 'Flexible double-ended dildo for solo or partner play. Body-safe silicone. Highly flexible shaft for comfortable positioning.',
    price_kes: 4500, category: 'Dildos', rating: 4.3, review_count: 31,
    features: 'Double-ended\n30cm total length\nFlexible silicone\nSolo or partner use\nHarness compatible',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // ─── Anal Toys ───
  {
    name: 'Beginner Anal Plug Set — 3 Sizes',
    description: 'Perfect starter kit with three graduated silicone anal plugs. Includes small, medium, and large sizes. Tapered tips for easy insertion. Flared bases for safety.',
    price_kes: 2800, category: 'Anal Toys', rating: 4.5, review_count: 88, tag: 'Starter Kit',
    features: '3 sizes included\nFlared safety base\nBody-safe silicone\nSmooth finish\nEasy to clean',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Vibrating Anal Plug — Remote Control',
    description: 'Wireless remote controlled vibrating anal plug with 10 modes. Up to 10m range. USB rechargeable. Smooth silicone body.',
    price_kes: 5200, category: 'Anal Toys', rating: 4.7, review_count: 63,
    features: '10 vibration modes\nRemote control 10m\nUSB rechargeable\nBody-safe silicone\nFlared base',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Prostate Massager — P-Spot Stimulator',
    description: 'Specially curved for prostate stimulation. 7 vibration modes. Rechargeable with magnetic charger. Smooth body-safe silicone.',
    price_kes: 4800, category: 'Anal Toys', rating: 4.6, review_count: 47,
    features: 'P-spot curve\n7 vibration modes\nMagnetic charging\nBody-safe silicone\nWaterproof',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // ─── Lubricants & Wellness ───
  {
    name: 'Water-Based Lubricant — 200ml',
    description: 'Premium water-based personal lubricant. Compatible with all toy materials and condoms. Fragrance-free. Long-lasting formula. pH balanced.',
    price_kes: 950, category: 'Lubricants', rating: 4.7, review_count: 256, tag: 'Bestseller',
    features: 'Condom safe\nToy compatible\nFragrance-free\npH balanced\nLong-lasting',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Silicone-Based Lubricant — 100ml',
    description: 'Ultra-long-lasting silicone lubricant. Ideal for anal play and extended sessions. Waterproof formula. Not compatible with silicone toys.',
    price_kes: 1400, category: 'Lubricants', rating: 4.5, review_count: 112,
    features: 'Ultra long-lasting\nWaterproof formula\nSmooth feel\nNo sticky residue\n100ml bottle',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Warming Massage Oil — Rose & Vanilla',
    description: 'Luxurious warming massage oil that heats up with touch. Edible formula. Rose and vanilla scent. Great for sensual massage and intimacy.',
    price_kes: 1100, category: 'Wellness', rating: 4.6, review_count: 189,
    features: 'Warming formula\nEdible\nRose & vanilla scent\nMoisturizing\n100ml',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Delay Spray for Men — 10ml',
    description: 'Clinical-strength delay spray to help men last longer. Fast-acting. 15-minute duration. Mild benzocaine formula. Does not transfer to partner.',
    price_kes: 1800, category: 'Wellness', rating: 4.4, review_count: 203,
    features: 'Fast-acting\n15-min effectiveness\nDoes not transfer\nClinical strength\nDiscreet packaging',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Female Arousal Serum — 30ml',
    description: 'Fast-acting arousal serum for women. Increases sensitivity and blood flow. Water-based. Compatible with condoms. Natural botanical formula.',
    price_kes: 2200, category: 'Wellness', rating: 4.3, review_count: 94,
    features: 'Fast-acting\nIncreases sensitivity\nNatural botanical\nCondom safe\n30ml bottle',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Toy Cleaner Spray — Antibacterial 100ml',
    description: 'Fast-acting antibacterial toy cleaner. Safe for all toy materials. No rinse formula. Kills 99.9% of bacteria. Essential for toy hygiene.',
    price_kes: 650, category: 'Wellness', rating: 4.8, review_count: 342,
    features: 'Kills 99.9% bacteria\nNo rinse needed\nAll materials safe\n100ml spray\nFast-acting',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // ─── Bondage & BDSM ───
  {
    name: 'Beginner Bondage Kit — 5 Piece Set',
    description: 'Complete beginner BDSM starter set. Includes adjustable cuffs, blindfold, feather tickler, soft paddle, and bondage tape. Easy-release mechanism on all restraints.',
    price_kes: 4200, category: 'Bondage', rating: 4.5, review_count: 77, tag: 'Starter Kit',
    features: '5-piece set\nEasy-release cuffs\nFeather tickler included\nSoft paddle\nStorage bag',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Velvet Blindfold — Adjustable',
    description: 'Luxurious velvet blindfold with adjustable strap. Blocks all light. Soft and comfortable for extended wear. Unisex design.',
    price_kes: 650, category: 'Bondage', rating: 4.6, review_count: 298,
    features: 'Full blackout\nSoft velvet\nAdjustable strap\nComfortable fit\nUnisex',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Leather Handcuffs with Quick-Release',
    description: 'Genuine faux leather wrist cuffs with velcro quick-release and D-ring connectors. Padded interior for comfort. Includes short chain link.',
    price_kes: 1800, category: 'Bondage', rating: 4.4, review_count: 56,
    features: 'Quick-release safety\nPadded interior\nD-ring connectors\nChain included\nAdjustable fit',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Bondage Tape — Non-Stick 18m',
    description: 'Self-adhesive bondage tape that sticks to itself but not skin or hair. 18 meters long. Reusable. Comes in black. No residue.',
    price_kes: 850, category: 'Bondage', rating: 4.3, review_count: 89,
    features: 'Skin-safe\nNo residue\n18m length\nReusable\nSelf-adhesive',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // ─── Lingerie ───
  {
    name: 'Red Lace Lingerie Set — Bra & Thong',
    description: 'Stunning red lace push-up bra and matching thong. Available sizes S–XL. French lace fabric. Underwire bra with adjustable straps. Ships discreetly.',
    price_kes: 1800, category: 'Lingerie', rating: 4.5, review_count: 167,
    features: 'French lace\nPush-up bra\nAdjustable straps\nSizes S–XL\nDiscreet packaging',
    imageUrl: 'https://images.pexels.com/photos/6580227/pexels-photo-6580227.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Black Satin Corset Bodysuit',
    description: 'Elegant satin corset bodysuit with adjustable lacing and suspender clips. Boned structure for perfect shaping. Available S–XXL. Includes matching G-string.',
    price_kes: 3200, category: 'Lingerie', rating: 4.7, review_count: 134, tag: 'Popular',
    features: 'Boned structure\nAdjustable lacing\nSuspender clips\nG-string included\nSizes S–XXL',
    imageUrl: 'https://images.pexels.com/photos/6580227/pexels-photo-6580227.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Sheer Mesh Babydoll Negligee',
    description: 'Ultra-sheer mesh babydoll with embroidered floral lace trim. Matching mesh thong included. One size fits most. Soft and feminine.',
    price_kes: 1400, category: 'Lingerie', rating: 4.4, review_count: 98,
    features: 'Ultra-sheer mesh\nFloral lace trim\nThong included\nOne size fits most\nSoft fabric',
    imageUrl: 'https://images.pexels.com/photos/6580227/pexels-photo-6580227.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Fishnet Bodystocking — Full Body',
    description: 'Stretchy full-body fishnet stocking. Open crotch design. One size fits all. Perfect for role play or seductive evenings.',
    price_kes: 900, category: 'Lingerie', rating: 4.2, review_count: 211,
    features: 'Full body coverage\nOpen crotch\nHighly stretchy\nOne size fits all\nFishnet weave',
    imageUrl: 'https://images.pexels.com/photos/6580227/pexels-photo-6580227.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Faux Leather Harness Bra Set',
    description: 'Adjustable faux leather body harness bra. Criss-cross design. Pairs with any bra or worn alone. Metal O-ring accents. Adjustable buckles.',
    price_kes: 2200, category: 'Lingerie', rating: 4.5, review_count: 73,
    features: 'Faux leather\nAdjustable buckles\nMetal O-rings\nVersatile styling\nOne size fits most',
    imageUrl: 'https://images.pexels.com/photos/6580227/pexels-photo-6580227.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // ─── Couples Toys ───
  {
    name: 'Vibrating Couples Ring — Remote Control',
    description: 'Stretchy silicone couples ring with built-in vibrator. Wireless remote with 12 modes. Enhances pleasure for both partners during intimacy. USB rechargeable.',
    price_kes: 3800, category: 'Toys', rating: 4.6, review_count: 145, tag: 'Couples Pick',
    features: '12 vibration modes\nRemote control\nStretchy silicone\nUSB rechargeable\nWaterproof',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Remote Panty Vibrator — Wearable',
    description: 'Discreet wearable panty vibrator with wireless remote. 12 vibration modes. 10m remote range. USB rechargeable. Perfect for couples play in public or private.',
    price_kes: 6500, category: 'Toys', rating: 4.7, review_count: 88,
    features: 'Wearable design\n12 vibration modes\n10m remote range\nUSB rechargeable\nDiscreet & quiet',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Couple Vibrator — C-Shape Design',
    description: 'Ergonomic C-shape vibrator designed for simultaneous internal and external stimulation during intercourse. 2 motors. Remote control. Rechargeable.',
    price_kes: 8500, category: 'Toys', rating: 4.8, review_count: 167, tag: 'Premium',
    features: 'Dual motor\nC-shape ergonomic\nRemote control\nRechargeable\nFor intercourse use',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  // ─── Accessories ───
  {
    name: 'Feather Tickler — Ostrich Feather',
    description: 'Soft ostrich feather tickler on elegant faux leather handle. 35cm total length. Perfect foreplay tool. Available in red, black, and pink.',
    price_kes: 850, category: 'Accessories', rating: 4.3, review_count: 178,
    features: 'Genuine feathers\nFaux leather handle\n35cm length\nMultiple colors\nSoft & sensual',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Naughty Dice Game Set',
    description: 'Erotic dice game set for couples. Two large dice — one for actions, one for body parts. Hours of playful fun. Perfect naughty gift.',
    price_kes: 600, category: 'Accessories', rating: 4.1, review_count: 321,
    features: 'Action dice + body dice\nEasy to play\nFor two players\nFun foreplay game\nCompact size',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Pheromone Perfume for Her — 30ml',
    description: 'Science-backed pheromone perfume designed to attract and captivate. Blend of natural pheromones with a light floral top note. Long-lasting 6–8 hours.',
    price_kes: 2800, category: 'Wellness', rating: 4.4, review_count: 209,
    features: 'Natural pheromones\nLong-lasting 6-8hrs\nFloral fragrance\n30ml bottle\nFor women',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Sexy Nurse Costume — Role Play Set',
    description: 'Complete nurse role-play costume: dress, cap, stethoscope prop, and accessories. Available sizes S–XL. Stretchy fabric. Perfect for fantasy play.',
    price_kes: 2600, category: 'Accessories', rating: 4.2, review_count: 67,
    features: 'Full costume set\nCap + accessories\nSizes S–XL\nStretchy fabric\nDiscreet shipping',
    imageUrl: 'https://images.pexels.com/photos/6580227/pexels-photo-6580227.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Rose Gold Nipple Clamps — Adjustable',
    description: 'Rose gold plated adjustable nipple clamps with chain. Adjustable tension screw. Includes small bells. Nipple-friendly rubber tips.',
    price_kes: 1500, category: 'Bondage', rating: 4.5, review_count: 134,
    features: 'Adjustable tension\nRubber-tipped\nRose gold plated\nChain connector\nBells included',
    imageUrl: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Stainless Steel Ben Wa Balls — 2pc',
    description: 'Medical-grade stainless steel kegel balls for pelvic floor strengthening. 2 sizes. Smooth finish. Can be used for pleasure or exercise.',
    price_kes: 2100, category: 'Wellness', rating: 4.6, review_count: 98,
    features: 'Medical-grade steel\nKegel exercise\n2 balls included\nSmooth finish\nMulti-purpose',
    imageUrl: 'https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
]

// ── Insert product into DB ────────────────────────────────────────────────────
async function insertProduct(db, product) {
  if (DRY_RUN) { console.log(`  [dry-run] Would insert: ${product.name}`); return }
  try {
    if (db.isMysql) {
      await db.run(
        `INSERT IGNORE INTO \`shop_products\`
           (\`name\`, \`description\`, \`price_kes\`, \`image_url\`, \`category\`, \`rating\`, \`review_count\`, \`tag\`, \`features\`, \`source_url\`, \`is_active\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [product.name, product.description, product.price_kes || 0, product.image_url || null,
         product.category, product.rating || 4.0, product.review_count || 0,
         product.tag || null, product.features || null, product.source_url || null]
      )
    } else {
      await db.run(
        `INSERT INTO shop_products
           (name, description, price_kes, image_url, category, rating, review_count, tag, features, source_url, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1)
         ON CONFLICT DO NOTHING`,
        [product.name, product.description, product.price_kes || 0, product.image_url || null,
         product.category, product.rating || 4.0, product.review_count || 0,
         product.tag || null, product.features || null, product.source_url || null]
      )
    }
  } catch (err) {
    console.error(`  [insert] Failed: ${product.name} — ${err.message}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const db = await createDb()
  console.log(`[db] Connected (${db.isMysql ? 'MySQL' : 'PostgreSQL'})`)

  await ensureTable(db)

  if (CLEAR && !DRY_RUN) {
    if (db.isMysql) await db.run('DELETE FROM `shop_products`')
    else             await db.run('DELETE FROM shop_products')
    console.log('[db] Cleared existing shop_products')
  }

  let scraped = []

  if (!FORCE_SEED) {
    console.log('\n[scrape] Trying Kenyan adult e-commerce sites...')

    const results = await Promise.allSettled([
      scrapePassionSpice().then(p => { console.log(`[passionspice] ${p.length} products found`); return p }),
      scrapeSexToy254().then(p => { console.log(`[sextoy254] ${p.length} products found`); return p }),
      scrapeAdultsOnly().then(p => { console.log(`[adultsonly] ${p.length} products found`); return p }),
    ])

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.length > 0) scraped.push(...r.value)
    }
    console.log(`\n[scrape] Total scraped: ${scraped.length} products`)
  }

  // Process scraped products — download their images
  let inserted = 0
  if (scraped.length > 0) {
    console.log('\n[insert] Processing scraped products...')
    for (const p of scraped) {
      let imageUrl = null
      if (p.imageUrl) {
        const ext = p.imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'
        const safeExt = ['jpg','jpeg','png','webp'].includes(ext) ? ext : 'jpg'
        const filename = `shop_${Date.now()}_${slugify(p.name)}.${safeExt}`
        imageUrl = await downloadImage(p.imageUrl, filename, p.source_url || p.imageUrl)
        await sleep(300)
      }
      await insertProduct(db, { ...p, image_url: imageUrl })
      inserted++
    }
    console.log(`[insert] Inserted ${inserted} scraped products`)
  }

  // Always add seed products if we have fewer than 20 total
  const countResult = await db.query(
    db.isMysql
      ? 'SELECT COUNT(*) AS cnt FROM `shop_products` WHERE is_active = 1'
      : 'SELECT COUNT(*) AS cnt FROM shop_products WHERE is_active = 1'
  )
  const existingCount = Number(countResult.rows[0]?.cnt ?? 0)

  if (existingCount < 20) {
    console.log(`\n[seed] Only ${existingCount} products in DB — adding seed products...`)
    for (const p of SEED_PRODUCTS) {
      // Try to download seed images locally
      let imageUrl = null
      if (p.imageUrl) {
        const filename = `shop_seed_${slugify(p.name)}.jpg`
        imageUrl = await downloadImage(p.imageUrl, filename, 'https://www.pexels.com/')
        if (!imageUrl) imageUrl = p.imageUrl // fall back to external URL if download fails
      }
      await insertProduct(db, { ...p, image_url: imageUrl })
      await sleep(200)
    }
    console.log(`[seed] Seed products added`)
  }

  const finalCount = await db.query(
    db.isMysql
      ? 'SELECT COUNT(*) AS cnt FROM `shop_products` WHERE is_active = 1'
      : 'SELECT COUNT(*) AS cnt FROM shop_products WHERE is_active = 1'
  )
  console.log(`\n[done] Total active shop products: ${finalCount.rows[0]?.cnt}`)
  await db.end()
}

main().catch(e => { console.error(e); process.exit(1) })
