"""Pytest configuration and shared fixtures."""

import pytest
from unittest.mock import Mock, patch
from pathlib import Path
from typing import Dict, Any, List

from security_news_agent.config.settings import AgentConfig
from security_news_agent.processing.state import State


@pytest.fixture
def mock_config():
    """Provide a mock configuration for testing."""
    return AgentConfig(
        google_api_key="test-google-key",
        langchain_api_key="test-langchain-key", 
        tavily_api_key="test-tavily-key",
        gemini_model_name="gemini-1.5-flash-latest",
        slide_format="pdf",
        marp_theme="default",
        marp_paginate=True
    )


@pytest.fixture
def mock_tavily_response():
    """Mock Tavily API response."""
    return {
        "results": [
            {
                "title": "Critical Security Vulnerability Discovered in Popular Framework",
                "url": "https://example.com/security-news-1",
                "content": "A critical vulnerability has been discovered in a widely-used web framework that could allow remote code execution. Security researchers recommend immediate patching."
            },
            {
                "title": "Major Data Breach Affects Millions of Users",
                "url": "https://example.com/security-news-2", 
                "content": "A major technology company has disclosed a data breach affecting millions of user accounts. The breach included personal information and encrypted passwords."
            },
            {
                "title": "New Malware Campaign Targets Financial Institutions",
                "url": "https://example.com/security-news-3",
                "content": "Cybersecurity firms have identified a sophisticated malware campaign specifically targeting financial institutions with advanced persistent threat techniques."
            }
        ]
    }


@pytest.fixture
def mock_gemini_response():
    """Mock Gemini LLM response."""
    return """# Daily Security Briefing - 2025-09-14

## Executive Summary

Today's security landscape shows three critical areas of concern: framework vulnerabilities, data breaches, and targeted malware campaigns.

## Key Threats

### Critical Framework Vulnerability
- **Impact**: Remote code execution possible
- **Recommendation**: Immediate patching required
- **Source**: https://example.com/security-news-1

### Major Data Breach
- **Scope**: Millions of users affected
- **Data**: Personal information and passwords
- **Source**: https://example.com/security-news-2

### Financial Malware Campaign
- **Target**: Financial institutions
- **Method**: Advanced persistent threats
- **Source**: https://example.com/security-news-3

## Recommendations

1. Apply security patches immediately
2. Monitor for unusual account activity
3. Implement additional monitoring for financial systems"""


@pytest.fixture
def mock_initial_state():
    """Provide a mock initial state for workflow testing."""
    return State(
        topic="Daily Cybersecurity Threat Briefing",
        outline=[],
        toc=[],
        slide_md="",
        score=0.0,
        subscores={},
        reasons={},
        suggestions=[],
        risk_flags=[],
        passed=False,
        feedback="",
        title="",
        slide_path="",
        attempts=0,
        error="",
        log=[],
        context_md="",
        sources={}
    )


@pytest.fixture
def mock_processed_state(mock_initial_state, mock_gemini_response):
    """Provide a mock state after processing."""
    state = mock_initial_state.copy()
    state.update({
        "outline": [
            "Critical Framework Vulnerability - Remote code execution risk",
            "Major Data Breach - Millions of users affected", 
            "Financial Malware Campaign - APT targeting banks"
        ],
        "toc": [
            "Executive Summary",
            "Key Threats", 
            "Vulnerability Analysis",
            "Breach Reports",
            "Recommendations"
        ],
        "slide_md": mock_gemini_response,
        "title": "Daily Security Briefing - 2025-09-14",
        "score": 8.5,
        "passed": True,
        "context_md": "### Query: latest cybersecurity news\n- Critical Security Vulnerability Discovered in Popular Framework — A critical vulnerability has been discovered... [source](https://example.com/security-news-1)"
    })
    return state


@pytest.fixture
def temp_output_dir(tmp_path):
    """Provide a temporary directory for output testing."""
    output_dir = tmp_path / "slides"
    output_dir.mkdir()
    return output_dir


@pytest.fixture
def mock_tavily_client(mock_tavily_response):
    """Mock TavilyClient for testing."""
    with patch('security_news_agent.search.tavily_client.TavilyClient') as mock_class:
        mock_instance = Mock()
        mock_instance.search.return_value = mock_tavily_response
        mock_instance.collect_context.return_value = {
            "latest cybersecurity news": mock_tavily_response["results"]
        }
        mock_class.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_llm(mock_gemini_response):
    """Mock LLM client for testing."""
    with patch('security_news_agent.processing.nodes.ChatGoogleGenerativeAI') as mock_class:
        mock_instance = Mock()
        mock_response = Mock()
        mock_response.content = mock_gemini_response
        mock_instance.invoke.return_value = mock_response
        mock_class.return_value = mock_instance
        yield mock_instance