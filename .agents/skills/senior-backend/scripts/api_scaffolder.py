#!/usr/bin/env python3
"""
API Scaffolder Tool
Scaffolds enterprise-grade Next.js App Router API routes with Zod validation, session auth, and error handling.
"""

import os
import sys
import argparse

ROUTE_TEMPLATE = """import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentSession } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/rbac';
import { logger } from '@/lib/utils/secure-logger';

// 1. Input Validation Schema
const Create{ResourcePascal}Schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
});

/**
 * GET /api/{resource} - List {resource} entries
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    requireAuth(session);

    // Business logic delegation
    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    logger.error('Failed to fetch {resource}', { error: error.message });
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

/**
 * POST /api/{resource} - Create a new {resource}
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const user = requireAuth(session);

    const body = await req.json();
    const parsed = Create{ResourcePascal}Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    logger.info('Created {resource}', { userId: user.userId });

    return NextResponse.json({
      success: true,
      data: {
        id: `{resource}_${Date.now()}`,
        ...parsed.data,
        ownerId: user.userId,
      },
    }, { status: 201 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    logger.error('Failed to create {resource}', { error: error.message });
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
"""

def scaffold_api(resource_name: str, base_dir: str):
    slug = resource_name.lower().replace("-", "_").replace(" ", "_")
    pascal = "".join(part.capitalize() for part in slug.split("_"))

    target_dir = os.path.join(base_dir, slug)
    os.makedirs(target_dir, exist_ok=True)
    target_file = os.path.join(target_dir, "route.ts")

    content = ROUTE_TEMPLATE.replace("{ResourcePascal}", pascal).replace("{resource}", slug)

    with open(target_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Successfully scaffolded API route at: {target_file}")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Scaffold enterprise Next.js App Router API endpoints")
    parser.add_argument("resource", help="Name of the resource to scaffold (e.g. 'study-goals', 'feedback')")
    parser.add_argument("--output", "-o", default="apps/web/src/app/api", help="Output directory")
    args = parser.parse_args()

    return scaffold_api(args.resource, args.output)

if __name__ == "__main__":
    sys.exit(main())
