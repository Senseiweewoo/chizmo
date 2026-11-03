import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { DeckService } from '@/lib/services/deck-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params;
    const session = await getCurrentSession();
    const deck = await DeckService.getDeckById(deckId, session?.userId);

    if (!deck) {
      return NextResponse.json({ success: false, error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deck });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params;
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const updated = await DeckService.updateDeck(deckId, userId, body);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deck: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params;
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const ok = await DeckService.deleteDeck(deckId, userId);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
