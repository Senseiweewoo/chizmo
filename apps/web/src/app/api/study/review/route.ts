import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { StudyService } from '@/lib/services/study-service';
import { SubmitReviewSchema } from '@chizmo/core';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const parsed = SubmitReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid rating' },
        { status: 400 }
      );
    }

    const { cardId, rating, responseMs } = parsed.data;
    const result = await StudyService.submitReview(userId, cardId, rating, responseMs);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
