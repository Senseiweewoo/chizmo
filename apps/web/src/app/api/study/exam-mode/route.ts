import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { StudyService } from '@/lib/services/study-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const { deckId, examDate } = body;

    if (!deckId) {
      return NextResponse.json(
        { success: false, error: 'deckId is required' },
        { status: 400 }
      );
    }

    const parsedDate = examDate ? new Date(examDate) : null;
    const result = await StudyService.configureExamMode(deckId, userId, parsedDate);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update exam mode' },
      { status: 500 }
    );
  }
}