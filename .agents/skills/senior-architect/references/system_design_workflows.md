# System Design Workflows

Methodologies for designing resilient, high-scale distributed study platforms.

---

## 1. System Design Step-by-Step Workflow

1. **Requirements & Scope Definition**:
   - Functional: What does the user accomplish? (Generate deck from PDF, study via FSRS, live multiplayer).
   - Non-Functional: Latency (<100ms API, <16ms UI flip), Availability (99.9%), Data durability (zero review log loss).
2. **Capacity Estimation & Math**:
   - 100,000 active students $\times$ 50 reviews/day = 5,000,000 daily `ReviewLog` entries.
   - At 100 bytes per record = 500 MB/day append-only storage.
   - Write throughput: $\approx 60$ writes/second average, peaking at $300$ writes/second.
3. **High-Level Component Design**:
   - Ingestion Workers (BullMQ + Redis) decouple heavy OCR/Whisper STT from user-facing Next.js HTTP server.
   - Socket.IO servers with Redis pub/sub adapter allow horizontal scaling of multiplayer rooms.
4. **Data Modeling & Storage Strategy**:
   - PostgreSQL for relational consistency and transactional integrity (Decks, Users, Billing).
   - Redis for low-latency queues, ephemeral room states, and rolling rate limiters.

---

## 2. Technical Trade-Off Matrix

| Decision | Selected Option | Alternative | Rationale |
|---|---|---|---|
| **Scheduler Algorithm** | **FSRS-4.5** | SM-2 | 20–30% higher retention efficiency with 15–20% fewer reviews needed. |
| **Realtime Engine** | **Socket.IO + Redis** | WebSockets (raw) | Built-in fallback to HTTP long-polling, room broadcasting, and automatic reconnection. |
| **Background Processing** | **BullMQ** | In-process timer | Durable Redis-backed queues prevent job loss during container redeploys. |
| **Auth Strategy** | **Stateless JWT in HttpOnly Cookie** | LocalStorage JWT | Immune to XSS exfiltration while avoiding database round-trip on static assets. |
