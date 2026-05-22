import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token required' },
      { status: 400 }
    );
  }

  try {
    // Find verification token
    const result = await executeQuery(
      'SELECT * FROM email_verification_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    ) as any[];

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const verificationRecord = result[0];

    // Update user as verified
    await executeQuery(
      'UPDATE users SET email_verified = true WHERE id = ?',
      [verificationRecord.user_id]
    );

    // Delete token
    await executeQuery(
      'DELETE FROM email_verification_tokens WHERE id = ?',
      [verificationRecord.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('[v0] Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
