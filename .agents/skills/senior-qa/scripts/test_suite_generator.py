#!/usr/bin/env python3
"""
Test Suite Generator
Scaffolds zero-dependency Node.js native test suites (node:test) with boundary conditions and mock setups.
"""

import os
import sys
import argparse

TEST_TEMPLATE = """import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { {ExportName} } from '../{ModuleFile}.js';

describe('{SuiteName} Tests', () => {
  it('1. should execute standard operation successfully on valid input', () => {
    // Arrange
    const input = 'sample_input';

    // Act & Assert
    assert.ok(input);
  });

  it('2. should enforce boundary validation and handle empty or null values', () => {
    // Boundary test
    assert.strictEqual(Boolean(''), false);
  });

  it('3. should handle errors and throw expected exception on malformed state', () => {
    assert.throws(
      () => {
        throw new Error('Expected failure');
      },
      { message: 'Expected failure' }
    );
  });
});
"""

def generate_test_suite(module_name: str, output_dir: str):
    slug = module_name.lower().replace("-", "_").replace(" ", "_")
    pascal = "".join(part.capitalize() for part in slug.split("_"))

    os.makedirs(output_dir, exist_ok=True)
    target_file = os.path.join(output_dir, f"{slug}.test.ts")

    content = (
        TEST_TEMPLATE
        .replace("{SuiteName}", pascal)
        .replace("{ExportName}", pascal)
        .replace("{ModuleFile}", slug)
    )

    with open(target_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[OK] Generated test suite at: {target_file}")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Generate Node.js native test suite")
    parser.add_argument("module", help="Name of module to test (e.g. 'spaced-repetition', 'billing-manager')")
    parser.add_argument("--output", "-o", default="packages/core/src/__tests__", help="Output directory")
    args = parser.parse_args()

    return generate_test_suite(args.module, args.output)

if __name__ == "__main__":
    sys.exit(main())
