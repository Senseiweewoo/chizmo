import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { StudyService } from '@/lib/services/study-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const searchParams = req.nextUrl.searchParams;
    const cardId = searchParams.get('cardId');
    const examDateStr = searchParams.get('examDate');
    const examDate = examDateStr ? new Date(examDateStr) : undefined;

    if (!cardId) {
      return NextResponse.json(
        { success: false, error: 'cardId query param is required' },
        { status: 400 }
      );
    }

    const previews = StudyService.getIntervalPreviews(userId, cardId, new Date(), examDate);

    return NextResponse.json({
      success: true,
      cardId,
      previews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to preview intervals' },
      { status: 500 }
    );
  }
}