"""Mock API clients for running the agent in test mode without real API keys."""

from typing import List, Dict, Any

# Mock data for Tavily search results
MOCK_TAVILY_SEARCH_RESULTS = [
    {
        "url": "https://mock-news.com/article1",
        "content": "Major vulnerability found in popular 'LogIt' library. All users are advised to update immediately. The vulnerability, dubbed 'LogLeak', allows for remote code execution.",
        "title": "Critical RCE Vulnerability 'LogLeak' Discovered in LogIt Library",
        "raw_content": "Full raw text of the article about LogLeak...",
        "score": 0.98,
    },
    {
        "url": "https://mock-security.net/breach-announcement",
        "content": "Massive data breach at 'CloudCorp' exposes millions of user records. The breach was discovered on Monday and is believed to have been carried out by the 'DataWraiths' hacking group.",
        "title": "CloudCorp Announces Major Data Breach, Millions of Records Exposed",
        "raw_content": "Full raw text of the CloudCorp breach announcement...",
        "score": 0.95,
    },
]

# Mock data for Gemini AI responses
MOCK_GEMINI_OUTLINE_RESPONSE = """
## Outline

1.  **Critical RCE Vulnerability 'LogLeak' in LogIt Library**
    *   Discovery and Impact
    *   Mitigation and Recommendations
2.  **Massive Data Breach at CloudCorp**
    *   Details of the Breach
    *   Attribution to 'DataWraiths'
"""

MOCK_GEMINI_SLIDES_RESPONSE = """
---
marp: true
theme: default
paginate: true
---

# Daily Cybersecurity Threat Briefing

---

## Critical RCE Vulnerability 'LogLeak' in LogIt Library

**A major vulnerability has been found in the popular 'LogIt' library.**

- **Vulnerability:** 'LogLeak'
- **Impact:** Remote Code Execution (RCE)
- **Action:** All users are advised to update to the latest version immediately.

---

## Massive Data Breach at CloudCorp

**CloudCorp has announced a significant data breach affecting millions of users.**

- **Details:** User records, including names and email addresses, were exposed.
- **Attribution:** The attack is believed to be the work of the 'DataWraiths' hacking group.
- **Status:** The breach was discovered on Monday and is currently under investigation.
"""


class MockTavilyClient:
    """A mock Tavily client that returns pre-defined search results."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def collect_context(self, queries: List[Dict[str, Any]], **kwargs) -> Dict[str, List[Dict[str, str]]]:
        """Mocks the context collection, returning a fixed list of results for the first query."""
        print(f"--- MOCK Tavily: Collecting context for {len(queries)} queries ---")
        first_query = queries[0].get("q", "mock_query")
        return {first_query: MOCK_TAVILY_SEARCH_RESULTS}

    def format_context_as_markdown(self, context: Dict[str, List[Dict[str, str]]]) -> str:
        """Mocks the markdown formatting."""
        print("--- MOCK Tavily: Formatting context as markdown ---")
        bullets = []
        for query, items in context.items():
            bullets.append(f"### Query: {query}")
            for item in items:
                bullets.append(f"- {item['title']} — {item['content']} [source]({item['url']})")
            bullets.append("")
        return "\n".join(bullets)

    def get_total_results_count(self, context: Dict[str, List[Dict[str, str]]]) -> int:
        """Mocks the result counting."""
        print("--- MOCK Tavily: Counting total results ---")
        return sum(len(results) for results in context.values())


class MockAIMessage:
    """A mock AI message object to simulate the response from a chat model."""
    def __init__(self, content: str):
        self.content = content

class MockChatGoogleGenerativeAI:
    """A mock Google Gemini client."""

    def __init__(self, model: str, convert_system_message_to_human: bool = False):
        # Model and other parameters are ignored in the mock client
        self.model = model

    def invoke(self, messages: List[Any]) -> MockAIMessage:
        """
        Mocks the AI model's `invoke` method.
        Returns a pre-defined outline or slide content based on the input prompt.
        Handles both string and message object inputs.
        """
        if isinstance(messages, str):
            prompt_content = messages.lower()
        else:
            prompt_content = messages[0].content.lower()

        print(f"--- MOCK Gemini: Invoking model '{self.model}' ---")

        if "outline" in prompt_content:
            return MockAIMessage(MOCK_GEMINI_OUTLINE_RESPONSE)
        elif "slide" in prompt_content:
            return MockAIMessage(MOCK_GEMINI_SLIDES_RESPONSE)
        else:
            return MockAIMessage("This is a generic mock AI response.")
