# QA Best Practices

Quality assurance processes, release readiness criteria, regression prevention, and defect management.

---

## 1. Release Readiness & Quality Gates

Before any production deployment or PR merge, enforce:
1. **Type Safety**: `npm run typecheck` passes with 0 errors across all workspaces.
2. **Automated Tests**: 100% of unit, integration, and security test suites pass.
3. **Build Integrity**: `npm run build` succeeds for all applications and workers.
4. **Security Audit**: High-severity vulnerabilities remediated via package overrides.

---

## 2. Regression Prevention & Bug Fix Standards

Every confirmed bug report must follow the **Test-Driven Fix Loop**:
1. **Reproduce**: Write a failing unit or integration test capturing the exact scenario.
2. **Prove Failure**: Run the test to observe the assertion failure (`AssertionError`).
3. **Fix**: Apply the minimum pragmatic code fix.
4. **Verify**: Re-run the test to confirm it passes, ensuring the bug can never re-occur unnoticed.
