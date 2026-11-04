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
export function clamp(val: number, min: number, max: number): number {
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
 * Calculate dynamically raised retention in exam mode
 * In the final 7 days before an exam date, target retention is raised up to 0.96 for peak recall
 */
export function calculateDynamicRetention(now: Date, examDate?: Date, baseRetention = 0.9): number {
  if (!examDate) return baseRetention;
  const diffMs = examDate.getTime() - now.getTime();
  const daysToExam = diffMs / (1000 * 60 * 60 * 24);

  if (daysToExam <= 0) return 0.96;
  if (daysToExam <= 7) {
    // Elevate retention linearly from baseRetention (e.g. 0.90) to 0.96
    const fraction = (7 - daysToExam) / 7;
    return Number((baseRetention + fraction * (0.96 - baseRetention)).toFixed(3));
  }
  return baseRetention;
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
 * Check if a card has reached the leech threshold (8 or more lapses)
 */
export function isLeechCard(state: CardState, threshold = 8): boolean {
  return state.lapses >= threshold;
}

/**
 * Deterministic pseudo-random number generator for interval fuzzing
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Apply deterministic jitter to intervals > 3 days to prevent clumped review loads
 */
export function applyIntervalFuzz(intervalDays: number, seed?: number): number {
  if (intervalDays <= 3) return intervalDays;
  const actualSeed = seed ?? intervalDays * 1337;
  const factor = 0.95 + pseudoRandom(actualSeed) * 0.1; // +/- 5%
  return Math.max(3, Math.round(intervalDays * factor));
}

export interface ScheduleOptions {
  config?: FSRSConfig;
  examDate?: Date;
  fuzzSeed?: number;
}

/**
 * Core FSRS schedule function
 * Pure function: pass in current state, rating, current timestamp 'now', and options
 */
export function scheduleCard(
  currentState: CardState | null,
  rating: Rating,
  now: Date,
  optionsOrConfig: FSRSConfig | ScheduleOptions = DEFAULT_FSRS_CONFIG
): { next: CardState; log: ReviewLogEntry } {
  const options: ScheduleOptions =
    'requestRetention' in optionsOrConfig
      ? { config: optionsOrConfig }
      : optionsOrConfig;

  const config = options.config || DEFAULT_FSRS_CONFIG;
  const w = config.w;
  const isFirstReview = !currentState || currentState.state === 'NEW' || currentState.reps === 0;

  // Dynamically raise retention in final week of exam mode
  const effectiveRetention = calculateDynamicRetention(now, options.examDate, config.requestRetention);

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
      const rawInterval = calculateNextInterval(nextS, effectiveRetention, config.maximumInterval);
      intervalDays = applyIntervalFuzz(rawInterval, options.fuzzSeed);
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
      const rawInterval = calculateNextInterval(nextS, effectiveRetention, config.maximumInterval);
      intervalDays = applyIntervalFuzz(rawInterval, options.fuzzSeed);
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

/**
 * Deterministically replay a sequence of review logs to reconstruct CardState
 * Verifies that the append-only ReviewLog is the single source of truth
 */
export function replayReviewLogs(
  logs: ReviewLogEntry[],
  config: FSRSConfig = DEFAULT_FSRS_CONFIG
): CardState | null {
  if (logs.length === 0) return null;

  // Sort logs chronologically
  const sorted = [...logs].sort((a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime());

  let state: CardState | null = null;
  for (const log of sorted) {
    const res = scheduleCard(state, log.rating, log.reviewedAt, config);
    state = res.next;
    state.userId = log.userId;
    state.cardId = log.cardId;
  }

  return state;
}

/**
 * Format interval in days into a human-readable badge (e.g., '<1m', '10m', '1d', '3d', '2.5mo')
 */
export function formatInterval(days: number): string {
  if (days <= 0) return '<1m';
  const minutes = days * 24 * 60;
  if (minutes < 1.5) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = days * 24;
  if (hours < 24) return `${Math.round(hours)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${(days / 30).toFixed(1)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export interface IntervalPreview {
  rating: Rating;
  label: 'Again' | 'Hard' | 'Good' | 'Easy';
  intervalDays: number;
  formatted: string;
  nextDue: Date;
}

const RATING_LABELS: Record<Rating, 'Again' | 'Hard' | 'Good' | 'Easy'> = {
  1: 'Again',
  2: 'Hard',
  3: 'Good',
  4: 'Easy',
};

/**
 * Calculate predicted next intervals for all 4 ratings without modifying state
 */
export function previewIntervals(
  currentState: CardState | null,
  now: Date,
  optionsOrConfig: FSRSConfig | ScheduleOptions = DEFAULT_FSRS_CONFIG
): IntervalPreview[] {
  const ratings: Rating[] = [1, 2, 3, 4];
  return ratings.map((rating) => {
    const { next, log } = scheduleCard(currentState, rating, now, optionsOrConfig);
    return {
      rating,
      label: RATING_LABELS[rating],
      intervalDays: log.scheduledDays,
      formatted: formatInterval(log.scheduledDays),
      nextDue: next.due,
    };
  });
}
