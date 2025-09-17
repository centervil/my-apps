# Requirements for Issue 39: True Test Mode

## 1. Overview

The `security-news-agent` currently requires valid API keys for Google Gemini, LangChain, and Tavily to run, even in `--test-mode`. This prevents users and developers from running the agent without signing up for these services. This document outlines the requirements to implement a true test mode that can run without any API keys.

## 2. User Stories

### User Story 1: As a new user, I want to try the agent without API keys, so that I can quickly evaluate its functionality.

- **Acceptance Criteria 1.1:** When I run the agent with the `--test-mode` flag, the application must start and run to completion without requiring `GOOGLE_API_KEY`, `LANGCHAIN_API_KEY`, or `TAVILY_API_KEY` to be set in the environment.
- **Acceptance Criteria 1.2:** The agent, when run in this mode, should produce a sample report based on pre-defined mock data, demonstrating the end-to-end workflow.
- **Acceptance Criteria 1.3:** The console output should clearly indicate that the agent is running in test mode and using mock data/clients.

### User Story 2: As a developer, I want to run the agent and its tests without configuring external API keys, so that I can contribute to the project more easily.

- **Acceptance Criteria 2.1:** The application logic should bypass strict API key validation at startup if the `--test-mode` flag is present.
- **Acceptance Criteria 2.2:** If the `--test-mode` flag is used and API keys are not found, the system must inject mock clients for all external services (Tavily, Gemini, LangChain).
- **Acceptance Criteria 2.3:** If the `--test-mode` flag is used and API keys *are* present, the agent should use the real API keys and services, allowing for testing with actual external services.
- **Acceptance Criteria 2.4:** Unit and integration tests related to the agent's workflow should be runnable without needing real API keys in the test environment.

## 3. Non-Functional Requirements

- **Stability:** The changes should not negatively impact the stability of the agent when running in its normal, non-test mode.
- **Test Reliability:** Any "brittle" tests encountered during development should be fixed to improve the overall reliability of the test suite.
- **Clarity:** The implementation should be clean and easy to understand, especially the logic that decides whether to use real or mock clients.
