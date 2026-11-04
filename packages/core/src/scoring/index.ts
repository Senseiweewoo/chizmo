/**
 * Real-time Multiplayer & Quiz Scoring Engine
 * Pure logic for server-authoritative scoring and latency adjustment
 */

export * from './write-grading.js';

export interface ScoreCalculationInput {
  basePoints?: number; // Default 1000
  totalAllowedMs: number;
  serverStartTs: number;
  clientAnswerTs: number;
  serverReceiveTs: number;
  pingRttMs?: number;
  isCorrect: boolean;
  currentStreak: number;
}

export interface ScoreCalculationResult {
  isCorrect: boolean;
  pointsAwarded: number;
  adjustedResponseMs: number;
  newStreak: number;
  streakBonusFraction: number;
  speedBonusFraction: number;
}

/**
 * Calculate server-authoritative score with latency offset compensation
 */
export function calculateQuizScore(input: ScoreCalculationInput): ScoreCalculationResult {
  const basePoints = input.basePoints ?? 1000;

  if (!input.isCorrect) {
    return {
      isCorrect: false,
      pointsAwarded: 0,
      adjustedResponseMs: Math.max(0, input.serverReceiveTs - input.serverStartTs),
      newStreak: 0,
      streakBonusFraction: 0,
      speedBonusFraction: 0,
    };
  }

  // Adjust response time taking half of the measured ping RTT into account
  const rttOffset = (input.pingRttMs ?? 0) / 2;
  const rawElapsed = input.serverReceiveTs - input.serverStartTs;
  const adjustedResponseMs = Math.max(50, Math.min(input.totalAllowedMs, rawElapsed - rttOffset));

  const remainingFraction = Math.max(0, (input.totalAllowedMs - adjustedResponseMs) / input.totalAllowedMs);
  const speedBonusFraction = 0.5 + 0.5 * remainingFraction; // Between 0.5 and 1.0

  // Streak bonus: +5% per consecutive correct answer up to 5 streak (max 25%)
  const newStreak = input.currentStreak + 1;
  const streakBonusFraction = Math.min(0.25, (newStreak - 1) * 0.05);

  const totalMultiplier = speedBonusFraction * (1 + streakBonusFraction);
  const pointsAwarded = Math.round(basePoints * totalMultiplier);

  return {
    isCorrect: true,
    pointsAwarded,
    adjustedResponseMs: Math.round(adjustedResponseMs),
    newStreak,
    streakBonusFraction,
    speedBonusFraction,
  };
}
