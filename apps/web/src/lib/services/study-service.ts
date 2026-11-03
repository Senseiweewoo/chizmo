import {
  Rating,
  CardState,
  scheduleCard,
  gamificationReducer,
  GamificationState,
  DEFAULT_FSRS_CONFIG,
} from '@chizmo/core';
import { DeckService } from './deck-service';

// In-Memory CardState Cache for instant local play
const inMemoryCardStates = new Map<string, CardState>();
// In-Memory Gamification Cache
const userGamificationStates = new Map<string, GamificationState>();
// Review history for undo stack
const recentReviewHistory: Array<{ cardId: string; prevState: CardState; logId: string }> = [];

function getGamificationState(userId: string): GamificationState {
  if (!userGamificationStates.has(userId)) {
    userGamificationStates.set(userId, {
      userId,
      xp: 50,
      level: 1,
      streakDays: 1,
      streakFrozen: false,
      freezesRemaining: 1,
      cardsStudiedToday: 0,
      lastStudyDate: '',
      unlockedAchievements: [],
    });
  }
  return userGamificationStates.get(userId)!;
}

export const StudyService = {
  async getStudyQueue(deckId: string, userId: string) {
    const deck = await DeckService.getDeckById(deckId, userId);
    if (!deck || !deck.cards) {
      return { deckTitle: '', items: [] };
    }

    const items = deck.cards.map((card) => {
      const stateKey = `${userId}:${card.id}`;
      let state = inMemoryCardStates.get(stateKey);

      if (!state) {
        state = {
          userId,
          cardId: card.id,
          state: 'NEW',
          stability: 0,
          difficulty: 5.0,
          due: new Date(),
          reps: 0,
          lapses: 0,
        };
        inMemoryCardStates.set(stateKey, state);
      }

      return {
        card,
        state,
        isNew: state.state === 'NEW',
      };
    });

    return {
      deckTitle: deck.title,
      deckColor: deck.color,
      items,
    };
  },

  async submitReview(userId: string, cardId: string, rating: Rating, responseMs = 1200) {
    const now = new Date();
    const stateKey = `${userId}:${cardId}`;
    const currentState = inMemoryCardStates.get(stateKey) || null;

    // 1. Calculate next state using pure FSRS scheduler
    const { next, log } = scheduleCard(currentState, rating, now, DEFAULT_FSRS_CONFIG);
    log.id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    log.responseMs = responseMs;

    // Record for undo functionality
    if (currentState) {
      recentReviewHistory.push({
        cardId,
        prevState: { ...currentState },
        logId: log.id,
      });
    }

    inMemoryCardStates.set(stateKey, next);

    // 2. Run Gamification Reducer
    const gState = getGamificationState(userId);
    const updatedGState = gamificationReducer(
      gState,
      {
        type: 'CARD_REVIEWED',
        rating,
        isDue: true,
        cardId,
      },
      now
    );
    userGamificationStates.set(userId, updatedGState);

    const xpGained = updatedGState.xp - gState.xp;

    return {
      success: true,
      nextState: next,
      log,
      gamification: {
        xpGained,
        totalXp: updatedGState.xp,
        level: updatedGState.level,
        streakDays: updatedGState.streakDays,
        cardsStudiedToday: updatedGState.cardsStudiedToday,
      },
    };
  },

  async undoLastReview(userId: string) {
    const last = recentReviewHistory.pop();
    if (!last) {
      return { success: false, error: 'No recent action to undo' };
    }

    const stateKey = `${userId}:${last.cardId}`;
    inMemoryCardStates.set(stateKey, last.prevState);

    return {
      success: true,
      restoredCardId: last.cardId,
      restoredState: last.prevState,
    };
  },
};
