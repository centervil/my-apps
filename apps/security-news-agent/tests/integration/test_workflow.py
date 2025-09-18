"""Integration tests for the complete workflow."""

import tempfile
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from security_news_agent.config.settings import AgentConfig
from security_news_agent.output.renderer import ReportRenderer
from security_news_agent.processing.workflow import SecurityNewsWorkflow
from security_news_agent.search.tavily_client import TavilyClient
from tests.fixtures.mock_data import (
    MOCK_CONTEXT_DATA,
    MOCK_EVALUATION_RESPONSE,
    MOCK_SLIDE_CONTENT,
)


@pytest.mark.integration
class TestEndToEndWorkflow:
    """Integration tests for the complete security news workflow."""

    @pytest.fixture
    def temp_output_dir(self):
        """Create temporary output directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield Path(temp_dir)

    @pytest.fixture
    def integration_config(self):
        """Create configuration for integration testing."""
        return AgentConfig(
            google_api_key="test-google-key",
            langchain_api_key="test-langchain-key",
            tavily_api_key="test-tavily-key",
            gemini_model_name="gemini-1.5-flash-latest",
            slide_format="",  # No rendering for integration tests
            marp_theme="default",
            marp_paginate=True,
        )

    @pytest.fixture
    def mock_tavily_client(self):
        """Create mock Tavily client with realistic responses."""
        client = Mock(spec=TavilyClient)
        client.api_key = "test-key"
        client.collect_context.return_value = MOCK_CONTEXT_DATA
        client.format_context_as_markdown.return_value = (
            self._create_mock_context_markdown()
        )
        client.get_total_results_count.return_value = 5
        return client

    def _create_mock_context_markdown(self):
        """Create realistic context markdown."""
        return """### Query: latest cybersecurity news
