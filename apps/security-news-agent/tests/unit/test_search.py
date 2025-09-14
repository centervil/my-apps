"""Unit tests for Tavily search functionality."""

import pytest
import requests
from unittest.mock import Mock, patch
from security_news_agent.search.tavily_client import (
    TavilyClient,
    TavilyError,
    TavilyAPIError,
    TavilyNetworkError
)
from tests.fixtures.mock_data import MOCK_TAVILY_RESPONSE, MOCK_SEARCH_QUERIES


class TestTavilyClient:
    """Test cases for TavilyClient class."""
    
    def test_init(self):
        """Test TavilyClient initialization."""
        client = TavilyClient("test-api-key", timeout=30)
        
        assert client.api_key == "test-api-key"
        assert client.timeout == 30
        assert client.endpoint == "https://api.tavily.com/search"
    
    def test_init_default_timeout(self):
        """Test TavilyClient initialization with default timeout."""
        client = TavilyClient("test-api-key")
        
        assert client.timeout == 60
    
    @patch('requests.post')
    def test_search_success(self, mock_post):
        """Test successful search operation."""
        mock_response = Mock()
        mock_response.json.return_value = MOCK_TAVILY_RESPONSE
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        client = TavilyClient("test-api-key")
        result = client.search("test query")
        
        assert result == MOCK_TAVILY_RESPONSE
        mock_post.assert_called_once()
        
        # Check the payload
        call_args = mock_post.call_args
        payload = call_args[1]['json']
        assert payload['api_key'] == "test-api-key"
        assert payload['query'] == "test query"
        assert payload['max_results'] == 8
        assert payload['time_range'] == "day"
    
    @patch('requests.post')
    def test_search_with_options(self, mock_post):
        """Test search with custom options."""
        mock_response = Mock()
        mock_response.json.return_value = MOCK_TAVILY_RESPONSE
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        client = TavilyClient("test-api-key")
        result = client.search(
            query="security news",
            max_results=5,
            include_domains=["example.com"],
            time_range="week",
            search_depth="basic"
        )
        
        # Check the payload
        call_args = mock_post.call_args
        payload = call_args[1]['json']
        assert payload['query'] == "security news"
        assert payload['max_results'] == 5
        assert payload['include_domains'] == ["example.com"]
        assert payload['time_range'] == "week"
        assert payload['search_depth'] == "basic"
    
    @patch('requests.post')
    def test_search_api_error(self, mock_post):
        """Test handling of API error response."""
        mock_response = Mock()
        mock_response.json.return_value = {"error": "Invalid API key"}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        client = TavilyClient("test-api-key")
        
        with pytest.raises(TavilyAPIError) as exc_info:
            client.search("test query")
            
        assert "Invalid API key" in str(exc_info.value)
    
    @patch('requests.post')
    def test_search_network_error(self, mock_post):
        """Test handling of network errors."""
        mock_post.side_effect = requests.RequestException("Network error")
        
        client = TavilyClient("test-api-key")
        
        with pytest.raises(TavilyNetworkError) as exc_info:
            client.search("test query")
            
        assert "Network error" in str(exc_info.value)
    
    @patch('requests.post')
    def test_search_timeout_error(self, mock_post):
        """Test handling of timeout errors."""
        mock_post.side_effect = requests.Timeout("Request timeout")
        
        client = TavilyClient("test-api-key")
        
        with pytest.raises(TavilyNetworkError) as exc_info:
            client.search("test query")
            
        assert "Request timeout" in str(exc_info.value)
    
    @patch('requests.post')
    def test_search_http_error(self, mock_post):
        """Test handling of HTTP errors."""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.HTTPError("404 Not Found")
        mock_post.return_value = mock_response
        
        client = TavilyClient("test-api-key")
        
        with pytest.raises(TavilyNetworkError):
            client.search("test query")
    
    @patch.object(TavilyClient, 'search')
    def test_collect_context_string_queries(self, mock_search):
        """Test collect_context with string queries."""
        mock_search.return_value = MOCK_TAVILY_RESPONSE
        
        client = TavilyClient("test-api-key")
        queries = ["query1", "query2"]
        
        result = client.collect_context(queries)
        
        assert len(result) == 2
        assert "query1" in result
        assert "query2" in result
        assert mock_search.call_count == 2
    
    @patch.object(TavilyClient, 'search')
    def test_collect_context_dict_queries(self, mock_search):
        """Test collect_context with dictionary queries."""
        mock_search.return_value = MOCK_TAVILY_RESPONSE
        
        client = TavilyClient("test-api-key")
        queries = MOCK_SEARCH_QUERIES[:2]  # Use first 2 queries
        
        result = client.collect_context(queries)
        
        assert len(result) == 2
        assert mock_search.call_count == 2
        
        # Check that search was called with correct parameters
        calls = mock_search.call_args_list
        assert calls[0][1]['include_domains'] == ["thehackernews.com", "bleepingcomputer.com"]
        assert calls[1][1]['include_domains'] == ["krebsonsecurity.com", "darkreading.com"]
    
    @patch.object(TavilyClient, 'search')
    def test_collect_context_deduplication(self, mock_search):
        """Test that collect_context deduplicates results by URL."""
        # Mock response with duplicate URLs
        duplicate_response = {
            "results": [
                {
                    "title": "Article 1",
                    "url": "https://example.com/article1",
                    "content": "Content 1"
                },
                {
                    "title": "Article 2", 
                    "url": "https://example.com/article1",  # Duplicate URL
                    "content": "Content 2"
                }
            ]
        }
        mock_search.return_value = duplicate_response
        
        client = TavilyClient("test-api-key")
        queries = ["query1", "query2"]
        
        result = client.collect_context(queries)
        
        # Should only have one result per query due to deduplication
        assert len(result["query1"]) == 1
        assert len(result["query2"]) == 0  # Second query results deduplicated
    
    @patch.object(TavilyClient, 'search')
    def test_collect_context_empty_query(self, mock_search):
        """Test collect_context skips empty queries."""
        client = TavilyClient("test-api-key")
        queries = ["valid query", "", "another valid query"]
        
        result = client.collect_context(queries)
        
        assert len(result) == 2  # Empty query should be skipped
        assert "valid query" in result
        assert "another valid query" in result
        assert "" not in result
        assert mock_search.call_count == 2
    
    @patch.object(TavilyClient, 'search')
    def test_collect_context_search_failure(self, mock_search):
        """Test collect_context handles search failures gracefully."""
        mock_search.side_effect = [MOCK_TAVILY_RESPONSE, TavilyAPIError("API Error")]
        
        client = TavilyClient("test-api-key")
        queries = ["query1", "query2"]
        
        result = client.collect_context(queries)
        
        assert len(result) == 2
        assert len(result["query1"]) > 0  # First query succeeded
        assert len(result["query2"]) == 0  # Second query failed but didn't crash
    
    def test_format_context_as_markdown(self):
        """Test formatting context as markdown."""
        context = {
            "query1": [
                {
                    "title": "Article 1",
                    "url": "https://example.com/1",
                    "content": "Content 1"
                }
            ],
            "query2": []
        }
        
        client = TavilyClient("test-api-key")
        markdown = client.format_context_as_markdown(context)
        
        assert "### Query: query1" in markdown
        assert "### Query: query2" in markdown
        assert "Article 1" in markdown
        assert "https://example.com/1" in markdown
        assert "No results found" in markdown
    
    def test_get_total_results_count(self):
        """Test getting total results count."""
        context = {
            "query1": [{"title": "1", "url": "url1", "content": "content1"}],
            "query2": [
                {"title": "2", "url": "url2", "content": "content2"},
                {"title": "3", "url": "url3", "content": "content3"}
            ],
            "query3": []
        }
        
        client = TavilyClient("test-api-key")
        count = client.get_total_results_count(context)
        
        assert count == 3
    
    def test_filter_results_by_keywords(self):
        """Test filtering results by keywords."""
        context = {
            "query1": [
                {
                    "title": "Security Vulnerability Found",
                    "url": "https://example.com/1",
                    "content": "A critical security issue was discovered"
                },
                {
                    "title": "Weather Update",
                    "url": "https://example.com/2", 
                    "content": "Today will be sunny"
                }
            ]
        }
        
        client = TavilyClient("test-api-key")
        filtered = client.filter_results_by_keywords(context, ["security", "vulnerability"])
        
        assert len(filtered["query1"]) == 1
        assert "Security Vulnerability" in filtered["query1"][0]["title"]
    
    def test_filter_results_case_sensitive(self):
        """Test case-sensitive keyword filtering."""
        context = {
            "query1": [
                {
                    "title": "SECURITY Alert",
                    "url": "https://example.com/1",
                    "content": "Critical issue"
                }
            ]
        }
        
        client = TavilyClient("test-api-key")
        
        # Case-insensitive (default)
        filtered_insensitive = client.filter_results_by_keywords(context, ["security"])
        assert len(filtered_insensitive["query1"]) == 1
        
        # Case-sensitive
        filtered_sensitive = client.filter_results_by_keywords(
            context, ["security"], case_sensitive=True
        )
        assert len(filtered_sensitive["query1"]) == 0  # "security" != "SECURITY"