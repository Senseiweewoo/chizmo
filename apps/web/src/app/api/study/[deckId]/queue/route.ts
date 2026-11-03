import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { StudyService } from '@/lib/services/study-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params;
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const queue = await StudyService.getStudyQueue(deckId, userId);
    return NextResponse.json({ success: true, ...queue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
