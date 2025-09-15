#!/usr/bin/env python3
"""Test runner script for the security news agent."""

import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*50}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {description} failed")
        print(f"Exit code: {e.returncode}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False
    except FileNotFoundError:
        print(f"ERROR: Command not found. Make sure poetry is installed.")
        return False


def main():
    parser = argparse.ArgumentParser(description="Run tests for security news agent")
    parser.add_argument("--unit", action="store_true", help="Run unit tests only")
    parser.add_argument("--integration", action="store_true", help="Run integration tests only")
    parser.add_argument("--coverage", action="store_true", help="Run with coverage report")
    parser.add_argument("--lint", action="store_true", help="Run linting checks")
    parser.add_argument("--format", action="store_true", help="Format code")
    parser.add_argument("--all", action="store_true", help="Run all checks")
    
    args = parser.parse_args()
    
    # Change to project directory
    project_dir = Path(__file__).parent.parent
    print(f"Working directory: {project_dir}")
    
    success = True
    
    if args.all or args.format:
        # Format code
        if not run_command(["poetry", "run", "black", "src/", "tests/"], "Code formatting (black)"):
            success = False
        if not run_command(["poetry", "run", "isort", "src/", "tests/"], "Import sorting (isort)"):
            success = False
    
    if args.all or args.lint:
        # Run linting
        if not run_command(["poetry", "run", "flake8", "src/", "tests/"], "Linting (flake8)"):
            success = False
        if not run_command(["poetry", "run", "mypy", "src/"], "Type checking (mypy)"):
            success = False
    
    if args.unit:
        # Run unit tests only
        if not run_command(["poetry", "run", "pytest", "tests/unit/", "-v"], "Unit tests"):
            success = False
    elif args.integration:
        # Run integration tests only
        if not run_command(["poetry", "run", "pytest", "tests/integration/", "-v"], "Integration tests"):
            success = False
    elif args.coverage:
        # Run tests with coverage
        if not run_command([
            "poetry", "run", "pytest", 
            "--cov=src/security_news_agent",
            "--cov-report=html",
            "--cov-report=term-missing"
        ], "Tests with coverage"):
            success = False
    elif args.all or not any([args.unit, args.integration, args.coverage, args.lint, args.format]):
        # Run all tests
        if not run_command(["poetry", "run", "pytest", "-v"], "All tests"):
            success = False
    
    if success:
        print(f"\n{'='*50}")
        print("✅ All checks passed!")
        print(f"{'='*50}")
        return 0
    else:
        print(f"\n{'='*50}")
        print("❌ Some checks failed!")
        print(f"{'='*50}")
        return 1


if __name__ == "__main__":
    sys.exit(main())