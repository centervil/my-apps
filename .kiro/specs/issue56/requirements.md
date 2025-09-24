# Requirements for Issue #56: Organize gemini-cli actions

## 1. User Stories

### User Story 1: Remove Unnecessary Workflows
- **As a:** developer
- **I want to:** remove the `invoke`, `triage`, and `test` GitHub Action workflows
- **So that:** the repository is cleaner, easier to understand, and CI resource usage is reduced.

#### Acceptance Criteria
- The workflow file related to the `invoke` command is deleted from the `.github/workflows` directory.
- The workflow file related to the `triage` command is deleted from the `.github/workflows` directory.
- The workflow files related to testing other workflows are deleted from the `.github/workflows` directory.
- The remaining critical workflows (`gemini-dispatch.yml`, `gemini-review.yml`) continue to function correctly after the deletions.

### User Story 2: Set Default Language to Japanese
- **As a:** user interacting with the Gemini agent
- **I want to:** have the agent's responses be in Japanese by default
- **So that:** I can interact with it more smoothly and naturally without specifying the language each time.

#### Acceptance Criteria
- A configuration or modification is applied to the core Gemini agent workflows.
- When the agent is triggered (e.g., via `gemini-dispatch.yml`), its response is consistently in Japanese.
- This change does not negatively impact the agent's ability to perform its tasks.
