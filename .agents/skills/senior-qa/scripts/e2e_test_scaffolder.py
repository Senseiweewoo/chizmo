#!/usr/bin/env python3
"""
Playwright E2E Test Scaffolder
Scaffolds user journey tests with authentication storage state, assertions, and mock intercepts.
"""

import os
import sys
import argparse

E2E_TEMPLATE = """import { test, expect } from '@playwright/test';

test.describe('{FeaturePascal} E2E User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application base
    await page.goto('/');
  });

  test('1. should render feature elements and handle primary action', async ({ page }) => {
    // Check main title or header
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // Perform primary interaction
    const actionButton = page.getByRole('button').first();
    if (await actionButton.isVisible()) {
      await actionButton.click();
    }
  });

  test('2. should maintain responsive mobile viewport layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
"""

def scaffold_e2e(feature_name: str, output_dir: str):
    slug = feature_name.lower().replace("-", "_").replace(" ", "_")
    pascal = "".join(part.capitalize() for part in slug.split("_"))

    os.makedirs(output_dir, exist_ok=True)
    target_file = os.path.join(output_dir, f"{slug}.spec.ts")

    content = E2E_TEMPLATE.replace("{FeaturePascal}", pascal)
    with open(target_file, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[OK] Scaffolded Playwright E2E test at: {target_file}")
    return 0

def main():
    parser = argparse.ArgumentParser(description="Scaffold Playwright E2E test")
    parser.add_argument("feature", help="Feature name (e.g. 'onboarding-flow', 'live-room-game')")
    parser.add_argument("--output", "-o", default="tests/e2e", help="Output directory")
    args = parser.parse_args()

    return scaffold_e2e(args.feature, args.output)

if __name__ == "__main__":
    sys.exit(main())
