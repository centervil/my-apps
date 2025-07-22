# Gemini Development Guide

This document outlines the core principles, technology stack, and development workflows for this repository.

## 1. Core Principles

- **Monorepo Approach**: This repository is a monorepo managed by `pnpm` workspaces. It houses multiple, distinct UI automation projects under the `packages/` directory.
- **Automation as Code**: All UI automation logic is treated as production-level code, applying software engineering best practices.
- **Security First (DevSecOps)**: Security is integrated into the development lifecycle from the beginning ("Shift-Left").

## 2. Technology Stack

- **Language**: TypeScript
- **UI Automation Framework**: Playwright
- **Test Runner**: `@playwright/test`
- **Package Manager**: pnpm
- **CLI**: GitHub CLI (`gh`)
- **Code Linter**: ESLint (to be configured)
- **Code Formatter**: Prettier
- **CI/CD**: GitHub Actions
- **Security Scanning**:
  - **SAST**: GitHub CodeQL
  - **Dependency Vulnerabilities**: `pnpm audit` & GitHub Dependabot
  - **Secret Scanning**: GitHub Secret Scanning

## 3. Development Workflows

This repository combines two core development methodologies: Issue-Driven Development for task management and Test-Driven Development for implementation.

### 3.1. Issue-Driven Development (IDD)

All work, including new features, bug fixes, and chores, is managed through GitHub Issues. This ensures traceability and clear context for every change. The workflow is as follows:

1.  **Task Definition**: A task is defined as a GitHub Issue.
2.  **Initiate Work**: The AI agent (or developer) is given an Issue number to start work.
3.  **Branch Creation**: A new branch is created from `main` using the naming convention: `[type]/[issue-number]-[short-description]` (e.g., `feat/123-add-login-page`, `bugfix/456-fix-button-alignment`).
4.  **Implementation**: Development is done on the feature branch, following the TDD cycle described below.
5.  **Commit Messages**: Commits are linked to the issue using keywords (e.g., `feat: Add login form. Closes #123`).
6.  **Pull Request**: Once the work is complete, a Pull Request is created to merge the branch into `main`. The PR description should be filled out according to the `.github/pull_request_template.md`. Draft PRs can be used for work-in-progress reviews.
7.  **CI & Review**: The CI pipeline runs automatically. The PR is then reviewed by a human.
8.  **Merge**: After approval, the PR is merged into `main`, and the feature branch is deleted.

### 3.2. Test-Driven Development (TDD)

This project adopts a Test-Driven Development (TDD) approach for all implementation work.

#### Red-Green-Refactor Cycle

1.  **Red**: Write a failing test. Create a new test file in `tests/` that describes a user story or a piece of functionality. Run the test to confirm it fails as expected.
2.  **Green**: Write the minimum code to make the test pass. This usually involves creating or updating Page Object files in `src/pages/` or `src/components/`.
3.  **Refactor**: With the test passing, refactor both the implementation code (`src/`) and the test code (`tests/`) for clarity, performance, and maintainability.

#### Page Object Model (POM)

- **`tests/`**: Contains test files (`*.spec.ts`). These files should describe user interactions and expected outcomes. They should *not* contain complex selectors or implementation details.
- **`src/pages/`**: Each file represents a page in the web application. It contains the locators (element selectors) and methods to interact with that page.
- **`src/components/`**: Contains reusable UI components that appear on multiple pages (e.g., headers, navigation bars).

## 4. Commit Guidelines

To maintain a clean, readable, and automated git history, this project adheres to the following commit guidelines.

### 4.1. Commit Message Format (Conventional Commits)

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This provides a clear structure that is both human- and machine-readable.

**Format:**
```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

- **`<type>`**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`.
- **`<scope>` (optional)**: The part of the codebase affected (e.g., `spotify-automation`, `auth`).
- **`<subject>`**: A concise, imperative-mood description of the change.
- **`<body>` (optional)**: The motivation and context for the change.
- **`<footer>` (optional)**: References to GitHub issues (e.g., `Closes #123`) and breaking change notifications.

**Example:**
```
feat(spotify-automation): add login page object

Implements the page object for the Spotify login screen, including locators for email, password, and the submit button.

Closes #12
```

### 4.2. Commit Frequency (Atomic Commits)

Each commit should be an "atomic" unit of work, representing a single, complete logical change.

- **One Change per Commit**: Avoid bundling unrelated changes (e.g., a feature and a typo fix) into one commit.
- **Commit Early, Commit Often**: Commit frequently at logical points in your development process.
- **Good Times to Commit**:
    1.  After passing a new test (the "Green" in Red-Green-Refactor).
    2.  After completing a refactoring of existing code.
    3.  After a small, self-contained bug fix.
- **Keep Commits Clean**: Ensure that every commit leaves the project in a working state. Do not commit broken or work-in-progress code to a feature branch that will be merged.

## 5. Development Logs

To maintain a record of development activities, a log file will be created for each development session.

- **Location**: `development_logs/` (This directory is ignored by Git).
- **File Naming**: `YYYY-MM-DD-issue-[issue-number]-session-[session-number].md`
- **Content**: The log will contain a summary of actions taken, decisions made, and any issues encountered during the session.

## 6. CI/CD Pipeline (`.github/workflows/ci.yml`)

The CI pipeline is triggered on every push or pull request to the `main` branch and performs the following steps:
1.  **Lint & Format Check**: Ensures code quality and consistency.
2.  **Run Playwright Tests**: Executes the entire test suite.
3.  **Upload Report**: Uploads the Playwright HTML report as a build artifact, allowing for easy review of test results.

## 7. Project Structure

```
/
├── packages/
│   └── [project-name]/
│       ├── src/
│       └── tests/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── codeql-analysis.yml
│   └── pull_request_template.md  # PR Template
│
├── development_logs/             # Ignored by Git
│
└── GEMINI.md                     # This file
```
