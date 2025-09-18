"""Real API tests package.

These tests use actual API calls and should be run sparingly to avoid
hitting rate limits. They require valid API keys to be set in environment
variables.

To run these tests:
    pytest tests/api/ -m api

To skip these tests:
    pytest -m "not api"
"""
