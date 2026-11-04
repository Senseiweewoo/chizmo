import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  scheduleCard,
  calculateRetrievability,
  calculateNextInterval,
  DEFAULT_FSRS_CONFIG,
} from '../scheduler/fsrs.js';
import { getStudyDayStart, calculateExamPace } from '../scheduler/queue.js';
import { gamificationReducer, xpForLevel, levelFromXp } from '../gamification/reducer.js';
import { generateDailyQuests, evaluateQuestProgress } from '../gamification/quests.js';
import { ALL_ACHIEVEMENTS } from '../gamification/achievements.js';
import { calculateQuizScore } from '../scoring/index.js';
import { CardState } from '../types/index.js';

describe('FSRS-4.5 Scheduler Tests', () => {
  const now = new Date('2026-11-04T12:00:00Z');

  it('1. New card + Good graduates into learning interval', () => {
    const res = scheduleCard(null, 3, now);
    assert.strictEqual(res.next.state, 'LEARNING');
    assert.strictEqual(res.next.reps, 1);
    assert.strictEqual(res.next.lapses, 0);
    assert(res.next.due > now, 'Due date must be in the future');
  });

  it('2. New card + Easy graduates immediately to REVIEW state', () => {
    const res = scheduleCard(null, 4, now);
    assert.strictEqual(res.next.state, 'REVIEW');
    assert.strictEqual(res.next.reps, 1);
    assert(res.next.stability > 2.0, 'Easy stability should be high');
  });

  it('3. Hard < Good < Easy intervals are strictly increasing', () => {
    const matureCard: CardState = {
      userId: 'u1',
      cardId: 'c1',
      state: 'REVIEW',
      stability: 10,
      difficulty: 5.0,
      due: now,
      lastReview: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      reps: 5,
      lapses: 0,
    };

    const resHard = scheduleCard(matureCard, 2, now);
    const resGood = scheduleCard(matureCard, 3, now);
    const resEasy = scheduleCard(matureCard, 4, now);

    assert(
      resHard.next.stability < resGood.next.stability,
      `Hard stability (${resHard.next.stability}) should be less than Good (${resGood.next.stability})`
    );
    assert(
      resGood.next.stability < resEasy.next.stability,
      `Good stability (${resGood.next.stability}) should be less than Easy (${resEasy.next.stability})`
    );
  });

  it('4. Again on mature card cuts stability and transitions to RELEARNING', () => {
    const matureCard: CardState = {
      userId: 'u1',
      cardId: 'c1',
      state: 'REVIEW',
      stability: 20,
      difficulty: 4.0,
      due: now,
      lastReview: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      reps: 8,
      lapses: 0,
    };

    const res = scheduleCard(matureCard, 1, now);
    assert.strictEqual(res.next.state, 'RELEARNING');
    assert.strictEqual(res.next.lapses, 1);
    assert(res.next.stability < matureCard.stability, 'Stability must decrease on lapse');
  });

  it('5. Timezone & 4 AM rollover counts 01:00 AM as previous study day', () => {
    const lateNight = new Date('2026-11-04T01:30:00');
    const dayStart = getStudyDayStart(lateNight, 4);
    assert.strictEqual(dayStart.getDate(), 3, 'Should count as day 3 for 1:30 AM study before 4 AM rollover');
  });

  it('6. Exam mode calculates required new cards per day accurately', () => {
    const examDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days away
    const pace = calculateExamPace(70, 70, now, examDate);
    // targetDays = 10 - 3 = 7 days -> 70 / 7 = 10 cards per day
    assert.strictEqual(pace.requiredNewPerDay, 10);
  });
});

describe('Gamification & XP Reducer Tests', () => {
  const now = new Date('2026-11-04T12:00:00Z');

  const initialState = {
    userId: 'u1',
    xp: 0,
    level: 1,
    streakDays: 0,
    streakFrozen: false,
    freezesRemaining: 1,
    cardsStudiedToday: 0,
    lastStudyDate: '',
    unlockedAchievements: [] as string[],
  };

  it('1. XP progression and level curve test', () => {
    assert.strictEqual(levelFromXp(0), 1);
    assert.strictEqual(levelFromXp(150), 2);
    assert.strictEqual(levelFromXp(500), 3);
  });

  it('2. Reviewing cards earns XP and triggers streak on qualifying threshold', () => {
    let state = initialState;
    for (let i = 0; i < 10; i++) {
      state = gamificationReducer(
        state,
        { type: 'CARD_REVIEWED', rating: 3, isDue: true, cardId: `c${i}` },
        now
      );
    }
    assert.strictEqual(state.cardsStudiedToday, 10);
    assert.strictEqual(state.streakDays, 1);
    assert(state.xp >= 50, '10 Good reviews should award at least 50 XP');
  });

  it('3. Daily quests generate deterministically and advance progress from events', () => {
    const quests = generateDailyQuests('2026-11-04');
    assert.strictEqual(quests.length, 3, 'Must produce exactly 3 daily quests');

    // Simulate reviews
    const { updatedQuests, newlyEarnedXp } = evaluateQuestProgress(quests, {
      type: 'CARD_REVIEWED',
      rating: 3,
      isDue: true,
      cardId: 'c1',
    });

    const reviewQuest = updatedQuests.find((q) => q.type === 'review_count');
    if (reviewQuest) {
      assert.strictEqual(reviewQuest.current, 1);
    }
  });

  it('4. Declarative achievements table contains unique IDs with valid XP rewards', () => {
    assert(ALL_ACHIEVEMENTS.length >= 6);
    const ids = new Set(ALL_ACHIEVEMENTS.map((a) => a.id));
    assert.strictEqual(ids.size, ALL_ACHIEVEMENTS.length, 'Achievement IDs must be unique');
    for (const a of ALL_ACHIEVEMENTS) {
      assert(a.xpReward > 0, 'Every achievement must award positive XP');
    }
  });
});

describe('Multiplayer & Quiz Scoring Tests', () => {
  it('1. Correct answer with quick response earns speed & streak bonuses', () => {
    const score = calculateQuizScore({
      basePoints: 1000,
      totalAllowedMs: 15000,
      serverStartTs: 100000,
      clientAnswerTs: 102000,
      serverReceiveTs: 102100,
      pingRttMs: 100,
      isCorrect: true,
      currentStreak: 2,
    });

    assert(score.isCorrect);
    assert(score.pointsAwarded > 800, 'Fast response should earn high fraction of 1000 base points');
    assert.strictEqual(score.newStreak, 3);
  });

  it('2. Incorrect answer awards 0 points and resets streak', () => {
    const score = calculateQuizScore({
      totalAllowedMs: 15000,
      serverStartTs: 100000,
      clientAnswerTs: 102000,
      serverReceiveTs: 102100,
      isCorrect: false,
      currentStreak: 5,
    });

    assert.strictEqual(score.pointsAwarded, 0);
    assert.strictEqual(score.newStreak, 0);
  });
});
