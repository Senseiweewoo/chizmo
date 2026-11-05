# API Design Patterns

Enterprise guidelines and production patterns for RESTful APIs and distributed backend architectures.

---

## 1. URL Structure & Resource Modeling

- **Nouns over Verbs**: Use plural nouns for resource paths (`/api/decks`, `/api/cards`, `/api/users`).
- **Hierarchical Nesting**: Nest subordinate resources under parent identifiers when ownership is strictly hierarchical:
  - `GET /api/decks/:deckId/cards` (list cards in deck)
  - `POST /api/decks/:deckId/cards` (create card in deck)
  - Direct identifier for direct mutation: `DELETE /api/cards/:cardId`
- **Actions on Resources**: When an operation does not map neatly to CRUD, model it as an action sub-resource:
  - `POST /api/study/review` (submit a study review event)
  - `POST /api/community/fork` (fork a deck)
  - `POST /api/live/rooms/:code/join` (join live multiplayer session)

---

## 2. Pagination Strategy

### Cursor-Based Pagination (Recommended for dynamic streams & feeds)
```typescript
interface CursorPaginationResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```
**Prisma Implementation**:
```typescript
const items = await prisma.reviewLog.findMany({
  where: { userId },
  take: limit + 1,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  orderBy: { reviewedAt: 'desc' },
});
```

### Offset Pagination (For shallow catalog navigation)
- Enforce hard upper bounds: `limit = Math.min(parseInt(limitParam || '20', 10), 100)`.
- Disallow deep offset queries (`offset > 10,000`) due to linear scan penalties in PostgreSQL.

---

## 3. Idempotency & Mutation Safety

- **Idempotency Keys**: Use `Idempotency-Key` HTTP headers for financial transactions, billing upgrades, and background job creation.
- **Deduplication**: Hash unique payload contents (`hash(chunkText + settings + promptVersion)`) to avoid duplicate AI generations or queue bloat.
- **Optimistic Concurrency**: Include an `updatedAt` or `version` integer check on concurrent updates to prevent lost updates:
  ```sql
  UPDATE decks SET title = $1, version = version + 1 WHERE id = $2 AND version = $3;
  ```

---

## 4. Standard Response Formats

### Successful Mutation / Query
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 140, "page": 1 }
}
```

### Structured Error Response
```json
{
  "success": false,
  "error": "Resource not found or unauthorized",
  "code": "DECK_NOT_FOUND",
  "details": []
}
```
