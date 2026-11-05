import { NextRequest, NextResponse } from 'next/server';
import { DeckService } from '@/lib/services/deck-service';
import { getCurrentSession } from '@/lib/auth/session';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const ok = await DeckService.deleteCard(cardId, userId);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    const status = error.message?.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
