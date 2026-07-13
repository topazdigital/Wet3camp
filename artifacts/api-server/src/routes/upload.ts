import { Router } from 'express'
import { requireAuth, type AuthRequest } from '../middlewares/requireAuth.js'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPool } from '../lib/db.js'

const router = Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads')

async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true })
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase().slice(0, 80)
}

// POST /api/upload
// Body: { data: "data:image/jpeg;base64,...", filename?: "photo.jpg", type?: "avatar"|"gallery"|"blog" }
// type "blog" additionally accepts video (mp4/webm/mov/quicktime) and is admin-only.
router.post('/upload', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { data, filename, type = 'avatar' } = req.body as { data?: string; filename?: string; type?: string }
    if (!data) { res.status(400).json({ message: 'No image data provided' }); return }

    if (type === 'blog' && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Admin access required' }); return
    }

    const imgMatches = data.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/)
    const vidMatches = type === 'blog' ? data.match(/^data:video\/(mp4|webm|quicktime|mov);base64,(.+)$/) : null

    if (!imgMatches && !vidMatches) {
      res.status(400).json({ message: 'Invalid file format. Send a base64 data URL (image, or video for blog uploads).' }); return
    }

    const isVideo = !!vidMatches
    const matches = (imgMatches ?? vidMatches)!
    const rawExt = matches[1]
    const ext = rawExt === 'jpg' ? 'jpeg' : rawExt === 'quicktime' ? 'mov' : rawExt
    const base64 = matches[2]
    const buffer = Buffer.from(base64, 'base64')

    const maxSize = isVideo ? 80 * 1024 * 1024 : 8 * 1024 * 1024
    if (buffer.length > maxSize) {
      res.status(413).json({ message: `File too large. Maximum size is ${isVideo ? '80MB' : '8MB'}.` }); return
    }

    await ensureUploadsDir()

    const safeName = filename ? sanitizeFilename(filename.replace(/\.[^.]+$/, '')) : 'photo'
    const uniqueName = `${Date.now()}_${req.userId}_${safeName}.${ext}`
    const filePath = path.join(UPLOADS_DIR, uniqueName)

    await writeFile(filePath, buffer)

    const url = `/api/uploads/${uniqueName}`

    // If type is 'avatar', update the escort profile image and user avatar in DB
    if (type === 'avatar') {
      const pool = getPool()
      if (pool) {
        await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [url, req.userId]).catch(() => {})
        await pool.query('UPDATE escorts SET image = ? WHERE user_id = ?', [url, req.userId]).catch(() => {})
      }
    }

    // If type is 'gallery', insert into escort_gallery
    if (type === 'gallery') {
      const pool = getPool()
      if (pool) {
        const [[escort]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ? LIMIT 1', [req.userId])
        if (escort) {
          await pool.query(
            'INSERT INTO escort_gallery (escort_id, image_url, sort_order) VALUES (?,?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM escort_gallery eg WHERE eg.escort_id = ?))',
            [escort.id, url, escort.id]
          ).catch(() => {
            pool.query('INSERT INTO escort_gallery (escort_id, image_url) VALUES (?,?)', [escort.id, url]).catch(() => {})
          })
        }
      }
    }

    res.json({ success: true, url })
  } catch (err: any) {
    console.error('[upload]', err)
    res.status(500).json({ message: 'Upload failed', detail: err?.message ?? '' })
  }
})

// DELETE /api/upload — remove a gallery image
router.delete('/upload', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { url } = req.body as { url?: string }
    if (!url) { res.status(400).json({ message: 'url is required' }); return }
    const pool = getPool()
    if (pool) {
      const [[escort]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ? LIMIT 1', [req.userId])
      if (escort) {
        await pool.query('DELETE FROM escort_gallery WHERE escort_id = ? AND image_url = ?', [escort.id, url]).catch(() => {})
      }
    }
    const filename = url.split('/').pop() ?? ''
    const filePath = path.join(UPLOADS_DIR, filename)
    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises')
      await unlink(filePath).catch(() => {})
    }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: 'Delete failed', detail: err?.message ?? '' })
  }
})

export default router
