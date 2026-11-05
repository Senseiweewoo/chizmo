#!/usr/bin/env python3
"""
Frontend Feature Scaffolder
Scaffolds Next.js App Router route directories with page.tsx, loading.tsx, error.tsx, and UI skeleton.
"""

import os
import sys
import argparse

PAGE_TEMPLATE = """import React, { Suspense } from 'react';
import { Card } from '@/components/ui/Card';

interface {FeaturePascal}PageProps {
  params: Promise<{ id?: string }>;
}

export default async function {FeaturePascal}Page({ params }: {FeaturePascal}PageProps) {
  const resolvedParams = await params;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {FeaturePascal}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Feature overview and operational workflow.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />}>
        <Card className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {FeaturePascal} content loaded successfully.
          </p>
        </Card>
      </Suspense>
    </div>
  );
}
"""

LOADING_TEMPLATE = """import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  );
}
"""

ERROR_TEMPLATE = """'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Feature error caught:', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto my-16 text-center space-y-4 p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5">
      <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">Something went wrong</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={() => reset()} variant="outline">
        Try Again
      </Button>
    </div>
  );
}
"""

def scaffold_feature(feature_name: str, base_dir: str):
    slug = feature_name.lower().replace("-", "_").replace(" ", "_")
    pascal = "".join(part.capitalize() for part in slug.split("_"))

    target_dir = os.path.join(base_dir, slug)
    os.makedirs(target_dir, exist_ok=True)

    with open(os.path.join(target_dir, "page.tsx"), "w", encoding="utf-8") as f:
        f.write(PAGE_TEMPLATE.replace("{FeaturePascal}", pascal))

    with open(os.path.join(target_dir, "loading.tsx"), "w", encoding="utf-8") as f:
        f.write(LOADING_TEMPLATE)

    with open(os.path.join(target_dir, "error.tsx"), "w", encoding="utf-8") as f:
        f.write(ERROR_TEMPLATE)

    print(f"[OK] Successfully scaffolded feature route at: {target_dir}")
    print(f"   Created: page.tsx, loading.tsx, error.tsx")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Scaffold Next.js App Router feature directory")
    parser.add_argument("feature", help="Feature name (e.g. 'analytics-export', 'leaderboard-hall')")
    parser.add_argument("--output", "-o", default="apps/web/src/app", help="Output directory")
    args = parser.parse_args()

    return scaffold_feature(args.feature, args.output)

if __name__ == "__main__":
    sys.exit(main())
