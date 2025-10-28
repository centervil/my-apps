# AGENTS.md - Agent Development Guidelines

## Quick Reference

- [1. Core Principles](#1-core-principles)
- [2. Technology Stack](#2-technology-stack)
- [3. Development Workflows](#3-development-workflows)
  - [3.1. Issue-Driven Development (IDD)](#31-issue-driven-development-idd)
  - [3.2. Specification Document Creation Process](#32-specification-document-creation-process)
  - [3.3. Test-Driven Development (TDD)](#33-test-driven-development-tdd)
- [4. Issue Management Guidelines](#4-issue-management-guidelines)
- [5. Commit Guidelines](#5-commit-guidelines)
- [6. Development Logs](#6-development-logs)
- [7. CI/CD Pipeline](#7-ci-cd-pipeline-githubworkflows-ciyml)
- [8. Project Structure](#8-project-structure)
- [9. Operational Guidelines](#9-operational-guidelines)
  - [9.1. Git Management and .gitignore](#91-git-management-and-gitignore)
  - [9.2. Tooling and Version Management](#92-tooling-and-version-management)
  - [9.3. Quick Reference Maintenance](#93-quick-reference-maintenance)
- [10. Playwright Browser Automation Tasks](#10-playwright-browser-automation-tasks)
- [11. Self-Reflection and Self-Correction](#11-self-reflection-and-self-correction)

## 1. Core Principles

- **Monorepo Approach**: This repository is a monorepo managed by `pnpm` workspaces. It houses multiple, distinct UI automation projects under the `apps/` directory.
- **Automation as Code**: All UI automation logic is treated as production-level code, applying software engineering best practices.
- **Security First (DevSecOps)**: Security is integrated into the development lifecycle from the beginning ("Shift-Left").

## 2. Technology Stack

- **Language**: TypeScript
- **UI Automation Framework**: Playwright
- **Test Runner**: `@playwright/test`
- **Package Manager**: pnpm
- **CLI**: GitHub CLI (`gh`)
- **Code Linter**: ESLint
- **Code Formatter**: Prettier
- **CI/CD**: GitHub Actions
- **Security Scanning**:
  - **SAST**: GitHub CodeQL
  - **Dependency Vulnerabilities**: `pnpm audit` & GitHub Dependabot
  - **Secret Scanning**: GitHub Secret Scanning

## 3. Development Workflows

This repository combines two core development methodologies: Issue-Driven Development for task management and Test-Driven Development for implementation.

### 3.1. Issue-Driven Development (IDD)

All work is managed through GitHub Issues.

0.  **Sync `main` branch**: Before creating a new branch, ensure your local `main` branch is up-to-date with the remote repository (`git pull origin main`).
1.  **Task Definition**: A task is defined as a GitHub Issue.
2.  **Branch Creation**: Create a branch named `[type]/[issue-number]-[short-description]` (e.g., `feat/123-add-login-page`).
3.  **Implementation**: Follow the TDD cycle.
4.  **Commit Messages**: Link commits to issues (e.g., `Closes #123`).
5.  **Pull Request**: Create a PR to merge into `main`.
6.  **CI & Review**: The CI pipeline runs, followed by a human review.
7.  **Merge**: After approval, the PR is merged.

### 3.2. Specification Document Creation Process

To ensure high-quality software development, the following three specification documents are created for each Issue.

- **`requirements.md`**: Defines what the system should do.
  - Requirements are described in **user story format**.
  - Each user story clearly defines **acceptance criteria** that serve as the criteria for completion.
- **`design.md`**: Designs how to build the system.
  - Defines the system's **architecture**, **components**, **interfaces**, and **data models**.
  - Also describes **error handling** and **test strategies**.
- **`tasks.md`**: Creates a concrete plan for building the system.
  - Based on the design, implementation tasks are listed in **checklist format**.
  - Each task must be small and clearly defined.

### 3.3. Test-Driven Development (TDD)

This project adopts a Test-Driven Development (TDD) approach.

#### 3.3.1. Test Coverage for All Changes

In addition to following the TDD cycle, the following principles must be strictly adhered to.

Any feature addition or modification to the project's source code (e.g., files in `src/` or `scripts/`) must be accompanied by the addition or modification of corresponding test code. To avoid creating redundant tests, **modifying an existing test should be prioritized over creating a new one.** A new test should only be created when modification is not appropriate.

-   **Feature Additions**: Must be accompanied by new tests that verify the feature works as expected.
-   **Bug Fixes**: Must include a test that reproduces the bug (fails before the fix and passes after the fix). This ensures the fix is correct and prevents future regressions.
-   **Refactoring**: All existing tests must continue to pass. If the refactoring allows for better testing, tests should be improved as well.

**A task is not considered complete if code changes are not accompanied by corresponding test changes.**

#### Red-Green-Refactor Cycle

1.  **Red**: Write a failing test in `tests/`.
2.  **Green**: Write the minimum code in `src/` to make the test pass.
3.  **Refactor**: Improve code and tests while keeping tests green.

#### Page Object Model (POM)

- **`tests/`**: Contains test files (`*.spec.ts`) describing user interactions.
- **`src/pages/`**: Contains page objects with locators and methods for each page.
- **`src/components/`**: Contains reusable UI components.

## 4. Issue Management Guidelines

- **One Issue, One Pull Request**: Keep issues small and focused.
- **Define "Done"**: Every issue must have a clear "Definition of Done" checklist.
- **No Scope Creep**: If you discover a new task, create a new issue. Do not expand the scope of the current one.

## 5. Commit Guidelines

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

- **Format**: `<type>(<scope>): <subject>`
- **Example**: `feat(spotify-automation): add login page object. Closes #12`
- **Frequency**: Commits should be "atomic," representing a single logical change.

## 6. Development Logs

All work sessions must be recorded in Markdown files. **注: すべての開発ログは日本語で記述されます。**

- **Location**: `development_logs/`.
- **File Naming**: `YYYY-MM-DD-issue-[issue-number]-session-[session-number].md`
- **Content**: Summary of actions, decisions, and rationale.

## 7. CI/CD Pipeline (`.github/workflows/ci.yml`)

The CI pipeline runs on every push or pull request to `main`, performing linting, formatting, testing, and uploading a test report.

## 8. Project Structure

```
/
├── apps/
│   ├── cli-tools/
│   └── ui-automations/
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
│
├── development_logs/
│
└── AGENTS.md           # This file
```

## 9. Operational Guidelines

This section outlines general best practices and considerations for development within this repository.

### 9.1. Git Management and `.gitignore`

- **Strict Git Management**: Always be mindful of what is being added to Git. Only commit files that are essential for the project and should be version-controlled.
- **Proactive `.gitignore` Usage**: Immediately add entries to `.gitignore` for any new files or directories that are generated during development (e.g., build artifacts, temporary files, IDE-specific configurations, personal logs) and should not be tracked by Git.
- **Precise Staging**: Avoid using `git add .` indiscriminately. Prefer `git add <specific_files>` or `git add -u` to stage only the intended changes, reducing the risk of accidentally committing unwanted files.

### 9.2. Tooling and Version Management

- **Version Dependency Awareness**: Be aware that tools and libraries can have breaking changes in major version updates. Always consult official documentation, migration guides, and changelogs before performing major version upgrades.
- **Official Documentation First**: When encountering issues or seeking to understand tool behavior, prioritize consulting the official documentation. This is the most reliable source of information for correct usage and best practices.

### 9.3. Quick Reference Maintenance

- **Update on Change**: The "Quick Reference" section at the top of this document must be updated whenever new top-level sections or significant subsections are added, removed, or renamed.
- **Maintain Link Integrity**: Ensure that all links within the quick reference accurately point to the correct sections.

## 10. Playwright Browser Automation Tasks

This section describes specific guidelines and best practices for browser automation tasks using Playwright.

### 10.1. Debugging and UI Element Identification

- **Leveraging `page.pause()` and Playwright Inspector**: Use `await page.pause()` in `--headed` mode to inspect the browser state and debug step-by-step.

### 10.2. Locator Selection and Management

- **Dynamic Locators**: Acquire locators for dynamic elements right when they are needed.
- **Robust Selectors**: Prefer semantic locators like `getByTestId()`, `getByRole()`, or `getByPlaceholder()`.

### 10.3. Enhancing Test Stability

- **Strategic Delays**: Use `await page.waitForTimeout(500);` before critical interactions to improve stability with dynamic UIs.
- **`waitFor` Methods**: Use `locator.waitFor({ state: 'visible' })` to wait for elements to become available.

### 10.4. Addressing Environment-Specific Issues

- **System Dependencies**: Use `sudo pnpm exec playwright install-deps` to install necessary system dependencies like fonts.
- **Tooling Conflicts**: Use the absolute path to the local Playwright binary in `node_modules/.bin` to avoid conflicts with global installations.

### 10.5. Scope Management and Issue Isolation

- **Security Challenges**: Isolate automation challenges like reCAPTCHA as separate concerns from the primary test objective.
- **User Collaboration**: Work closely with the user to debug complex issues instead of guessing solutions.

## 11. Self-Reflection and Self-Correction

Agents must critically evaluate their own work to ensure high quality.

- **Process**: Record your thought process, use objective criteria to evaluate your work, and repeat the "Plan → Execute → Evaluate → Revise" cycle.
- **Approaches**: Use internal rubrics, "chain of thought" reasoning, and iterative improvement.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

# CI Error Guidelines

If the user wants help with fixing an error in their CI pipeline, use the following flow:
- Retrieve the list of current CI Pipeline Executions (CIPEs) using the `nx_cloud_cipe_details` tool
- If there are any errors, use the `nx_cloud_fix_cipe_failure` tool to retrieve the logs for a specific task
- Use the task logs to see what's wrong and help the user fix their problem. Use the appropriate tools if necessary
- Make sure that the problem is fixed by running the task that you passed into the `nx_cloud_fix_cipe_failure` tool


<!-- nx configuration end-->