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

type PendingChunkUpload = {
  userId: string | number
  filename?: string
  total: number
  chunks: Map<number, string>
  expiresAt: number
}

const pendingChunkUploads = new Map<string, PendingChunkUpload>()
const CHUNK_UPLOAD_TTL_MS = 10 * 60 * 1000
const MAX_CHUNK_COUNT = 256
const MAX_CHUNK_CHARS = 80_000
const MAX_TOTAL_CHARS = 12 * 1024 * 1024

async function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true })
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase().slice(0, 80)
}

async function persistUpload(
  buffer: Buffer,
  filename: string | undefined,
  type: string,
  userId: string | number,
  ext: string,
) {
  await ensureUploadsDir()

  const safeName = filename ? sanitizeFilename(filename.replace(/\.[^.]+$/, '')) : 'photo'
  const uniqueName = `${Date.now()}_${userId}_${safeName}.${ext}`
  const filePath = path.join(UPLOADS_DIR, uniqueName)

  await writeFile(filePath, buffer)

  const url = `/api/uploads/${uniqueName}`

  if (type === 'avatar') {
    const pool = getPool()
    if (pool) {
      await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [url, userId]).catch(() => {})
      await pool.query('UPDATE escorts SET image = ? WHERE user_id = ?', [url, userId]).catch(() => {})
    }
  }

  if (type === 'gallery') {
    const pool = getPool()
    if (pool) {
      const [[escort]] = await pool.query<any[]>('SELECT id FROM escorts WHERE user_id = ? LIMIT 1', [userId])
      if (escort) {
        await pool.query(
          'INSERT INTO escort_gallery (escort_id, image_url, sort_order) VALUES (?,?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM escort_gallery eg WHERE eg.escort_id = ?))',
          [escort.id, escort.id]
        ).catch(() => {
          pool.query('INSERT INTO escort_gallery (escort_id, image_url) VALUES (?,?)', [escort.id, url]).catch(() => {})
        })
      }
    }
  }

  return url
}

// POST /api/upload
// Body: { data: "data:image/jpeg;base64,...", filename?: "photo.jpg", type?: "avatar"|"gallery"|"blog" }
// type "blog" additionally accepts video (mp4/webm/mov/quicktime) and is admin-only.
router.post('/upload', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : null
    const body = rawBody ? {} : req.body as { data?: string; filename?: string; type?: string }
    const type = rawBody
      ? (typeof req.query.type === 'string' ? req.query.type : 'avatar')
      : (body.type || 'avatar')
    const filename = rawBody
      ? (typeof req.query.filename === 'string' ? req.query.filename : undefined)
      : body.filename

    if (!rawBody && !body.data) {
      res.status(400).json({ message: 'No image data provided' }); return
    }

    if (type === 'blog' && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Admin access required' }); return
    }

    let ext: string
    let buffer: Buffer
    let isVideo = false

    if (rawBody) {
      const mime = String(req.headers['content-type'] ?? '').split(';', 1)[0].toLowerCase()
      const extByMime: Record<string, string> = {
        'image/jpeg': 'jpeg',
        'image/jpg': 'jpeg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      }
      ext = extByMime[mime] ?? ''
      if (!ext) {
        res.status(400).json({ message: 'Invalid image format.' }); return
      }
      buffer = rawBody
    } else {
      const data = body.data!
      const imgMatches = data.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/)
      const vidMatches = type === 'blog' ? data.match(/^data:video\/(mp4|webm|quicktime|mov);base64,(.+)$/) : null

      if (!imgMatches && !vidMatches) {
        res.status(400).json({ message: 'Invalid file format. Send a base64 data URL (image, or video for blog uploads).' }); return
      }

      isVideo = !!vidMatches
      const matches = (imgMatches ?? vidMatches)!
      const rawExt = matches[1]
      ext = rawExt === 'jpg' ? 'jpeg' : rawExt === 'quicktime' ? 'mov' : rawExt
      buffer = Buffer.from(matches[2], 'base64')
    }

    const maxSize = isVideo ? 80 * 1024 * 1024 : 8 * 1024 * 1024
    if (buffer.length > maxSize) {
      res.status(413).json({ message: `File too large. Maximum size is ${isVideo ? '80MB' : '8MB'}.` }); return
    }

    const url = await persistUpload(buffer, filename, type, req.userId, ext)

    res.json({ success: true, url })
  } catch (err: any) {
    console.error('[upload]', err)
    res.status(500).json({ message: 'Upload failed', detail: err?.message ?? '' })
  }
})

// POST /api/upload-chunk
// Verification pose uploads use several small JSON requests because the live
// Apache host rejects larger request bodies before they reach Node. Each
// request carries a base64 slice; the final request reassembles and saves the
// compressed JPEG.
router.post('/upload-chunk', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      uploadId, index, total, data, filename, mime = 'image/jpeg',
    } = req.body as {
      uploadId?: string
      index?: number
      total?: number
      data?: string
      filename?: string
      mime?: string
    }

    const chunkIndex = Number(index)
    const chunkTotal = Number(total)
    if (
      !uploadId || !/^[a-zA-Z0-9_-]{8,100}$/.test(uploadId)
      || !Number.isInteger(chunkIndex) || chunkIndex < 0
      || !Number.isInteger(chunkTotal) || chunkTotal < 1 || chunkTotal > MAX_CHUNK_COUNT
      || chunkIndex >= chunkTotal
      || chunkTotal * MAX_CHUNK_CHARS > MAX_TOTAL_CHARS
      || typeof data !== 'string' || data.length === 0 || data.length > MAX_CHUNK_CHARS
      || mime !== 'image/jpeg'
    ) {
      res.status(400).json({ message: 'Invalid upload chunk.' }); return
    }

    const now = Date.now()
    for (const [id, pending] of pendingChunkUploads) {
      if (pending.expiresAt <= now) pendingChunkUploads.delete(id)
    }

    let pending = pendingChunkUploads.get(uploadId)
    if (pending && (pending.userId !== req.userId || pending.total !== chunkTotal)) {
      res.status(400).json({ message: 'Upload session does not match.' }); return
    }
    if (!pending) {
      pending = {
        userId: req.userId,
        filename,
        total: chunkTotal,
        chunks: new Map(),
        expiresAt: now + CHUNK_UPLOAD_TTL_MS,
      }
      pendingChunkUploads.set(uploadId, pending)
    }

    pending.chunks.set(chunkIndex, data)
    pending.expiresAt = now + CHUNK_UPLOAD_TTL_MS

    if (pending.chunks.size < pending.total) {
      res.json({ success: true, complete: false, received: pending.chunks.size, total: pending.total }); return
    }

    const base64 = Array.from({ length: pending.total }, (_, i) => pending!.chunks.get(i) ?? '').join('')
    pendingChunkUploads.delete(uploadId)
    const buffer = Buffer.from(base64, 'base64')
    if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
      res.status(413).json({ message: 'File too large or invalid.' }); return
    }

    const url = await persistUpload(buffer, pending.filename, 'verification_pose', req.userId, 'jpeg')
    res.json({ success: true, complete: true, url })
  } catch (err: any) {
    console.error('[upload-chunk]', err)
    res.status(500).json({ message: 'Chunked upload failed', detail: err?.message ?? '' })
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
