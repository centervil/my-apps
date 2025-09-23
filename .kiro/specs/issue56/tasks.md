# Task List for Issue #56: Organize gemini-cli actions

This checklist breaks down the work required to complete Issue #56, based on the requirements and design specifications.

## 1. Specification and Planning
- [x] Create `.kiro/specs/issue56/` directory.
- [x] Create `requirements.md` with user stories.
- [x] Create `design.md` with the design plan.
- [ ] Create this `tasks.md` file.

## 2. Workflow Cleanup
- [ ] Delete `.github/workflows/gemini-invoke.yml`.
- [ ] Delete `.github/workflows/gemini-triage.yml`.
- [ ] Delete `.github/workflows/test-gemini-workflows.yml`.
- [ ] Delete `.github/workflows/e2e-test-gemini.yml`.
- [ ] Verify deletion by listing files in `.github/workflows/`.

## 3. Implement Japanese Language Response
- [ ] Read the contents of `.github/workflows/gemini-dispatch.yml`.
- [ ] Read the contents of `.github/workflows/gemini-review.yml`.
- [ ] Identify the prompt construction step in both files.
- [ ] Modify `gemini-dispatch.yml` to add the Japanese language instruction.
- [ ] Modify `gemini-review.yml` to add the Japanese language instruction.
- [ ] Verify the modifications by reading the files again.

## 4. Documentation and Finalization
- [ ] Create the development log file: `development_logs/2025-09-23-issue-56-session-1.md`.
- [ ] Write a summary of the work session in the log file (in Japanese).
- [ ] Request a code review.
- [ ] Commit the changes with a message adhering to Conventional Commits (`fix(actions): clean up workflows and set Japanese prompt`).
- [ ] Submit the work.
