# Database Optimization Guide

PostgreSQL performance tuning, indexing rules, query optimization, and schema design standards.

---

## 1. Indexing Rules of Thumb

1. **Composite Index Ordering (Equality First, Range Last)**:
   - If querying `WHERE userId = 'user_123' AND due <= NOW() ORDER BY due ASC`:
   - Create `@@index([userId, due])`.
   - The equality column (`userId`) narrows down the index tree; the range/sort column (`due`) allows direct sequential scans without sorting.

2. **Foreign Key Indexing**:
   - PostgreSQL does *not* automatically create indexes on foreign key columns.
   - Always define `@@index([deckId])`, `@@index([ownerId])`, `@@index([sourceId])` to ensure fast `JOIN` operations and cascade updates.

3. **Partial & Unique Indexes**:
   - Use partial indexes when querying a subset of rows:
     `CREATE INDEX idx_active_subscriptions ON subscriptions(user_id) WHERE status = 'ACTIVE';`
   - Use unique composite constraints for idempotency:
     `@@unique([userId, cardId])` in `CardState`.

---

## 2. Preventing N+1 Query Anti-Patterns

### Problem
```typescript
// BAD: Triggers 1 query for decks + N queries for cards
const decks = await prisma.deck.findMany();
for (const deck of decks) {
  const cards = await prisma.card.findMany({ where: { deckId: deck.id } });
}
```

### Solution
```typescript
// GOOD: Eagerly load in 2 batched SQL queries
const decks = await prisma.deck.findMany({
  include: {
    cards: { take: 50 },
    _count: { select: { cards: true } },
  },
});
```

---

## 3. Connection Pooling & Serverless Lifecycles

- **Singleton Client**: In Node.js serverless runtimes (Next.js App Router, AWS Lambda), always cache the PrismaClient instance on `globalThis` to prevent pool exhaustion across fast hot-reloads and container recycling.
- **PgBouncer / Supabase / Neon Pooling**:
  - Direct connection string for migrations (`DIRECT_URL`).
  - Pooled connection string with transaction-mode pooling for application traffic (`DATABASE_URL`).
- **Connection Limits**: Set `connection_limit` explicitly in the connection string:
  `postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20`.

---

## 4. Zero-Downtime Migration Practices

1. **Never Drop or Rename Columns Directly**:
   - Phase 1: Add new column (nullable or with default).
   - Phase 2: Deploy code writing to both old and new columns.
   - Phase 3: Backfill data from old column to new column.
   - Phase 4: Deploy code reading exclusively from new column.
   - Phase 5: Drop old column in a final migration.
2. **Avoid Full Table Locks**:
   - Adding a column with a non-constant `DEFAULT` or without `NULL` in older Postgres versions locks tables.
   - Adding indexes concurrently (`CREATE INDEX CONCURRENTLY`) avoids locking writes.
