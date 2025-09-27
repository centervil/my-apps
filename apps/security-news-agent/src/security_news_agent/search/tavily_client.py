"""Tavily API client for security news search."""

from typing import Any, Dict, List, Optional, Union

import requests
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from ..utils.error_handling import APIError
from ..utils.logging_config import get_logger

logger = get_logger(__name__)


class TavilyError(APIError):
    """Base exception for Tavily API errors."""

    def __init__(self, message: str, **kwargs: Any) -> None:
        super().__init__(message, "Tavily", **kwargs)


class TavilyAPIError(TavilyError):
    """Raised when Tavily API returns an error response."""

    pass


class TavilyNetworkError(TavilyError):
    """Raised when network issues occur during API calls."""

    pass


class TavilyClient:
    """Client for interacting with the Tavily search API."""

    def __init__(self, api_key: str, timeout: int = 60):
        """Initialize the Tavily client.

        Args:
            api_key: Tavily API key
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.timeout = timeout
        self.endpoint = "https://api.tavily.com/search"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(
            (requests.RequestException, requests.Timeout)
        ),
    )
    def search(
        self,
        query: str,
        max_results: int = 8,
        include_domains: Optional[List[str]] = None,
        time_range: str = "day",
        search_depth: str = "advanced",
    ) -> Dict[str, Any]:
        """Perform a single search query using Tavily API.

        Args:
            query: Search query string
            max_results: Maximum number of results to return
            include_domains: List of domains to include in search
            time_range: Time range for search ("day", "week", "month", "year")
            search_depth: Search depth ("basic" or "advanced")

        Returns:
            Dictionary containing search results

        Raises:
            TavilyAPIError: If API returns an error
            TavilyNetworkError: If network issues occur
        """
        payload: Dict[str, Any] = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": search_depth,
            "include_answer": True,
            "max_results": max_results,
            "time_range": time_range,
        }

        if include_domains:
            payload["include_domains"] = include_domains

        logger.info(
            f"Searching Tavily for: '{query}' (max_results={max_results})"
        )

        try:
            response = requests.post(
                self.endpoint, json=payload, timeout=self.timeout
            )
            response.raise_for_status()

            data: Dict[str, Any] = response.json()

            # Check for API-level errors
            if "error" in data:
                raise TavilyAPIError(f"Tavily API error: {data['error']}")

            logger.info(
                f"Found {len(data.get('results', []))} results for query: '{query}'"
            )
            return data

        except requests.Timeout as e:
            logger.error(f"Timeout during Tavily search for query: '{query}'")
            raise TavilyNetworkError(f"Request timeout: {e}")
        except requests.RequestException as e:
            logger.error(
                f"Network error during Tavily search for query: '{query}': {e}"
            )
            raise TavilyNetworkError(f"Network error: {e}")
        except TavilyAPIError as e:
            # Re-raise specific API errors to be caught by the caller
            raise e
        except Exception as e:
            logger.error(
                f"Unexpected error during Tavily search for query: '{query}': {e}"
            )
            raise TavilyError(f"Unexpected error: {e}")

    def collect_context(
        self,
        queries: List[Union[str, Dict[str, Any]]],
        max_per_query: int = 6,
        default_time_range: str = "day",
    ) -> Dict[str, List[Dict[str, str]]]:
        """Collect search results from multiple queries with deduplication.

        Args:
            queries: List of query strings or query configuration dictionaries
            max_per_query: Maximum results per query
            default_time_range: Default time range if not specified in query config

        Returns:
            Dictionary mapping query strings to lists of search results

        Raises:
            TavilyError: If any search fails
        """
        seen_urls = set()
        results: Dict[str, List[Dict[str, str]]] = {}

        for query_config in queries:
            if isinstance(query_config, dict):
                query_text = query_config.get("q", "")
                include_domains = query_config.get("include_domains")
                time_range = query_config.get("time_range", default_time_range)
            else:
                query_text = query_config
                include_domains = None
                time_range = default_time_range

            if not query_text:
                logger.warning("Skipping empty query")
                continue

            try:
                data = self.search(
                    query=query_text,
                    max_results=max_per_query,
                    include_domains=include_domains,
                    time_range=time_range,
                )

                # Process and deduplicate results
                query_results = []
                for result in data.get("results", []):
                    url = result.get("url")
                    if not url or url in seen_urls:
                        continue

                    seen_urls.add(url)
                    query_results.append(
                        {
                            "title": (result.get("title") or "")[:160],
                            "url": url,
                            "content": (
                                (result.get("content") or "").replace(
                                    "\n", " "
                                )
                            )[:600],
                        }
                    )

                results[query_text] = query_results
                logger.info(
                    f"Collected {len(query_results)} unique results for: '{query_text}'"
                )

            except TavilyError as e:
                logger.error(f"Failed to search for query '{query_text}': {e}")
                # Continue with other queries instead of failing completely
                results[query_text] = []

        total_results = sum(
            len(results_list) for results_list in results.values()
        )
        logger.info(f"Total unique results collected: {total_results}")

        return results

    def format_context_as_markdown(
        self, context: Dict[str, List[Dict[str, str]]]
    ) -> str:
        """Format search context as markdown bullets.

        Args:
            context: Search results from collect_context()

        Returns:
            Formatted markdown string
        """
        bullets = []

        for query, items in context.items():
            bullets.append(f"### Query: {query}")

            if not items:
                bullets.append("- No results found")
            else:
                for item in items:
                    title = item["title"]
                    url = item["url"]
                    content = item["content"].replace("\n", " ")
                    bullets.append(f"- {title} — {content} [source]({url})")

            bullets.append("")  # Empty line between queries

        return "\n".join(bullets)

    def get_total_results_count(
        self, context: Dict[str, List[Dict[str, str]]]
    ) -> int:
        """Get total number of results across all queries.

        Args:
            context: Search results from collect_context()

        Returns:
            Total number of results
        """
        return sum(len(results) for results in context.values())

    def filter_results_by_keywords(
        self,
        context: Dict[str, List[Dict[str, str]]],
        keywords: List[str],
        case_sensitive: bool = False,
    ) -> Dict[str, List[Dict[str, str]]]:
        """Filter search results by keywords in title or content.

        Args:
            context: Search results from collect_context()
            keywords: List of keywords to filter by
            case_sensitive: Whether to perform case-sensitive matching

        Returns:
            Filtered search results
        """
        filtered_context = {}

        for query, results in context.items():
            filtered_results = []

            for result in results:
                title = result["title"]
                content = result["content"]

                if not case_sensitive:
                    title = title.lower()
                    content = content.lower()
                    keywords = [kw.lower() for kw in keywords]

                # Check if any keyword appears in title or content
                if any(
                    keyword in title or keyword in content
                    for keyword in keywords
                ):
                    filtered_results.append(result)

            filtered_context[query] = filtered_results

        return filtered_context
