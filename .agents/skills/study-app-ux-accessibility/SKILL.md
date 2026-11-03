---
name: study-app-ux-accessibility
description: >-
  Design guidance for the UI/UX of a student-facing study app: onboarding that reaches a first generated deck in under a minute, mobile-first layout, flashcard flip and swipe interactions, playful-but-clean visual style, dark mode, empty/loading/error states, and WCAG 2.2 AA accessibility including dyslexia-friendly options and reduced motion. Use this skill whenever the user is designing screens, components, onboarding, design tokens, or accessibility for a flashcard/quiz/learning app, or asks for the app to feel "fun", "Gen Z", "gamified", or "addictive" in a good way.
---

# Study App UX & Accessibility

Also read the `frontend-design` skill when producing real UI code, to avoid generic template looks. This skill supplies the product-specific decisions.

## Design direction
Playful but uncluttered, aimed at teens without being childish. Original mascot/icon set, bold rounded typeface, one vibrant primary color plus a neutral scale, generous radius, strong contrast, and a full dark mode. Do not imitate another product's mascot, palette, or copy.

## Information architecture (mobile bottom tabs)
Home (today's queue, streak, goal ring) · Library (decks, folders) · Create (the big "+": import anything) · Live · Profile. Desktop uses a left sidebar with the same five items.

## Onboarding (goal: first deck in < 60 s)
1. 3-5 taps: level, subject, goal/exam date, daily time.
2. "What are you learning?" single field + import chips (PDF, YouTube, notes, photo).
3. Progress animation with real status text while generating.
4. Land in the first study session immediately; ask to save progress (account) after it ends. Paywall never appears before this point.

## Study screen
- One card at a time; flip on tap/space, swipe or press 1-4 to rate; undo button always visible.
- Show a thin session progress bar, not a stressful countdown.
- Answer feedback < 100 ms; confetti only for milestones.
- Provide "I knew it / I didn't" for two-button mode as well as four-grade mode (simpler for novices).

## States everyone forgets
Empty (illustration + one clear action), loading (skeletons not spinners), error (what happened + retry), offline (banner + queued reviews), quota reached (explain, offer options; don't dead-end), generation partially failed (show what succeeded).

## Accessibility (WCAG 2.2 AA minimum)
- Color contrast >= 4.5:1 text, 3:1 UI; never rely on color alone for correct/incorrect (add icon + text).
- Full keyboard operation with visible focus; targets >= 44x44 px.
- Screen-reader labels; announce card flips and answer results with `aria-live`.
- Respect `prefers-reduced-motion`; app setting to disable animation, sound, haptics.
- Text size setting; dyslexia-friendly font option and increased line spacing; avoid timers by default (offer extended time in tests).
- Support RTL and long translations; copy lives in i18n files from day one.

## Performance targets
FCP < 2 s on mid-range phones, card interaction at 60 fps, lazy-load heavy modes (live, charts), optimistic UI for ratings (write review log in the background).

## Copy tone
Encouraging, specific, short. "Nice, 8 in a row." not "OMG YOU'RE ON FIRE!!!" Avoid shame; never imply the user is failing.

## Review checklist before shipping a screen
Works at 360 px wide; dark mode; keyboard only; screen reader pass; reduced motion; empty/loading/error states present; copy externalized.
