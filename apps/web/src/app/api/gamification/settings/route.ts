import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { GamificationService } from '@/lib/services/gamification-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const updated = await GamificationService.updateSettings(userId, body);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
