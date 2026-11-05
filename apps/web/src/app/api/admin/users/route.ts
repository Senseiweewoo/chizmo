import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { requireAdmin } from '@/lib/auth/rbac';
import { prisma } from '@chizmo/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    requireAdmin(session);

    let users: any[] = [];
    try {
      users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          isGuest: true,
          createdAt: true,
          _count: {
            select: { decks: true, reviewLogs: true },
          },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      users = [
        {
          id: 'user_demo_scholar',
          email: 'scholar@chizmo.app',
          displayName: 'Demo Scholar 🦉',
          role: 'ADMIN',
          isGuest: false,
          createdAt: new Date(),
          _count: { decks: 4, reviewLogs: 220 },
        },
      ];
    }

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    const status = error.statusCode || 403;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