- Critical Security Vulnerability Discovered in Popular Framework — A critical vulnerability (CVE-2025-1234) has been discovered... [source](https://thehackernews.com/2025/09/critical-vulnerability-framework.html)
- Major Data Breach Affects 50 Million Users at Tech Giant — A major technology company has disclosed a data breach... [source](https://bleepingcomputer.com/2025/09/major-data-breach-tech-company.html)

### Query: latest vulnerability reports
- Zero-Day Exploit in Popular VPN Software Under Active Attack — Security researchers have discovered a zero-day vulnerability... [source](https://darkreading.com/2025/09/zero-day-vpn-software-attack.html)

### Query: malware trends
- New Malware Campaign Targets Financial Institutions Worldwide — Cybersecurity firms have identified a sophisticated malware campaign... [source](https://krebsonsecurity.com/2025/09/malware-campaign-financial-institutions.html)
"""

    def test_complete_workflow_success(
        self, integration_config, mock_tavily_client, temp_output_dir
    ):
        """Test complete workflow execution with mocked dependencies."""

        # Mock LLM responses
        mock_llm_responses = [
            # Outline response
            Mock(
                content="""
- Critical Framework Vulnerability (CVE-2025-1234) - Remote code execution risk
- Major Data Breach at Tech Giant - 50 million users affected
- Zero-Day VPN Exploit - Active attacks on popular VPN software
- Financial Malware Campaign - Sophisticated APT targeting banks
- Healthcare Ransomware Attack - 2 million patient records at risk
"""
            ),
            # TOC response
            Mock(
                content='{"toc": ["Executive Summary", "Critical Vulnerabilities", "Data Breaches", "Malware Threats", "Recommendations"]}'
            ),
            # Slides response
            Mock(content=MOCK_SLIDE_CONTENT),
            # Evaluation response
            Mock(content=MOCK_EVALUATION_RESPONSE),
        ]

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ) as mock_llm_class:
            mock_llm = Mock()
            mock_llm.invoke.side_effect = mock_llm_responses
            mock_llm_class.return_value = mock_llm

            # Create workflow
            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            # Execute workflow
            result = workflow.run()

            # Verify workflow completed successfully
            assert result is not None
            assert "error" not in result or result["error"] == ""
            assert "slide_md" in result
            assert len(result["slide_md"]) > 0
            assert "score" in result
            assert "passed" in result

            # Verify all workflow steps were executed
            assert mock_tavily_client.collect_context.called
            assert (
                mock_llm.invoke.call_count >= 3
            )  # At least outline, TOC, slides

    def test_workflow_with_tavily_error(
        self, integration_config, temp_output_dir
    ):
        """Test workflow handling when Tavily API fails."""

        # Mock Tavily client that fails
        mock_tavily_client = Mock(spec=TavilyClient)
        mock_tavily_client.api_key = "test-key"
        mock_tavily_client.collect_context.side_effect = Exception(
            "Tavily API Error"
        )

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ):
            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            result = workflow.run()

            # Verify error handling
            assert result is not None
            assert "error" in result
            assert (
                "tavily_error" in result["error"]
                or "Tavily API Error" in result["error"]
            )

    def test_workflow_with_llm_error(
        self, integration_config, mock_tavily_client, temp_output_dir
    ):
        """Test workflow handling when LLM fails."""

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ) as mock_llm_class:
            mock_llm = Mock()
            mock_llm.invoke.side_effect = Exception("LLM API Error")
            mock_llm_class.return_value = mock_llm

            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            result = workflow.run()

            # Verify error handling
            assert result is not None
            assert "error" in result
            assert (
                "outline_error" in result["error"]
                or "LLM API Error" in result["error"]
            )

    def test_workflow_retry_logic(
        self, integration_config, mock_tavily_client, temp_output_dir
    ):
        """Test workflow retry logic when evaluation fails initially."""

        # Mock LLM responses with initial failure, then success
        mock_llm_responses = [
            # First attempt - outline
            Mock(content="- Item 1\n- Item 2\n- Item 3"),
            # First attempt - TOC
            Mock(content='{"toc": ["Section 1", "Section 2"]}'),
            # First attempt - slides
            Mock(content="# Basic slides\n\n## Section 1\n\nContent"),
            # First attempt - evaluation (fail)
            Mock(
                content='{"score": 6.0, "pass": false, "feedback": "Needs improvement"}'
            ),
            # Second attempt - TOC
            Mock(content='{"toc": ["Better Section 1", "Better Section 2"]}'),
            # Second attempt - slides
            Mock(content=MOCK_SLIDE_CONTENT),
            # Second attempt - evaluation (pass)
            Mock(content=MOCK_EVALUATION_RESPONSE),
        ]

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ) as mock_llm_class:
            mock_llm = Mock()
            mock_llm.invoke.side_effect = mock_llm_responses
            mock_llm_class.return_value = mock_llm

            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            result = workflow.run()

            # Verify retry logic worked
            assert result is not None
            assert result.get("attempts", 0) >= 2
            assert result.get("passed", False) is True
            assert mock_llm.invoke.call_count >= 6  # Multiple attempts

    def test_workflow_max_attempts_reached(
        self, integration_config, mock_tavily_client, temp_output_dir
    ):
        """Test workflow when max attempts are reached."""

        # Mock LLM responses that always fail evaluation
        failing_responses = [
            Mock(content="- Item 1\n- Item 2"),  # outline
            Mock(content='{"toc": ["Section 1"]}'),  # TOC
            Mock(content="# Basic slides"),  # slides
            Mock(
                content='{"score": 5.0, "pass": false, "feedback": "Poor quality"}'
            ),  # evaluation
        ]

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ) as mock_llm_class:
            mock_llm = Mock()
            # Repeat failing responses for multiple attempts
            mock_llm.invoke.side_effect = failing_responses * 5
            mock_llm_class.return_value = mock_llm

            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )
            workflow.max_attempts = 2  # Reduce for faster testing

            result = workflow.run()

            # Verify max attempts handling
            assert result is not None
            assert result.get("attempts", 0) >= 2
            # Should proceed even if not passed when max attempts reached
            assert "slide_md" in result

    def test_complete_workflow_with_output_rendering(
        self, integration_config, mock_tavily_client, temp_output_dir
    ):
        """Test complete workflow including output rendering."""

        # Configure for markdown output only
        integration_config.slide_format = ""

        mock_llm_responses = [
            Mock(content="- Item 1\n- Item 2\n- Item 3"),
            Mock(content='{"toc": ["Section 1", "Section 2"]}'),
            Mock(content=MOCK_SLIDE_CONTENT),
            Mock(content=MOCK_EVALUATION_RESPONSE),
        ]

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ) as mock_llm_class:
            mock_llm = Mock()
            mock_llm.invoke.side_effect = mock_llm_responses
            mock_llm_class.return_value = mock_llm

            # Create workflow
            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            # Execute workflow
            result = workflow.run()

            # Verify workflow completed
            assert result is not None
            assert result.get("passed", False) is True
            assert "slide_md" in result

            # Test output rendering
            renderer = ReportRenderer(integration_config, str(temp_output_dir))
            render_result = renderer.save_and_render(
                result["slide_md"], result.get("title", "Test Report")
            )

            # Verify output was saved
            assert render_result["success"] is True
            assert render_result["markdown_path"] is not None
            assert Path(render_result["markdown_path"]).exists()

            # Verify content
            saved_content = Path(render_result["markdown_path"]).read_text()
            assert "marp: true" in saved_content
            assert "Daily Security Briefing" in saved_content

    def test_workflow_prerequisites_validation(
        self, integration_config, mock_tavily_client
    ):
        """Test workflow prerequisites validation."""

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ):
            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            # Test successful validation
            assert workflow.validate_prerequisites() is True

            # Test with missing Tavily key
            mock_tavily_client.api_key = None
            assert workflow.validate_prerequisites() is False

            # Test with missing Google key
            mock_tavily_client.api_key = "test-key"
            integration_config.google_api_key = ""
            assert workflow.validate_prerequisites() is False

    def test_workflow_summary(self, integration_config, mock_tavily_client):
        """Test workflow configuration summary."""

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ):
            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            summary = workflow.get_workflow_summary()

            assert "model" in summary
            assert "max_attempts" in summary
            assert "nodes" in summary
            assert len(summary["nodes"]) == 5
            assert summary["model"] == integration_config.gemini_model_name

    def test_workflow_state_management(
        self, integration_config, mock_tavily_client
    ):
        """Test workflow state creation and management."""

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ):
            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            # Test initial state creation
            initial_state = workflow.create_initial_state()
            assert (
                initial_state["topic"] == "Daily Cybersecurity Threat Briefing"
            )
            assert initial_state["attempts"] == 0
            assert initial_state["error"] == ""

            # Test custom topic
            custom_state = workflow.create_initial_state("Custom Topic")
            assert custom_state["topic"] == "Custom Topic"

            # Test run config creation
            run_config = workflow.create_run_config()
            assert run_config["run_name"] == "daily-security-news-agent"
            assert "security" in run_config["tags"]

    def test_error_propagation_through_workflow(
        self, integration_config, temp_output_dir
    ):
        """Test that errors propagate correctly through the workflow."""

        # Mock Tavily client that succeeds
        mock_tavily_client = Mock(spec=TavilyClient)
        mock_tavily_client.api_key = "test-key"
        mock_tavily_client.collect_context.return_value = MOCK_CONTEXT_DATA
        mock_tavily_client.format_context_as_markdown.return_value = (
            "### Query: test\n- Article 1"
        )
        mock_tavily_client.get_total_results_count.return_value = 1

        # Mock LLM that fails on slides generation
        mock_llm_responses = [
            Mock(content="- Item 1\n- Item 2"),  # outline succeeds
            Mock(content='{"toc": ["Section 1"]}'),  # TOC succeeds
        ]

        with patch(
            "security_news_agent.processing.workflow.ChatGoogleGenerativeAI"
        ) as mock_llm_class:
            mock_llm = Mock()
            mock_llm.invoke.side_effect = mock_llm_responses + [
                Exception("Slides generation failed")
            ]
            mock_llm_class.return_value = mock_llm

            workflow = SecurityNewsWorkflow(
                integration_config, mock_tavily_client
            )

            result = workflow.run()

            # Verify error was captured and propagated
            assert result is not None
            assert "error" in result
            assert (
                "slides_error" in result["error"]
                or "Slides generation failed" in result["error"]
            )

            # Verify partial state was preserved
            assert "outline" in result
            assert "toc" in result
