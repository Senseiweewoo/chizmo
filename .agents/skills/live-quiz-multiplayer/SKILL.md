---
name: live-quiz-multiplayer
description: >-
  Build a real-time multiplayer quiz game mode (Kahoot-style "Live" rooms) where a host runs a flashcard deck and players join by code or QR, with server-authoritative timing, scoring, reconnects, team modes, moderation, and end-of-game reports. Use this skill whenever the user mentions live quiz, multiplayer, join code, classroom game, WebSockets for quizzes, head-to-head study games, or "Gizmo Live"-style features.
---

# Live Quiz Multiplayer

## Principles
1. **The server is the source of truth** for the question timer, answer acceptance, and scores. Clients render state; they never decide correctness or timing.
2. **Latency fairness**: measure each client's offset with a ping handshake; score using server receive time minus the question's server start time, optionally adjusted by half the measured RTT.
3. **Resilience**: all room state lives in Redis (not process memory) so a realtime server can restart or scale horizontally.

## Room lifecycle
`LOBBY -> QUESTION(i) -> REVEAL(i) -> LEADERBOARD(i) -> ... -> PODIUM -> ENDED`
Host actions: start, pause/resume, skip, extend timer, show/hide answers, kick, end. Auto-end rooms idle for 2 hours.

## Joining
- 6-digit code (avoid ambiguous chars, expire when the room ends) plus QR linking to `/live/join?code=...`.
- Nickname only; no account required. Run a profanity filter on names, dedupe by suffix, rate-limit join attempts per IP.
- Player gets a signed `rejoinToken` stored in localStorage so a refresh or dropped connection restores their seat.

## Socket protocol (versioned, Zod-validated)
Client -> server: `join {code,nickname}`, `rejoin {token}`, `answer {qIndex, choice, clientTs}`, host: `start`, `pause`, `skip`, `kick {playerId}`.
Server -> clients: `lobby {players}`, `question {index, text, choices, endsAtServerTs}`, `answer_ack`, `reveal {correct, distribution}`, `leaderboard {top5, you}`, `podium`, `error {code}`.
Never send the correct answer before reveal. Ignore duplicate or late answers idempotently (first valid answer wins).

## Scoring
`points = base * (0.5 + 0.5 * remainingFraction)` for correct answers, plus streak bonus (+5% per consecutive correct, cap 25%). Ties broken by total response time. Put this in `packages/core/scoring` with unit tests.

## Game modes
Classic speed quiz; **team mode** (average or sum of top-k scores); **survival** (wrong answer = lose a life); **race** (progress along a track per correct answer). Build classic first; others are scoring/rendering variations on the same event stream.

## Question sourcing
Auto-build MCQs from deck cards (use AI distractors prepared ahead of time, not at game time). Cache the question set when the room is created.

## After the game
Report to host: per-question accuracy, hardest questions, per-player results (CSV export). Offer each player "save missed cards to my deck" which creates `CardState` entries so live play feeds spaced repetition.

## Safety and abuse
Host-only controls; kick + ban by session; message-free design (no chat) for minors; rate-limit sockets (messages/sec); cap players per room by plan (e.g. 40 free, 200 premium); log room events for moderation.

## Tests
Simulate 100 bots with random latency and disconnects; assert: scores are identical across two replays of the same event log, late answers rejected, reconnect restores score, server restart mid-question resumes with the correct remaining time.
