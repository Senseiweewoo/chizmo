import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { DeckService } from '@/lib/services/deck-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const { deckId } = body;

    if (!deckId) {
      return NextResponse.json({ success: false, error: 'Deck ID is required' }, { status: 400 });
    }

    const forked = await DeckService.forkDeck(deckId, userId);
    if (!forked) {
      return NextResponse.json({ success: false, error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deck: forked,
      message: 'Deck successfully cloned to your personal library!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fork deck' },
      { status: 500 }
    );
  }
}
