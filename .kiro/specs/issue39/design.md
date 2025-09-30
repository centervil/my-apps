# Design for Issue 39: True Test Mode

## 1. Overview

This document outlines the technical design to implement a "true test mode" for the `security-news-agent`. The goal is to allow the agent to run with the `--test-mode` flag without requiring any API keys, using mock clients and data instead.

## 2. Component Design

### 2.1. Configuration Loading (`config/settings.py`)

- **`AgentConfig.from_env` Method:** This class method will be refactored to handle the absence of API keys when `test_mode=True`.
  - The method will first read the `GOOGLE_API_KEY`, `LANGCHAIN_API_KEY`, and `TAVILY_API_KEY` from the environment.
  - It will then check the `test_mode` boolean flag.
  - **If `test_mode` is `True`:**
    - It will check if each key is present. If a key is `None` or an empty string, it will be replaced with a mock key string (e.g., `"mock_google_api_key"`).
    - No `ConfigurationError` will be raised for missing API keys.
  - **If `test_mode` is `False`:**
    - The existing logic will be preserved: if any of the required API keys are missing, a `ConfigurationError` will be raised.
- This change isolates the test-mode logic within the configuration module and prevents the application from exiting prematurely when run with `--test-mode`.

### 2.2. Main Application Logic (`__main__.py`)

- **Client Initialization:** The `main` function will be updated to intelligently select between real and mock clients.
  - The current logic is `if args.test_mode and "mock" in config.google_api_key:`. This is fundamentally correct but can be made more explicit for clarity.
  - A boolean variable, e.g., `use_mock_clients`, will be set based on the condition.
  - **If `use_mock_clients` is `True`:**
    - The application will instantiate `MockTavilyClient` and `MockChatGoogleGenerativeAI`.
    - A clear log message will be printed to the console, e.g., "🧪 API keys not found. Using MOCK clients for test mode."
  - **If `use_mock_clients` is `False`:**
    - The application will instantiate the real clients (`TavilyClient` and the default `ChatGoogleGenerativeAI` from the workflow).
    - If `args.test_mode` is true (meaning real keys were provided in test mode), a message will be printed, e.g., "🧪 Running in test mode with REAL API keys."

### 2.3. Mock Clients and Data

- **`processing/mock_clients.py`:** The existing mock clients will be used. No changes are anticipated here unless bugs are found.
- **`tests/fixtures/mock_data.py`:** The existing mock data will be used for the end-to-end workflow in test mode. No changes are anticipated.

## 3. Test Strategy

### 3.1. Unit Tests (`tests/unit/test_config.py`)

- New test cases will be added to `TestAgentConfig` to cover the new `test_mode` logic:
  - A test to verify that `AgentConfig.from_env(test_mode=True)` successfully creates a config object with mock API keys when no keys are in the environment.
  - A test to verify that `AgentConfig.from_env(test_mode=True)` uses the real API keys if they _are_ provided in the environment.
  - A test to confirm that `AgentConfig.from_env(test_mode=False)` still raises a `ConfigurationError` when keys are missing.

### 3.2. Integration Tests

- The existing integration tests in `tests/integration/test_workflow.py` should already cover the workflow logic. We will ensure they can run without requiring API keys to be set in the testing environment.

### 3.3. Manual End-to-End Testing

- After implementation, the following manual tests will be performed:
  1. Run `python -m security_news_agent --test-mode` in an environment with **no** `.env` file or API key environment variables set.
     - **Expected:** The agent runs successfully and produces a report. The log indicates mock clients were used.
  2. Run `python -m security_news_agent --test-mode` in an environment **with** valid API keys set.
     - **Expected:** The agent runs successfully using real APIs. The log indicates real keys were used in test mode.
  3. Run `python -m security_news_agent` (without test mode) in an environment with **no** API keys.
     - **Expected:** The agent fails at startup with a `ConfigurationError`.

## 4. Error Handling

- The `ConfigurationError` will now only be raised for missing API keys when `test_mode` is `False`.
- All other error handling paths should remain unaffected.
