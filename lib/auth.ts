import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface TokenPayload {
  id: number;
  username: string;
  user_type: 'escort' | 'client' | 'advertiser' | 'admin';
  email?: string;
  phone?: string;
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

export function verifyTokenFromRequest(req: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  );
}

export function badRequestResponse(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}
