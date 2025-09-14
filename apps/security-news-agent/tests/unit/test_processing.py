"""Unit tests for processing modules."""

import pytest
import json
from unittest.mock import Mock, patch
from security_news_agent.processing.nodes import WorkflowNodes
from security_news_agent.processing.workflow import SecurityNewsWorkflow
from security_news_agent.processing.state import State
from security_news_agent.search.tavily_client import TavilyError
from tests.fixtures.mock_data import (
    MOCK_CONTEXT_DATA,
    MOCK_OUTLINE_RESPONSE,
    MOCK_TOC_RESPONSE,
    MOCK_SLIDE_CONTENT,
    MOCK_EVALUATION_RESPONSE
)


class TestWorkflowNodes:
    """Test cases for WorkflowNodes class."""
    
    def test_collect_info_success(self, mock_initial_state, mock_config):
        """Test successful news collection."""
        mock_tavily = Mock()
        mock_tavily.collect_context.return_value = MOCK_CONTEXT_DATA
        mock_tavily.format_context_as_markdown.return_value = "### Query: test\n- Article 1"
        mock_tavily.get_total_results_count.return_value = 3
        
        result = WorkflowNodes.collect_info(mock_initial_state, mock_tavily, mock_config)
        
        assert "sources" in result
        assert "context_md" in result
        assert "log" in result
        assert "error" not in result
        mock_tavily.collect_context.assert_called_once()
    
    def test_collect_info_tavily_error(self, mock_initial_state, mock_config):
        """Test handling of Tavily API errors."""
        mock_tavily = Mock()
        mock_tavily.collect_context.side_effect = TavilyError("API Error")
        
        result = WorkflowNodes.collect_info(mock_initial_state, mock_tavily, mock_config)
        
        assert "error" in result
        assert "tavily_error" in result["error"]
        assert "log" in result
    
    def test_make_outline_success(self, mock_initial_state):
        """Test successful outline generation."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = MOCK_OUTLINE_RESPONSE
        mock_llm.invoke.return_value = mock_response
        
        state = mock_initial_state.copy()
        state["context_md"] = "### Query: test\n- Security news article"
        
        result = WorkflowNodes.make_outline(state, mock_llm)
        
        assert "outline" in result
        assert len(result["outline"]) > 0
        assert "log" in result
        assert "error" not in result
    
    def test_make_outline_no_context(self, mock_initial_state):
        """Test outline generation with no context."""
        mock_llm = Mock()
        
        result = WorkflowNodes.make_outline(mock_initial_state, mock_llm)
        
        assert "error" in result
        assert "No news context available" in result["error"]
        mock_llm.invoke.assert_not_called()
    
    def test_make_outline_llm_error(self, mock_initial_state):
        """Test handling of LLM errors in outline generation."""
        mock_llm = Mock()
        mock_llm.invoke.side_effect = Exception("LLM Error")
        
        state = mock_initial_state.copy()
        state["context_md"] = "### Query: test\n- Security news article"
        
        result = WorkflowNodes.make_outline(state, mock_llm)
        
        assert "error" in result
        assert "outline_error" in result["error"]
    
    def test_make_toc_success(self, mock_initial_state):
        """Test successful TOC generation."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = MOCK_TOC_RESPONSE
        mock_llm.invoke.return_value = mock_response
        
        state = mock_initial_state.copy()
        state["outline"] = ["Item 1", "Item 2", "Item 3"]
        
        result = WorkflowNodes.make_toc(state, mock_llm)
        
        assert "toc" in result
        assert len(result["toc"]) > 0
        assert "error" in result  # Should be empty string
        assert result["error"] == ""
    
    def test_make_toc_no_outline(self, mock_initial_state):
        """Test TOC generation with no outline."""
        mock_llm = Mock()
        
        result = WorkflowNodes.make_toc(mock_initial_state, mock_llm)
        
        assert "error" in result
        assert "No outline available" in result["error"]
        mock_llm.invoke.assert_not_called()
    
    def test_make_toc_json_parse_error(self, mock_initial_state):
        """Test TOC generation with JSON parsing error."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Invalid JSON response"
        mock_llm.invoke.return_value = mock_response
        
        state = mock_initial_state.copy()
        state["outline"] = ["Item 1", "Item 2"]
        
        with patch('security_news_agent.utils.helpers.strip_bullets') as mock_strip:
            mock_strip.return_value = ["Chapter 1", "Chapter 2"]
            
            result = WorkflowNodes.make_toc(state, mock_llm)
            
            assert "toc" in result
            assert len(result["toc"]) == 2
    
    def test_make_toc_default_fallback(self, mock_initial_state):
        """Test TOC generation falls back to default structure."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = ""
        mock_llm.invoke.return_value = mock_response
        
        state = mock_initial_state.copy()
        state["outline"] = ["Item 1"]
        
        with patch('security_news_agent.utils.helpers.strip_bullets') as mock_strip:
            mock_strip.return_value = []
            
            result = WorkflowNodes.make_toc(state, mock_llm)
            
            assert "toc" in result
            assert "Introduction" in result["toc"]
            assert "Conclusion" in result["toc"]
    
    def test_write_slides_success(self, mock_initial_state):
        """Test successful slide generation."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = MOCK_SLIDE_CONTENT
        mock_llm.invoke.return_value = mock_response
        
        state = mock_initial_state.copy()
        state["context_md"] = "### Query: test\n- Security news article"
        
        with patch('security_news_agent.utils.helpers.today_iso') as mock_today:
            mock_today.return_value = "2025-09-14"
            
            result = WorkflowNodes.write_slides(state, mock_llm)
            
            assert "slide_md" in result
            assert "title" in result
            assert "2025-09-14" in result["title"]
            assert "error" in result
            assert result["error"] == ""
    
    def test_write_slides_no_context(self, mock_initial_state):
        """Test slide generation with no context."""
        mock_llm = Mock()
        
        result = WorkflowNodes.write_slides(mock_initial_state, mock_llm)
        
        assert "error" in result
        assert "No news context available" in result["error"]
        mock_llm.invoke.assert_not_called()
    
    def test_evaluate_slides_success(self, mock_initial_state):
        """Test successful slide evaluation."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = MOCK_EVALUATION_RESPONSE
        mock_llm.invoke.return_value = mock_response
        
        state = mock_initial_state.copy()
        state["slide_md"] = MOCK_SLIDE_CONTENT
        state["topic"] = "Test Topic"
        
        result = WorkflowNodes.evaluate_slides(state, mock_llm)
        
        assert "score" in result
        assert "subscores" in result
        assert "passed" in result
        assert "attempts" in result
        assert result["attempts"] == 1
    
    def test_evaluate_slides_no_content(self, mock_initial_state):
        """Test evaluation with no slide content."""
        mock_llm = Mock()
        
        result = WorkflowNodes.evaluate_slides(mock_initial_state, mock_llm)
        
        assert "error" in result
        assert "No slide content available" in result["error"]
        mock_llm.invoke.assert_not_called()
    
    def test_evaluate_slides_with_error(self, mock_initial_state):
        """Test evaluation skips when there's a previous error."""
        state = mock_initial_state.copy()
        state["error"] = "Previous error"
        
        mock_llm = Mock()
        
        result = WorkflowNodes.evaluate_slides(state, mock_llm)
        
        assert result == {}  # Should return empty dict
        mock_llm.invoke.assert_not_called()
    
    def test_evaluate_slides_json_parse_error(self, mock_initial_state):
        """Test evaluation with JSON parsing error."""
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Invalid JSON"
        mock_llm.invoke.return_value = mock_response
        
        state = mock_initial_state.copy()
        state["slide_md"] = MOCK_SLIDE_CONTENT
        
        result = WorkflowNodes.evaluate_slides(state, mock_llm)
        
        assert "score" in result
        assert result["score"] == 7.0  # Default score
        assert "passed" in result
        assert "attempts" in result
    
    def test_route_after_eval_max_attempts(self, mock_initial_state):
        """Test routing when max attempts reached."""
        state = mock_initial_state.copy()
        state["attempts"] = 3
        state["passed"] = False
        
        result = WorkflowNodes.route_after_eval(state, max_attempts=3)
        
        assert result == "ok"
    
    def test_route_after_eval_passed(self, mock_initial_state):
        """Test routing when evaluation passed."""
        state = mock_initial_state.copy()
        state["attempts"] = 1
        state["passed"] = True
        
        result = WorkflowNodes.route_after_eval(state)
        
        assert result == "ok"
    
    def test_route_after_eval_retry(self, mock_initial_state):
        """Test routing when should retry."""
        state = mock_initial_state.copy()
        state["attempts"] = 1
        state["passed"] = False
        
        result = WorkflowNodes.route_after_eval(state)
        
        assert result == "retry"


