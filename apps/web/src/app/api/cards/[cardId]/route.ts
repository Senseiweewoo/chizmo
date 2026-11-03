import { NextRequest, NextResponse } from 'next/server';
import { DeckService } from '@/lib/services/deck-service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const ok = await DeckService.deleteCard(cardId);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
