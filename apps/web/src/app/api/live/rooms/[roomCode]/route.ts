import { NextRequest, NextResponse } from 'next/server';
import { LiveRoomService } from '@/lib/services/live-room-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const resolvedParams = await params;
    const roomCode = resolvedParams.roomCode;

    const room = LiveRoomService.getRoom(roomCode);
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const currentQ = room.questions[room.currentQuestionIndex];
    const leaderboard = LiveRoomService.getLeaderboard(roomCode);

    return NextResponse.json({
      success: true,
      room: {
        code: room.code,
        hostId: room.hostId,
        deckId: room.deckId,
        deckTitle: room.deckTitle,
        status: room.status,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length,
        questionDurationSec: room.questionDurationSec,
        questionStartTs: room.questionStartTs,
        playerCount: room.players.size,
        currentQuestion: currentQ
          ? {
              prompt: currentQ.prompt,
              choices: currentQ.choices,
              correctIndex: room.status === 'REVEAL' || room.status === 'LEADERBOARD' || room.status === 'PODIUM'
                ? currentQ.correctIndex
                : undefined,
              explanation: room.status === 'REVEAL' ? currentQ.explanation : undefined,
            }
          : null,
        leaderboard,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch room state' },
      { status: 500 }
    );
  }
}
