import { Card, CardState, QueueItem } from '../types/index.js';
import { calculateRetrievability } from './fsrs.js';

export interface DailyQueueConfig {
  newPerDay: number;
  maxReviews: number;
  timezone: string;
  dayRolloverHour: number; // default 4 (4:00 AM)
  examDate?: Date;
}

export interface DeckWithCards {
  id: string;
  title: string;
  color?: string;
  cards: Card[];
}

export interface MultiDeckQueueResult {
  queue: Array<QueueItem & { deckTitle: string; deckColor: string }>;
  totalDueCount: number;
  totalNewCount: number;
  overdueCount: number;
  isCatchUpMode: boolean;
  requiredNewPerDay: number;
  overallReadiness: number;
}

/**
 * Deterministic pseudo-random number generator for interval fuzzing
 */
export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Apply deterministic jitter to intervals > 3 days to prevent clumped review loads
 */
export function applyFuzz(intervalDays: number, seed: number): number {
  if (intervalDays <= 3) return intervalDays;
  const factor = 0.95 + pseudoRandom(seed) * 0.1; // +/- 5%
  return Math.max(3, Math.round(intervalDays * factor));
}

/**
 * Get the effective "study day" start timestamp for a user given timezone and rollover hour
 */
export function getStudyDayStart(now: Date, rolloverHour = 4): Date {
  const date = new Date(now);
  if (date.getHours() < rolloverHour) {
    date.setDate(date.getDate() - 1);
  }
  date.setHours(rolloverHour, 0, 0, 0);
  return date;
}

/**
 * Calculate exam mode pace: returns required new cards per day to cover all cards by (examDate - 3 days)
 */
export function calculateExamPace(totalCards: number, unlearnedCards: number, now: Date, examDate: Date): {
  requiredNewPerDay: number;
  daysRemaining: number;
} {
  const diffMs = examDate.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const targetDays = Math.max(1, daysRemaining - 3); // Finish 3 days before exam for final review
  const requiredNewPerDay = Math.ceil(unlearnedCards / targetDays);
  return { requiredNewPerDay, daysRemaining };
}

/**
 * Calculate overall deck readiness percentage based on mean retrievability on a future date
 */
export function calculateReadiness(states: CardState[], targetDate: Date): number {
  if (states.length === 0) return 0;
  let totalR = 0;
  for (const st of states) {
    if (st.state === 'NEW') {
      totalR += 0;
      continue;
    }
    const elapsedMs = Math.max(0, targetDate.getTime() - (st.lastReview?.getTime() || targetDate.getTime()));
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    totalR += calculateRetrievability(elapsedDays, st.stability);
  }
  return Number(((totalR / states.length) * 100).toFixed(1));
}

/**
 * Build daily study queue for a single deck
 */
export function buildDailyQueue(
  cards: Card[],
  states: Map<string, CardState>,
  now: Date,
  config: DailyQueueConfig
): QueueItem[] {
  const dueReviews: QueueItem[] = [];
  const newCards: QueueItem[] = [];

  for (const card of cards) {
    const state = states.get(card.id);

    if (!state || state.state === 'NEW') {
      const defaultState: CardState = {
        userId: state?.userId || '',
        cardId: card.id,
        state: 'NEW',
        stability: 0,
        difficulty: 5.0,
        due: now,
        reps: 0,
        lapses: 0,
      };
      newCards.push({
        card,
        state: defaultState,
        isNew: true,
        retrievability: 0,
      });
    } else {
      // Check if due
      if (state.due <= now) {
        const elapsedMs = Math.max(0, now.getTime() - (state.lastReview?.getTime() || now.getTime()));
        const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
        const R = calculateRetrievability(elapsedDays, state.stability);
        dueReviews.push({
          card,
          state,
          isNew: false,
          retrievability: R,
        });
      }
    }
  }

  // Sort due cards: prioritize lowest retrievability (most urgent)
  dueReviews.sort((a, b) => a.retrievability - b.retrievability);

  // Determine new card limit (adjust if exam mode active)
  let allowedNew = config.newPerDay;
  if (config.examDate) {
    const examPace = calculateExamPace(cards.length, newCards.length, now, config.examDate);
    allowedNew = Math.max(config.newPerDay, examPace.requiredNewPerDay);
  }

  const selectedReviews = dueReviews.slice(0, config.maxReviews);
  const selectedNew = newCards.slice(0, allowedNew);

  // Interleave due reviews with new cards to maximize engagement (3:1 ratio)
  const interleaved: QueueItem[] = [];
  let rIdx = 0;
  let nIdx = 0;

  while (rIdx < selectedReviews.length || nIdx < selectedNew.length) {
    for (let i = 0; i < 3 && rIdx < selectedReviews.length; i++) {
      interleaved.push(selectedReviews[rIdx++]);
    }
    if (nIdx < selectedNew.length) {
      interleaved.push(selectedNew[nIdx++]);
    }
  }

  return interleaved;
}

