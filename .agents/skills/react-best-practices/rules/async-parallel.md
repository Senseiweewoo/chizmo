# async-parallel: Parallelize Independent Operations

## Why It Matters
When two or more asynchronous calls do not depend on each other's return values, running them sequentially creates an unnecessary waterfall. Parallel execution reduces total response latency to the duration of the slowest single operation.

---

## Incorrect Code
```typescript
export async function getDashboardData(userId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const decks = await prisma.deck.findMany({ where: { ownerId: userId } });
  const streak = await prisma.streakDay.findFirst({ where: { userId } });
  return { profile, decks, streak };
}
```

## Correct Code
```typescript
export async function getDashboardData(userId: string) {
  const [profile, decks, streak] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.deck.findMany({ where: { ownerId: userId } }),
    prisma.streakDay.findFirst({ where: { userId } }),
  ]);
  return { profile, decks, streak };
}
```