class TestSecurityNewsWorkflow:
    """Test cases for SecurityNewsWorkflow class."""
    
    def test_init(self, mock_config):
        """Test workflow initialization."""
        mock_tavily = Mock()
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI') as mock_llm_class:
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            assert workflow.config == mock_config
            assert workflow.tavily_client == mock_tavily
            assert workflow.max_attempts == 3
            assert workflow.graph is not None
            mock_llm_class.assert_called_once()
    
    def test_create_initial_state(self, mock_config):
        """Test initial state creation."""
        mock_tavily = Mock()
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            state = workflow.create_initial_state()
            
            assert state["topic"] == "Daily Cybersecurity Threat Briefing"
            assert state["outline"] == []
            assert state["attempts"] == 0
            assert state["error"] == ""
    
    def test_create_initial_state_custom_topic(self, mock_config):
        """Test initial state creation with custom topic."""
        mock_tavily = Mock()
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            state = workflow.create_initial_state("Custom Topic")
            
            assert state["topic"] == "Custom Topic"
    
    def test_create_run_config(self, mock_config):
        """Test run configuration creation."""
        mock_tavily = Mock()
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            config = workflow.create_run_config()
            
            assert config["run_name"] == "daily-security-news-agent"
            assert "security" in config["tags"]
            assert "model" in config["metadata"]
    
    def test_create_run_config_custom_name(self, mock_config):
        """Test run configuration creation with custom name."""
        mock_tavily = Mock()
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            config = workflow.create_run_config("custom-run")
            
            assert config["run_name"] == "custom-run"
    
    def test_validate_prerequisites_success(self, mock_config):
        """Test successful prerequisites validation."""
        mock_tavily = Mock()
        mock_tavily.api_key = "test-key"
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            result = workflow.validate_prerequisites()
            
            assert result is True
    
    def test_validate_prerequisites_missing_tavily_key(self, mock_config):
        """Test prerequisites validation with missing Tavily key."""
        mock_tavily = Mock()
        mock_tavily.api_key = None
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            result = workflow.validate_prerequisites()
            
            assert result is False
    
    def test_validate_prerequisites_missing_google_key(self, mock_config):
        """Test prerequisites validation with missing Google key."""
        mock_config.google_api_key = ""
        mock_tavily = Mock()
        mock_tavily.api_key = "test-key"
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            result = workflow.validate_prerequisites()
            
            assert result is False
    
    def test_get_workflow_summary(self, mock_config):
        """Test workflow summary generation."""
        mock_tavily = Mock()
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            summary = workflow.get_workflow_summary()
            
            assert "model" in summary
            assert "max_attempts" in summary
            assert "nodes" in summary
            assert len(summary["nodes"]) == 5
    
    @patch('security_news_agent.processing.workflow.StateGraph')
    def test_run_success(self, mock_state_graph, mock_config):
        """Test successful workflow execution."""
        mock_tavily = Mock()
        mock_graph_instance = Mock()
        mock_graph_instance.invoke.return_value = {"score": 8.5, "passed": True}
        mock_state_graph.return_value.compile.return_value = mock_graph_instance
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            result = workflow.run()
            
            assert "score" in result
            assert result["score"] == 8.5
            mock_graph_instance.invoke.assert_called_once()
    
    @patch('security_news_agent.processing.workflow.StateGraph')
    def test_run_with_error(self, mock_state_graph, mock_config):
        """Test workflow execution with error."""
        mock_tavily = Mock()
        mock_graph_instance = Mock()
        mock_graph_instance.invoke.return_value = {"error": "Test error"}
        mock_state_graph.return_value.compile.return_value = mock_graph_instance
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            result = workflow.run()
            
            assert "error" in result
            assert result["error"] == "Test error"
    
    @patch('security_news_agent.processing.workflow.StateGraph')
    def test_run_execution_exception(self, mock_state_graph, mock_config):
        """Test workflow execution with exception."""
        mock_tavily = Mock()
        mock_graph_instance = Mock()
        mock_graph_instance.invoke.side_effect = Exception("Execution failed")
        mock_state_graph.return_value.compile.return_value = mock_graph_instance
        
        with patch('security_news_agent.processing.workflow.ChatGoogleGenerativeAI'):
            workflow = SecurityNewsWorkflow(mock_config, mock_tavily)
            
            result = workflow.run()
            
            assert "error" in result
            assert "workflow_execution_error" in result["error"]