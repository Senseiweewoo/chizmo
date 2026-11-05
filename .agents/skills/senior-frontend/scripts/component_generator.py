#!/usr/bin/env python3
"""
React Component Generator
Scaffolds accessible, type-safe React 19 / Next.js components with Tailwind CSS styling and test stubs.
"""

import os
import sys
import argparse

COMPONENT_TEMPLATE = """'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface {ComponentName}Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'default' | 'volt' | 'outline';
  disabled?: boolean;
}

export function {ComponentName}({
  title,
  variant = 'default',
  disabled = false,
  className,
  children,
  ...props
}: {ComponentName}Props) {
  const variantClasses = {
    default: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white',
    volt: 'bg-volt-500 text-slate-950 font-black border-volt-400 shadow-md',
    outline: 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400',
  }[variant];

  return (
    <div
      role="region"
      aria-disabled={disabled}
      className={twMerge(
        clsx(
          'p-4 rounded-2xl border transition-all duration-200',
          variantClasses,
          disabled && 'opacity-50 pointer-events-none',
          className
        )
      )}
      {...props}
    >
      {title && (
        <h3 className="text-base font-bold mb-2 text-inherit">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
"""

def generate_component(name: str, output_dir: str):
    pascal_name = "".join(part.capitalize() for part in name.replace("-", "_").split("_"))
    os.makedirs(output_dir, exist_ok=True)
    target_path = os.path.join(output_dir, f"{pascal_name}.tsx")

    content = COMPONENT_TEMPLATE.replace("{ComponentName}", pascal_name)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[OK] Generated component at: {target_path}")
    return 0

def main():
    parser = argparse.ArgumentParser(description="React Component Generator")
    parser.add_argument("name", help="Name of component (e.g. 'StudyStatsCard', 'StreakBadge')")
    parser.add_argument("--output", "-o", default="apps/web/src/components/ui", help="Output directory")
    args = parser.parse_args()

    return generate_component(args.name, args.output)

if __name__ == "__main__":
    sys.exit(main())
