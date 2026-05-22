import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db';
import { comparePasswords, createToken, badRequestResponse } from '@/lib/auth';
import { z } from 'zod';

const LoginSchema = z.object({
  login: z.string().min(3, 'Login required'),
  password: z.string().min(6, 'Password required'),
  loginMethod: z.enum(['email', 'phone', 'username']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password, loginMethod } = LoginSchema.parse(body);

    let query = 'SELECT * FROM users WHERE ';
    
    if (loginMethod === 'email') {
      query += 'email = ?';
    } else if (loginMethod === 'phone') {
      query += 'phone = ?';
    } else {
      query += 'username = ?';
    }

    query += ' AND is_active = true AND is_banned = false';

    const results = await executeQuery(query, [login]) as any[];

    if (results.length === 0) {
      return badRequestResponse('Invalid credentials');
    }

    const user = results[0];
    const passwordMatch = await comparePasswords(password, user.password_hash);

    if (!passwordMatch) {
      return badRequestResponse('Invalid credentials');
    }

    if (user.user_type === 'admin' && user.email_verified === false) {
      return badRequestResponse('Please verify your email first');
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      user_type: user.user_type,
      email: user.email,
      phone: user.phone,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        email: user.email,
        phone: user.phone,
        display_name: user.display_name,
        profile_image: user.profile_image,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequestResponse(error.errors[0].message);
    }
    console.error('[v0] Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
