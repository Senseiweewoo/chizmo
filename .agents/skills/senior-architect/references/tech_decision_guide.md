# Technical Decision Guide & ADR Framework

Standard framework for proposing, evaluating, and documenting architectural decisions.

---

## 1. Architectural Decision Record (ADR) Template

```markdown
# ADR-001: Adoption of FSRS-4.5 as Core Spaced Repetition Engine

## Context & Problem Statement
The application requires a modern spaced repetition scheduling algorithm that optimizes memory retention while minimizing review fatigue for diverse subjects (language vocabulary, medical school exams, standardized test prep).

## Considered Options
1. SM-2 (SuperMemo-2 classic algorithm)
2. FSRS-4.5 (Free Spaced Repetition Scheduler standard)
3. Anki default hybrid

## Decision Outcome
Chosen option: **FSRS-4.5** implemented in `packages/core`.

### Positive Consequences
- Dynamic calculation of Memory Stability ($S$) and Difficulty ($D$).
- Retrievability decay formula $R(t) = (1 + t / (9 \cdot S))^{-1}$ models real human forgetting accurately.
- Supports customizable desired retention targets ($0.70$ to $0.97$) and Exam Date mode.

### Negative Consequences
- Slightly more complex mathematical calculations than SM-2 (mitigated by isolated pure functional unit testing in `packages/core`).
```
