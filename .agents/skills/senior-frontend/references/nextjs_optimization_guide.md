# Next.js 15 Optimization Guide

Performance engineering, Core Web Vitals optimization, App Router streaming, and bundle reduction.

---

## 1. App Router Data Fetching & Streaming

### Suspense Boundaries for Fast First Paint
Wrap slow, heavy data fetches in `<Suspense fallback={<Skeleton />}>` to stream HTML immediately rather than blocking the server response:

```tsx
export default async function DeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Fast Header: streams immediately */}
      <DeckHeader deckId={deckId} />

      {/* Heavy Analytics & Recommendations: streamed asynchronously */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <DeckAnalytics deckId={deckId} />
      </Suspense>
    </div>
  );
}
```

---

## 2. Dynamic Imports for Heavy Client Libraries

Never load heavy libraries (`canvas-confetti`, `socket.io-client`, charting libraries) in the initial bundle. Load on demand using `next/dynamic`:

```tsx
import dynamic from 'next/dynamic';

const ConfettiReward = dynamic(
  () => import('@/components/gamification/ConfettiReward').then((mod) => mod.ConfettiReward),
  { ssr: false }
);

const LiveQuizArena = dynamic(
  () => import('@/components/live/LiveQuizArena').then((mod) => mod.LiveQuizArena),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);
```

---

## 3. Font & Asset Optimization

1. **Local Variable Fonts**:
   Use `next/font/local` or `next/font/google` with `display: 'swap'` to eliminate layout shifts (CLS 0):
   ```tsx
   import { Inter } from 'next/font/google';

   const inter = Inter({
     subsets: ['latin'],
     display: 'swap',
     variable: '--font-inter',
   });
   ```

2. **Image Optimization**:
   Always specify `width`, `height`, and `sizes` on `next/image` to prevent reflows. Use `priority` only on above-the-fold hero images.

---

## 4. Bundle Optimization & Target Budgets

- **First Load JS**: Keep shared First Load JS below **120 kB**.
- **Route JS**: Route-specific client code should remain below **30 kB** per view.
- **Tree-Shaking Icons**: Avoid importing barrel icons:
  - Good: `import { Flame, Target } from 'lucide-react'` (properly tree-shaken by Next.js bundler).
  - Avoid: importing entire icon sets dynamically without named imports.
