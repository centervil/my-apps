# Design: Relax Strict Cookie Expiration Check

## Architecture

This change is localized to the `AuthManager` class within the `apps/ui-automations/spotify-automation` project. Specifically, it modifies the validation logic within the `isAuthValid` method.

## Implementation Details

### `src/auth/authManager.ts`

**Current Behavior:**
The `isAuthValid` method iterates through all cookies in the stored auth state. If *any* cookie is found to be expired (based on its `expires` timestamp), an `AuthError` with code `EXPIRED_AUTH` is immediately thrown.

**New Behavior:**
The iteration logic will be modified to:
1. Check each cookie's expiration status.
2. If a cookie is expired:
   - Log a warning message: `Warning: Cookie '${cookie.name}' has expired and will be ignored.`
   - **Continue** to the next cookie without throwing an error.
3. If valid cookies exist (implicit in "not failing"), the method returns `true`.

*Note:* We are relying on the subsequent browser navigation step (`await newEpisodePage.assertPageIsVisible()`) to catch cases where the *essential* session cookies are actually expired or invalid. The `isAuthValid` check serves as a preliminary sanity check, which should not be overly aggressive.

## Test Strategy

### Unit Tests (`tests/unit/auth/authManager.spec.ts`)

We will modify the existing unit tests to reflect the relaxed requirements.

1.  **Modify "Throw on Expired" Test:**
    - The existing test case `'isAuthValid should throw EXPIRED_AUTH error if a cookie is expired'` will be updated or replaced.
    - **New Test Case:** `'isAuthValid should return true (and log warning) even if non-essential cookies are expired'`.
    - **Setup:** Create a mock `spotify-auth.json` containing a mix of valid and expired cookies.
    - **Assertion:** Ensure `isAuthValid()` returns `true` and does not throw.

2.  **Regression Testing:**
    - Ensure existing tests for valid auth files and corrupted files still pass.

### Integration/E2E
- Run the full build/test suite to ensure no side effects on the CLI execution flow.
