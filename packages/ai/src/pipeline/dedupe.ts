import { GeneratedCard } from '../interface.js';

/**
 * Tokenize and normalize text into a word frequency bag or word set
 */
function tokenize(str: string): Set<string> {
  const words = str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Jaccard similarity between two word sets
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface DedupeResult {
  uniqueCards: GeneratedCard[];
  droppedDuplicates: Array<{ card: GeneratedCard; reason: string }>;
}

/**
 * Deduplicate cards within a deck using exact hash and fuzzy text similarity
 */
export function deduplicateCards(
  cards: GeneratedCard[],
  similarityThreshold = 0.80
): DedupeResult {
  const uniqueCards: GeneratedCard[] = [];
  const droppedDuplicates: Array<{ card: GeneratedCard; reason: string }> = [];

  const seenExactFronts = new Set<string>();
  const cardTokenSets: Array<{ card: GeneratedCard; tokens: Set<string> }> = [];

  for (const card of cards) {
    const normFront = card.front.trim().toLowerCase();

    // 1. Exact match
    if (seenExactFronts.has(normFront)) {
      droppedDuplicates.push({
        card,
        reason: 'Exact duplicate question prompt',
      });
      continue;
    }

    // 2. Fuzzy token similarity against previously accepted cards
    const currentTokens = tokenize(card.front);
    let isFuzzyDuplicate = false;
    let duplicateWith: string | null = null;

    for (const prior of cardTokenSets) {
      const sim = jaccardSimilarity(currentTokens, prior.tokens);
      if (sim >= similarityThreshold) {
        isFuzzyDuplicate = true;
        duplicateWith = prior.card.front;
        break;
      }
    }

    if (isFuzzyDuplicate) {
      droppedDuplicates.push({
        card,
        reason: `Substantially similar to existing card: "${duplicateWith}"`,
      });
      continue;
    }

    // Accepted as unique
    seenExactFronts.add(normFront);
    cardTokenSets.push({ card, tokens: currentTokens });
    uniqueCards.push(card);
  }

  return {
    uniqueCards,
    droppedDuplicates,
  };
}