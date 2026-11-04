import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { DeckService } from '@/lib/services/deck-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const { deckId, reason, details } = body;

    if (!deckId || !reason) {
      return NextResponse.json({ success: false, error: 'Deck ID and reason are required' }, { status: 400 });
    }

    const report = await DeckService.reportDeck(deckId, userId, reason, details);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}
