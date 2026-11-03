import { Card, CardState, QueueItem } from '../types/index.js';
import { calculateRetrievability } from './fsrs.js';

export interface DailyQueueConfig {
  newPerDay: number;
  maxReviews: number;
  timezone: string;
  dayRolloverHour: number; // default 4 (4:00 AM)
  examDate?: Date;
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
 * Build daily study queue with interleaving and capacity caps
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

  // Interleave due reviews with new cards to maximize engagement
  const interleaved: QueueItem[] = [];
  let rIdx = 0;
  let nIdx = 0;

  while (rIdx < selectedReviews.length || nIdx < selectedNew.length) {
    // Interleave ratio: 3 reviews to 1 new card
    for (let i = 0; i < 3 && rIdx < selectedReviews.length; i++) {
      interleaved.push(selectedReviews[rIdx++]);
    }
    if (nIdx < selectedNew.length) {
      interleaved.push(selectedNew[nIdx++]);
    }
  }

  return interleaved;
}
