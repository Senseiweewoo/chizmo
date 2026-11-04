import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { DeckService } from '@/lib/services/deck-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const { deckId, format = 'TLDR', content, text } = body;

    let title = 'Study Guide Summary';
    let cards: any[] = [];

    if (deckId) {
      const deck = await DeckService.getDeckById(deckId, userId);
      if (deck) {
        title = deck.title;
        cards = deck.cards || [];
      }
    } else if (content || text) {
      const rawText = (content || text).trim();
      title = 'Custom Study Notes';
      cards = [
        {
          front: 'Primary Topic Focus',
          back: rawText,
          hint: 'Fundamental synthesis',
        },
      ];
    }

    if (cards.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Deck contains no cards to summarize',
      }, { status: 400 });
    }

    // Synthesize structured summary sections
    const executiveTldr = `This high-yield synthesis covers ${cards.length} core concepts from "${title}". Mastering these fundamental relationships will provide a defensible foundation for both conceptual multiple choice and detailed exam explanations.`;

    const keyConcepts = cards.slice(0, 8).map((c) => ({
      concept: c.front,
      explanation: c.back,
      mnemonic: c.hint || undefined,
    }));

    const commonPitfalls = [
      `Confusing the primary mechanism with secondary downstream effects.`,
      `Over-generalizing the rule without noting standard exceptions.`,
      `Mixing up related technical terminology with similar prefixes.`,
    ];

    const highYieldQuestions = cards.slice(0, 3).map((c, i) => ({
      questionNumber: i + 1,
      prompt: `Can you explain the exact significance of: "${c.front}" without looking at your notes?`,
      answerKey: c.back,
    }));

    return NextResponse.json({
      success: true,
      title,
      format,
      executiveTldr,
      keyConcepts,
      commonPitfalls,
      highYieldQuestions,
      cardCount: cards.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
