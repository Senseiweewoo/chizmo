---
name: gamification-engine
description: >-
  Design and implement the motivation layer of a study app: XP, levels, daily streaks with freezes, weekly goals, achievements, leaderboards, reminders, confetti and sound feedback, with ethical guardrails against manipulative engagement tricks. Use this skill whenever the user wants study streaks, points, badges, "addictive" learning mechanics, leaderboards, push notification reminders, or says they want a Duolingo-like or Gizmo-like game feel.
---

# Gamification Engine

Goal: make studying feel rewarding while rewarding **learning**, not mere tapping. Keep the logic in `packages/core/gamification` as pure functions fed by events from `ReviewLog`.

## Event-driven design
Emit domain events (`card_reviewed`, `session_completed`, `quiz_finished`, `deck_created`, `live_game_won`). A single reducer turns events into XP, streak, and achievement updates, so rules live in one place and are testable.

## XP and levels
- Base XP per review: Again 0-1, Hard 2, Good 5, Easy 6; bonus for session completion and accuracy.
- Cap XP per card per day so users can't farm one easy deck; reduce XP for reviewing cards that aren't due (cramming).
- Level curve: `xpForLevel(n) = round(100 * n^1.5)`; show progress to next level on the home screen.

## Streaks
- A "study day" = at least N meaningful reviews (default 10) or one finished session, evaluated in the user's timezone with a rollover hour.
- **Streak freeze**: auto-consumed on a missed day; earn one per 7-day streak (max 2 banked); premium gets more. Show remaining freezes.
- **Repair window**: let users restore a lost streak within 24h by completing a double session. Avoid punishing copy.
- Keep a calendar heat map from `StreakDay`.

## Weekly goals and quests
Daily goal ring (e.g. 5/10/20 min), weekly goal, and simple rotating quests ("Review 30 cards before Friday"). Choose goals from onboarding answers.

## Achievements
Declarative table: `{id, name, rule(events|stats), icon, xpReward}`. Examples: first deck, 7/30/100-day streak, 1,000 reviews, perfect quiz, comeback after 14 days, first live win. Unlock toast with a celebration, once.

## Leaderboards
Redis sorted sets keyed by `lb:{scope}:{isoWeek}`; scopes: friends, class, global. Opt-in only, display names only, weekly reset, and tier leagues so beginners compete with beginners. Never show real names or schools of minors.

## Feedback and polish
Confetti on milestones, subtle haptics, short sound effects (all toggleable, with a reduced-motion setting). Correct/incorrect feedback should be instant (<100 ms).

## Reminders
- One smart daily reminder at the user's chosen time; skip if they already studied. Respect quiet hours and per-channel opt-outs; one-tap unsubscribe.
- Copy is encouraging and specific ("12 cards are ready; about 4 minutes"), never guilt-based.

## Ethical guardrails (important, especially with teen users)
- No fake scarcity, fake countdowns, or loss-aversion shaming ("your streak is dying!").
- No notifications late at night; no more than 1-2 per day.
- Don't gate learning behind compulsive loops; let users turn off streaks and leaderboards.
- Don't reward speed at the expense of accuracy in standard review.
- Measure success by retention of knowledge (accuracy over time), not just time-in-app.

## Tests
XP caps, streak across DST changes and timezone travel, freeze consumption order, achievement idempotency (unlock once), leaderboard weekly rollover.
