# Design Document

## Overview

The Security News Agent Tests workflow is failing because it attempts to run Nx commands without properly setting up the Node.js environment and installing dependencies. The solution involves adding the necessary setup steps to install Node.js, pnpm, and workspace dependencies before executing any Nx commands.

## Architecture

The fix will modify the existing `.github/workflows/security-news-test.yml` workflow to include proper Node.js and pnpm setup steps. The workflow will maintain its current structure but add the missing dependency setup steps.

### Current Workflow Structure

```
1. Checkout repository
2. Set up Python
3. Cache Poetry dependencies
4. Install Poetry
5. Install Python dependencies
6. Run linting (FAILS HERE - no nx available)
7. Run tests
8. Upload coverage
```

### Fixed Workflow Structure

```
1. Checkout repository
2. Set up Python
3. Set up Node.js and pnpm (NEW)
4. Install Node.js dependencies (NEW)
5. Cache Poetry dependencies
6. Install Poetry
7. Install Python dependencies
8. Run linting (NOW WORKS - nx available)
9. Run tests
10. Upload coverage
```

## Components and Interfaces

### Modified Workflow Steps

1. **Node.js Setup Step**
   - Uses `pnpm/action-setup@v3` with version 10
   - Uses `actions/setup-node@v4` with Node.js 20 and pnpm cache
   - Follows the same pattern as the main CI workflow

2. **Dependency Installation Step**
   - Runs `pnpm install --unsafe-perm` to install all workspace dependencies
   - Ensures Nx is available for subsequent commands
   - Uses the same command as the main CI workflow

3. **Existing Steps**
   - All existing steps remain unchanged
   - The linting step will now work because Nx is available

## Data Models

No new data models are required. The workflow uses existing GitHub Actions inputs and outputs.

## Error Handling

### Dependency Installation Failures

- If pnpm installation fails, the workflow will fail fast
- If Node.js dependencies installation fails, the workflow will fail with clear error messages
- Existing error handling for Python dependencies and linting remains unchanged

### Cache Handling

- Node.js dependencies will be cached using the built-in pnpm cache mechanism
- Poetry dependencies caching remains unchanged
- Cache keys will be based on lock files to ensure proper invalidation

## Testing Strategy

### Validation Approach

1. **Local Testing**: Test the workflow changes locally using act or similar tools
2. **Branch Testing**: Create a test branch and verify the workflow runs successfully
3. **Integration Testing**: Ensure the fix doesn't break other workflows or functionality

### Success Criteria

1. The "Run linting and formatting checks" step completes successfully
2. All Python version matrix jobs complete without cancellation
3. The linting command `poetry run flake8 src/ tests/` executes properly
4. No regression in other workflow functionality

### Rollback Plan

If the changes cause issues:

1. Revert the workflow file changes
2. The workflow will return to its previous state
3. Investigate alternative solutions if needed

## Implementation Notes

### Consistency with Existing Workflows

The solution follows the exact same pattern used in the main CI workflow (`.github/workflows/ci.yml`):

- Same pnpm version (10)
- Same Node.js version (20)
- Same installation command (`pnpm install --unsafe-perm`)
- Same action versions

### Performance Considerations

- Adding Node.js setup will increase job runtime by ~30-60 seconds
- pnpm caching will minimize the impact on subsequent runs
- The change is necessary for functionality and the performance impact is acceptable

### Security Considerations

- Uses the same trusted GitHub Actions as existing workflows
- No new secrets or permissions required
- Follows existing security practices in the repository
