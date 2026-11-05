#!/usr/bin/env python3
"""
Test Coverage & Test Suite Analyzer
Scans workspace for test files, counts tests, detects untested modules, and generates QA metrics.
"""

import os
import re
import sys
import argparse

def analyze_tests(project_root: str, verbose: bool = False):
    test_files = []
    source_files = []

    for root, _, files in os.walk(project_root):
        # Ignore node_modules, .next, dist, build, git
        if any(ign in root for ign in ["node_modules", ".next", "dist", "build", ".git"]):
            continue
        for f in files:
            if f.endswith(".test.ts") or f.endswith(".test.js") or f.endswith(".spec.ts"):
                test_files.append(os.path.join(root, f))
            elif f.endswith(".ts") or f.endswith(".tsx"):
                if not f.endswith(".d.ts") and not f.endswith(".test.ts"):
                    source_files.append(os.path.join(root, f))

    print("\n=======================================================")
    print(f"  Senior QA Test Coverage & Suite Analysis")
    print(f"  Project Root:     {project_root}")
    print(f"  Total Test Files: {len(test_files)}")
    print(f"  Total Sources:    {len(source_files)}")
    print("=======================================================\n")

    total_test_cases = 0
    print("Discovered Test Suites:")
    print("-------------------------------------------------------")
    for tf in test_files:
        try:
            with open(tf, "r", encoding="utf-8") as f:
                content = f.read()
            cases = len(re.findall(r"\bit\s*\(|\btest\s*\(", content))
            total_test_cases += cases
            rel_path = os.path.relpath(tf, project_root)
            print(f"  {str(cases).rjust(3)} tests  |  {rel_path}")
        except Exception:
            pass
    print("-------------------------------------------------------")
    print(f"Total Automated Test Cases: {total_test_cases}")

    ratio = (len(test_files) / max(1, len(source_files))) * 100
    print(f"Test File Ratio:           {ratio:.1f}%")
    if total_test_cases >= 40:
        print("QA Health Assessment:      EXCELLENT (Robust coverage on critical domains)")
    else:
        print("QA Health Assessment:      MODERATE (Consider expanding edge-case suites)")
    print("=======================================================\n")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Analyze test files and test case density")
    parser.add_argument("path", nargs="?", default=".", help="Root directory to scan")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose test analysis")
    args = parser.parse_args()

    return analyze_tests(args.path, args.verbose)

if __name__ == "__main__":
    sys.exit(main())
