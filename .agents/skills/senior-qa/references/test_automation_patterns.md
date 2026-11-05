# Test Automation Patterns

Automation architectures using Node.js native test runner (`node:test`), Playwright, and CI integration.

---

## 1. Native Node.js Test Runner (`node:test`)

Zero-dependency, high-speed test execution natively built into Node.js 18+:

```typescript
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Feature Test Suite', () => {
  it('should execute expected behavior on valid input', () => {
    const input = { query: 'test' };
    const result = executeLogic(input);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.items, []);
  });

  it('should throw or reject on boundary violation', () => {
    assert.throws(() => executeLogic({ query: '' }), {
      name: 'ValidationError',
    });
  });
});
```

---

## 2. Playwright E2E Best Practices

- **Resilient Selectors**: Prefer accessible role selectors (`page.getByRole('button', { name: 'Study Now' })`) over brittle CSS classes or XPath.
- **Network Mocking for AI APIs**: Intercept expensive LLM generation calls during E2E testing to ensure fast, deterministic tests without incurring API costs:
  ```typescript
  await page.route('/api/ai/generate-cards', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, cards: [{ front: 'Q', back: 'A' }] }),
    });
  });
  ```
- **Storage State Persistence**: Save authenticated browser context to `storageState.json` to skip repetitive login forms across tests.
