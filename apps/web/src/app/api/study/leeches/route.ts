import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { StudyService } from '@/lib/services/study-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const searchParams = req.nextUrl.searchParams;
    const deckId = searchParams.get('deckId') || undefined;

    const leeches = await StudyService.getLeechCards(userId, deckId);

    return NextResponse.json({
      success: true,
      leeches,
      count: leeches.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch leech cards' },
      { status: 500 }
    );
  }
}