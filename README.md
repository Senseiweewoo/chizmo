# Chizmo 🧠⚡

An AI-powered spaced repetition study platform built for deep learning, active recall, and collaborative study.

## 🚀 Overview

Chizmo blends modern spaced repetition (FSRS-4.5) with instant AI-powered content generation, gamification streaks, and real-time multiplayer quiz rooms.

### Core Pillars
- **FSRS-4.5 Spaced Repetition**: Scientifically tuned stability and retrievability scoring, learning steps, timezone-aware day rollover, and exam-date mode.
- **AI Card Generation & Quality Engine**: Strict prompt-engineered generation with Zod validation, LLM critic pass, grounding quote verification, and deduplication.
- **Import Anything Pipeline**: Extract and chunk knowledge from PDFs, PowerPoints, DOCX, handwritten notes/photos (OCR), YouTube transcripts, audio recordings, and Quizlet/Anki exports.
- **Ethical Gamification**: Pure event-driven XP, leveling, streaks with freeze mechanics and repair windows, weekly leaderboards, and zero dark patterns.
- **Live Quiz Multiplayer**: Server-authoritative real-time quiz game rooms with join codes/QR, ping latency compensation, and instant post-game flashcard conversion.
- **Student Safety & Privacy**: Data minimization, age gating (COPPA & GDPR-K compliant), AI self-harm detection & crisis intervention protocols, and academic integrity focus.

---

## 🏗️ Monorepo Architecture

```text
chizmo/
├── apps/
│   ├── web          # Next.js (App Router), Tailwind CSS, shadcn/ui
│   ├── mobile       # Expo React Native (post-MVP, sharing packages/core)
│   ├── worker       # BullMQ processors (document ingestion & AI generation)
│   └── realtime     # Socket.IO & Redis server for live multiplayer quiz rooms
└── packages/
    ├── core         # Pure TS: FSRS scheduler, scoring, XP, validators (strictly NO I/O)
    ├── ai           # LLM provider interface, versioned prompts, output schemas, critic
    └── db           # Prisma schema, migrations, and database seeders
```

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js (App Router)](https://nextjs.org/), TypeScript, [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Real-Time**: Node.js, [Socket.IO](https://socket.io/) with Redis adapter
- **Databases & Cache**: PostgreSQL with [Prisma ORM](https://www.prisma.io/), [Redis](https://redis.io/)
- **Queues & Background Jobs**: [BullMQ](https://bullmq.io/)
- **Validation**: [Zod](https://zod.dev/)
- **Spaced Repetition**: FSRS-4.5 (`ts-fsrs`)
