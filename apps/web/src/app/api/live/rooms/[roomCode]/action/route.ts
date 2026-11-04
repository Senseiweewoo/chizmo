import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { LiveRoomService } from '@/lib/services/live-room-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const resolvedParams = await params;
    const roomCode = resolvedParams.roomCode;

    const session = await getCurrentSession();
    const currentUserId = session?.userId || 'guest-user';

    const body = await req.json();
    const { action, status, playerId, choiceIndex, responseMs } = body;

    // Action 1: Host advances state
    if (action === 'ADVANCE_STATE') {
      const updated = LiveRoomService.advanceState(roomCode, currentUserId, status);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Unauthorized or invalid room' }, { status: 403 });
      }
      return NextResponse.json({ success: true, status: updated.status, questionIndex: updated.currentQuestionIndex });
    }

    // Action 2: Player submits answer
    if (action === 'SUBMIT_ANSWER') {
      if (typeof choiceIndex !== 'number' || typeof responseMs !== 'number') {
        return NextResponse.json({ success: false, error: 'choiceIndex and responseMs required' }, { status: 400 });
      }

      const pId = playerId || currentUserId;
      const res = LiveRoomService.submitAnswer(roomCode, pId, choiceIndex, responseMs);
      if (!res) {
        return NextResponse.json({ success: false, error: 'Submission rejected (question may be closed)' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        ...res,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Action failed' },
      { status: 500 }
    );
  }
}
