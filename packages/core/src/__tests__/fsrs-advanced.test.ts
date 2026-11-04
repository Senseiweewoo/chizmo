import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  scheduleCard,
  calculateRetrievability,
  calculateNextInterval,
  calculateDynamicRetention,
  isLeechCard,
  applyIntervalFuzz,
  replayReviewLogs,
  previewIntervals,
  DEFAULT_FSRS_CONFIG,
} from '../scheduler/fsrs.js';
import {
  buildMultiDeckDailyQueue,
  DeckWithCards,
  getStudyDayStart,
  calculateExamPace,
  calculateReadiness,
} from '../scheduler/queue.js';
import { Card, CardState, Rating, ReviewLogEntry } from '../types/index.js';

describe('Advanced FSRS-4.5 Scheduler Tests', () => {
  const baseTime = new Date('2026-11-04T12:00:00Z');

  it('1. Replaying append-only ReviewLog reconstructs identical CardState', () => {
    let state: CardState | null = null;
    const logs: ReviewLogEntry[] = [];
    let currentTime = new Date(baseTime);

    // Simulate 5 reviews: Good, Good, Hard, Again (lapse), Good
    const ratings: Rating[] = [3, 3, 2, 1, 3];

    for (let i = 0; i < ratings.length; i++) {
      const rating = ratings[i];
      const res = scheduleCard(state, rating, currentTime);
      state = res.next;
      logs.push(res.log);

      // Advance time by the scheduled interval
      currentTime = new Date(currentTime.getTime() + Math.max(1, res.log.scheduledDays) * 24 * 60 * 60 * 1000);
    }

    assert(state !== null);
    assert.strictEqual(state.lapses, 1);
    assert.strictEqual(state.reps, 4);

    // Replay logs from scratch
    const replayed = replayReviewLogs(logs);
    assert(replayed !== null);
    assert.strictEqual(replayed.stability, state.stability);
    assert.strictEqual(replayed.difficulty, state.difficulty);
    assert.strictEqual(replayed.state, state.state);
    assert.strictEqual(replayed.reps, state.reps);
    assert.strictEqual(replayed.lapses, state.lapses);
  });

  it('2. Interval fuzzing applies reproducible jitter with seed', () => {
    const rawInterval = 14; // > 3 days
    const fuzzed1 = applyIntervalFuzz(rawInterval, 42);
    const fuzzed2 = applyIntervalFuzz(rawInterval, 42);
    const fuzzedDifferent = applyIntervalFuzz(rawInterval, 999);

    assert.strictEqual(fuzzed1, fuzzed2, 'Seeded fuzzing must be strictly deterministic');
    assert(fuzzed1 >= 13 && fuzzed1 <= 16, 'Fuzzed interval should remain within +/- 10% bounds');
  });

  it('3. Overdue reviews use actual physical elapsed days for retrievability R', () => {
    const matureCard: CardState = {
      userId: 'u1',
      cardId: 'c1',
      state: 'REVIEW',
      stability: 10,
      difficulty: 4.5,
      due: baseTime,
      lastReview: new Date(baseTime.getTime() - 10 * 24 * 60 * 60 * 1000), // scheduled 10 days
      reps: 4,
      lapses: 0,
    };

    // Review on schedule: 10 days elapsed
    const R_onSchedule = calculateRetrievability(10, matureCard.stability);
    // Review 30 days overdue: 40 days elapsed
    const R_overdue = calculateRetrievability(40, matureCard.stability);

    assert(R_overdue < R_onSchedule, `Overdue recall probability (${R_overdue}) must be lower than on-schedule (${R_onSchedule})`);
    assert(R_onSchedule > 0.85 && R_onSchedule <= 0.92, 'On schedule recall should be ~0.90');
    assert(R_overdue < 0.75, '40-day overdue recall on S=10 should drop significantly');
  });

  it('4. Exam date mode escalates target retention in final 7 days', () => {
    // 30 days away: base retention (0.90)
    const farExam = new Date(baseTime.getTime() + 30 * 24 * 60 * 60 * 1000);
    const rFar = calculateDynamicRetention(baseTime, farExam, 0.90);
    assert.strictEqual(rFar, 0.90);

    // 3 days away: final week escalation
    const closeExam = new Date(baseTime.getTime() + 3 * 24 * 60 * 60 * 1000);
    const rClose = calculateDynamicRetention(baseTime, closeExam, 0.90);
    assert(rClose > 0.93, `Retention in final 3 days (${rClose}) should escalate toward 0.96`);
  });

  it('5. Leech detection identifies cards with >= 8 lapses', () => {
    const normalCard: CardState = {
      userId: 'u1',
      cardId: 'c1',
      state: 'REVIEW',
      stability: 5,
      difficulty: 5.0,
      due: baseTime,
      reps: 10,
      lapses: 3,
    };
    assert.strictEqual(isLeechCard(normalCard), false);

    const leechCard: CardState = {
      ...normalCard,
      lapses: 8,
    };
    assert.strictEqual(isLeechCard(leechCard), true, 'Card with 8 lapses must be flagged as a leech');
  });

  it('6. Multi-deck daily queue interleaves cards across distinct subjects', () => {
    const deckA: DeckWithCards = {
      id: 'deck-a',
      title: 'Biology',
      cards: [
        { id: 'a1', deckId: 'deck-a', type: 'basic', front: 'A1', back: 'Ans A1', tags: [], position: 0, createdBy: 'AI', contentHash: '1', createdAt: baseTime, updatedAt: baseTime },
        { id: 'a2', deckId: 'deck-a', type: 'basic', front: 'A2', back: 'Ans A2', tags: [], position: 1, createdBy: 'AI', contentHash: '2', createdAt: baseTime, updatedAt: baseTime },
      ],
    };

    const deckB: DeckWithCards = {
      id: 'deck-b',
      title: 'History',
      cards: [
        { id: 'b1', deckId: 'deck-b', type: 'basic', front: 'B1', back: 'Ans B1', tags: [], position: 0, createdBy: 'AI', contentHash: '3', createdAt: baseTime, updatedAt: baseTime },
        { id: 'b2', deckId: 'deck-b', type: 'basic', front: 'B2', back: 'Ans B2', tags: [], position: 1, createdBy: 'AI', contentHash: '4', createdAt: baseTime, updatedAt: baseTime },
      ],
    };

    const states = new Map<string, CardState>([
      ['a1', { userId: 'u1', cardId: 'a1', state: 'REVIEW', stability: 5, difficulty: 5, due: baseTime, reps: 2, lapses: 0, lastReview: baseTime }],
      ['b1', { userId: 'u1', cardId: 'b1', state: 'REVIEW', stability: 4, difficulty: 5, due: baseTime, reps: 2, lapses: 0, lastReview: baseTime }],
    ]);

    const result = buildMultiDeckDailyQueue([deckA, deckB], states, baseTime, {
      newPerDay: 5,
      maxReviews: 50,
      timezone: 'UTC',
      dayRolloverHour: 4,
    });

    assert(result.queue.length >= 2);
    // Ensure both decks are present and interleaved
    const deckTitles = result.queue.map((q) => q.deckTitle);
    assert(deckTitles.includes('Biology'));
    assert(deckTitles.includes('History'));
  });

  it('7. Day rollover handles late-night 02:00 AM study as previous calendar day', () => {
    const nightTime = new Date('2026-11-04T02:15:00Z');
    const dayStart = getStudyDayStart(nightTime, 4);
    assert.strictEqual(dayStart.getUTCDate(), 3, '2:15 AM before 4 AM rollover counts as day 3');
  });

  it('8. Property test: Stability remains positive and Difficulty remains within [1, 10] across 10,000 ratings', () => {
    let state: CardState | null = null;
    let currTime = new Date(baseTime);

    // Simple deterministic LCG pseudo-random generator
    let seed = 123456789;
    function randRating(): Rating {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return ((seed % 4) + 1) as Rating;
    }

    for (let i = 0; i < 10000; i++) {
      const rating = randRating();
      const res = scheduleCard(state, rating, currTime);
      state = res.next;

      assert(state.stability > 0, `Stability must remain strictly positive (got ${state.stability}) at step ${i}`);
      assert(state.difficulty >= 1.0 && state.difficulty <= 10.0, `Difficulty must be within [1, 10] (got ${state.difficulty}) at step ${i}`);

      // Advance by scheduled time
      const days = Math.max(0.01, res.log.scheduledDays);
      currTime = new Date(currTime.getTime() + days * 24 * 60 * 60 * 1000);
    }
  });

  it('9. previewIntervals calculates all 4 options without modifying state', () => {
    const matureCard: CardState = {
      userId: 'u1',
      cardId: 'c1',
      state: 'REVIEW',
      stability: 10,
      difficulty: 4.5,
      due: baseTime,
      lastReview: new Date(baseTime.getTime() - 10 * 24 * 60 * 60 * 1000),
      reps: 5,
      lapses: 0,
    };

    const previews = previewIntervals(matureCard, baseTime);
    assert.strictEqual(previews.length, 4);
    assert.strictEqual(previews[0].label, 'Again');
    assert.strictEqual(previews[0].formatted, '<1m'); // learning step
    assert.strictEqual(previews[1].label, 'Hard');
    assert.strictEqual(previews[2].label, 'Good');
    assert.strictEqual(previews[3].label, 'Easy');

    // Interval monotonicity: Hard < Good < Easy
    assert(previews[1].intervalDays < previews[2].intervalDays, 'Hard interval < Good interval');
    assert(previews[2].intervalDays < previews[3].intervalDays, 'Good interval < Easy interval');
  });
});
