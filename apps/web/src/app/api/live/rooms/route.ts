import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { LiveRoomService } from '@/lib/services/live-room-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const hostId = session?.userId || 'guest-host';

    const body = await req.json();
    const { deckId, durationSec = 15 } = body;

    if (!deckId) {
      return NextResponse.json({ success: false, error: 'Deck ID is required' }, { status: 400 });
    }

    const room = await LiveRoomService.createRoom(hostId, deckId, durationSec);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Failed to create room with deck' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      code: room.code,
      deckTitle: room.deckTitle,
      questionCount: room.questions.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize live room' },
      { status: 500 }
    );
  }
}
