---
name: fsrs-scheduler
description: >-
  Implement spaced repetition scheduling (FSRS, with SM-2 as fallback) for flashcard apps: card states, due dates, daily queues, exam-date mode, retention targets, review logs, and unit tests. Use this skill whenever the user mentions spaced repetition, FSRS, SM-2, Anki-style scheduling, review intervals, "due cards", forgetting curves, daily review limits, or wants a study app to quiz users at calculated intervals, even if they don't name an algorithm.
---

# FSRS Scheduler

Spaced repetition is the engine of a study app, and bugs here silently ruin retention. Build it as a pure, deterministic module in `packages/core/scheduler` with no database or clock access (pass `now` in).

## Prefer a maintained library
Use the open-source `ts-fsrs` package for production. Hand-rolling is only worth it to learn or to avoid a dependency; if you do, verify every formula and the default weights against the `ts-fsrs` source and its test vectors, because small transcription errors compile fine and schedule badly.

## Model in one paragraph
Each card has **stability** S (days until recall probability falls to 90%), **difficulty** D (1-10), and a **state** (NEW, LEARNING, REVIEW, RELEARNING). Recall probability after t days is the retrievability R(t,S). The user rates each review 1 Again, 2 Hard, 3 Good, 4 Easy. The scheduler updates S and D and picks the next interval so that predicted R equals the **desired retention** (default 0.90).

## Reference formulas (FSRS-4.5 family; confirm against ts-fsrs)
```
DECAY = -0.5; FACTOR = 19/81
R(t,S)   = (1 + FACTOR * t / S) ^ DECAY
interval = S / FACTOR * (r ^ (1/DECAY) - 1)      // r = desired retention
S0(G)    = w[G-1]
D0(G)    = clamp(w4 - w5*(G-3), 1, 10)
D'       = clamp(w7*D0(3) + (1-w7)*(D - w6*(G-3)), 1, 10)
recall:  S' = S * (1 + e^w8 * (11-D) * S^-w9 * (e^(w10*(1-R)) - 1) * hardPenalty * easyBonus)
         hardPenalty = w15 if G==2 else 1;  easyBonus = w16 if G==4 else 1
forget:  S' = w11 * D^-w12 * ((S+1)^w13 - 1) * e^(w14*(1-R))   (cap at S)
```
Start with the published default weights from `ts-fsrs`; later, optimize per-user weights from `ReviewLog` once a user has ~1,000 reviews.

## Public API to implement
```ts
type Rating = 1|2|3|4
schedule(state: CardState|null, rating: Rating, now: Date, cfg: Config): { next: CardState; log: ReviewLogEntry }
retrievability(state: CardState, now: Date): number
buildDailyQueue(states: CardState[], now: Date, cfg: { newPerDay: number; maxReviews: number; tz: string; rolloverHour: number }): QueueItem[]
```

## Product behaviours
- **Learning steps** for new/lapsed cards (e.g. 1m, 10m) before they graduate to day-scale intervals.
- **Daily limits**: new per day (default 10-20), max reviews (default 200). Surface overflow as "catch up" instead of showing a scary number.
- **Day boundary**: use the user's timezone and a rollover hour (default 4 am) so late-night study counts for the right day.
- **Interleaving**: shuffle across decks and topics within the due set; don't show a deck's cards in blocks.
- **Fuzz**: add small random jitter to intervals over ~3 days so cards don't clump. Seed it for tests.
- **Exam-date mode**: given exam date E and deck size, compute required new cards per day to introduce everything by roughly E minus 3 days, raise desired retention in the final week, and show a "readiness" % = mean R across cards on date E. Cram mode ignores long-term efficiency, so label it clearly.
- **Leeches**: after 8 lapses, flag the card and offer "rewrite or split this card" (ties into ai-card-generation).
- **Undo**: keep the previous state in the log so the last answer can be undone.

## Tests to write first
1. New card + Good yields interval about S0(3) days after graduating the learning steps
2. Again on a mature card cuts stability and moves state to RELEARNING
3. Hard < Good < Easy intervals, strictly increasing
4. Overdue reviews: R uses actual elapsed days, not scheduled days
5. Timezone/rollover: a review at 01:00 local counts for the previous study day
6. Deterministic fuzz with fixed seed
7. Property test: stability stays positive and difficulty stays within 1-10 across 10,000 random rating sequences
8. Round-trip: replaying the `ReviewLog` rebuilds the same `CardState`

## Don't
- Don't store scheduling fields on the shared `Card` row; they belong to `CardState` per user.
- Don't call `new Date()` inside the scheduler.
- Don't change algorithms without a migration plan: replay logs to rebuild states.
