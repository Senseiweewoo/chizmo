import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scheduleCard,
  calculateRetrievability,
} from '../scheduler/fsrs.js';
import {
  gamificationReducer,
  xpForLevel,
  levelFromXp,
  GamificationState,
} from '../gamification/reducer.js';
import { detectCrisisIntent, VERIFIED_CRISIS_HOTLINES } from '../safety/crisis-detector.js';
import { gradeTypedAnswer } from '../scoring/write-grading.js';
import { calculateQuizScore } from '../scoring/index.js';

describe('System Integrity & Cross-Domain Smoke Tests', () => {
  it('1. Verifies end-to-end FSRS-4.5 full lifecycle (New -> Learn -> Review -> Lapse -> Relearn)', () => {
    const t0 = new Date('2026-11-05T08:00:00Z');

    // Step 1: Good rating on new card -> Enters LEARNING
    const step1 = scheduleCard(null, 3, t0);
    assert.equal(step1.next.state, 'LEARNING');
    assert.equal(step1.next.reps, 1);
    assert.equal(step1.next.lapses, 0);

    // Step 2: Good rating in learning -> Enters REVIEW
    const t1 = new Date(t0.getTime() + 10 * 60 * 1000);
    const step2 = scheduleCard(step1.next, 3, t1);
    assert.equal(step2.next.state, 'REVIEW');
    assert.ok(step2.next.stability > 1.0);

    // Step 3: Lapse on review -> Enters RELEARNING with stability drop
    const t2 = new Date(t1.getTime() + 4 * 24 * 60 * 60 * 1000);
    const step3 = scheduleCard(step2.next, 1, t2);
    assert.equal(step3.next.state, 'RELEARNING');
    assert.equal(step3.next.lapses, 1);
    assert.ok(step3.next.stability < step2.next.stability);
  });

  it('2. Verifies retrievability decay formula bounds R(t) in (0, 1]', () => {
    const stability = 10.0;
    const r0 = calculateRetrievability(0, stability);
    assert.equal(r0, 1.0);

    const r10 = calculateRetrievability(10, stability);
    assert.ok(r10 > 0.8 && r10 < 0.95, `Expected R around 0.9, got ${r10}`);

    const r100 = calculateRetrievability(100, stability);
    assert.ok(r100 > 0 && r100 < r10);
  });

  it('3. Verifies event-driven gamification XP progression & level curves', () => {
    const initial: GamificationState = {
      userId: 'u_test',
      xp: 0,
      level: 1,
      streakDays: 3,
      streakFrozen: false,
      freezesRemaining: 1,
      cardsStudiedToday: 0,
      lastStudyDate: '2026-11-04',
      unlockedAchievements: [],
    };

    const nextState = gamificationReducer(
      initial,
      {
        type: 'CARD_REVIEWED',
        rating: 4, // Easy -> 6 XP
        isDue: true,
        cardId: 'c1',
      },
      new Date('2026-11-05T10:00:00Z')
    );

    assert.equal(nextState.xp, 6);
    assert.equal(nextState.cardsStudiedToday, 1);
    assert.ok(nextState.level >= 1);
  });

  it('4. Verifies 24/7 crisis detector safety halt and verified hotlines', () => {
    const safeResult = detectCrisisIntent('Can you explain cellular respiration and mitochondria?');
    assert.equal(safeResult.isCrisis, false);

    const alertResult = detectCrisisIntent('I want to end my life, I cannot take this anymore');
    assert.equal(alertResult.isCrisis, true);
    assert.ok(alertResult.hotlines.length >= 4);
    assert.ok(alertResult.compassionateResponse && alertResult.compassionateResponse.length > 20);
  });

  it('5. Verifies Levenshtein typo-tolerant fuzzy grading on active recall', () => {
    const perfect = gradeTypedAnswer('mitochondria', 'mitochondria');
    assert.equal(perfect.verdict, 'CORRECT');

    const minorTypo = gradeTypedAnswer('mitochodria', 'mitochondria');
    assert.equal(minorTypo.isAccepted, true);

    const wrong = gradeTypedAnswer('chloroplast', 'mitochondria');
    assert.equal(wrong.verdict, 'INCORRECT');
  });

  it('6. Verifies server-authoritative live multiplayer scoring with streak multiplier', () => {
    const score = calculateQuizScore({
      basePoints: 1000,
      totalAllowedMs: 15000,
      serverStartTs: 100000,
      clientAnswerTs: 101000,
      serverReceiveTs: 101150,
      isCorrect: true,
      currentStreak: 4,
    });

    assert.ok(score.pointsAwarded > 1000, 'Score should include speed and streak bonus');
    assert.equal(score.newStreak, 5);
  });
});
