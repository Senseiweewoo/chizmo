---
name: senior-backend
description: Comprehensive backend development skill for building scalable backend systems using NodeJS, Express, Go, Python, Postgres, GraphQL, REST APIs. Includes API scaffolding, database optimization, security implementation, and performance tuning. Use when designing APIs, optimizing database queries, implementing business logic, handling authentication/authorization, or reviewing backend code.
---

# Senior Backend

Complete toolkit for senior backend development with modern architecture patterns and production-grade engineering practices.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts and standard workflows:

```bash
# Script 1: Api Scaffolder
python .agents/skills/senior-backend/scripts/api_scaffolder.py [options]

# Script 2: Database Migration Tool & Schema Optimizer
python .agents/skills/senior-backend/scripts/database_migration_tool.py [options]

# Script 3: Api Load Tester & Benchmark Analyzer
python .agents/skills/senior-backend/scripts/api_load_tester.py [options]
```

## Core Capabilities

### 1. Api Scaffolder
Automated scaffolding for enterprise REST & GraphQL endpoints across Node.js / Next.js / Express / Go / Python.
- Idempotent route handler generation with Zod / Pydantic validation
- Layered architecture: Route Handler -> Service Layer -> Repository / ORM
- Built-in audit logging, RBAC checks, rate limiters, and error handling

**Usage:**
```bash
python .agents/skills/senior-backend/scripts/api_scaffolder.py <resource-name> --output apps/web/src/app/api
```

### 2. Database Migration Tool & Schema Optimizer
Deep analysis and index auditing for PostgreSQL & Prisma ORMs.
- Analyzes foreign keys missing composite or lookup indexes
- Detects hot tables without query pagination or proper indexing
- Flags non-atomic mutations lacking database transactions
- Validates migration idempotency and safety against zero-downtime constraints

**Usage:**
```bash
python .agents/skills/senior-backend/scripts/database_migration_tool.py packages/db/prisma/schema.prisma --verbose
```

### 3. Api Load Tester & Benchmark Analyzer
Load testing tool to evaluate backend throughput, connection pooling, and latency distributions.
- Computes p50, p90, p95, p99 latency percentiles
- Detects thread pool starvation, event loop lag, and connection pool exhaustion
- Measures throughput (requests/sec) and error rates under concurrency

**Usage:**
```bash
python .agents/skills/senior-backend/scripts/api_load_tester.py http://localhost:3000/api/health --concurrency 20 --requests 200
```

---

## Architectural Principles & Standards

### 1. Separation of Concerns & Clean Architecture
1. **Controllers / Route Handlers**: Parse and validate request bodies/params using Zod. Extract authenticated session identity. Delegate business logic directly to domain services. Return structured JSON with standardized status codes.
2. **Domain Service Layer**: Pure business logic, authorization invariants, and multi-entity orchestrations. Zero dependency on HTTP request/response objects.
3. **Data Access / Repository Layer**: Parameterized database queries, transactional atomicity (`prisma.$transaction`), and connection management.
4. **Pure Logic Cores**: Mathematical, algorithmic, and state reducer logic should have zero external I/O (e.g. `packages/core`).

### 2. Database Performance & Indexing
- **Index High-Cardinality Filters**: Any column queried in `WHERE`, `JOIN`, `ORDER BY`, or `GROUP BY` must have an index.
- **Composite Index Ordering**: Equality fields first (`userId`), followed by range/sort fields (`due`, `reviewedAt`, `createdAt`).
- **N+1 Prevention**: Always use eager relations (`include`, `select`) or batch loader patterns. Never query foreign relations in an unbatched `Array.map(async item => ...)` loop.
- **Connection Pooling**: Use connection poolers (PgBouncer) and singleton instances in serverless/Edge environments (`globalThis.prisma`).

### 3. Resilient Error Handling & Logging
- **Fail Fast & Explicitly**: Validate all inputs at the boundary. Return RFC 7807 problem details or `{ success: false, error: string }`.
- **Sanitized Logging**: Never log passwords, authorization tokens, bearer credentials, session cookies, or raw PII.
- **Transaction Safety**: Any multi-step mutation that must stay consistent across failures must run within a database transaction with rollback support.

---

## Reference Documentation

- [API Design Patterns](./references/api_design_patterns.md): RESTful guidelines, pagination (cursor vs offset), idempotency keys, and error schemas.
- [Database Optimization Guide](./references/database_optimization_guide.md): Query optimization, index selection, connection pool tuning, and migration safety.
- [Backend Security Practices](./references/backend_security_practices.md): Server-side RBAC, RLS enforcement, SQL parameterization, rate limiting, and webhook validation.
