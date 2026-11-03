# Study App System Guidelines & Architectural Standards

This document establishes the project rules, architectural standards, and core invariants for this AI-powered study platform. All code, scaffolding, and feature implementations must strictly adhere to these principles.

---

## 1. Monorepo Layout & Tech Stack

### Repository Structure
```
apps/web        Next.js (App Router) + Tailwind CSS + shadcn/ui + marketing site
apps/mobile     Expo React Native (post-MVP; shares logic with packages/core)
apps/worker     BullMQ processors for file ingestion & AI card generation
apps/realtime   Socket.IO / WebSocket server for live multiplayer quiz rooms
packages/core   Pure TypeScript: FSRS scheduler, scoring, XP, validators, domain types (STRICTLY NO I/O)
packages/ai     Provider interface, versioned prompts, output schemas, critic & grounding logic
packages/db     Prisma schema, migrations, and database seeders
```

### Core Stack
- **Framework & Frontend**: Next.js (App Router), TypeScript (strict mode), Tailwind CSS, shadcn/ui
- **Database & Cache**: PostgreSQL (Prisma ORM) and Redis (queues, caching, live game state)
- **Background Jobs**: BullMQ
- **Real-Time**: Socket.IO with Redis adapter
- **Validation**: Zod across every boundary (API requests, AI outputs, file metadata)
- **Monetization & Analytics**: Stripe (web) / RevenueCat (mobile); PostHog; Sentry

---

## 2. Core Data Modeling Invariants

1. **Card Content vs. Scheduling State Separation**:
   - `Card` represents shared, immutable or author-edited content.
   - `CardState` represents a specific user's scheduling state (`state`, `stability`, `difficulty`, `due`, `reps`, `lapses`).
   - **Never store scheduling or review fields directly on the `Card` entity.**
2. **Append-Only Review Log**:
   - `ReviewLog` is immutable and append-only (`userId`, `cardId`, `rating`, `prevState`, `elapsedDays`, `scheduledDays`, `responseMs`, `reviewedAt`). It is the ground truth for analytics, FSRS weight tuning, and streak calculations.
3. **Pure Core Logic**:
   - `packages/core` must have zero external I/O, network, or clock calls. Clocks (`now: Date`) and configs must always be passed into functions as parameters to guarantee deterministic testing.

---

## 3. Spaced Repetition (FSRS-4.5)

- **Default Engine**: Use `ts-fsrs` (FSRS-4.5 standard). SM-2 is only a reference fallback.
- **Ratings**: `1: Again`, `2: Hard`, `3: Good`, `4: Easy`.
- **Learning Steps**: Support intra-day learning steps (e.g., 1 min, 10 min) before graduation to full day-scale intervals.
- **Timezone & Rollover**: Scheduling and daily review queues must compute days using the user's local timezone with a custom rollover hour (default 4:00 AM local time).
- **Interval Fuzzing**: Apply small deterministic jitter to intervals $>3$ days to avoid card clumping.
- **Exam Mode**: Dynamically calculate required new cards per day given exam date $E$, and raise desired retention in the final week.
- **Leech Management**: Automatically flag cards with $\ge 8$ lapses for review or AI rewriting/splitting.

---

## 4. AI Content Generation & Quality Pipeline

1. **Pipeline Order**:
   `Chunk Source -> Generate Cards -> Zod Validate -> LLM Critic Pass -> Grounding Quote Verification -> Dedupe -> User Review Screen`
2. **Card Quality Criteria**:
   - **Atomic**: Exactly one fact or concept per card.
   - **Self-Contained**: Clear and answerable without needing external context.
   - **Unambiguous**: Exactly one defensible correct answer.
   - **Concise**: Front $<25$ words; back $<40$ words.
   - **Active Recall**: Production over passive recognition.
   - **Grounded**: Every generated card must cite a verifiable source location (`page`, `slide`, `timestamp`, or `quote`).
