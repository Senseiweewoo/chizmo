import { NextRequest, NextResponse } from 'next/server';
import { LiveRoomService } from '@/lib/services/live-room-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const resolvedParams = await params;
    const roomCode = resolvedParams.roomCode;

    const body = await req.json();
    const { playerId, nickname, avatar } = body;

    if (!nickname) {
      return NextResponse.json({ success: false, error: 'Nickname is required' }, { status: 400 });
    }

    const assignedId = playerId || `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const result = LiveRoomService.joinRoom(roomCode, assignedId, nickname, avatar);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      player: result.player,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to join room' },
      { status: 500 }
    );
  }
}
