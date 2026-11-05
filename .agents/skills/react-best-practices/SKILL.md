---
name: react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
---

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel Engineering. Contains 45 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js App Router pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size, Core Web Vitals, or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

---

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)
- `async-defer-await` - Move `await` into branches where actually used
- `async-parallel` - Use `Promise.all()` for independent asynchronous operations
- `async-dependencies` - Use partial dependency resolution (`better-all`) for mixed cascades
- `async-api-routes` - Start promises early, await late in Next.js API routes
- `async-suspense-boundaries` - Use `<Suspense>` boundaries to stream content progressively

### 2. Bundle Size Optimization (CRITICAL)
- `bundle-barrel-imports` - Import directly from specific modules, avoid barrel index files
- `bundle-dynamic-imports` - Use `next/dynamic` with `{ ssr: false }` for heavy client components
- `bundle-defer-third-party` - Load analytics, confetti, audio, or logging after initial hydration
- `bundle-conditional` - Load modules only when a specific feature or study mode is activated
- `bundle-preload` - Preload resources on hover or focus for instant perceived speed

### 3. Server-Side Performance (HIGH)
- `server-cache-react` - Use `React.cache()` for per-request database and fetch deduplication
- `server-cache-lru` - Use LRU in-memory or Redis caches for cross-request computation caching
- `server-serialization` - Minimize payload serialized across Server -> Client component boundaries
- `server-parallel-fetching` - Restructure parent/child components to parallelize database queries
- `server-after-nonblocking` - Use Next.js `after()` or background workers for non-blocking logging

### 4. Client-Side Data Fetching (MEDIUM-HIGH)
- `client-swr-dedup` - Use SWR or React Query for automatic caching and request deduplication
- `client-event-listeners` - Deduplicate global event listeners and unregister on unmount

### 5. Re-render Optimization (MEDIUM)
- `rerender-defer-reads` - Do not subscribe to state only used inside event callbacks
- `rerender-memo` - Extract expensive mathematical or rendering work into `React.memo()`
- `rerender-dependencies` - Pass primitive dependencies into `useEffect` rather than object instances
- `rerender-derived-state` - Subscribe to derived booleans instead of raw changing values
- `rerender-functional-setstate` - Use functional `setState((prev) => ...)` for stable callbacks
- `rerender-lazy-state-init` - Pass initializer function `useState(() => init())` for expensive defaults
- `rerender-transitions` - Use `startTransition()` for non-urgent UI updates (e.g. search filters)

### 6. Rendering Performance (MEDIUM)
- `rendering-animate-svg-wrapper` - Animate CSS `transform` on an outer `<div>` wrapper, not the `<svg>`
- `rendering-content-visibility` - Use `content-visibility: auto` for long flashcard and review feeds
- `rendering-hoist-jsx` - Extract static JSX elements outside the component render cycle
- `rendering-svg-precision` - Reduce SVG coordinate precision to minimize DOM payload
- `rendering-hydration-no-flicker` - Use inline blocking script to prevent dark mode flash of unstyled content
- `rendering-activity` - Use React 19 `<Activity>` component for offscreen tabs rather than unmounting
- `rendering-conditional-render` - Use ternary `cond ? <Comp /> : null` instead of `cond && <Comp />` (prevents `0` rendering)

### 7. JavaScript Performance (LOW-MEDIUM)
- `js-batch-dom-css` - Group CSS changes via classes or CSS variables rather than style properties
- `js-index-maps` - Build `Map` or `Set` for repeated $O(1)$ lookups instead of `.find()` in loops
- `js-cache-property-access` - Cache object property lookups inside tight hot loops
- `js-cache-function-results` - Cache pure function calculations in module-level Map
- `js-cache-storage` - Cache `localStorage` / `sessionStorage` reads in memory
- `js-combine-iterations` - Combine multiple `.filter().map()` chains into a single pass
- `js-length-check-first` - Check array length before running expensive deep comparisons
- `js-early-exit` - Return early from functions to minimize nested control flow
- `js-hoist-regexp` - Hoist `RegExp` creation outside component render functions and loops
- `js-min-max-loop` - Use `Math.min`/`Math.max` in a loop instead of sorting an entire array
- `js-set-map-lookups` - Use `Set` for membership checks (`set.has(id)`)
- `js-tosorted-immutable` - Use `toSorted()` instead of `.slice().sort()` for immutable data

### 8. Advanced Patterns (LOW)
- `advanced-event-handler-refs` - Store event handler callbacks in refs to avoid re-subscribing
- `advanced-use-latest` - Maintain `useLatest(value)` for stable callback refs
