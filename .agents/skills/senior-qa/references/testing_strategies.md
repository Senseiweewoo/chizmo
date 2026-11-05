# Testing Strategies

Test design patterns, test pyramids, and quality assurance strategies for production study platforms.

---

## 1. Test Levels & Objectives

| Level | Scope | Execution Speed | Primary Goal |
|---|---|---|---|
| **Unit** | Pure functions, algorithms, validators | <1ms per test | Mathematical correctness, boundary edge cases |
| **Integration** | Route handlers, ORM services, state reducers | 10–100ms per test | Inter-module contracts, schema validation, RLS |
| **E2E** | Full browser flows (Playwright) | 1–5s per test | Critical user journeys, UI rendering, session persistence |

---

## 2. Boundary Value Analysis (BVA) & Equivalence Partitioning

For any input range $[min, max]$:
- Test: $min - 1$, $min$, $min + 1$, nominal value, $max - 1$, $max$, $max + 1$.
- Example for XP Level curve: Level 0 (invalid/edge), Level 1 (base), Level 100 (high integer).
- Example for Flashcard rating: 0 (invalid), 1 (`Again`), 2 (`Hard`), 3 (`Good`), 4 (`Easy`), 5 (invalid).

---

## 3. Deterministic Testing of Time-Sensitive Systems

- **No System Clocks in Core**: Timezone rollovers (4:00 AM) and spaced repetition intervals must accept reference dates:
  ```typescript
  // Deterministic test
  const midnight = new Date('2026-11-05T01:00:00Z');
  const rolloverDay = computeStudyDay(midnight, 'America/New_York', 4);
  assert.strictEqual(rolloverDay, '2026-11-04');
  ```
- **Interval Fuzzing Determinism**: Seed pseudorandom generators or pass card IDs as deterministic seeds so test assertions remain reproducible across runs.
