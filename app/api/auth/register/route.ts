import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';
import { sendEmail, getVerificationEmailHtml } from '@/lib/email';
import { z } from 'zod';
import crypto from 'crypto';

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(100),
  userType: z.enum(['escort', 'client', 'advertiser']),
  loginMethod: z.enum(['email', 'phone', 'username']),
  city: z.string(),
  country: z.string().default('Kenya'),
});

export async function POST(req: NextRequest) {
  let connection;
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    // Validate login method
    if (data.loginMethod === 'email' && !data.email) {
      return NextResponse.json(
        { error: 'Email required for email login' },
        { status: 400 }
      );
    }
    if (data.loginMethod === 'phone' && !data.phone) {
      return NextResponse.json(
        { error: 'Phone required for phone login' },
        { status: 400 }
      );
    }

    // Check if username exists
    const userExists = await executeQuery(
      'SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?',
      [data.username, data.email, data.phone]
    ) as any[];

    if (userExists.length > 0) {
      return NextResponse.json(
        { error: 'Username, email, or phone already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Begin transaction
    connection = await beginTransaction();

    // Create user
    const userResult = await executeQuery(
      `INSERT INTO users (
        username, email, phone, password_hash, user_type,
        display_name, city, country, login_method,
        email_verified, phone_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.username,
        data.email || null,
        data.phone || null,
        passwordHash,
        data.userType,
        data.displayName,
        data.city,
        data.country,
        data.loginMethod,
        data.loginMethod !== 'email',
        data.loginMethod !== 'phone',
      ]
    ) as any;

    const userId = userResult.insertId;

    // Create user type specific record
    if (data.userType === 'escort') {
      await executeQuery(
        'INSERT INTO escorts (user_id) VALUES (?)',
        [userId]
      );
    } else if (data.userType === 'client') {
      await executeQuery(
        'INSERT INTO clients (user_id) VALUES (?)',
        [userId]
      );
    } else if (data.userType === 'advertiser') {
      await executeQuery(
        'INSERT INTO advertisers (user_id) VALUES (?)',
        [userId]
      );
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await executeQuery(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, verificationToken, expiresAt]
    );

    // Send verification email if email login
    if (data.loginMethod === 'email' && data.email) {
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: data.email,
        subject: 'Verify your Wet3 Camp account',
        html: getVerificationEmailHtml(data.displayName, verificationLink),
      });
    }

    await commitTransaction(connection);

    // Create token
    const token = createToken({
      id: userId,
      username: data.username,
      user_type: data.userType as 'escort' | 'client' | 'advertiser',
      email: data.email,
      phone: data.phone,
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Check your email for verification link.',
      token,
      user: {
        id: userId,
        username: data.username,
        user_type: data.userType,
        display_name: data.displayName,
        email_verified: data.loginMethod !== 'email',
      },
    });
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('[v0] Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
