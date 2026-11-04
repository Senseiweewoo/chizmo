import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { GamificationService } from '@/lib/services/gamification-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const result = await GamificationService.repairStreak(userId);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to repair streak' },
      { status: 500 }
    );
  }
}
