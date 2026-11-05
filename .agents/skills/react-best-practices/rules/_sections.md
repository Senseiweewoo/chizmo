# Performance Rule Sections

Detailed breakdowns and implementations for core optimization categories.

---

## Section 1: Async & Eliminating Waterfalls
Waterfalls occur when independent asynchronous operations are executed sequentially with consecutive `await` statements, multiplying network latency:
```typescript
// BAD: 200ms + 200ms = 400ms waterfall
const user = await getUser(userId);
const deck = await getDeck(deckId);

// GOOD: Parallel execution in max(200ms, 200ms) = 200ms
const [user, deck] = await Promise.all([
  getUser(userId),
  getDeck(deckId),
]);
```

---

## Section 2: Bundle Size Optimization
Client bundles degrade Time to Interactive (TTI) and First Input Delay (FID).
- Dynamic import for heavy study modes (Match mode, Live Multiplayer, Confetti celebrations):
```typescript
import dynamic from 'next/dynamic';

const MatchGame = dynamic(() => import('./MatchGame'), {
  loading: () => <MatchGameSkeleton />,
  ssr: false,
});
```

---

## Section 3: Server-Side Performance & Streaming
- Utilize `React.cache()` to deduplicate database queries across multiple Server Components rendered in the same request:
```typescript
import { cache } from 'react';
import { prisma } from '@chizmo/db';

export const getDeckWithStats = cache(async (deckId: string) => {
  return prisma.deck.findUnique({
    where: { id: deckId },
    include: { _count: { select: { cards: true } } },
  });
});
```
