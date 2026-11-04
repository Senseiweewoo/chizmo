import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { DeckService } from '@/lib/services/deck-service';
import { detectCrisisIntent } from '@chizmo/core';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const userId = session?.userId || 'guest-user';

    const body = await req.json();
    const { deckId, history = [], socraticMode = true } = body;
    const message = body.message || body.question || body.prompt;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // 1. Critical Safety Check: Self-Harm / Crisis Interception
    const crisisCheck = detectCrisisIntent(message);
    if (crisisCheck.isCrisis) {
      return NextResponse.json({
        success: true,
        isCrisis: true,
        reply: crisisCheck.compassionateResponse,
        hotlines: crisisCheck.hotlines,
        suggestedActions: [],
        citations: [],
      });
    }

    // 2. Academic Integrity / Homework Mill Filter
    const essayMillPattern = /\b(write\s+(my|an)\s+(entire|complete|whole)?\s*(essay|paper|assignment))\b/i;
    if (essayMillPattern.test(message)) {
      return NextResponse.json({
        success: true,
        isCrisis: false,
        reply:
          "I'm here to help you master the ideas and write a brilliant essay yourself, rather than writing it for you! Let's start with your central thesis or claim: what is the main argument you want to explore? ⚡",
        suggestedActions: [
          'Help me brainstorm thesis ideas',
          'Outline 3 main body arguments',
          'Find strong evidence in my notes',
        ],
        citations: [],
      });
    }

    // 3. Deck Grounding Context
    let deckCardsText = '';
    let citations: string[] = [];

    if (deckId) {
      const deck = await DeckService.getDeckById(deckId, userId);
      const cards = deck?.cards || [];
      if (cards.length > 0) {
        // Find most relevant cards based on simple keyword token overlap
        const tokens = message.toLowerCase().split(/\s+/).filter((t: string) => t.length > 3);
        const relevant = cards.filter((c: any) => {
          const combined = (c.front + ' ' + c.back).toLowerCase();
          return tokens.some((t: string) => combined.includes(t));
        });

        const cardsToUse = relevant.length > 0 ? relevant.slice(0, 3) : cards.slice(0, 3);
        deckCardsText = cardsToUse
          .map((c: any, i: number) => `Card ${i + 1}: Q: "${c.front}" | A: "${c.back}"`)
          .join('\n');
        citations = cardsToUse.map((c: any) => c.front);
      }
    }

    // 4. Socratic Tutor Formulation
    let reply = '';
    let suggestedActions = [
      'Give me a simpler hint 💡',
      'Explain like I’m 5 🧒',
      'Give a real-world example 🌍',
      'Quiz me on this concept 🎯',
    ];

    const lower = message.toLowerCase();
    if (lower.includes('hint')) {
      reply = `Here is a guiding clue: focus on what happens to the energy state before and after the interaction occurs. Notice how one side gains while the other balances it out. What does that suggest about the core rule?`;
    } else if (lower.includes('like i’m 5') || lower.includes('eli5')) {
      reply = `Imagine you have a piggy bank. You can't spend money until you drop coins in. In this concept, the coins are the inputs, and the spending is the output. What do you think happens if the piggy bank is empty?`;
    } else if (lower.includes('quiz me')) {
      reply = `Quick active recall challenge! Based on your deck notes:\n\nIf you remove the primary limiting factor, does the overall rate accelerate indefinitely, or does another bottleneck take over? Take a guess!`;
    } else if (deckCardsText) {
      reply = `Great question! Looking at your deck materials:\n\nNotice that **${citations[0] || 'the core concept'}** is closely tied to your question. Instead of jumping to the final conclusion, what is the very first step in this process?`;
    } else {
      reply = `That's an important concept! To help this stick in your long-term memory: what part of this feels most confusing—the definition itself, or how it gets applied in exam problems?`;
    }

    return NextResponse.json({
      success: true,
      isCrisis: false,
      reply,
      suggestedActions,
      citations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Tutor session error' },
      { status: 500 }
    );
  }
}
