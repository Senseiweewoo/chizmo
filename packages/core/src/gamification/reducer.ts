import { Rating, UserStats } from '../types/index.js';

export type GamificationEvent =
  | { type: 'CARD_REVIEWED'; rating: Rating; isDue: boolean; cardId: string }
  | { type: 'SESSION_COMPLETED'; cardsCount: number; correctCount: number; durationMs: number }
  | { type: 'QUIZ_FINISHED'; score: number; isPerfect: boolean }
  | { type: 'DECK_CREATED'; cardCount: number }
  | { type: 'LIVE_GAME_WON'; rank: number };

export interface GamificationState {
  userId: string;
  xp: number;
  level: number;
  streakDays: number;
  streakFrozen: boolean;
  freezesRemaining: number;
  cardsStudiedToday: number;
  lastStudyDate: string; // YYYY-MM-DD
  lastQualifiedDate?: string; // YYYY-MM-DD when streak was awarded
  unlockedAchievements: string[];
}

/**
 * Calculate total XP required to reach level n
 * Formula: xpForLevel(n) = round(100 * n^1.5)
 */
export function xpForLevel(n: number): number {
  if (n <= 1) return 0;
  return Math.round(100 * Math.pow(n - 1, 1.5));
}

/**
 * Determine current level from total accumulated XP
 */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * Format date to YYYY-MM-DD based on custom rollover hour (default 4 AM)
 */
export function toStudyDateString(now: Date, rolloverHour = 4): string {
  const adjusted = new Date(now);
  if (adjusted.getHours() < rolloverHour) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  return adjusted.toISOString().slice(0, 10);
}

/**
 * Base XP table by review rating
 */
export const XP_BY_RATING: Record<Rating, number> = {
  1: 1, // Again
  2: 2, // Hard
  3: 5, // Good
  4: 6, // Easy
};

/**
 * Pure gamification event reducer
 */
export function gamificationReducer(
  state: GamificationState,
  event: GamificationEvent,
  now: Date,
  rolloverHour = 4
): GamificationState {
  const todayStr = toStudyDateString(now, rolloverHour);
  const isSameDay = state.lastStudyDate === todayStr;

  let xpGained = 0;
  let cardsStudiedToday = isSameDay ? state.cardsStudiedToday : 0;
  let streakDays = state.streakDays;
  let freezes = state.freezesRemaining;
  let streakFrozen = false;
  const newAchievements = [...state.unlockedAchievements];

  switch (event.type) {
    case 'CARD_REVIEWED': {
      // Base XP
      const base = XP_BY_RATING[event.rating] || 1;
      // Cap cramming: non-due reviews receive minimal XP to prevent grinding
      const earned = event.isDue ? base : 1;
      xpGained += earned;
      cardsStudiedToday += 1;
      break;
    }

    case 'SESSION_COMPLETED': {
      // Bonus 15 XP for completing an entire study session
      xpGained += 15;
      if (event.correctCount / Math.max(1, event.cardsCount) >= 0.9) {
        xpGained += 10; // Accuracy bonus
      }
      break;
    }

    case 'QUIZ_FINISHED': {
      xpGained += Math.round(event.score * 0.1);
      if (event.isPerfect && !newAchievements.includes('perfect_quiz')) {
        newAchievements.push('perfect_quiz');
      }
      break;
    }

    case 'DECK_CREATED': {
      xpGained += 20;
      if (!newAchievements.includes('deck_architect')) {
        newAchievements.push('deck_architect');
      }
      break;
    }

    case 'LIVE_GAME_WON': {
      xpGained += event.rank === 1 ? 50 : 25;
      if (event.rank === 1 && !newAchievements.includes('podium_champ')) {
        newAchievements.push('podium_champ');
      }
      break;
    }
  }

  // Calculate Streak progression
  // A meaningful study day requires >= 10 cards OR 1 completed session
  const qualifiesForDay = cardsStudiedToday >= 10 || event.type === 'SESSION_COMPLETED';
  let lastQualifiedDate = state.lastQualifiedDate;

  if (qualifiesForDay && state.lastQualifiedDate !== todayStr) {
    if (state.lastQualifiedDate) {
      const lastDate = new Date(state.lastQualifiedDate);
      const currDate = new Date(todayStr);
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        streakDays += 1;
      } else if (diffDays === 2 && freezes > 0) {
        // Streak freeze automatically consumed
        freezes -= 1;
        streakFrozen = true;
        streakDays += 1;
      } else {
        // Streak resets
        streakDays = 1;
      }
    } else {
      streakDays = 1;
    }

    lastQualifiedDate = todayStr;

    // Award a streak freeze for every 7 days (max 2 banked)
    if (streakDays % 7 === 0 && freezes < 2) {
      freezes += 1;
    }
  }

  // Milestone achievements
  if (streakDays >= 7 && !newAchievements.includes('streak_7_day')) {
    newAchievements.push('streak_7_day');
  }
  if (streakDays >= 30 && !newAchievements.includes('streak_30_day')) {
    newAchievements.push('streak_30_day');
  }

  const updatedXp = state.xp + xpGained;
  const updatedLevel = levelFromXp(updatedXp);

  return {
    ...state,
    xp: updatedXp,
    level: updatedLevel,
    streakDays,
    streakFrozen,
    freezesRemaining: freezes,
    cardsStudiedToday,
    lastStudyDate: todayStr,
    lastQualifiedDate,
    unlockedAchievements: newAchievements,
  };
}
