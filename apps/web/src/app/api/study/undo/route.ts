import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { StudyService } from '@/lib/services/study-service';

export async function POST() {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const result = await StudyService.undoLastReview(userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
