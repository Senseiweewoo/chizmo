import { NextResponse } from 'next/server';
import { prisma } from '@chizmo/db';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
        subscription: true,
        entitlement: true,
        _count: {
          select: {
            decks: true,
            reviewLogs: true,
            achievements: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.userId,
          email: session.email || null,
          displayName: session.displayName,
          isGuest: session.isGuest,
          role: session.role || 'USER',
          timezone: 'UTC',
          dayRolloverHour: 4,
          stats: {
            deckCount: 1,
            reviewsCompleted: 5,
            achievementsUnlocked: 1,
          },
        },
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isGuest: user.isGuest,
        role: user.role,
        timezone: user.timezone,
        dayRolloverHour: user.dayRolloverHour,
        profile: user.profile,
        subscription: user.subscription,
        entitlement: user.entitlement,
        stats: {
          deckCount: user._count.decks,
          reviewsCompleted: user._count.reviewLogs,
          achievementsUnlocked: user._count.achievements,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
