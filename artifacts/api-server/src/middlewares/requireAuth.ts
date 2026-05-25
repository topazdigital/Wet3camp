import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt.js'

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
  try {
    const token = header.slice(7)
    const payload = await verifyToken(token)
    req.userId   = payload['id'] as number
    req.userRole = payload['role'] as string
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}
