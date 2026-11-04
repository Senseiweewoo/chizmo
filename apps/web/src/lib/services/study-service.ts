import {
  Rating,
  CardState,
  scheduleCard,
  gamificationReducer,
  GamificationState,
  DEFAULT_FSRS_CONFIG,
  buildDailyQueue,
  buildMultiDeckDailyQueue,
  DeckWithCards,
  calculateExamPace,
  calculateReadiness,
  isLeechCard,
  previewIntervals,
  formatInterval,
  calculateRetrievability,
  DailyQueueConfig,
  Card,
  IntervalPreview,
} from '@chizmo/core';
import { prisma } from '@chizmo/db';
import { DeckService, DeckWithMeta } from './deck-service';

// In-Memory CardState Cache for instant local / offline play
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
  /**
   * Fetch single deck study queue with FSRS scheduling prioritization
   */
  async getStudyQueue(deckId: string, userId: string) {
    const deck = await DeckService.getDeckById(deckId, userId);
    if (!deck || !deck.cards || deck.cards.length === 0) {
      return {
        deckTitle: deck?.title || '',
        deckColor: deck?.color || '#6366F1',
        examDate: deck?.examDate || null,
        items: [],
        examPace: null,
        readiness: 0,
      };
    }

    const now = new Date();
    const statesMap = new Map<string, CardState>();

    // 1. Load states (from DB if available, fallback to memory cache)
    try {
      const dbStates = await prisma.cardState.findMany({
        where: {
          userId,
          cardId: { in: deck.cards.map((c) => c.id) },
        },
      });
      for (const s of dbStates) {
        statesMap.set(s.cardId, {
          userId: s.userId,
          cardId: s.cardId,
          state: s.state as any,
          stability: s.stability,
          difficulty: s.difficulty,
          due: s.due,
          lastReview: s.lastReview || undefined,
          reps: s.reps,
          lapses: s.lapses,
        });
      }
    } catch {
      // Offline fallback: load from memory
      for (const card of deck.cards) {
        const stateKey = `${userId}:${card.id}`;
        const st = inMemoryCardStates.get(stateKey);
        if (st) {
          statesMap.set(card.id, st);
        }
      }
    }

    // Fill missing cards with default NEW state
    for (const card of deck.cards) {
      if (!statesMap.has(card.id)) {
        const stateKey = `${userId}:${card.id}`;
        let st = inMemoryCardStates.get(stateKey);
        if (!st) {
          st = {
            userId,
            cardId: card.id,
            state: 'NEW',
            stability: 0,
            difficulty: 5.0,
            due: now,
            reps: 0,
            lapses: 0,
          };
          inMemoryCardStates.set(stateKey, st);
        }
        statesMap.set(card.id, st);
      }
    }

    const queueConfig: DailyQueueConfig = {
      newPerDay: 15,
      maxReviews: 100,
      timezone: 'UTC',
      dayRolloverHour: 4,
      examDate: deck.examDate ? new Date(deck.examDate) : undefined,
    };

    const coreCards: Card[] = deck.cards.map((c) => ({
      id: c.id,
      deckId: c.deckId,
      type: (c.type as any) || 'basic',
      front: c.front,
      back: c.back,
      choices: c.choices,
      correctIndex: c.correctIndex,
      hint: c.hint,
      explanation: c.explanation,
      tags: c.tags || [],
      position: c.position || 0,
      createdBy: 'AI',
      contentHash: c.contentHash || '',
      createdAt: c.createdAt || now,
      updatedAt: c.updatedAt || now,
    }));

    const queueItems = buildDailyQueue(coreCards, statesMap, now, queueConfig);

    // Compute exam metrics
    let examPace = null;
    if (deck.examDate) {
      const examDateObj = new Date(deck.examDate);
      const unlearned = coreCards.filter((c) => {
        const s = statesMap.get(c.id);
        return !s || s.state === 'NEW';
      }).length;
      examPace = calculateExamPace(coreCards.length, unlearned, now, examDateObj);
    }

    const readiness = calculateReadiness(
      Array.from(statesMap.values()),
      deck.examDate ? new Date(deck.examDate) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    );

    return {
      deckTitle: deck.title,
      deckColor: deck.color || '#6366F1',
      examDate: deck.examDate || null,
      examPace,
      readiness,
      items: queueItems,
    };
  },

  /**
   * Build unified multi-deck daily study queue
   * Interleaves cards across multiple decks and topics for optimal learning
   */
  async getMultiDeckDailyQueue(
    userId: string,
    options?: {
      timezone?: string;
      dayRolloverHour?: number;
      newPerDay?: number;
      maxReviews?: number;
    }
  ) {
    const userDecks = await DeckService.getUserDecks(userId);
    const now = new Date();

    const fullDecks: DeckWithCards[] = [];
    const allStatesMap = new Map<string, CardState>();

    for (const d of userDecks) {
      const deckWithCards = await DeckService.getDeckById(d.id, userId);
      if (deckWithCards && deckWithCards.cards && deckWithCards.cards.length > 0) {
        fullDecks.push({
          id: deckWithCards.id,
          title: deckWithCards.title,
          color: deckWithCards.color || '#6366F1',
          cards: deckWithCards.cards.map((c) => ({
            id: c.id,
            deckId: c.deckId,
            type: (c.type as any) || 'basic',
            front: c.front,
            back: c.back,
            choices: c.choices,
            correctIndex: c.correctIndex,
            hint: c.hint,
            explanation: c.explanation,
            tags: c.tags || [],
            position: c.position || 0,
            createdBy: 'AI',
            contentHash: c.contentHash || '',
            createdAt: c.createdAt || now,
            updatedAt: c.updatedAt || now,
          })),
        });

        // Load card states for this deck
        for (const card of deckWithCards.cards) {
          const stateKey = `${userId}:${card.id}`;
          let st = inMemoryCardStates.get(stateKey);
          if (!st) {
            st = {
              userId,
              cardId: card.id,
              state: 'NEW',
              stability: 0,
              difficulty: 5.0,
              due: now,
              reps: 0,
              lapses: 0,
            };
            inMemoryCardStates.set(stateKey, st);
          }
          allStatesMap.set(card.id, st);
        }
      }
    }

    const config: DailyQueueConfig = {
      newPerDay: options?.newPerDay || 20,
      maxReviews: options?.maxReviews || 200,
      timezone: options?.timezone || 'UTC',
      dayRolloverHour: options?.dayRolloverHour || 4,
    };

    const multiQueueResult = buildMultiDeckDailyQueue(fullDecks, allStatesMap, now, config);

    // Identify unique subject titles and colors
    const uniqueDecks = Array.from(
      new Set(multiQueueResult.queue.map((item) => JSON.stringify({ id: item.card.deckId, title: item.deckTitle, color: item.deckColor })))
    ).map((s) => JSON.parse(s));

    return {
      ...multiQueueResult,
      uniqueDecks,
      totalCardsInQueue: multiQueueResult.queue.length,
    };
  },

  /**
   * Retrieve leech cards (cards with >= 8 lapses) for review or rewriting
   */
  async getLeechCards(userId: string, deckId?: string) {
    const userDecks = await DeckService.getUserDecks(userId);
    const leeches: Array<{
      card: any;
      deckTitle: string;
      deckColor: string;
      state: CardState;
      lapses: number;
      suggestion: string;
    }> = [];

    for (const d of userDecks) {
      if (deckId && d.id !== deckId) continue;
      const deck = await DeckService.getDeckById(d.id, userId);
      if (!deck || !deck.cards) continue;

      for (const card of deck.cards) {
        const stateKey = `${userId}:${card.id}`;
        const st = inMemoryCardStates.get(stateKey);
        if (st && isLeechCard(st)) {
          leeches.push({
            card,
            deckTitle: deck.title,
            deckColor: deck.color || '#6366F1',
            state: st,
            lapses: st.lapses,
            suggestion:
              st.lapses >= 12
                ? 'High difficulty concept. Split into 2-3 atomic cards or rephrase question.'
                : 'Consider adding a memorable mnemonic hint or clarifying the answer.',
          });
        }
      }
    }

    return leeches;
  },

  /**
   * Retrieve weak spot cards (lapses >= 1, difficulty >= 6.0, or relearning)
   */
  async getWeakSpots(userId: string, deckId?: string) {
    const userDecks = await DeckService.getUserDecks(userId);
    const weakSpots: Array<{
      card: any;
      deckTitle: string;
      deckColor: string;
      state: CardState;
      lapses: number;
      difficulty: number;
      isLeech: boolean;
      retrievability: number;
    }> = [];

    const now = new Date();

    for (const d of userDecks) {
      if (deckId && d.id !== deckId) continue;
      const deck = await DeckService.getDeckById(d.id, userId);
      if (!deck || !deck.cards) continue;

      for (const card of deck.cards) {
        const stateKey = `${userId}:${card.id}`;
        const existing = inMemoryCardStates.get(stateKey);
        const st: CardState = existing || {
          cardId: card.id,
          userId,
          state: 'NEW',
          stability: 0,
          difficulty: 5.0,
          due: now,
          reps: 0,
          lapses: 0,
        };

        const elapsedDays = Math.max(0, (now.getTime() - new Date(st.due).getTime()) / (1000 * 60 * 60 * 24));
        const r = st.stability > 0 ? Math.exp((-Math.LN10 / (9 * st.stability)) * elapsedDays) : 0.5;

        const isLeech = isLeechCard(st);
        const isWeak = st.lapses > 0 || st.difficulty >= 6.0 || st.state === 'RELEARNING' || isLeech;

        if (isWeak) {
          weakSpots.push({
            card,
            deckTitle: deck.title,
            deckColor: deck.color || '#6366F1',
            state: st,
            lapses: st.lapses,
            difficulty: st.difficulty,
            isLeech,
            retrievability: Math.round(r * 100),
          });
        }
      }
    }

    weakSpots.sort((a, b) => {
      if (a.isLeech !== b.isLeech) return a.isLeech ? -1 : 1;
      if (a.lapses !== b.lapses) return b.lapses - a.lapses;
      return b.difficulty - a.difficulty;
    });

    return weakSpots;
  },

  /**
   * Configure exam date mode for a deck
   */
  async configureExamMode(deckId: string, userId: string, examDate: Date | null) {
    const updated = await DeckService.updateDeck(deckId, userId, { examDate });
    if (!updated) {
      return { success: false, error: 'Deck not found' };
    }

    const studyQueue = await this.getStudyQueue(deckId, userId);
    return {
      success: true,
      deck: updated,
      examPace: studyQueue.examPace,
      readiness: studyQueue.readiness,
    };
  },

  /**
   * Preview predicted next intervals for all 4 ratings without altering state
   */
  getIntervalPreviews(userId: string, cardId: string, now = new Date(), examDate?: Date): IntervalPreview[] {
    const stateKey = `${userId}:${cardId}`;
    const currentState = inMemoryCardStates.get(stateKey) || null;
    return previewIntervals(currentState, now, { examDate });
  },

  /**
   * Submit card review with FSRS calculation, undo tracking, and gamification update
   */
  async submitReview(userId: string, cardId: string, rating: Rating, responseMs = 1200, examDate?: Date) {
    const now = new Date();
    const stateKey = `${userId}:${cardId}`;
    const currentState = inMemoryCardStates.get(stateKey) || null;

    // 1. Calculate next state using pure FSRS scheduler with dynamic retention & fuzz
    const { next, log } = scheduleCard(currentState, rating, now, {
      config: DEFAULT_FSRS_CONFIG,
      examDate,
    });
    log.id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    log.responseMs = responseMs;

    // Record for undo functionality
    recentReviewHistory.push({
      cardId,
      prevState: currentState
        ? { ...currentState }
        : {
            userId,
            cardId,
            state: 'NEW',
            stability: 0,
            difficulty: 5.0,
            due: now,
            reps: 0,
            lapses: 0,
          },
      logId: log.id,
    });

    // Update in-memory state
    inMemoryCardStates.set(stateKey, next);

    // Persist to database if available
    try {
      await prisma.cardState.upsert({
        where: {
          userId_cardId: {
            userId,
            cardId,
          },
        },
        create: {
          userId,
          cardId,
          state: next.state as any,
          stability: next.stability,
          difficulty: next.difficulty,
          due: next.due,
          lastReview: next.lastReview,
          reps: next.reps,
          lapses: next.lapses,
        },
        update: {
          state: next.state as any,
          stability: next.stability,
          difficulty: next.difficulty,
          due: next.due,
          lastReview: next.lastReview,
          reps: next.reps,
          lapses: next.lapses,
        },
      });

      await prisma.reviewLog.create({
        data: {
          userId,
          cardId,
          rating,
          prevState: log.prevState as any,
          elapsedDays: log.elapsedDays,
          scheduledDays: log.scheduledDays,
          responseMs,
          reviewedAt: now,
        },
      });
    } catch {
      // Graceful offline fallback
    }

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
    const isLeech = isLeechCard(next);

    return {
      success: true,
      nextState: next,
      log,
      isLeech,
      formattedInterval: formatInterval(log.scheduledDays),
      gamification: {
        xpGained,
        totalXp: updatedGState.xp,
        level: updatedGState.level,
        streakDays: updatedGState.streakDays,
        cardsStudiedToday: updatedGState.cardsStudiedToday,
      },
    };
  },

  /**
   * Undo the most recent review action
   */
  async undoLastReview(userId: string) {
    const last = recentReviewHistory.pop();
    if (!last) {
      return { success: false, error: 'No recent action to undo' };
    }

    const stateKey = `${userId}:${last.cardId}`;
    inMemoryCardStates.set(stateKey, last.prevState);

    // Also revert in database if available
    try {
      await prisma.cardState.upsert({
        where: {
          userId_cardId: {
            userId,
            cardId: last.cardId,
          },
        },
        create: {
          userId,
          cardId: last.cardId,
          state: last.prevState.state as any,
          stability: last.prevState.stability,
          difficulty: last.prevState.difficulty,
          due: last.prevState.due,
          lastReview: last.prevState.lastReview,
          reps: last.prevState.reps,
          lapses: last.prevState.lapses,
        },
        update: {
          state: last.prevState.state as any,
          stability: last.prevState.stability,
          difficulty: last.prevState.difficulty,
          due: last.prevState.due,
          lastReview: last.prevState.lastReview,
          reps: last.prevState.reps,
          lapses: last.prevState.lapses,
        },
      });
    } catch {
      // Offline fallback
    }

    return {
      success: true,
      restoredCardId: last.cardId,
      restoredState: last.prevState,
    };
  },
};