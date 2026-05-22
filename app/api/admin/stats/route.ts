import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, unauthorizedResponse } from '@/lib/auth';
import { executeQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = verifyTokenFromRequest(req);

  if (!token || token.user_type !== 'admin') {
    return unauthorizedResponse();
  }

  try {
    // Get dashboard stats
    const [usersCount, escortsCount, clientsCount, advertisersCount, totalBookings, pendingVerifications] = await Promise.all([
      executeQuery('SELECT COUNT(*) as count FROM users') as any,
      executeQuery('SELECT COUNT(*) as count FROM escorts') as any,
      executeQuery('SELECT COUNT(*) as count FROM clients') as any,
      executeQuery('SELECT COUNT(*) as count FROM advertisers') as any,
      executeQuery('SELECT COUNT(*) as count FROM bookings') as any,
      executeQuery('SELECT COUNT(*) as count FROM users WHERE verification_status = "pending"') as any,
    ]);

    return NextResponse.json({
      users: (usersCount as any)[0].count,
      escorts: (escortsCount as any)[0].count,
      clients: (clientsCount as any)[0].count,
      advertisers: (advertisersCount as any)[0].count,
      bookings: (totalBookings as any)[0].count,
      pendingVerifications: (pendingVerifications as any)[0].count,
    });
  } catch (error) {
    console.error('[v0] Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
