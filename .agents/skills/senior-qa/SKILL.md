---
name: senior-qa
description: Comprehensive QA and testing skill for quality assurance, test automation, and testing strategies for ReactJS, NextJS, NodeJS applications. Includes test suite generation, coverage analysis, E2E testing setup, and quality metrics. Use when designing test strategies, writing test cases, implementing test automation, performing manual testing, or analyzing test coverage.
---

# Senior QA

Complete toolkit for senior QA and test automation across React, Next.js, Node.js, and TypeScript architectures.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts and standard test workflows:

```bash
# Script 1: Test Suite Generator
python .agents/skills/senior-qa/scripts/test_suite_generator.py [options]

# Script 2: Coverage Analyzer
python .agents/skills/senior-qa/scripts/coverage_analyzer.py [options]

# Script 3: E2E Test Scaffolder
python .agents/skills/senior-qa/scripts/e2e_test_scaffolder.py [options]
```

## Core Capabilities

### 1. Test Suite Generator
Automated test scaffolder for Node.js `node:test`, Vitest, and Jest test suites.
- Generates unit test suites with boundary value analysis and equivalence partitioning
- Preconfigured assertions (`node:assert/strict`) for zero-dependency execution
- Mocking patterns for Prisma, Redis, and external AI providers

**Usage:**
```bash
python .agents/skills/senior-qa/scripts/test_suite_generator.py <module-path> --output packages/core/src/__tests__
```

### 2. Coverage Analyzer
Comprehensive analysis of test file presence, test case density, and untested business logic.
- Maps source files in `src/` to corresponding test files
- Detects orphaned components and service functions without unit test coverage
- Generates test coverage gap reports with severity ratings

**Usage:**
```bash
python .agents/skills/senior-qa/scripts/coverage_analyzer.py . --verbose
```

### 3. E2E Test Scaffolder
Playwright test scaffolder for critical user journeys.
- Onboarding and first-deck generation flow
- Study session rating lifecycle (Again, Hard, Good, Easy)
- Real-time live quiz room creation, joining, and scoring
- Mobile viewport and responsive touch interaction assertions

**Usage:**
```bash
python .agents/skills/senior-qa/scripts/e2e_test_scaffolder.py <feature-name> --output tests/e2e
```

---

## Testing Principles & Standards

### 1. The Pragmatic Testing Pyramid
1. **Unit Tests (70%)**: Pure functions, FSRS math, XP progression, Levenshtein fuzzy grading, Zod schema boundary validation. Fast (<1ms), deterministic, zero network or DB dependencies.
2. **Integration Tests (20%)**: Service layer tests with database or in-memory fallbacks, API route handler execution, authentication cookie validation.
3. **End-to-End Tests (10%)**: Playwright browser flows testing critical paths: Landing -> Ingest/Generate -> Study Flashcards -> Upgrade Pro.

### 2. Invariants for Test Quality
- **Assert Behavior, Not Implementation**: Test inputs and outputs, not internal private variables.
- **Deterministic Clocks**: Always pass `now: Date` into time-sensitive schedulers (FSRS, streaks, rollover). Never rely on system clock in tests.
- **Fail Fast**: Tests must run without flaky timeouts. Unit suites should execute in under 5 seconds.

---

## Reference Documentation

- [Testing Strategies](./references/testing_strategies.md): Unit vs integration vs E2E, boundary value analysis, and deterministic testing.
- [Test Automation Patterns](./references/test_automation_patterns.md): Node test runner, Playwright configurations, mocking strategies, and CI matrix execution.
- [QA Best Practices](./references/qa_best_practices.md): Bug triage, regression testing, test data management, and release quality gates.
