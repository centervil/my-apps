#!/usr/bin/env python3
"""Script to run tests with real APIs in a controlled manner."""

import os
import sys
import argparse
import subprocess
from pathlib import Path


def check_api_keys():
    """Check if required API keys are available."""
    required_keys = ["GOOGLE_API_KEY", "LANGCHAIN_API_KEY", "TAVILY_API_KEY"]
    missing_keys = []
    
    for key in required_keys:
        if not os.getenv(key):
            missing_keys.append(key)
    
    return missing_keys


def run_api_tests(test_type="minimal", verbose=False):
    """Run API tests with specified configuration."""
    
    # Check prerequisites
    missing_keys = check_api_keys()
    if missing_keys:
        print("❌ Missing required API keys:")
        for key in missing_keys:
            print(f"   - {key}")
        print("\nPlease set these environment variables before running API tests.")
        return False
    
    print("✅ All required API keys found")
    
    # Change to project directory
    project_dir = Path(__file__).parent.parent
    os.chdir(project_dir)
    
    # Build pytest command
    cmd = ["poetry", "run", "pytest", "tests/api/"]
    
    if test_type == "minimal":
        # Run only basic API tests
        cmd.extend(["-k", "not slow"])
    elif test_type == "full":
        # Run all API tests including slow ones
        pass
    elif test_type == "quick":
        # Run only the quickest API validation tests
        cmd.extend(["-k", "test_tavily_client_real_search or test_config_validation"])
    
    # Add markers and options
    cmd.extend(["-m", "api"])
    
    if verbose:
        cmd.append("-v")
    else:
        cmd.append("-q")
    
    # Add timeout and other safety options
    cmd.extend([
        "--tb=short",
        "--maxfail=3",  # Stop after 3 failures to avoid excessive API usage
        "--timeout=300"  # 5 minute timeout per test
    ])
    
    print(f"Running API tests ({test_type} mode)...")
    print(f"Command: {' '.join(cmd)}")
    print("⚠️  Note: These tests will consume API quotas")
    
    try:
        result = subprocess.run(cmd, check=False)
        
        if result.returncode == 0:
            print("\n✅ All API tests passed!")
        else:
            print(f"\n❌ Some API tests failed (exit code: {result.returncode})")
            
        return result.returncode == 0
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return False
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Run security news agent tests with real APIs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Test Types:
  quick    - Run only basic API validation tests (fastest)
  minimal  - Run core API tests, skip slow tests (default)
  full     - Run all API tests including slow ones

Examples:
  python scripts/test_with_real_apis.py --type quick
  python scripts/test_with_real_apis.py --type minimal --verbose
  python scripts/test_with_real_apis.py --type full

Note: These tests require valid API keys and will consume API quotas.
Set the following environment variables:
  - GOOGLE_API_KEY
  - LANGCHAIN_API_KEY  
  - TAVILY_API_KEY
"""
    )
    
    parser.add_argument(
        "--type", 
        choices=["quick", "minimal", "full"],
        default="minimal",
        help="Type of API tests to run (default: minimal)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    parser.add_argument(
        "--check-keys",
        action="store_true", 
        help="Only check if API keys are configured"
    )
    
    args = parser.parse_args()
    
    if args.check_keys:
        missing_keys = check_api_keys()
        if missing_keys:
            print("❌ Missing API keys:")
            for key in missing_keys:
                print(f"   - {key}")
            return 1
        else:
            print("✅ All required API keys are configured")
            return 0
    
    # Confirm with user before running tests
    if not args.verbose:
        print(f"About to run {args.type} API tests.")
        print("These tests will make real API calls and consume quotas.")
        response = input("Continue? (y/N): ").strip().lower()
        if response not in ['y', 'yes']:
            print("Cancelled by user")
            return 0
    
    success = run_api_tests(args.type, args.verbose)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())