---
name: minors-safety-compliance
description: >-
  Privacy, safety, and legal-compliance checklist for a study app used by teenagers and children: age gating, COPPA/GDPR-K/CCPA, parental consent, data minimization, content moderation for public decks and live games, AI tutor safety (self-harm handling, academic integrity), copyright/DMCA handling, security basics, and honest marketing claims. Use this skill whenever the user's app might be used by under-18 students, handles uploads or public sharing, includes an AI chat tutor, shows testimonials or exam-result claims, or asks about privacy policy, terms, GDPR, COPPA, or moderation. This is general engineering guidance, not legal advice.
---

# Minors, Safety & Compliance

State clearly to the user: this is engineering guidance, not legal advice, and a lawyer should review the policies before launch, especially for COPPA (US, under 13), GDPR-K (EU/UK age-of-consent rules vary 13-16), and the UK Children's Code.

## Data minimization
Collect only: email (or parent email), display name, birth year (not full DOB), study data. No precise location, no contact-list upload, no behavioral ad targeting, no selling of data. Third-party SDKs must be audited; disable ad/analytics identifiers for minors.

## Age gate and consent
- Neutral age screen at signup (don't hint which answer unlocks access).
- Under the local digital-consent age: parental-consent flow (email-plus, or verified method as required) before collecting personal data; limited mode until consent.
- Guest mode keeps data local/anonymous until signup.

## User rights
Self-serve data export and account deletion (including uploads and AI chat history), cookie consent with real choices, retention schedule (delete unused guest data, purge deleted accounts within a stated period), and a plain-language privacy policy written for teens.

## Content moderation
- Public decks: automated text/image checks on publish, user "Report" button, takedown queue, ability to unpublish, and rate limits on new accounts publishing.
- Private uploads are never publicly indexed.
- Live games: nickname filter, no free-text chat for minors, host kick/ban.
- Leaderboards: display names only, opt-in, no school/real-name display.

## AI tutor and generation safety
- Filter harmful input/output; refuse unsafe instructions.
- **Self-harm or crisis signals**: respond with warmth, don't continue as a normal homework chat, encourage reaching a trusted adult or local crisis line, and provide region-appropriate resources (look up current ones; don't hardcode stale numbers).
- **Academic integrity**: default to teaching (hints, worked-example, Socratic) rather than producing answers to be submitted as graded work; add a note in the UI.
- Label AI-generated study content as possibly inaccurate; provide "Report a mistake".
- Don't claim the tutor is a human or a licensed professional.

## Copyright and uploads
Terms: users confirm they have rights to uploaded material. Provide a DMCA/takedown form and a repeat-infringer policy. Store uploads privately; don't republish source text verbatim in public decks by default.

## Security baseline
HTTPS everywhere, encryption at rest, secrets in env/secret manager, least-privilege IAM, signed URLs, SSRF protection on URL imports, parser sandboxing, dependency scanning, rate limiting, audit logs for admin actions, backups with restore tests, and a documented incident-response plan with breach-notification timelines.

## Honest marketing
- Testimonials must be real, consented, and attributed (or clearly labeled illustrative during development). Never fabricate reviews or grade claims.
- Avoid unqualified outcome claims ("guaranteed A+"). Use hedged, evidence-backed statements and cite studies on spaced repetition/active recall accurately.
- Competitor comparisons must be factual and verifiable; date-stamp them.
- Subscription terms: clear price, trial length, renewal date reminders, one-click cancel, no dark patterns.

## Launch checklist
Age gate tested · consent flow tested · privacy/terms/cookies live · export/delete work · moderation queue staffed · crisis-handling tested · DMCA address live · security review done · pen-test or at least dependency/audit scan · lawyer review recorded.
