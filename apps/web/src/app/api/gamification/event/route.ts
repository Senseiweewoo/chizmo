import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { GamificationService } from '@/lib/services/gamification-service';
import { GamificationEvent } from '@chizmo/core';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';
    const displayName = session?.email ? session.email.split('@')[0] : 'Chizmo Explorer';

    const body = await req.json();
    const event: GamificationEvent = body.event;

    if (!event || !event.type) {
      return NextResponse.json({ success: false, error: 'Invalid event payload' }, { status: 400 });
    }

    const result = await GamificationService.recordEvent(userId, event, displayName);

    return NextResponse.json({
      success: true,
      xpEarned: result.xpEarned,
      leveledUp: result.leveledUp,
      level: result.profile.state.level,
      totalXp: result.profile.state.xp,
      streakDays: result.profile.state.streakDays,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record event' },
      { status: 500 }
    );
  }
}
