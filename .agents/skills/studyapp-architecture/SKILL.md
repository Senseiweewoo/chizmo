---
name: studyapp-architecture
description: >-
  Blueprint and build order for an AI study app (flashcards, quizzes, spaced repetition, gamification, live multiplayer) in the style of Gizmo/Quizlet/Anki. Use this skill whenever the user is building, scaffolding, planning, or extending a flashcard app, quiz generator, study platform, or "Gizmo-like" product, including monorepo layout, database schema, API design, tech stack choices, or deciding what to build next. Use it even if the user only mentions one feature, because it keeps the whole system consistent.
---

# Study App Architecture

Use this skill as the source of truth for structure. The companion skills (fsrs-scheduler, ai-card-generation, content-ingestion-pipeline, gamification-engine, live-quiz-multiplayer, study-app-ux-accessibility, minors-safety-compliance) go deep on one area each; read the relevant one before writing code in that area.

## Default stack (change only with a stated reason)
- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL + Prisma; Redis (queues, cache, live-game state)
- BullMQ workers for ingestion and AI generation
- Socket.IO (or Ably/Pusher) for live games
- Zod for every boundary (API input, AI output, file metadata)
- Stripe (web) / RevenueCat (mobile); PostHog; Sentry
- Expo React Native only after the web MVP works; share logic through `packages/core`

## Monorepo layout
```
apps/web        Next.js app + marketing site
apps/mobile     Expo app (later)
apps/worker     BullMQ processors (ingestion, generation)
apps/realtime   Socket server for live games
packages/core   Pure TS: scheduler, scoring, XP, types, validators (no I/O)
packages/ai     Provider interface, prompts (versioned), parsers, critic
packages/db     Prisma schema, migrations, seed
```
Keep `packages/core` free of I/O so it is trivially unit-testable and shareable with mobile.

## Core entities
See `references/data-model.md` for the full Prisma sketch. The shape that matters most:
- **Card** is content (shared, editable). **CardState** is per-user scheduling data. Never store scheduling fields on Card, or shared decks break.
- **ReviewLog** is append-only. It is the ground truth for analytics and for re-tuning the scheduler.
- **Source** records where content came from, with a status machine: `pending -> extracting -> generating -> review -> ready | failed`.

## Build order (confirm each phase works before the next)
1. Scaffold, auth (guest mode that upgrades to an account), DB, design tokens, CI
2. Deck/card CRUD + flip-card study
3. Scheduler (fsrs-scheduler skill) + daily queue + review log
4. AI generation from topic/pasted text (ai-card-generation skill)
5. File ingestion (content-ingestion-pipeline skill)
6. Extra study modes: quiz, write-it-out, match, weak spots, test
7. Gamification (gamification-engine skill)
8. Summaries + AI tutor
9. Sharing, public library, Quizlet/Anki import
10. Live multiplayer (live-quiz-multiplayer skill)
11. Analytics + weekly AI report
12. Monetization and entitlements
13. Marketing/SEO pages, legal pages
14. Accessibility, performance, security pass

## Rules that prevent expensive rework
- Time-to-first-deck under 60 seconds drives retention; defer signup and paywall until after the first completed session.
- Do entitlement checks server-side, in one `can(user, action)` function.
- Treat every AI call as slow, fallible, and costly: queue it, validate output, cache by content hash, budget tokens per user.
- All times stored in UTC; scheduler takes the user's timezone and day-rollover hour as input.
- Write the scheduler and scoring tests first; they are cheap and catch the nastiest bugs.
- After each phase, report: what was built, how to run it, what's next.
