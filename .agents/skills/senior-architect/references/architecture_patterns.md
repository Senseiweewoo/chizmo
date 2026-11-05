# Architecture Patterns

System design patterns, boundary enforcement, and monorepo architectural guidelines.

---

## 1. Clean Architecture & Hexagonal Ports/Adapters

Isolate core business logic from frameworks, UI, and storage mechanisms.

```
+-------------------------------------------------------+
|  Infrastructure Layer: Next.js, Prisma, BullMQ, Redis |
|  +-------------------------------------------------+  |
|  |  Application Layer: DeckService, StudyService   |  |
|  |  +-------------------------------------------+  |  |
|  |  |  Domain Core: FSRS Math, XP Reducer, Zod  |  |  |
|  |  +-------------------------------------------+  |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

### Invariants
1. Dependencies point **inward** only: Infrastructure depends on Application; Application depends on Domain Core.
2. The Domain Core (`packages/core`) knows nothing about PostgreSQL, HTTP requests, or external SDKs.

---

## 2. Event-Driven Reducer Architecture

State changes in gamification, streaks, and user progression are processed deterministically as pure domain events:

```typescript
// Pure Reducer Function: (State, DomainEvent) -> NextState
export function gamificationReducer(state: UserGamificationState, event: ReviewLogEvent): UserGamificationState {
  const earnedXp = computeRatingXp(event.rating);
  const nextTotalXp = state.totalXp + earnedXp;
  const nextLevel = computeLevelFromXp(nextTotalXp);
  const isStreakDay = (state.dailyReviews + 1) >= 10;

  return {
    ...state,
    totalXp: nextTotalXp,
    level: nextLevel,
    dailyReviews: state.dailyReviews + 1,
    currentStreak: isStreakDay && !state.hasStudiedToday ? state.currentStreak + 1 : state.currentStreak,
    hasStudiedToday: isStreakDay || state.hasStudiedToday,
  };
}
```

---

## 3. CQRS (Command Query Responsibility Segregation)

- **Queries** (Read path): Optimized for low latency with direct database selects, relations, and caching (`GET /api/decks/[deckId]`, `GET /api/study/daily-queue`).
- **Commands** (Write path): Validated through domain rules, transactions, and event emission (`POST /api/study/review`, `POST /api/ingest/upload`).
