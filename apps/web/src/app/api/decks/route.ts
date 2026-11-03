import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { DeckService } from '@/lib/services/deck-service';
import { CreateDeckSchema } from '@chizmo/core';

export async function GET() {
  try {
    const session = await getCurrentSession();
    const decks = await DeckService.getDecks(session?.userId);
    return NextResponse.json({ success: true, decks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const parsed = CreateDeckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const deck = await DeckService.createDeck(userId, parsed.data);
    return NextResponse.json({ success: true, deck }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
