/**
 * Restore Escort Images — Live MySQL Server Fix
 *
 * Fixes escorts where `image IS NULL` by re-fetching their profile pages
 * (from the stored `source_url`) and re-downloading their profile photo.
 *
 * Run this on the LIVE server when escort photos disappear:
 *
 *   cd /home/admin/wet3camp-build/artifacts/api-server
 *   DATABASE_URL="mysql://admin_wet3camp:PASS@localhost/admin_wet3camp" \
 *     node ../../scripts/restore-escort-images.mjs
 *
 * Options:
 *   --limit=50       process only first N escorts (default: all)
 *   --dry-run        show what would be updated, no DB writes
 *   --all            also re-download images for escorts that already have one
 */

import { mkdirSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const API_DIR     = path.resolve(__dirname, '..', 'artifacts', 'api-server')
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(API_DIR, 'uploads')
const DATABASE_URL = process.env.DATABASE_URL
const IS_MYSQL    = DATABASE_URL?.startsWith('mysql://') || DATABASE_URL?.startsWith('mysql2://')
const UA          = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

const args    = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ALL     = args.includes('--all')
const LIMIT   = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '9999', 10)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── DB adapter ────────────────────────────────────────────────────────────────
async function createDb() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not set')
  if (IS_MYSQL) {
    const mysql = (await import('mysql2/promise')).default
    const pool  = mysql.createPool(DATABASE_URL)
    return {
      query: async (sql, p = []) => { const [rows] = await pool.query(sql, p); return rows },
      run:   async (sql, p = []) => { await pool.query(sql, p) },
      end:   async () => pool.end(),
      isMysql: true,
    }
  }
  const { default: pg } = await import('pg')
  const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 3 })
  return {
    query: async (sql, p = []) => (await pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), p)).rows,
    run:   async (sql, p = []) => pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), p),
    end:   async () => pool.end(),
    isMysql: false,
  }
}

// ── Image download ────────────────────────────────────────────────────────────
async function downloadImage(imageUrl, filename, referer) {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
  const dest = path.join(UPLOADS_DIR, filename)
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': UA, Referer: referer || imageUrl },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 500) throw new Error('Too small')
    await writeFile(dest, buf)
    return `/api/uploads/${filename}`
  } catch (err) {
    console.warn(`    [img] Failed ${filename}: ${err.message}`)
    return null
  }
}

// ── Extract image from escort profile page ────────────────────────────────────
async function fetchProfileImage(profileUrl) {
  if (!profileUrl) return null
  try {
    const res = await fetch(profileUrl, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(20000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()

    // nairobiraha.com pattern
    let m = html.match(/<img[^>]+class="[^"]*profile[^"]*"[^>]+src="([^"]+)"/i)
         || html.match(/<div[^>]+class="[^"]*profile-photo[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i)
         || html.match(/<img[^>]+src="(https?:\/\/[^"]+(?:profile|photo|escort|girl|lady)[^"]*(?:jpg|jpeg|png|webp))[^"]*"/i)
         || html.match(/og:image[^>]+content="([^"]+)"/i)
         || html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)

    // hookup254.com pattern  
    if (!m) {
      m = html.match(/<img[^>]+src="(https?:\/\/hookup254\.com[^"]+(?:jpg|jpeg|png|webp))"/i)
           || html.match(/<img[^>]+src="(https?:\/\/[^"]+(?:jpg|jpeg|png|webp))"[^>]+class="[^"]*wp-post-image[^"]*"/i)
    }

    return m ? m[1] : null
  } catch { return null }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const db = await createDb()
  console.log(`[db] Connected (${db.isMysql ? 'MySQL' : 'PostgreSQL'})`)
  console.log(`[mode] ${DRY_RUN ? 'DRY RUN — no DB writes' : 'LIVE — will update DB'}`)
  console.log(`[mode] ${ALL ? 'ALL escorts' : 'Only escorts with NULL image'}`)

  const where = ALL ? '' : ' WHERE image IS NULL'
  const escorts = await db.query(
    `SELECT id, name, source_url, image FROM escorts${where} ORDER BY id DESC LIMIT ?`,
    [LIMIT]
  )

  console.log(`\n[found] ${escorts.length} escorts to process\n`)

  let fixed = 0, skipped = 0, failed = 0

  for (const escort of escorts) {
    const label = `#${escort.id} ${escort.name}`
    if (!escort.source_url) {
      console.log(`  [skip] ${label} — no source_url`)
      skipped++
      continue
    }

    console.log(`  [fetch] ${label} — ${escort.source_url}`)
    const remoteImgUrl = await fetchProfileImage(escort.source_url)

    if (!remoteImgUrl) {
      console.log(`    [miss] No image found on profile page`)
      failed++
      await sleep(500)
      continue
    }

    const ext  = remoteImgUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg'
    const safe = ['jpg','jpeg','png','webp'].includes(ext) ? ext : 'jpg'
    const rand = Math.random().toString(36).slice(2, 7)
    const fname = `scraped_${Date.now()}_${rand}.${safe}`

    if (DRY_RUN) {
      console.log(`    [dry-run] Would download: ${remoteImgUrl} → ${fname}`)
      fixed++
      await sleep(300)
      continue
    }

    const localUrl = await downloadImage(remoteImgUrl, fname, escort.source_url)

    if (!localUrl) {
      console.log(`    [fail] Download failed, storing remote URL as fallback`)
      // Store the remote URL as fallback so at least something shows
      await db.run('UPDATE escorts SET image = ? WHERE id = ?', [remoteImgUrl, escort.id])
      fixed++
    } else {
      await db.run('UPDATE escorts SET image = ? WHERE id = ?', [localUrl, escort.id])
      console.log(`    [ok] ${localUrl}`)
      fixed++
    }

    await sleep(800)
  }

  console.log(`\n[done] Fixed: ${fixed} | Skipped: ${skipped} | Failed: ${failed}`)
  await db.end()
}

main().catch(e => { console.error('[error]', e.message); process.exit(1) })
