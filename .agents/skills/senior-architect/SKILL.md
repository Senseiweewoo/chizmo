---
name: senior-architect
description: Comprehensive software architecture skill for designing scalable, maintainable systems using ReactJS, NextJS, NodeJS, Express, React Native, Swift, Kotlin, Flutter, Postgres, GraphQL, Go, Python. Includes architecture diagram generation, system design patterns, tech stack decision frameworks, and dependency analysis. Use when designing system architecture, making technical decisions, creating architecture diagrams, evaluating trade-offs, or defining integration patterns.
---

# Senior Architect

Complete toolkit for senior software architecture, system design, architectural decision records (ADRs), and cross-package dependency analysis.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts and standard architecture workflows:

```bash
# Script 1: Architecture Diagram Generator
python .agents/skills/senior-architect/scripts/architecture_diagram_generator.py [options]

# Script 2: Project Architect & Invariant Auditor
python .agents/skills/senior-architect/scripts/project_architect.py [options]

# Script 3: Dependency Analyzer & Boundary Checker
python .agents/skills/senior-architect/scripts/dependency_analyzer.py [options]
```

## Core Capabilities

### 1. Architecture Diagram Generator
Generates clean Mermaid system flowcharts, component diagrams, and sequence diagrams of application data flows.
- Monorepo package topology (`apps/web`, `apps/worker`, `apps/realtime` -> `packages/core`, `packages/db`, `packages/ai`)
- Content ingestion and AI generation pipeline sequences
- Live quiz multiplayer WebSocket room state machines

**Usage:**
```bash
python .agents/skills/senior-architect/scripts/architecture_diagram_generator.py --output docs/architecture
```

### 2. Project Architect & Invariant Auditor
Comprehensive system audit tool checking compliance with core architectural rules.
- Enforces purity of domain logic (`packages/core` strictly zero I/O)
- Verifies entity separation: immutable `Card` content vs. user-specific `CardState`
- Checks append-only immutability of `ReviewLog`
- Audits server-side authorization boundaries on state-mutating endpoints

**Usage:**
```bash
python .agents/skills/senior-architect/scripts/project_architect.py . --verbose
```

### 3. Dependency Analyzer & Boundary Checker
Cross-package dependency auditor and workspace graph analyzer.
- Audits `package.json` workspaces for circular dependencies
- Enforces strict unidirectional dependencies (`apps -> packages`, never `packages -> apps`)
- Identifies unpinned or mismatched peer dependencies across workspaces

**Usage:**
```bash
python .agents/skills/senior-architect/scripts/dependency_analyzer.py .
```

---

## Architectural Principles & Standards

### 1. Unidirectional Monorepo Dependency Invariant
```
[apps/web]      [apps/worker]      [apps/realtime]
    │                │                   │
    ▼                ▼                   ▼
[packages/ai]  [packages/db]       [packages/core]
    │                │                   │
    └────────────────┼───────────────────┘
                     ▼
         (Zero circular imports)
```
- **Rule**: `packages/core` must never import from `@chizmo/db`, `@chizmo/ai`, or any `apps/`.
- **Rule**: Core math, FSRS algorithms, and state reducers must remain 100% pure and deterministic.

### 2. Separation of Content vs. Scheduling State
- **Card**: Shared entity representing flashcard content (`front`, `back`, `type`, `sourceRef`).
- **CardState**: Per-user scheduling state (`state`, `stability`, `difficulty`, `due`, `reps`, `lapses`).
- **ReviewLog**: Immutable, append-only historical record of all review ratings.

---

## Reference Documentation

- [Architecture Patterns](./references/architecture_patterns.md): Clean Architecture, Ports & Adapters, Event-Driven Architecture, and Monorepo separation.
- [System Design Workflows](./references/system_design_workflows.md): Step-by-step design processes, trade-off matrices, and capacity planning.
- [Tech Decision Guide](./references/tech_decision_guide.md): Architectural Decision Records (ADRs), evaluation frameworks, and RFC templates.