/**
 * Build unified multi-deck daily study queue
 * Interleaves cards across multiple decks and topics so students never get stuck in blocks
 */
export function buildMultiDeckDailyQueue(
  decks: DeckWithCards[],
  states: Map<string, CardState>,
  now: Date,
  config: DailyQueueConfig
): MultiDeckQueueResult {
  const allDuePerDeck: Map<string, Array<QueueItem & { deckTitle: string; deckColor: string }>> = new Map();
  const allNewPerDeck: Map<string, Array<QueueItem & { deckTitle: string; deckColor: string }>> = new Map();

  let totalDueCount = 0;
  let totalNewCount = 0;
  const allStates: CardState[] = [];

  for (const deck of decks) {
    const dueForDeck: Array<QueueItem & { deckTitle: string; deckColor: string }> = [];
    const newForDeck: Array<QueueItem & { deckTitle: string; deckColor: string }> = [];

    for (const card of deck.cards) {
      const state = states.get(card.id);

      if (!state || state.state === 'NEW') {
        const defaultState: CardState = {
          userId: state?.userId || '',
          cardId: card.id,
          state: 'NEW',
          stability: 0,
          difficulty: 5.0,
          due: now,
          reps: 0,
          lapses: 0,
        };
        newForDeck.push({
          card,
          state: defaultState,
          isNew: true,
          retrievability: 0,
          deckTitle: deck.title,
          deckColor: deck.color || '#6366F1',
        });
        totalNewCount++;
      } else {
        allStates.push(state);
        if (state.due <= now) {
          const elapsedMs = Math.max(0, now.getTime() - (state.lastReview?.getTime() || now.getTime()));
          const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
          const R = calculateRetrievability(elapsedDays, state.stability);
          dueForDeck.push({
            card,
            state,
            isNew: false,
            retrievability: R,
            deckTitle: deck.title,
            deckColor: deck.color || '#6366F1',
          });
          totalDueCount++;
        }
      }
    }

    // Sort due cards in deck by retrievability
    dueForDeck.sort((a, b) => a.retrievability - b.retrievability);
    allDuePerDeck.set(deck.id, dueForDeck);
    allNewPerDeck.set(deck.id, newForDeck);
  }

  // Interleave across decks (round-robin)
  const interleavedDue: Array<QueueItem & { deckTitle: string; deckColor: string }> = [];
  const interleavedNew: Array<QueueItem & { deckTitle: string; deckColor: string }> = [];

  let hasMoreDue = true;
  while (hasMoreDue) {
    hasMoreDue = false;
    for (const deck of decks) {
      const dueList = allDuePerDeck.get(deck.id);
      if (dueList && dueList.length > 0) {
        interleavedDue.push(dueList.shift()!);
        if (dueList.length > 0) hasMoreDue = true;
      }
    }
  }

  let hasMoreNew = true;
  while (hasMoreNew) {
    hasMoreNew = false;
    for (const deck of decks) {
      const newList = allNewPerDeck.get(deck.id);
      if (newList && newList.length > 0) {
        interleavedNew.push(newList.shift()!);
        if (newList.length > 0) hasMoreNew = true;
      }
    }
  }

  // Handle daily review limits & catch-up mode
  const overdueCount = Math.max(0, interleavedDue.length - config.maxReviews);
  const isCatchUpMode = overdueCount > 0;
  const selectedDue = interleavedDue.slice(0, config.maxReviews);

  let allowedNew = config.newPerDay;
  let requiredNewPerDay = allowedNew;
  if (config.examDate) {
    const pace = calculateExamPace(
      decks.reduce((sum, d) => sum + d.cards.length, 0),
      totalNewCount,
      now,
      config.examDate
    );
    requiredNewPerDay = pace.requiredNewPerDay;
    allowedNew = Math.max(config.newPerDay, pace.requiredNewPerDay);
  }
  const selectedNew = interleavedNew.slice(0, allowedNew);

  // Combine into final interleaved queue (3 due reviews to 1 new card)
  const finalQueue: Array<QueueItem & { deckTitle: string; deckColor: string }> = [];
  let dIdx = 0;
  let nIdx = 0;

  while (dIdx < selectedDue.length || nIdx < selectedNew.length) {
    for (let i = 0; i < 3 && dIdx < selectedDue.length; i++) {
      finalQueue.push(selectedDue[dIdx++]);
    }
    if (nIdx < selectedNew.length) {
      finalQueue.push(selectedNew[nIdx++]);
    }
  }

  const overallReadiness = calculateReadiness(allStates, config.examDate || now);

  return {
    queue: finalQueue,
    totalDueCount,
    totalNewCount,
    overdueCount,
    isCatchUpMode,
    requiredNewPerDay,
    overallReadiness,
  };
}