3. **Engineering Practices**:
   - Prompts must be versioned in files (e.g., `prompts/card-gen.v1.md`).
   - Cache generations by `hash(chunkText + settings + promptVersion)`.
   - Never use `eval()`; parse JSON strictly with Zod validation.
   - Provide a "Report a mistake" button and transparently label AI-generated content.
4. **AI Tutor**:
   - Ground conversations in the user's source materials using retrieval.
   - Default to Socratic hints and guided questions rather than direct homework solutions.

---

## 5. Content Ingestion Pipeline

- **Status State Machine**: `pending -> extracting -> generating -> review -> ready` (or `failed` with user-friendly error message).
- **Security**: Direct-to-bucket signed uploads (no streaming large files through Next.js server). Validate magic bytes, enforce file size limits, and isolate parsers in sandboxed worker containers with SSRF protections on URL imports.
- **Supported Formats**: PDF (text layer + OCR fallback), PPTX (slides + speaker notes), DOCX (headings & tables), Images/Photos (OCR), YouTube (captions/audio STT), Audio (Whisper STT), Quizlet/Anki (`.csv`, `.tsv`, `.apkg`).
- **Idempotency**: All worker jobs must be idempotent and cached by file content hash.

---

## 6. Gamification Engine & Ethical Guardrails

- **Event-Driven**: Single state reducer processing domain events from `ReviewLog`.
- **XP Progression**: Base XP (`Again: 0-1`, `Hard: 2`, `Good: 5`, `Easy: 6`) with caps per card/day to prevent grinding. Level curve: $\text{xpForLevel}(n) = \text{round}(100 \times n^{1.5})$.
- **Streaks**: A study day requires $\ge 10$ meaningful reviews or 1 completed session. Support streak freezes (1 earned per 7-day streak, max 2 banked) and a 24-hour repair window.
- **Leaderboards**: Redis sorted sets by week (`lb:{scope}:{isoWeek}`). Opt-in only; display names only.
- **Ethical Safeguards**:
  - NO dark patterns, guilt-based copy, or fake countdowns.
  - Quiet hours for notifications; no late-night pushes; maximum 1–2 reminders/day.
  - Option for users to disable streaks and leaderboards completely.

---

## 7. Live Quiz Multiplayer

- **Server-Authoritative**: Server controls question timers, answer validation, and score calculation. Redis stores all room states.
- **Room Lifecycle**: `LOBBY -> QUESTION -> REVEAL -> LEADERBOARD -> PODIUM -> ENDED`.
- **Join Flow**: 6-character room codes and QR codes; guest nicknames with profanity filtering; `rejoinToken` in `localStorage` for automatic reconnection.
- **Spaced Repetition Integration**: After a live game, players can save missed questions directly to their study decks as new cards.

---

## 8. UX, Accessibility & Onboarding

- **Speed to First Value**: Under 60 seconds from landing to first generated study session. Defer sign-up and paywalls until after the first session is completed.
- **Interaction Standards**: Instant answer feedback ($<100\text{ ms}$), optimistic UI updates, space/tap to flip, 1–4 keys or swipe to rate, always-visible undo button.
- **Accessibility (WCAG 2.2 AA)**:
  - Contrast ratios $\ge 4.5:1$ text, $\ge 3:1$ UI components.
  - Never convey state with color alone (combine icon + text).
  - Target sizes $\ge 44 \times 44\text{ px}$.
  - Support `prefers-reduced-motion`, dyslexia-friendly fonts, and keyboard-only navigation.

---

## 9. Minors, Safety & Compliance

- **Data Minimization**: Collect only email/parent email, display name, and birth year (not full birth date). Never sell data or use behavioral ad trackers.
- **Age Gating**: Neutral age gate at registration with parental consent workflows for users under the legal digital consent age (COPPA, GDPR-K).
- **Crisis & Self-Harm Safety**: The AI tutor must immediately detect self-harm or crisis cues, halt homework generation, offer compassionate language, and provide verified crisis hotline resources.
- **Academic Integrity**: Promote deep learning over cheating; use Socratic inquiry instead of essay/homework mills.
