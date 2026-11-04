import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { StudyService } from '@/lib/services/study-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const searchParams = req.nextUrl.searchParams;
    const deckId = searchParams.get('deckId') || undefined;

    const weakSpots = await StudyService.getWeakSpots(userId, deckId);

    return NextResponse.json({
      success: true,
      weakSpots,
      count: weakSpots.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch weak spots' },
      { status: 500 }
    );
  }
}
