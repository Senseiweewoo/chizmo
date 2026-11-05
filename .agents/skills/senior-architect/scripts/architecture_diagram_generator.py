#!/usr/bin/env python3
"""
Architecture Diagram Generator
Generates Mermaid architecture flowcharts and sequence diagrams for documentation and system design reviews.
"""

import os
import sys
import argparse

MONOREPO_DIAGRAM = """```mermaid
flowchart TD
  subgraph Apps["Application Layer (Apps)"]
    Web["apps/web (Next.js 15 App Router)"]
    Worker["apps/worker (BullMQ Background Ingestion)"]
    Realtime["apps/realtime (Socket.IO + Redis Quiz Arena)"]
  end

  subgraph Packages["Domain & Infrastructure Layer (Packages)"]
    Core["packages/core (FSRS Scheduler, XP Engine, Scoring, Validators)\\n[STRICTLY ZERO I/O]"]
    Db["packages/db (Prisma ORM, PostgreSQL Client)"]
    AI["packages/ai (LLM Providers, Critic & Grounding Pipeline)"]
  end

  subgraph External["External Infrastructure"]
    Postgres[("PostgreSQL Database")]
    RedisCache[("Redis Cache & BullMQ Queues")]
    LLMs["AI Providers (OpenAI, Anthropic, DeepSeek)"]
  end

  Web --> Core
  Web --> Db
  Web --> AI
  Worker --> Core
  Worker --> Db
  Worker --> AI
  Realtime --> Core
  Realtime --> RedisCache

  Db --> Postgres
  Worker --> RedisCache
  AI --> LLMs
```
"""

INGESTION_SEQUENCE = """```mermaid
sequenceDiagram
  autonumber
  actor User as Student
  participant Web as Next.js API (/api/ingest)
  participant Worker as Ingestion Worker
  participant AI as AI Critic Pipeline
  participant DB as PostgreSQL

  User->>Web: Upload File / Submit URL
  Web->>DB: Create Source (PENDING)
  Web->>Worker: Enqueue Ingestion Job (BullMQ)
  Web-->>User: 202 Accepted (sourceId)

  Worker->>Worker: Extract Text & Validate Magic Bytes
  Worker->>AI: Chunk Text & Generate Cards
  AI->>AI: Zod Validation & Critic Pass
  AI->>AI: Grounding Quote Verification
  Worker->>DB: Persist Cards & Update Source (READY)
  User->>Web: Poll Status -> Review Screen
```
"""

def generate_diagrams(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    arch_file = os.path.join(output_dir, "system_architecture.md")
    with open(arch_file, "w", encoding="utf-8") as f:
        f.write("# Chizmo System Architecture & Data Flows\n\n")
        f.write("## 1. Monorepo Package Topology\n\n")
        f.write(MONOREPO_DIAGRAM)
        f.write("\n\n## 2. Content Ingestion & AI Generation Sequence\n\n")
        f.write(INGESTION_SEQUENCE)

    print(f"[OK] Generated architecture diagrams at: {arch_file}")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Generate system architecture diagrams")
    parser.add_argument("path", nargs="?", default=None, help="Output directory or project path")
    parser.add_argument("--output", "-o", default=None, help="Output directory")
    args = parser.parse_args()

    out_dir = args.output or args.path or "docs/architecture"
    return generate_diagrams(out_dir)

if __name__ == "__main__":
    sys.exit(main())
