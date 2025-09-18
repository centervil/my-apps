"""Real API tests for the security news agent.

These tests use actual API calls and should be run sparingly to avoid
hitting rate limits. They require valid API keys to be set in environment
variables.
"""

import os
from pathlib import Path

import pytest

from security_news_agent.config.settings import AgentConfig, ConfigurationError
from security_news_agent.output.renderer import ReportRenderer
from security_news_agent.processing.workflow import SecurityNewsWorkflow
from security_news_agent.search.tavily_client import TavilyClient, TavilyError


@pytest.mark.api
class TestRealAPIIntegration:
    """Tests that use real API calls."""

    @pytest.fixture(scope="class")
    def api_config(self):
        """Load configuration from environment for API testing."""
        try:
            config = AgentConfig.from_env()
            return config
        except ConfigurationError as e:
            pytest.skip(f"API keys not configured: {e}")

    @pytest.fixture(scope="class")
    def limited_config(self, api_config):
        """Create configuration with limited queries for testing."""
        # Override search queries to use minimal API calls
        limited_config = api_config
        return limited_config

    def test_tavily_client_real_search(self, api_config):
        """Test Tavily client with real API call."""
        client = TavilyClient(api_config.tavily_api_key, timeout=30)

        try:
            # Use a very specific, limited query
            result = client.search(
                query="cybersecurity news today",
                max_results=2,
                time_range="day",
            )

            # Verify response structure
            assert isinstance(result, dict)
            assert "results" in result
            assert isinstance(result["results"], list)

            # Verify we got some results (may be 0 if no recent news)
            if result["results"]:
                first_result = result["results"][0]
                assert "title" in first_result
                assert "url" in first_result
                assert "content" in first_result

                # Verify URL format
                assert first_result["url"].startswith(("http://", "https://"))

            print(
                f"✅ Tavily API test successful. Found {len(result['results'])} results."
            )

        except TavilyError as e:
            pytest.fail(f"Tavily API error: {e}")
        except Exception as e:
            pytest.fail(f"Unexpected error in Tavily test: {e}")

    def test_tavily_client_collect_context_limited(self, api_config):
        """Test context collection with limited queries."""
        client = TavilyClient(api_config.tavily_api_key, timeout=30)

        # Use only one query with minimal results
        limited_queries = [
            {
                "q": "cybersecurity vulnerability",
                "include_domains": ["thehackernews.com"],
                "time_range": "day",
            }
        ]

        try:
            context = client.collect_context(limited_queries, max_per_query=2)

            # Verify response structure
            assert isinstance(context, dict)
            assert len(context) == 1

            query_key = list(context.keys())[0]
            results = context[query_key]
            assert isinstance(results, list)

            # Verify deduplication worked
            urls = [r["url"] for r in results]
            assert len(urls) == len(set(urls)), "URLs should be deduplicated"

            # Test markdown formatting
            markdown = client.format_context_as_markdown(context)
            assert isinstance(markdown, str)
            assert "### Query:" in markdown

            print(
                f"✅ Context collection test successful. Found {len(results)} unique results."
            )

        except TavilyError as e:
            pytest.fail(f"Tavily context collection error: {e}")
        except Exception as e:
            pytest.fail(f"Unexpected error in context collection test: {e}")

    @pytest.mark.slow
    def test_minimal_workflow_execution(self, limited_config, tmp_path):
        """Test minimal workflow execution with real APIs."""

        # Create Tavily client
        tavily_client = TavilyClient(limited_config.tavily_api_key, timeout=60)

        # Override search queries to be minimal
        original_get_queries = limited_config.get_search_queries

        def get_minimal_queries():
            return [
                {
                    "q": "security news",
                    "include_domains": ["thehackernews.com"],
                    "time_range": "week",  # Use week to increase chance of results
                }
            ]

        limited_config.get_search_queries = get_minimal_queries

        try:
            # Create workflow with reduced max attempts
            workflow = SecurityNewsWorkflow(limited_config, tavily_client)
            workflow.max_attempts = 1  # Reduce attempts to save API calls

            # Validate prerequisites
            if not workflow.validate_prerequisites():
                pytest.skip("Workflow prerequisites not met")

            # Create initial state with simple topic
            initial_state = workflow.create_initial_state("Security News Test")

            # Execute workflow
            result = workflow.run(initial_state)

            # Verify basic workflow completion
            assert result is not None
            assert isinstance(result, dict)

            # Check if we got through news collection
            if "sources" in result and result["sources"]:
                print(
                    f"✅ News collection successful. Found sources: {list(result['sources'].keys())}"
                )

                # If we have sources, check other steps
                if "outline" in result and result["outline"]:
                    print(
                        f"✅ Outline generation successful. Items: {len(result['outline'])}"
                    )

                if "slide_md" in result and result["slide_md"]:
                    print(
                        f"✅ Slide generation successful. Length: {len(result['slide_md'])} chars"
                    )

                    # Test output rendering
                    renderer = ReportRenderer(limited_config, str(tmp_path))
                    render_result = renderer.save_and_render(
                        result["slide_md"],
                        result.get("title", "API Test Report"),
                    )

                    if render_result["success"]:
                        print(
                            f"✅ Report rendering successful: {render_result['markdown_path']}"
                        )

                        # Verify file exists and has content
                        report_path = Path(render_result["markdown_path"])
                        assert report_path.exists()
                        content = report_path.read_text()
                        # Should have substantial content
                        assert len(content) > 100
                        assert "marp: true" in content
                    else:
                        print(
                            f"⚠️ Report rendering failed: {render_result.get('error', 'Unknown error')}"
                        )
                else:
                    print("⚠️ Slide generation did not complete")
            else:
                print(
                    "⚠️ No news sources found - this may be normal if no recent news matches the query"
                )

            # Check for errors
            if result.get("error"):
                print(f"⚠️ Workflow completed with error: {result['error']}")
                # Don't fail the test for API-related errors, just log them
                if (
                    "api" in result["error"].lower()
                    or "rate" in result["error"].lower()
                ):
                    pytest.skip(
                        f"API-related error (expected): {result['error']}"
                    )

            print("✅ Minimal workflow test completed successfully")

        except Exception as e:
            # Log the error but don't fail for expected API issues
            error_msg = str(e).lower()
            if any(
                term in error_msg
                for term in ["rate limit", "quota", "timeout", "network"]
            ):
                pytest.skip(f"API limitation encountered (expected): {e}")
            else:
                pytest.fail(f"Unexpected error in workflow test: {e}")
        finally:
            # Restore original method
            limited_config.get_search_queries = original_get_queries

    def test_api_error_handling(self, api_config):
        """Test error handling with invalid API parameters."""

        # Test with invalid API key
        invalid_client = TavilyClient("invalid-api-key", timeout=10)

        with pytest.raises(TavilyError):
            invalid_client.search("test query", max_results=1)

        print("✅ API error handling test successful")

    def test_rate_limiting_behavior(self, api_config):
        """Test behavior under potential rate limiting."""
        client = TavilyClient(api_config.tavily_api_key, timeout=30)

        # Make multiple rapid requests to test retry logic
        queries = ["security", "vulnerability", "malware"]

        try:
            for i, query in enumerate(queries):
                result = client.search(
                    query=f"{query} news", max_results=1, time_range="week"
                )

                assert isinstance(result, dict)
                print(f"✅ Request {i+1}/3 successful")

                # Small delay between requests
                import time

                time.sleep(1)

        except TavilyError as e:
            if "rate" in str(e).lower() or "limit" in str(e).lower():
                pytest.skip(f"Rate limiting encountered (expected): {e}")
            else:
                raise

        print("✅ Rate limiting behavior test completed")


