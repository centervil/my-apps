# Security News Agent

An AI-powered agent that automatically collects the latest cybersecurity news and generates comprehensive reports in presentation format. The agent uses LangGraph workflows, Google Gemini for content generation, and Tavily for news search.

## Features

- 🔍 **Automated News Collection**: Searches multiple trusted security news sources
- 🤖 **AI-Powered Analysis**: Uses Google Gemini to analyze and summarize findings
- 📊 **Professional Reports**: Generates Marp-compatible slide presentations
- 🔄 **Quality Assurance**: Built-in evaluation and retry logic for high-quality output
- 📈 **Multiple Formats**: Supports Markdown, PDF, PNG, and HTML output
- 🧪 **Comprehensive Testing**: Unit, integration, and real API tests
- 📝 **Structured Logging**: Detailed logging with multiple output formats
- ⚡ **Modular Architecture**: Clean, maintainable, and extensible codebase

## Quick Start

### Prerequisites

- Python 3.9 or higher
- Poetry for dependency management
- API keys for Google Gemini, LangChain, and Tavily
- Marp CLI (optional, for non-Markdown output formats)

### Installation

1. **Clone and navigate to the project:**

   ```bash
   cd apps/security-news-agent
   ```

2. **Install dependencies:**

   ```bash
   poetry install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see Configuration section)
   ```

4. **Validate configuration:**

   ```bash
   poetry run python -m security_news_agent --validate-only
   ```

5. **Run the agent:**
   ```bash
   poetry run python -m security_news_agent
   ```

## Configuration

### Required Environment Variables

| Variable            | Description                   | Required |
| ------------------- | ----------------------------- | -------- |
| `GOOGLE_API_KEY`    | Google Gemini API key         | ✅       |
| `LANGCHAIN_API_KEY` | LangChain API key for tracing | ✅       |
| `TAVILY_API_KEY`    | Tavily search API key         | ✅       |

### Optional Environment Variables

| Variable               | Default                           | Description                                                     |
| ---------------------- | --------------------------------- | --------------------------------------------------------------- |
| `GEMINI_MODEL_NAME`    | `gemini-1.5-flash-latest`         | Gemini model to use                                             |
| `SLIDE_FORMAT`         | `pdf`                             | Output format: `pdf`, `png`, `html`, or empty for Markdown only |
| `MARP_THEME`           | `default`                         | Marp theme for presentations                                    |
| `MARP_PAGINATE`        | `true`                            | Enable slide pagination                                         |
| `LANGCHAIN_TRACING_V2` | `true`                            | Enable LangChain tracing                                        |
| `LANGCHAIN_ENDPOINT`   | `https://api.smith.langchain.com` | LangChain tracing endpoint                                      |
| `LANGCHAIN_PROJECT`    | `security-news-agent`             | LangChain project name                                          |

### Getting API Keys

1. **Google Gemini API**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **LangChain API**: Sign up at [LangSmith](https://smith.langchain.com/)
3. **Tavily API**: Register at [Tavily](https://tavily.com/)

## Usage

### Basic Usage

```bash
# Generate daily security briefing
poetry run python -m security_news_agent

# Custom topic
poetry run python -m security_news_agent --topic "Weekly Security Review"

# Specify output directory and format
poetry run python -m security_news_agent --output-dir ./reports --format pdf
```

### Advanced Usage

```bash
# Test mode (limited API calls)
poetry run python -m security_news_agent --test-mode

# Debug mode with detailed logging
poetry run python -m security_news_agent --log-level DEBUG --log-file debug.log

# Validate configuration only
poetry run python -m security_news_agent --validate-only

# Clean up old files (keep 5 most recent)
poetry run python -m security_news_agent --cleanup 5
```

### Command Line Options

| Option                                   | Description                               |
| ---------------------------------------- | ----------------------------------------- |
| `--topic TEXT`                           | Topic for the security briefing           |
| `--output-dir PATH`                      | Output directory for reports              |
| `--format {pdf,png,html,md}`             | Output format                             |
| `--test-mode`                            | Use limited API calls for testing         |
| `--log-level {DEBUG,INFO,WARNING,ERROR}` | Logging verbosity                         |
| `--log-file PATH`                        | Log to file instead of console            |
| `--config-file PATH`                     | Path to .env configuration file           |
| `--validate-only`                        | Only validate configuration               |
| `--cleanup N`                            | Clean up old files, keeping N most recent |

## Development

### Project Structure

```
src/security_news_agent/
├── __init__.py              # Package initialization
├── __main__.py              # Main entry point
├── config/
│   ├── __init__.py
│   └── settings.py          # Configuration management
├── search/
│   ├── __init__.py
│   └── tavily_client.py     # Tavily API integration
├── processing/
│   ├── __init__.py
│   ├── workflow.py          # LangGraph workflow
│   ├── nodes.py             # Individual workflow nodes
│   └── state.py             # State management
├── output/
│   ├── __init__.py
│   └── renderer.py          # Report rendering
└── utils/
    ├── __init__.py
    ├── helpers.py           # Utility functions
    ├── logging_config.py    # Logging configuration
    └── error_handling.py    # Error handling utilities
```

### Running Tests

```bash
# Run all tests
make test

# Run specific test types
make test-unit           # Unit tests only
make test-integration    # Integration tests only
make test-coverage       # Tests with coverage report

# Run tests with real APIs (requires API keys)
python scripts/test_with_real_apis.py --type minimal
```

### Code Quality

```bash
# Format code
make format

# Run linting
make lint

# Run all quality checks
make test-coverage lint
```

### Using the Test Script

```bash
# Run comprehensive tests
python scripts/run_tests.py --all

# Run specific test types
python scripts/run_tests.py --unit
python scripts/run_tests.py --integration
python scripts/run_tests.py --coverage
```

## Output

The agent generates reports in the `slides/` directory:

- **Markdown files**: Always generated, Marp-compatible format
- **PDF/PNG/HTML**: Generated if Marp CLI is installed and format is specified
- **Logs**: Detailed execution logs (if `--log-file` is used)

### Sample Output Structure

```
slides/
├── 2025-01-27_Daily_Security_Briefing.md
├── 2025-01-27_Daily_Security_Briefing.pdf
└── ...
```

## Troubleshooting

See the [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues and solutions.

## Architecture

The agent uses a modular architecture with the following components:

1. **Configuration Module**: Manages environment variables and settings
2. **Search Module**: Handles Tavily API integration for news collection
3. **Processing Module**: LangGraph workflow for content generation and evaluation
4. **Output Module**: Marp rendering and file operations
5. **Utils Module**: Logging, error handling, and helper functions

### Workflow Steps

1. **News Collection**: Search multiple security news sources
2. **Outline Generation**: Create structured outline from collected news
3. **Table of Contents**: Generate presentation structure
4. **Slide Generation**: Create Marp-formatted slides
5. **Quality Evaluation**: Assess and potentially retry for quality
6. **Output Rendering**: Save Markdown and render to other formats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review existing GitHub issues
3. Create a new issue with detailed information
