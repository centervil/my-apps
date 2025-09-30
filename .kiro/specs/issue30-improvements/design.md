# Design Document

## Overview

This design document outlines the refactoring of the security news agent from a monolithic script into a well-structured, testable Python package. The design focuses on separation of concerns, comprehensive testing, and improved maintainability while preserving the existing LangGraph workflow functionality.

## Architecture

### Current State

- Single file (`__main__.py`) containing all functionality
- No separation of concerns
- No unit tests
- Difficult to test individual components

### Target State

```
src/security_news_agent/
├── __init__.py
├── __main__.py          # Entry point (minimal)
├── config/
│   ├── __init__.py
│   └── settings.py      # Configuration management
├── search/
│   ├── __init__.py
│   └── tavily_client.py # Tavily API integration
├── processing/
│   ├── __init__.py
│   ├── workflow.py      # LangGraph workflow
│   └── nodes.py         # Individual workflow nodes
├── output/
│   ├── __init__.py
│   └── renderer.py      # Marp rendering and file operations
└── utils/
    ├── __init__.py
    └── helpers.py       # Utility functions

tests/
├── __init__.py
├── conftest.py          # Pytest configuration and fixtures
├── unit/
│   ├── test_config.py
│   ├── test_search.py
│   ├── test_processing.py
│   └── test_output.py
├── integration/
│   └── test_workflow.py
└── fixtures/
    └── mock_data.py     # Mock API responses
```

## Components and Interfaces

### 1. Configuration Module (`config/settings.py`)

**Responsibility:** Centralized configuration management and validation

```python
@dataclass
class AgentConfig:
    google_api_key: str
    langchain_api_key: str
    tavily_api_key: str
    gemini_model_name: str = "gemini-1.5-flash-latest"
    slide_format: str = "pdf"
    marp_theme: str = "default"
    marp_paginate: bool = True

    @classmethod
    def from_env(cls) -> 'AgentConfig':
        # Load and validate environment variables

    def validate(self) -> None:
        # Validate configuration values
```

### 2. Search Module (`search/tavily_client.py`)

**Responsibility:** Tavily API integration and news collection

```python
class TavilyClient:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def search(self, query: str, **kwargs) -> Dict[str, Any]:
        # Single search operation

    def collect_context(self, queries: List[Union[str, Dict]], **kwargs) -> Dict[str, List[Dict]]:
        # Multiple search operations with deduplication
```

### 3. Processing Module (`processing/`)

**Responsibility:** LangGraph workflow and individual processing nodes

```python
# workflow.py
class SecurityNewsWorkflow:
    def __init__(self, config: AgentConfig, tavily_client: TavilyClient):
        self.config = config
        self.tavily_client = tavily_client
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        # Build LangGraph workflow

    def run(self, initial_state: State) -> Dict:
        # Execute workflow

# nodes.py
class WorkflowNodes:
    @staticmethod
    def collect_info(state: State, tavily_client: TavilyClient) -> Dict:
        # News collection node

    @staticmethod
    def make_outline(state: State, llm: ChatGoogleGenerativeAI) -> Dict:
        # Outline generation node

    # ... other nodes
```

### 4. Output Module (`output/renderer.py`)

**Responsibility:** Report rendering and file operations

```python
class ReportRenderer:
    def __init__(self, config: AgentConfig):
        self.config = config

    def render_markdown(self, content: str, title: str) -> str:
        # Process and format Markdown

    def save_report(self, content: str, output_path: Path) -> Path:
        # Save Markdown file

    def render_to_format(self, md_path: Path, format: str) -> Optional[Path]:
        # Render using Marp CLI
```

## Data Models

### State Management

The existing `State` TypedDict will be preserved but moved to a dedicated module for better organization:

```python
# processing/state.py
class State(TypedDict):
    topic: str
    outline: List[str]
    toc: List[str]
    slide_md: str
    score: float
    subscores: Dict[str, float]
    reasons: Dict[str, str]
    suggestions: List[str]
    risk_flags: List[str]
    passed: bool
    feedback: str
    title: str
    slide_path: str
    attempts: int
    error: str
    log: List[str]
    context_md: str
    sources: Dict[str, List[Dict[str, str]]]
```

## Error Handling

### Retry Logic

Implement exponential backoff for API calls:

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((requests.RequestException, json.JSONDecodeError))
)
def api_call_with_retry(self, *args, **kwargs):
    # API call implementation
```

### Error Categories

1. **Configuration Errors:** Missing API keys, invalid settings
2. **API Errors:** Rate limiting, network issues, invalid responses
3. **Processing Errors:** LLM failures, content generation issues
4. **Output Errors:** File system issues, Marp rendering failures

## Testing Strategy

### 1. Unit Tests

- **Mock External Dependencies:** Use `unittest.mock` for API calls
- **Test Individual Functions:** Each utility function and class method
- **Configuration Testing:** Validate environment variable handling
- **Error Scenarios:** Test error handling and edge cases

### 2. Integration Tests

- **Mock Data Pipeline:** Use realistic mock responses from Tavily and Gemini
- **End-to-End Workflow:** Test complete pipeline with mock data
- **File Operations:** Test report generation and saving

### 3. API Integration Tests

- **Controlled Testing:** Limited queries to minimize API usage
- **Real API Validation:** Verify actual API integration works
- **Rate Limit Handling:** Test API limit scenarios

### Test Data Management

```python
# tests/fixtures/mock_data.py
MOCK_TAVILY_RESPONSE = {
    "results": [
        {
            "title": "Critical Security Vulnerability Discovered",
            "url": "https://example.com/security-news",
            "content": "A critical vulnerability has been discovered..."
        }
    ]
}

MOCK_GEMINI_RESPONSE = "## Security Alert\n\nBased on the latest reports..."
```

### Test Configuration

```python
# tests/conftest.py
@pytest.fixture
def mock_config():
    return AgentConfig(
        google_api_key="test-key",
        langchain_api_key="test-key",
        tavily_api_key="test-key"
    )

@pytest.fixture
def mock_tavily_client():
    with patch('security_news_agent.search.tavily_client.TavilyClient') as mock:
        mock.return_value.search.return_value = MOCK_TAVILY_RESPONSE
        yield mock.return_value
```

## Performance Considerations

### Caching Strategy

- Cache Tavily search results for development/testing
- Implement request deduplication
- Add configurable cache TTL

### Resource Management

- Connection pooling for HTTP requests
- Memory-efficient processing of large responses
- Cleanup of temporary files

## Deployment and CI/CD Integration

### GitHub Actions Enhancements

1. **Test Stage:** Run all tests before deployment
2. **Dependency Caching:** Cache Poetry dependencies
3. **Artifact Management:** Store generated reports as artifacts
4. **Failure Notifications:** Alert on pipeline failures

### Environment Management

- Separate configurations for development, testing, and production
- Environment-specific API rate limits
- Configurable output formats per environment
