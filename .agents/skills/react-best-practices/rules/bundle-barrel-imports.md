# bundle-barrel-imports: Avoid Barrel File Re-exports

## Why It Matters
Importing from barrel files (`index.ts` files that re-export hundreds of modules or icons) forces bundlers to parse and evaluate unused modules, ballooning compilation memory and slowing down client-side bundle load times.

---

## Incorrect Code
```typescript
// BAD: Pulls in every icon module exported by the barrel file
import * as Icons from 'lucide-react';
```

## Correct Code
```typescript
// GOOD: Named import directly tree-shaken by bundler
import { Flame, Target, Sparkles } from 'lucide-react';
```
