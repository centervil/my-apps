"""Unit tests for mock client implementations."""

import pytest
from security_news_agent.processing.mock_clients import (
    MockTavilyClient,
    MockChatGoogleGenerativeAI,
    MOCK_TAVILY_SEARCH_RESULTS,
    MOCK_GEMINI_OUTLINE_RESPONSE,
    MOCK_GEMINI_SLIDES_RESPONSE
)


class TestMockTavilyClient:
    """Test cases for the MockTavilyClient."""

    def test_init(self):
        """Test that the client can be initialized."""
        client = MockTavilyClient(api_key="mock-key")
        assert client.api_key == "mock-key"

    def test_collect_context(self):
        """Test that collect_context returns mock data."""
        client = MockTavilyClient(api_key="mock-key")
        queries = [{"q": "test query"}]
        results = client.collect_context(queries)
        assert isinstance(results, dict)
        assert "test query" in results
        assert results["test query"] == MOCK_TAVILY_SEARCH_RESULTS

    def test_format_context_as_markdown(self):
        """Test that context is formatted correctly."""
        client = MockTavilyClient(api_key="mock-key")
        context = {"test query": MOCK_TAVILY_SEARCH_RESULTS}
        markdown = client.format_context_as_markdown(context)
        assert isinstance(markdown, str)
        assert "### Query: test query" in markdown
        assert MOCK_TAVILY_SEARCH_RESULTS[0]["title"] in markdown
        assert MOCK_TAVILY_SEARCH_RESULTS[0]["url"] in markdown

    def test_get_total_results_count(self):
        """Test that the total results are counted correctly."""
        client = MockTavilyClient(api_key="mock-key")
        context = {"test query": MOCK_TAVILY_SEARCH_RESULTS, "query2": []}
        count = client.get_total_results_count(context)
        assert count == len(MOCK_TAVILY_SEARCH_RESULTS)


class TestMockChatGoogleGenerativeAI:
    """Test cases for the MockChatGoogleGenerativeAI."""

    def test_init(self):
        """Test that the client can be initialized."""
        client = MockChatGoogleGenerativeAI(model="mock-model")
        assert client.model == "mock-model"

    def test_invoke_with_outline_prompt(self):
        """Test invocation for generating an outline."""
        client = MockChatGoogleGenerativeAI(model="mock-model")
        response = client.invoke("please create an outline")
        assert response.content == MOCK_GEMINI_OUTLINE_RESPONSE

    def test_invoke_with_slides_prompt(self):
        """Test invocation for generating slides."""
        client = MockChatGoogleGenerativeAI(model="mock-model")
        response = client.invoke("please create the slide content")
        assert response.content == MOCK_GEMINI_SLIDES_RESPONSE

    def test_invoke_with_generic_prompt(self):
        """Test invocation with a generic prompt."""
        client = MockChatGoogleGenerativeAI(model="mock-model")
        response = client.invoke("some other prompt")
        assert response.content == "This is a generic mock AI response."

    def test_invoke_with_message_list(self):
        """Test invocation with a list of message objects."""
        class FakeMessage:
            def __init__(self, content):
                self.content = content

        client = MockChatGoogleGenerativeAI(model="mock-model")
        messages = [FakeMessage("this is an outline prompt")]
        response = client.invoke(messages)
        assert response.content == MOCK_GEMINI_OUTLINE_RESPONSE
