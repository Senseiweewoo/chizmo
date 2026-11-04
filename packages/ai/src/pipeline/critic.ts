import { GeneratedCard, CriticResponse } from '../interface.js';

export interface CriticFilterResult {
  acceptedCards: GeneratedCard[];
  modifiedCards: Array<{ original: GeneratedCard; fixed: GeneratedCard; reason: string }>;
  droppedCards: Array<{ card: GeneratedCard; reason: string }>;
}

/**
 * Perform local heuristic atomic validation on generated cards
 */
export function validateCardHeuristics(card: GeneratedCard): { passes: boolean; reason?: string } {
  const frontWords = card.front.trim().split(/\s+/).length;
  const backWords = card.back.trim().split(/\s+/).length;

  // Front should be under 25 words per atomic card rule
  if (frontWords > 25) {
    return { passes: false, reason: `Prompt is too verbose (${frontWords} words). Must be atomic and < 25 words.` };
  }

  // Back should be under 40 words per atomic card rule
  if (backWords > 40) {
    return { passes: false, reason: `Answer is too verbose (${backWords} words). Split into atomic facts (< 40 words).` };
  }

  // Avoid vague open-ended prompts
  const lowerFront = card.front.toLowerCase();
  if (
    lowerFront.startsWith('discuss ') ||
    lowerFront.startsWith('explain in detail ') ||
    lowerFront.includes('explain in detail') ||
    lowerFront.startsWith('write an essay ')
  ) {
    return { passes: false, reason: 'Too open-ended for active recall. Needs concrete question.' };
  }

  // Avoid meta references to text
  if (lowerFront.includes('according to the text') || lowerFront.includes('as stated in the passage')) {
    return { passes: false, reason: 'Must be self-contained; remove "according to the text".' };
  }

  return { passes: true };
}

/**
 * Apply LLM critic pass evaluations to filter, fix, or drop cards
 */
export function applyCriticPass(
  cards: GeneratedCard[],
  criticResponse: CriticResponse
): CriticFilterResult {
  const acceptedCards: GeneratedCard[] = [];
  const modifiedCards: Array<{ original: GeneratedCard; fixed: GeneratedCard; reason: string }> = [];
  const droppedCards: Array<{ card: GeneratedCard; reason: string }> = [];

  const evalMap = new Map<number, (typeof criticResponse.evaluations)[0]>();
  for (const ev of criticResponse.evaluations) {
    evalMap.set(ev.cardIndex, ev);
  }

  cards.forEach((card, idx) => {
    // 1. Run quick heuristic rules
    const heuristic = validateCardHeuristics(card);
    if (!heuristic.passes) {
      droppedCards.push({ card, reason: heuristic.reason || 'Failed heuristic atomicity' });
      return;
    }

    const evaluation = evalMap.get(idx);
    if (!evaluation) {
      // If critic didn't evaluate, keep card if heuristic passed
      acceptedCards.push(card);
      return;
    }

    if (evaluation.verdict === 'drop') {
      droppedCards.push({ card, reason: evaluation.reason });
    } else if (evaluation.verdict === 'fix' && evaluation.fixedCard) {
      modifiedCards.push({
        original: card,
        fixed: evaluation.fixedCard,
        reason: evaluation.reason,
      });
      acceptedCards.push(evaluation.fixedCard);
    } else {
      acceptedCards.push(card);
    }
  });

  return {
    acceptedCards,
    modifiedCards,
    droppedCards,
  };
}