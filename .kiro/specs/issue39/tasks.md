# Task Checklist for Issue 39: True Test Mode

This document lists the specific implementation tasks required to complete Issue 39.

## Phase 1: Core Implementation

- [ ] **Task 1: Refactor `AgentConfig.from_env` in `settings.py`**
    - [ ] Modify the method to check for `test_mode`.
    - [ ] If `test_mode` is true, assign mock API key strings (`"mock_..."`) to any keys that are not found in the environment.
    - [ ] Ensure the `ConfigurationError` for missing API keys is only raised when `test_mode` is false.

- [ ] **Task 2: Update Client Initialization in `__main__.py`**
    - [ ] Refine the condition for using mock clients to be `args.test_mode and "mock" in config.google_api_key`.
    - [ ] Add a log message to inform the user that mock clients are being used because API keys were not found.
    - [ ] Add a log message to inform the user when the agent is running in test mode but with real API keys.

## Phase 2: Testing

- [ ] **Task 3: Add Unit Tests for `AgentConfig`**
    - [ ] In `tests/unit/test_config.py`, add a new test `test_from_env_test_mode_no_keys` to verify that mock keys are assigned when `test_mode=True` and no keys are set.
    - [ ] Add a new test `test_from_env_test_mode_with_real_keys` to verify that real keys are preserved when `test_mode=True`.
    - [ ] Ensure all existing tests in `test_config.py` continue to pass.

- [ ] **Task 4: Run Full Test Suite**
    - [ ] Execute the entire project test suite using the appropriate command (e.g., `poetry run pytest`).
    - [ ] Identify and fix any brittle or failing tests that are unrelated to the core changes but impact stability.

- [ ] **Task 5: Perform Manual End-to-End Tests**
    - [ ] Run the agent with `--test-mode` and no API keys.
    - [ ] Run the agent with `--test-mode` and with API keys.
    - [ ] Run the agent without `--test-mode` and no API keys.
    - [ ] Verify the output and log messages for all three scenarios match the expected behavior.

## Phase 3: Documentation

- [ ] **Task 6: Create Development Log**
    - [ ] Create the development log file in `development_logs/` as specified in `AGENTS.md`.
    - [ ] Document the changes made, decisions taken, and the rationale behind them.

## Phase 4: Finalization

- [ ] **Task 7: Code Review and Submission**
    - [ ] Request a code review.
    - [ ] Address any feedback from the review.
    - [ ] Submit the final changes.