@pytest.mark.api
class TestAPIConfiguration:
    """Test API configuration and validation."""

    def test_config_validation_with_real_keys(self):
        """Test configuration validation with real environment."""

        # Test loading from environment
        try:
            config = AgentConfig.from_env()

            # Validate configuration
            config.validate()

            # Test environment setup
            config.setup_environment()

            # Verify environment variables were set
            assert os.getenv("LANGCHAIN_TRACING_V2") is not None
            assert os.getenv("GOOGLE_API_KEY") == config.google_api_key

            print("✅ Configuration validation successful")

        except ConfigurationError as e:
            pytest.skip(f"Configuration not available for testing: {e}")

    def test_search_queries_configuration(self):
        """Test search queries configuration."""
        try:
            config = AgentConfig.from_env()

            queries = config.get_search_queries()

            # Verify query structure
            assert isinstance(queries, list)
            assert len(queries) > 0

            for query in queries:
                assert isinstance(query, dict)
                assert "q" in query
                assert "include_domains" in query
                assert isinstance(query["include_domains"], list)

                # Verify domains are valid
                for domain in query["include_domains"]:
                    assert isinstance(domain, str)
                    assert "." in domain  # Basic domain validation

            print(
                f"✅ Search queries configuration valid. Found {len(queries)} queries."
            )

        except ConfigurationError as e:
            pytest.skip(f"Configuration not available: {e}")


def run_api_tests():
    """Convenience function to run API tests with proper markers."""
    import subprocess
    import sys

    print("Running real API tests...")
    print(
        "Note: These tests require valid API keys and may consume API quotas."
    )

    # Run with API marker
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "tests/api/",
            "-m",
            "api",
            "-v",
            "--tb=short",
        ],
        capture_output=True,
        text=True,
    )

    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)

    return result.returncode == 0


if __name__ == "__main__":
    success = run_api_tests()
    exit(0 if success else 1)
