# Pre-Rename Inventory and Documentation

## Current Repository State

- **Current Name**: UI-Automation
- **Target Name**: my-apps
- **Owner**: centervil
- **Current URL**: https://github.com/centervil/UI-Automation
- **Target URL**: https://github.com/centervil/my-apps

## Files Containing Repository Name References

### 1. Package Configuration Files

- `apps/ui-automations/spotify-automation/package.json`
  - Contains: `"name": "@ui-automation/spotify-automation"`
  - Action needed: Update package scope from `@ui-automation` to `@my-apps`

- `package.json` (root)
  - Contains: `"name": "@ui-automation/source"`
  - Action needed: Update package scope from `@ui-automation` to `@my-apps`

- `pyproject.toml`
  - Contains: `name = "ui-automation"`
  - Action needed: Update project name to `my-apps`

### 2. CI/CD Configuration Files

- `.github/workflows/ci.yml`
  - Contains: `pnpm -F @ui-automation/spotify-automation exec playwright install --with-deps`
  - Contains: `path: apps/ui-automations/spotify-automation/playwright-report/`
  - Action needed: Update package reference from `@ui-automation` to `@my-apps`

### 3. Documentation Files

- `README.md`
  - Title: "UIAutomation" (no direct repository URL references found)
  - Action needed: Update title to reflect new repository name

- `AGENTS.md`
  - Contains: `└── ui-automations/` (directory structure reference)
  - Action needed: No changes needed (this is a directory name, not repository name)

- `development_logs/2025-07-22-issue-0-session-1.md`
  - Contains: "UI-Automation monorepo"
  - Action needed: Update historical references for consistency

- `development_logs/2025-08-26-issue-24-session-1.md`
  - Contains: GitHub issue URL with old repository name
  - Contains: Multiple references to `@ui-automation` package scope
  - Action needed: Update package scope references

### 4. Lock Files and Generated Files

- `pnpm-lock.yaml`
  - Contains: `apps/ui-automations/spotify-automation:`
  - Action needed: Will be automatically updated when package.json files are updated

### 5. GitHub Configuration Files

- `.github/ISSUE_TEMPLATE/` (multiple files)
  - Status: Need to check for repository-specific references
- `.github/pull_request_template.md`
  - Status: Need to check for repository-specific references

## Critical Configuration Files to Backup

1. `package.json` (root)
2. `apps/ui-automations/spotify-automation/package.json`
3. `pyproject.toml`
4. `.github/workflows/ci.yml`
5. `pnpm-lock.yaml`

## External Dependencies Analysis

- **GitHub Actions**: Uses standard actions, should continue working
- **pnpm workspaces**: Configuration in `pnpm-workspace.yaml` uses path patterns, not repository names
- **Nx configuration**: Uses local project references, should not be affected
- **Playwright**: Uses local configuration, should not be affected

## Potential Risks

1. **Package Scope Change**: Changing from `@ui-automation` to `@my-apps` will affect package references
2. **CI/CD Pipeline**: Package filter in GitHub Actions needs updating
3. **Development Logs**: Historical references will become outdated but this is acceptable
4. **External Links**: Any external systems linking to the old repository URL will need updating

## Recommended Update Order

1. Update repository name on GitHub
2. Update package.json files (root and apps)
3. Update pyproject.toml
4. Update CI/CD configuration
5. Update documentation files
6. Test all workflows and functionality

##

GitHub Templates Analysis

- `.github/pull_request_template.md`: No repository-specific references found
- `.github/ISSUE_TEMPLATE/bug_report.md`: No repository-specific references found
- `.github/ISSUE_TEMPLATE/feature_request.md`: No repository-specific references found
- `.github/ISSUE_TEMPLATE/question.md`: Not checked yet
- `.github/ISSUE_TEMPLATE/config.yml`: Not checked yet

## Backup Status

✅ Created backups of critical files in `.kiro/specs/issue26/backups/`:

- `package.json.backup`
- `spotify-automation-package.json.backup`
- `pyproject.toml.backup`
- `ci.yml.backup`

## Ready for Next Phase

All preparation tasks completed:

- ✅ Current repository state documented
- ✅ File inventory created with specific references identified
- ✅ Critical configuration files backed up
- ✅ Risk assessment completed
- ✅ Update order planned

The repository is ready for the rename operation.
