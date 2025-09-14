# Implementation Plan

- [x] 1. Set up project structure and testing framework
  - Create modular directory structure for the security news agent
  - Set up pytest configuration with fixtures and mock data
  - Add testing dependencies to pyproject.toml
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 2. Create configuration management module
  - Implement AgentConfig dataclass with validation
  - Add environment variable loading and validation logic
  - Create configuration error handling with clear messages
  - Write unit tests for configuration module
  - _Requirements: 1.1, 2.1, 5.4_

- [x] 3. Extract and modularize Tavily search functionality
  - Create TavilyClient class with search and context collection methods
  - Implement retry logic with exponential backoff for API calls
  - Add comprehensive error handling for network and API issues
  - Write unit tests with mocked API responses
  - _Requirements: 1.2, 2.1, 2.2, 5.3_

- [x] 4. Refactor LangGraph workflow into processing module
  - Extract workflow nodes into separate functions in nodes.py
  - Create SecurityNewsWorkflow class to manage the LangGraph pipeline
  - Implement proper state management and error propagation
  - Write unit tests for individual workflow nodes
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 5. Create output rendering module
  - Implement ReportRenderer class for Markdown processing and Marp rendering
  - Add file operations with proper error handling
  - Implement output format validation and cleanup
  - Write unit tests for rendering functionality
  - _Requirements: 1.2, 2.1, 2.2_

- [x] 6. Create utility module for helper functions
  - Extract utility functions (_log, _strip_bullets, _slugify_en, etc.)
  - Organize functions by category and add proper documentation
  - Write comprehensive unit tests for all utility functions
  - _Requirements: 1.2, 2.1, 2.2_

- [x] 7. Implement comprehensive unit test suite
  - Create test fixtures with realistic mock data for APIs
  - Write unit tests for all modules with 80%+ coverage
  - Implement parameterized tests for edge cases and error scenarios
  - Add test for configuration validation and error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8. Create integration tests for end-to-end workflow
  - Implement integration test using mock data that simulates real API responses
  - Test complete workflow from news collection to report generation
  - Verify Markdown output format and content structure
  - Test error handling and recovery in the full pipeline
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 9. Implement controlled real API testing capability
  - Create test mode with limited queries to minimize API usage
  - Add command-line flag for enabling real API testing
  - Implement rate limiting and graceful handling of API limits
  - Add clear success/failure feedback and sample report generation
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Enhance error handling and logging throughout the system
  - Implement structured logging with appropriate detail levels
  - Add progress indicators for long-running operations
  - Enhance retry logic with exponential backoff for all API calls
  - Improve error messages for configuration and runtime issues
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 11. Update main entry point to use new modular structure
  - Refactor __main__.py to use new modular components
  - Implement command-line argument parsing for test modes
  - Add proper initialization and cleanup logic
  - Ensure backward compatibility with existing usage
  - _Requirements: 1.1, 1.3, 4.1_

- [x] 12. Enhance GitHub Actions workflow with testing
  - Add test execution step before main pipeline execution
  - Implement dependency caching for improved performance
  - Add workflow failure prevention when tests fail
  - Implement report validation before committing
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13. Update documentation and add troubleshooting guide
  - Update README.md with new modular structure and testing instructions
  - Add troubleshooting section for common issues
  - Document test execution and development workflow
  - Add examples for different usage scenarios
  - _Requirements: 1.3, 4.4, 5.4_

- [x] 14. Perform comprehensive testing and validation
  - Run full test suite to ensure all tests pass
  - Execute integration tests with mock data
  - Perform controlled real API testing to verify functionality
  - Validate GitHub Actions workflow in test environment
  - _Requirements: 2.4, 3.3, 4.2, 4.4, 6.1_