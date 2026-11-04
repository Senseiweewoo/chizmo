import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { StudyService } from '@/lib/services/study-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const searchParams = req.nextUrl.searchParams;
    const timezone = searchParams.get('timezone') || 'UTC';
    const rolloverHour = parseInt(searchParams.get('rolloverHour') || '4', 10);
    const newPerDay = parseInt(searchParams.get('newPerDay') || '20', 10);
    const maxReviews = parseInt(searchParams.get('maxReviews') || '200', 10);

    const result = await StudyService.getMultiDeckDailyQueue(userId, {
      timezone,
      dayRolloverHour: rolloverHour,
      newPerDay,
      maxReviews,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch daily queue' },
      { status: 500 }
    );
  }
}