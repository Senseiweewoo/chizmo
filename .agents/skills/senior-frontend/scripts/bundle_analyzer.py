#!/usr/bin/env python3
"""
Next.js Bundle Analyzer
Inspects .next build output, static chunks, and JavaScript asset sizes against performance budgets.
"""

import os
import sys
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def format_bytes(size: int) -> str:
    for unit in ['B', 'kB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} TB"

def analyze_bundle(dot_next_path: str, verbose: bool = False):
    static_chunks_dir = os.path.join(dot_next_path, "static", "chunks")
    if not os.path.exists(static_chunks_dir):
        print(f"Error: Path '{static_chunks_dir}' does not exist. Run 'npm run build' first.")
        return 1

    chunks = []
    total_size = 0

    for root, _, files in os.walk(static_chunks_dir):
        for f in files:
            if f.endswith(".js"):
                fpath = os.path.join(root, f)
                size = os.path.getsize(fpath)
                rel_path = os.path.relpath(fpath, dot_next_path)
                chunks.append((rel_path, size))
                total_size += size

    chunks.sort(key=lambda x: x[1], reverse=True)

    print("\n=======================================================")
    print("  Next.js Production Bundle Analysis")
    print(f"  Target Directory: {dot_next_path}")
    print(f"  Total JS Chunks:  {len(chunks)}")
    print(f"  Total Bundle:     {format_bytes(total_size)}")
    print("=======================================================\n")

    print("Top 10 Largest JavaScript Chunks:")
    print("-------------------------------------------------------")
    for path, size in chunks[:10]:
        status = "[WARN] HEAVY (>150 kB)" if size > 150 * 1024 else "[OK] OPTIMAL"
        print(f"  {format_bytes(size).rjust(9)}  |  {status.ljust(21)}  |  {path}")
    print("-------------------------------------------------------\n")

    heavy_count = sum(1 for _, size in chunks if size > 150 * 1024)
    if heavy_count == 0:
        print("Status: EXCELLENT (All individual chunks within recommended 150 kB budget)")
    else:
        print(f"Status: {heavy_count} chunk(s) exceed 150 kB. Consider next/dynamic code splitting.")

    return 0

def main():
    parser = argparse.ArgumentParser(description="Analyze Next.js build bundle sizes")
    parser.add_argument("path", nargs="?", default="apps/web/.next", help="Path to .next build directory")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose chunk listing")
    args = parser.parse_args()

    return analyze_bundle(args.path, args.verbose)

if __name__ == "__main__":
    sys.exit(main())
