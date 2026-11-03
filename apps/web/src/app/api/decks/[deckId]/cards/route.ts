import { NextRequest, NextResponse } from 'next/server';
import { DeckService } from '@/lib/services/deck-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params;
    const body = await req.json();

    if (!body.front || !body.back) {
      return NextResponse.json(
        { success: false, error: 'Front and Back text are required.' },
        { status: 400 }
      );
    }

    const card = await DeckService.addCard(deckId, body);
    return NextResponse.json({ success: true, card }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
