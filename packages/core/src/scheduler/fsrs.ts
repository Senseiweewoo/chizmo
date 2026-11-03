import { CardState, FSRSConfig, Rating, ReviewLogEntry } from '../types/index.js';

/**
 * Standard FSRS-4.5 Default Weights (17 parameters)
 */
export const DEFAULT_FSRS_WEIGHTS: number[] = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61
];

export const DEFAULT_FSRS_CONFIG: FSRSConfig = {
  requestRetention: 0.9,
  maximumInterval: 36500, // 100 years cap
  w: DEFAULT_FSRS_WEIGHTS,
  learningSteps: [1, 10], // 1 min, 10 mins
};

const DECAY = -0.5;
const FACTOR = 19 / 81;

/**
 * Clamp a number within [min, max]
 */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Calculate retrievability (probability of recall) given elapsed days t and stability S
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1.0;
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

/**
 * Calculate next review interval in days for desired target retention r
 */
export function calculateNextInterval(stability: number, requestRetention = 0.9, maxInterval = 36500): number {
  if (stability <= 0) return 1;
  const interval = (stability / FACTOR) * (Math.pow(requestRetention, 1 / DECAY) - 1);
  return Math.max(1, Math.min(maxInterval, Math.round(interval)));
}

/**
 * Initial stability S0 based on initial grade G (1: Again, 2: Hard, 3: Good, 4: Easy)
 */
export function initialStability(rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  return Math.max(0.1, w[rating - 1]);
}

/**
 * Initial difficulty D0 based on initial grade G
 */
export function initialDifficulty(rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  const d0 = w[4] - w[5] * (rating - 3);
  return clamp(d0, 1, 10);
}

/**
 * Update difficulty based on current D and new rating G with mean reversion
 */
export function nextDifficulty(currentD: number, rating: Rating, w = DEFAULT_FSRS_WEIGHTS): number {
  const d0_3 = initialDifficulty(3, w);
  const target = currentD - w[6] * (rating - 3);
  const updated = w[7] * d0_3 + (1 - w[7]) * target;
  return clamp(updated, 1, 10);
}

/**
 * Update stability on successful recall (G in [2, 3, 4])
 */
export function nextRecallStability(
  currentD: number,
  currentS: number,
  retrievability: number,
  rating: Rating,
  w = DEFAULT_FSRS_WEIGHTS
): number {
  const hardPenalty = rating === 2 ? w[15] : 1.0;
  const easyBonus = rating === 4 ? w[16] : 1.0;
  const factor =
    1 +
    Math.exp(w[8]) *
      (11 - currentD) *
      Math.pow(currentS, -w[9]) *
      (Math.exp(w[10] * (1 - retrievability)) - 1) *
      hardPenalty *
      easyBonus;

  return Math.max(0.1, currentS * factor);
}

/**
 * Update stability on failure / lapse (G === 1)
 */
export function nextForgetStability(
  currentD: number,
  currentS: number,
  retrievability: number,
  w = DEFAULT_FSRS_WEIGHTS
): number {
  const nextS =
    w[11] *
    Math.pow(currentD, -w[12]) *
    (Math.pow(currentS + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - retrievability));

  // Stability after lapse should not exceed prior stability
  return Math.max(0.1, Math.min(currentS, nextS));
}

/**
 * Core FSRS schedule function
 * Pure function: pass in current state, rating, current timestamp 'now', and config
 */
export function scheduleCard(
  currentState: CardState | null,
  rating: Rating,
  now: Date,
  config: FSRSConfig = DEFAULT_FSRS_CONFIG
): { next: CardState; log: ReviewLogEntry } {
  const w = config.w;
  const isFirstReview = !currentState || currentState.state === 'NEW' || currentState.reps === 0;

  let elapsedDays = 0;
  let currentS = 0;
  let currentD = 5.0;
  let reps = 0;
  let lapses = 0;
  let prevState = currentState?.state || 'NEW';

  if (!isFirstReview && currentState?.lastReview) {
    const elapsedMs = Math.max(0, now.getTime() - currentState.lastReview.getTime());
    elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    currentS = currentState.stability;
    currentD = currentState.difficulty;
    reps = currentState.reps;
    lapses = currentState.lapses;
  }

  let nextS: number;
  let nextD: number;
  let nextState = prevState;
  let intervalDays = 1;

  if (isFirstReview) {
    nextS = initialStability(rating, w);
    nextD = initialDifficulty(rating, w);
    reps = 1;

    if (rating === 1) {
      nextState = 'LEARNING';
      lapses = 1;
      intervalDays = config.learningSteps[0] / (24 * 60); // In fractional days
    } else if (rating === 2 || rating === 3) {
      nextState = 'LEARNING';
      intervalDays = (config.learningSteps[1] || 10) / (24 * 60);
    } else {
      // Rating 4 graduates immediately
      nextState = 'REVIEW';
      intervalDays = calculateNextInterval(nextS, config.requestRetention, config.maximumInterval);
    }
  } else {
    // Mature or learning review
    const R = calculateRetrievability(elapsedDays, currentS);
    nextD = nextDifficulty(currentD, rating, w);

    if (rating === 1) {
      // Lapse
      nextS = nextForgetStability(currentD, currentS, R, w);
      lapses += 1;
      nextState = 'RELEARNING';
      intervalDays = config.learningSteps[0] / (24 * 60);
    } else {
      // Success
      nextS = nextRecallStability(currentD, currentS, R, rating, w);
      reps += 1;
      nextState = 'REVIEW';
      intervalDays = calculateNextInterval(nextS, config.requestRetention, config.maximumInterval);
    }
  }

  const nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  const nextCardState: CardState = {
    userId: currentState?.userId || 'unknown',
    cardId: currentState?.cardId || 'unknown',
    state: nextState,
    stability: Number(nextS.toFixed(4)),
    difficulty: Number(nextD.toFixed(4)),
    due: nextDue,
    lastReview: now,
    reps,
    lapses,
  };

  const logEntry: ReviewLogEntry = {
    userId: nextCardState.userId,
    cardId: nextCardState.cardId,
    rating,
    prevState,
    elapsedDays: Number(elapsedDays.toFixed(4)),
    scheduledDays: Number(intervalDays.toFixed(4)),
    reviewedAt: now,
  };

  return { next: nextCardState, log: logEntry };
}
