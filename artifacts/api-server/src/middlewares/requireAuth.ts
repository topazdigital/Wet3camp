import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt.js'
import { getPool } from '../lib/db.js'

export interface AuthRequest extends Request {
  userId?: number
  userRole?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization']
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' })
    return
  }

  let payload: Record<string, unknown>
  try {
    const token = header.slice(7)
    payload = await verifyToken(token) as Record<string, unknown>
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
    return
  }

  const userId = Number(payload.id)
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    res.status(401).json({ message: 'Invalid account session' })
    return
  }
  const pool = getPool()
  if (!pool) {
    res.status(503).json({ message: 'Authentication service unavailable' })
    return
  }

  try {
    const [[user]] = await pool.query<any[]>(
      'SELECT id, role, is_active FROM users WHERE id = ? LIMIT 1',
      [userId],
    )
    if (!user) {
      res.status(401).json({ message: 'This account no longer exists' })
      return
    }
    if (!Number(user.is_active)) {
      res.status(403).json({ message: 'This account is inactive' })
      return
    }
    req.userId = Number(user.id)
    req.userRole = String(user.role)
    next()
  } catch (error) {
    console.error('[requireAuth] account validation failed:', error)
    res.status(503).json({ message: 'Could not verify account status' })
  }
}
