# Tasks: Relax Strict Cookie Expiration Check

## Implementation Tasks

- [ ] **Update Unit Tests**
  - Modify `tests/unit/auth/authManager.spec.ts` to expect success (return `true`) instead of failure when expired cookies are present.
  - Add a spy on `console.warn` to verify the warning log (optional but recommended).

- [ ] **Refactor `AuthManager`**
  - Edit `apps/ui-automations/spotify-automation/src/auth/authManager.ts`.
  - Change the loop in `isAuthValid` to log a warning instead of throwing `AuthError` when a cookie is expired.

- [ ] **Verification**
  - Run `pnpm test` in the `spotify-automation` project to verify all unit tests pass.
  - Run the full lint and build process to ensure code quality.
