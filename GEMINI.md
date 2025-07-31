# Gemini Development Guide

## Quick Reference

- **Core Principles**: [Section 1](#1-core-principles)
- **Technology Stack**: [Section 2](#2-technology-stack)
- **Development Workflows**: [Section 3](#3-development-workflows)
  - Issue-Driven Development (IDD): [Section 3.1](#31-issue-driven-development-idd)
  - Test-Driven Development (TDD): [Section 3.2](#32-test-driven-development-tdd)
- **Issue Management Guidelines**: [Section 4](#4-issue-management-guidelines)
- **Commit Guidelines**: [Section 5](#5-commit-guidelines)
- **Development Logs**: [Section 6](#6-development-logs)
- **CI/CD Pipeline**: [Section 7](#7-ci-cd-pipeline-githubworkflows-ciyml)
- **Project Structure**: [Section 8](#8-project-structure)
- **Operational Guidelines**: [Section 9](#9-operational-guidelines)
  - Git Management and `.gitignore`: [Section 9.1](#91-git-management-and-gitignore)
  - Tooling and Version Management: [Section 9.2](#92-tooling-and-version-management)
  - Tool Usage Best Practices: [Section 9.3](#93-tool-usage-best-practices)
  - Quick Reference Maintenance: [Section 9.4](#94-quick-reference-maintenance)
  - **Session Review and Continuous Improvement**: [Section 9.5](#95-session-review-and-continuous-improvement)
- **Playwright Browser Automation Tasks**: [Section 10](#10-playwright-browser-automation-tasks)

---


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

All work, including new features, bug fixes, and chores, is managed through GitHub Issues. This ensures traceability and clear context for every change. For details on how to create and manage issues, see the **Issue Management Guidelines** (Section 4).

The workflow is as follows:

1.  **Task Definition**: A task is defined as a GitHub Issue using the provided templates.
2.  **Start from Main**: Before starting any work, ensure you are on the `main` branch and it is up-to-date (`git checkout main && git pull`).
3.  **Branch Creation**: Create a dedicated branch for the issue from the updated `main` branch, using the naming convention: `[type]/[issue-number]-[short-description]` (e.g., `feat/123-add-login-page`, `bugfix/456-fix-button-alignment`).
4.  **Initiate Work**: The AI agent (or developer) is given an Issue number to start work.
5.  **Implementation**: Development is done on the feature branch, following the TDD cycle described below.
6.  **Commit Messages**: Commits are linked to the issue using keywords (e.g., `feat: Add login form. Closes #123`). See **Commit Guidelines** (Section 5).
7.  **Pull Request**: Once the work is complete, a Pull Request is created to merge the branch into `main`. The PR description should be filled out according to the `.github/pull_request_template.md`. It is crucial that PR descriptions are clear, concise, and actionable, especially when changes affect external GitHub settings (e.g., Actions, CodeQL, Dependabot, Secret Scanning, Issue Templates). Detailed verification steps should be provided. Draft PRs can be used for work-in-progress reviews.
8.  **CI & Review**: The CI pipeline runs automatically. The PR is then reviewed by a human.
9.  **Merge**: After approval, the PR is merged into `main`, and the feature branch is deleted.

### 3.2. Test-Driven Development (TDD)

This project adopts a Test-Driven Development (TDD) approach for all implementation work.

#### Red-Green-Refactor Cycle

1.  **Red**: Write a failing test. Create a new test file in `tests/` that describes a user story or a piece of functionality. Run the test to confirm it fails as expected.
2.  **Green**: Write the minimum code to make the test pass. This usually involves creating or updating Page Object files in `src/pages/` or `src/components/`.
3.  **Refactor**: With the test passing, refactor both the implementation code (`src/`) and the test code (`tests/`) for clarity, performance, and maintainability.

#### Page Object Model (POM)

- **`tests/`**: Contains test files (`*.spec.ts`). These files should describe user interactions and expected outcomes. They should _not_ contain complex selectors or implementation details.
- **`src/pages/`**: Each file represents a page in the web application. It contains the locators (element selectors) and methods to interact with that page.
- **`src/components/`**: Contains reusable UI components that appear on multiple pages (e.g., headers, navigation bars).

## 4. Issue Management Guidelines

To ensure clarity and consistency, all tasks are managed through GitHub Issues, following these guidelines.

### 4.1. Issue Templates

When creating a new issue, please use the templates provided. These are available via the "New Issue" button on GitHub and are located in the `.github/ISSUE_TEMPLATE` directory. The templates ensure that all necessary information, such as the goal and completion criteria, is included from the start.

### 4.2. Issue Granularity

The guiding principle is: **One Issue, One Pull Request.**

- **Keep it Small**: An issue should represent a single, logical unit of work that can be completed by one developer in a reasonable amount of time (e.g., a few hours to a day).
- **Define "Done"**: Every issue must have a clear, objective "Definition of Done" in the form of a checklist. This is crucial for knowing when the task is truly complete.
- **Split Large Tasks**: If a task seems too large (e.g., "Implement the entire settings page"), break it down into smaller, more manageable user stories (e.g., "Implement password change UI", "Implement notification preferences").
- **Proactive Decomposition**: Before starting work, analyze the feature or task. If it involves multiple distinct steps (e.g., navigation, data input, submission), break it down into separate, sequential issues from the outset. This prevents the creation of overly broad issues and ensures each PR remains focused.

### 4.3. Handling New Discoveries

If you discover a new task or bug while working on an existing issue, **do not expand the scope of your current work**.

1.  **Create a New Issue**: Immediately create a new, separate issue for the newly discovered task.
2.  **Stay Focused**: Return to your original task and complete it.

This practice prevents scope creep and keeps Pull Requests clean and focused.

## 5. Commit Guidelines

To maintain a clean, readable, and automated git history, this project adheres to the following commit guidelines.

### 5.1. Commit Message Format (Conventional Commits)

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

### 5.2. Commit Frequency (Atomic Commits)

Each commit should be an "atomic" unit of work, representing a single, complete logical change.

- **One Change per Commit**: Avoid bundling unrelated changes (e.g., a feature and a typo fix) into one commit.
- **Commit Early, Commit Often**: Commit frequently at logical points in your development process.
- **Good Times to Commit**:
  1.  After passing a new test (the "Green" in Red-Green-Refactor).
  2.  After completing a refactoring of existing code.
  3.  After a small, self-contained bug fix.
- **Keep Commits Clean**: Ensure that every commit leaves the project in a working state. Do not commit broken or work-in-progress code to a feature branch that will be merged.

## 6. Development Logs

To maintain a record of development activities, a log file will be created for each development session. **注: すべての開発ログは日本語で記述されます。**

- **Location**: `development_logs/` (This directory is ignored by Git).
- **File Naming**: `YYYY-MM-DD-issue-[issue-number]-session-[session-number].md`
- **Content**: The log will contain a summary of actions taken, decisions made, and any issues encountered during the session. Crucially, it should explain *why* certain actions were taken, provide context for technical decisions, and briefly explain any specialized tools, libraries, or technical terms used, ensuring clarity for future reference and understanding.

## 7. CI/CD Pipeline (`.github/workflows/ci.yml`)

The CI pipeline is triggered on every push or pull request to the `main` branch and performs the following steps:

1.  **Lint & Format Check**: Ensures code quality and consistency.
2.  **Run Playwright Tests**: Executes the entire test suite.
3.  **Upload Report**: Uploads the Playwright HTML report as a build artifact, allowing for easy review of test results.

## 8. Project Structure

```
/
├── packages/
│   └── [project-name]/
│       ├── src/
│       └── tests/
│
├── .github/
│   ├── ISSUE_TEMPLATE/           # Issue Templates
│   │   └── feature_request.md
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── codeql-analysis.yml
│   └── pull_request_template.md  # PR Template
│
├── development_logs/             # Ignored by Git
│
└── GEMINI.md                     # This file
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

- **Update on Change**: The "Quick Reference" section at the top of this `GEMINI.md` document must be updated whenever new top-level sections or significant subsections are added, removed, or renamed. This ensures the quick reference remains accurate and useful for navigation.
- **Maintain Link Integrity**: Ensure that all links within the quick reference accurately point to the correct sections using Markdown anchor links (e.g., `[Section Name](#section-name)`).

## 10. Playwright Browser Automation Tasks

This section describes specific guidelines and best practices for browser automation tasks using Playwright. It focuses on challenges commonly encountered when automating dynamic UIs and complex login flows, and their solutions.

### 10.1. Debugging and UI Element Identification

*   **Leveraging `page.pause()` and Playwright Inspector**: When automating complex UIs or dynamic screen transitions, inserting `await page.pause();` into your test and running it in `--headed` mode will launch the Playwright Inspector. This allows you to visually inspect the browser's state during test execution, accurately identify element selectors, and debug the flow step-by-step.
    *   **Lesson Learned**: Instead of guessing selectors or flow corrections, verifying the actual UI state with the Inspector saves significant debugging time and improves accuracy. By adjusting the `page.pause()` position based on user feedback, you can pinpoint the exact location of issues.

### 10.2. Locator Selection and Management

*   **Dynamic Element Locator Acquisition Timing**: Defining locators for elements that are not present on the initial page load (e.g., a password input field that appears mid-login flow) in the Page Object's constructor can lead to errors.
    *   **Lesson Learned**: Acquire locators dynamically using `page.locator()` at the step where the element is expected to appear. This results in more robust test code that doesn't depend on the element's initial presence.
*   **Using Robust Selectors**: Playwright offers various built-in locators for identifying elements.
    *   **Lesson Learned**: Whenever possible, prefer more semantic and UI-change-resilient locators like `getByTestId()`, `getByRole()`, or `getByPlaceholder()`. This makes tests less susceptible to minor HTML structure changes. Generic CSS selectors (`page.locator('#id')`) should be used as a last resort.

### 10.3. Enhancing Test Stability

*   **Strategic Delays (`waitForTimeout`)**: In web pages with dynamic UIs, elements may not be immediately interactive even after appearing. JavaScript-driven form rewrites or re-renders can also conflict with rapid test operations.
    *   **Lesson Learned**: Strategically inserting small, fixed delays like `await page.waitForTimeout(500);` before critical interactions (e.g., clicks) can significantly improve test stability. While not always ideal for performance, it's an effective way to ensure test reliability.
*   **Leveraging `waitFor`**: When waiting for specific elements to become available, use `locator.waitFor({ state: 'visible' })` or `page.waitForSelector()`. This pauses test execution until the element is ready, preventing timeout errors.

### 10.4. Addressing Environment-Specific Issues

*   **System-Level Dependencies**: Playwright tests can be affected by system-level dependencies of the execution environment (e.g., fonts). Specifically, if non-English languages like Japanese are required, missing fonts can lead to garbled text.
    *   **Lesson Learned**: Use commands like `sudo pnpm exec playwright install-deps` or `sudo apt-get install -y fonts-noto-cjk` to install necessary system dependencies.
*   **Local vs. Global Tool Installation Conflicts**: When using commands like `pnpm exec playwright`, conflicts can arise if an older, globally installed version of Playwright or its dependencies clashes with the project's local version.
    *   **Lesson Learned**: Avoid these conflicts by explicitly calling the Playwright binary located in the project's `node_modules/.bin` directory using its absolute path. Example: `/path/to/your/project/packages/your-project/node_modules/.bin/playwright test ...`

### 10.5. Scope Management and Issue Isolation

*   **Security Challenges (reCAPTCHA, etc.)**: Bot countermeasures like reCAPTCHA are inherently difficult to automate and are typically considered out of scope for functional tests.
    *   **Lesson Learned**: If the primary function (e.g., login) successfully authenticates and redirects to the intended page, reCAPTCHA bypass should be isolated as a separate concern. Adjusting test assertions to consider reaching the reCAPTCHA page as a successful outcome for the login test can be a pragmatic approach.
*   **Close Collaboration with User**: When facing complex issues, instead of guessing solutions, asking the user for specific details (screen state, error messages) and collaboratively debugging using tools like Playwright Inspector is the most efficient and reliable path to resolution.

---