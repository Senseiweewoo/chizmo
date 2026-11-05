---
name: senior-frontend
description: Comprehensive frontend development skill for building modern, performant web applications using ReactJS, NextJS, TypeScript, Tailwind CSS. Includes component scaffolding, performance optimization, bundle analysis, and UI best practices. Use when developing frontend features, optimizing performance, implementing UI/UX designs, managing state, or reviewing frontend code.
---

# Senior Frontend

Complete toolkit for senior frontend development with modern tools, React 19 / Next.js 15 App Router architecture, and UI/UX best practices.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts and standard workflows:

```bash
# Script 1: Component Generator
python .agents/skills/senior-frontend/scripts/component_generator.py [options]

# Script 2: Bundle Analyzer
python .agents/skills/senior-frontend/scripts/bundle_analyzer.py [options]

# Script 3: Frontend Scaffolder
python .agents/skills/senior-frontend/scripts/frontend_scaffolder.py [options]
```

## Core Capabilities

### 1. Component Generator
Automated scaffolding for accessible, type-safe React components with Tailwind CSS variants and keyboard navigation.
- Accessible by default (WCAG 2.2 AA compliant, ARIA attributes, semantic HTML)
- Tailwind CSS styling with dark mode and responsive design
- TypeScript props interface definition
- Automatic unit / snapshot test generation

**Usage:**
```bash
python .agents/skills/senior-frontend/scripts/component_generator.py <component-name> --output apps/web/src/components/ui
```

### 2. Bundle Analyzer
Comprehensive analysis of Next.js static asset chunks and build outputs.
- Scans `.next/static/chunks/` for chunk size outliers
- Flags heavy modules exceeding budget (>50 kB First Load JS)
- Recommends dynamic `next/dynamic` code-splitting boundaries
- Analyzes shared vs route-specific client bundles

**Usage:**
```bash
python .agents/skills/senior-frontend/scripts/bundle_analyzer.py apps/web/.next --verbose
```

### 3. Frontend Scaffolder
Advanced feature-level scaffolding for Next.js App Router route segments.
- Generates `page.tsx`, `loading.tsx`, `error.tsx`, layout wrappers, and state hooks
- Separates Server Components (data fetching) from Client Components (interactive widgets)
- Integrated optimistic UI updates, loading skeletons, and error boundaries

**Usage:**
```bash
python .agents/skills/senior-frontend/scripts/frontend_scaffolder.py <feature-name> --output apps/web/src/app
```

---

## Architectural Principles & Standards

### 1. Server vs. Client Component Boundaries
- **Default to Server Components**: Fetch data on the server without shipping client JavaScript.
- **Push `'use client'` to the Leaves**: Wrap only interactive elements (buttons, inputs, swipe gestures, animations) in client components.
- **Avoid Waterfall Fetching**: Parallelize server data fetches using `Promise.all()`.
- **Zero Sensitive Data in Props**: Never pass secret keys or unredacted user credentials to client components.

### 2. Interaction & Performance Standards
- **Optimistic UI Updates**: Instantly reflect user ratings, bookmarking, and deck mutations prior to network round-trips.
- **Instant Response Times**: Flashcard flip and swipe animations must execute in under 16ms (60 FPS) with hardware acceleration (`transform: translate3d`).
- **Font & Image Optimization**: Use `next/font` for local variable fonts and `next/image` for responsive, lazy-loaded visual assets.

### 3. Accessibility (WCAG 2.2 AA)
- **Contrast Ratios**: Minimum 4.5:1 for body text and 3:1 for large text/interactive components.
- **Focus Indicators**: Visible, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`).
- **Keyboard Navigation**: Full application navigation using `Tab`, `Space`, `Enter`, and `Esc`.
- **Reduced Motion**: Respect `prefers-reduced-motion` to disable non-essential motion.

---

## Reference Documentation

- [React Patterns](./references/react_patterns.md): Compound components, render props, optimistic hooks, reducer state machines, and memoization.
- [Next.js Optimization Guide](./references/nextjs_optimization_guide.md): App Router streaming with Suspense, dynamic imports, Core Web Vitals, and caching strategies.
- [Frontend Best Practices](./references/frontend_best_practices.md): Tailwind CSS design tokens, dark mode synchronization, accessible forms, and error boundaries.
