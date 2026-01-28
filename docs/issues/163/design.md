# Design: Fix E2E Test Configuration for Spotify Automation

## 1. Problem Analysis

Currently, the `nx e2e spotify-automation` command executes unit tests located in `tests/unit`. This is caused by the Playwright configuration in `apps/ui-automations/spotify-automation/playwright.config.ts`. The `projects` array defines a `firefox` project which specifies a `testIgnore` property (e.g., `testIgnore: /auth\.setup\.ts/`). In Playwright, defining `testIgnore` at the project level overrides the global `testIgnore` setting (which correctly includes `**/tests/unit/**`). As a result, the unit tests are not ignored during the E2E run.

## 2. Architecture & Implementation Plan

The fix involves modifying the `playwright.config.ts` file to ensure the project-level configuration respects or duplicates the exclusion of unit tests.

### Configuration Change

We will modify the `projects` section in `playwright.config.ts`.

**Current (Problematic):**
```typescript
projects: [
  {
    name: 'firefox',
    use: { ... },
    testIgnore: /auth\.setup\.ts/,
  },
],
```

**Proposed Change:**
Explicitly include the unit test exclusion pattern in the project-level `testIgnore`.

```typescript
projects: [
  {
    name: 'firefox',
    use: { ... },
    testIgnore: ['**/tests/unit/**', /auth\.setup\.ts/], 
    // Or potentially remove testIgnore if the global one handles auth.setup.ts correctly, 
    // but the global one is ['**/tests/unit/**', '**/auth.setup.ts'], so removing it might be safer 
    // if we want to inherit strictly. 
    // However, the project specific ignore was likely added to specifically ignore auth.setup.ts for that project run 
    // (though global does it too).
    // Safest approach is to list all required ignores.
  },
],
```

Alternatively, since the global config is:
```typescript
testIgnore: ['**/tests/unit/**', '**/auth.setup.ts'],
```
And the project config wants to ignore `auth.setup.ts`.
If we simply remove `testIgnore` from the project, it should inherit the global `testIgnore`.
We should verify if the project-level `testIgnore` was intended to be *additive* (which it isn't) or *restrictive*. Since `auth.setup.ts` is already in global, removing the project-level override should suffice and be cleaner.

**Decision:**
I will first verify if removing the project-level `testIgnore` works (inheriting global). If specific project needs exist, I will merge the arrays. Given the context, simply ensuring `**/tests/unit/**` is present in the effective configuration is the goal.

## 3. Test Strategy

### Verification Steps
1.  **Reproduction**: Run `nx e2e spotify-automation` and observe unit tests running (already confirmed in audit).
2.  **Fix**: Apply configuration change.
3.  **Validation**: Run `nx e2e spotify-automation` again.
    *   Confirm that `tests/unit` tests are skipped.
    *   Confirm that E2E tests still run and pass.
    *   Confirm that `auth.setup.ts` is still ignored (not treated as a test file).

### Automated Tests
*   No new test code is needed; this is a configuration fix. The verification relies on the execution of the existing test runner.
