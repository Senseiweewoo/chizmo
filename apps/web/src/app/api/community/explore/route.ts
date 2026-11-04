import { NextRequest, NextResponse } from 'next/server';
import { DeckService } from '@/lib/services/deck-service';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || undefined;
    const tag = searchParams.get('tag') || undefined;

    const decks = await DeckService.getPublicDecks(query, tag);

    return NextResponse.json({
      success: true,
      decks,
      count: decks.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch community decks' },
      { status: 500 }
    );
  }
}
