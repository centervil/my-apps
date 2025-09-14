# Makefile for Security News Agent

.PHONY: help install test test-unit test-integration test-coverage lint format clean

# Default target
help:
	@echo "Available targets:"
	@echo "  install          Install dependencies"
	@echo "  test             Run all tests"
	@echo "  test-unit        Run unit tests only"
	@echo "  test-integration Run integration tests only"
	@echo "  test-coverage    Run tests with coverage report"
	@echo "  lint             Run linting checks"
	@echo "  format           Format code"
	@echo "  clean            Clean up generated files"

# Install dependencies
install:
	poetry install

# Run all tests
test:
	poetry run pytest

# Run unit tests only
test-unit:
	poetry run pytest tests/unit/ -v

# Run integration tests only
test-integration:
	poetry run pytest tests/integration/ -v

# Run tests with coverage
test-coverage:
	poetry run pytest --cov=src/security_news_agent --cov-report=html --cov-report=term

# Run linting
lint:
	poetry run flake8 src/ tests/
	poetry run mypy src/

# Format code
format:
	poetry run black src/ tests/
	poetry run isort src/ tests/

# Clean up
clean:
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf dist/
	rm -rf build/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete