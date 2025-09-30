# Troubleshooting Guide

This guide covers common issues and their solutions when using the Security News Agent.

## Table of Contents

- [Configuration Issues](#configuration-issues)
- [API-Related Problems](#api-related-problems)
- [Installation Problems](#installation-problems)
- [Runtime Errors](#runtime-errors)
- [Output Issues](#output-issues)
- [Performance Problems](#performance-problems)
- [Testing Issues](#testing-issues)

## Configuration Issues

### Missing API Keys

**Problem**: `ConfigurationError: Missing required environment variables`

**Solution**:

1. Ensure all required API keys are set:

   ```bash
   export GOOGLE_API_KEY="your-google-api-key"
   export LANGCHAIN_API_KEY="your-langchain-api-key"
   export TAVILY_API_KEY="your-tavily-api-key"
   ```

2. Or create a `.env` file:

   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

3. Validate configuration:
   ```bash
   poetry run python -m security_news_agent --validate-only
   ```

### Invalid Configuration Values

**Problem**: `ConfigurationError: Invalid SLIDE_FORMAT 'invalid'`

**Solution**: Use valid format values:

- `pdf` - PDF output
- `png` - PNG images
- `html` - HTML presentation
- `` (empty) - Markdown only

### Environment Variable Not Loading

**Problem**: Configuration seems correct but still getting errors

**Solution**:

1. Check if `.env` file is in the correct directory:

   ```bash
   ls -la .env  # Should be in apps/security-news-agent/
   ```

2. Verify file format (no spaces around `=`):

   ```bash
   GOOGLE_API_KEY=your-key-here
   # NOT: GOOGLE_API_KEY = your-key-here
   ```

3. Use absolute path for custom config file:
   ```bash
   poetry run python -m security_news_agent --config-file /path/to/.env
   ```

## API-Related Problems

### Rate Limiting

**Problem**: `TavilyError: Tavily API rate limit exceeded`

**Solution**:

1. Use test mode to reduce API calls:

   ```bash
   poetry run python -m security_news_agent --test-mode
   ```

2. Wait before retrying (rate limits usually reset hourly)

3. Check your API quota in the respective dashboards

### API Authentication Errors

**Problem**: `TavilyAPIError: Invalid API key` or similar

**Solution**:

1. Verify API keys are correct and active
2. Check if keys have necessary permissions
3. Test individual APIs:
   ```bash
   python scripts/test_with_real_apis.py --type quick
   ```

### Network Timeouts

**Problem**: `TavilyNetworkError: Request timeout`

**Solution**:

1. Check internet connection
2. Try again later (may be temporary API issues)
3. Increase timeout in test mode:
   ```python
   # In code: TavilyClient(api_key, timeout=120)
   ```

### Google Gemini Errors

**Problem**: `APIError: Google API error`

**Solution**:

1. Verify Google API key is for Gemini API
2. Check if Gemini API is enabled in Google Cloud Console
3. Ensure you have sufficient quota
4. Try a different model:
   ```bash
   export GEMINI_MODEL_NAME="gemini-1.5-pro"
   ```

## Installation Problems

### Poetry Not Found

**Problem**: `Command 'poetry' not found`

**Solution**:

1. Install Poetry:

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Add to PATH:

   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   ```

3. Or use pip instead:
   ```bash
   pip install -r requirements.txt  # If available
   ```

### Python Version Issues

**Problem**: `Python 3.9+ required`

**Solution**:

1. Check Python version:

   ```bash
   python --version
   ```

2. Install Python 3.9+ using pyenv:

   ```bash
   pyenv install 3.11.0
   pyenv local 3.11.0
   ```

3. Or use system package manager:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3.11
   ```

### Dependency Installation Failures

**Problem**: `poetry install` fails

**Solution**:

1. Clear Poetry cache:

   ```bash
   poetry cache clear pypi --all
   ```

2. Update Poetry:

   ```bash
   poetry self update
   ```

3. Try with verbose output:
   ```bash
   poetry install -vvv
   ```

## Runtime Errors

### Workflow Execution Failures

**Problem**: `ProcessingError: Workflow execution failed`

**Solution**:

1. Enable debug logging:

   ```bash
   poetry run python -m security_news_agent --log-level DEBUG
   ```

2. Check individual components:

   ```bash
   poetry run python -m security_news_agent --validate-only
   ```

3. Use test mode for debugging:
   ```bash
   poetry run python -m security_news_agent --test-mode --log-level DEBUG
   ```

### Memory Issues

**Problem**: `MemoryError` or system becomes unresponsive

**Solution**:

1. Reduce content size by using test mode
2. Close other applications
3. Increase system swap space
4. Use a machine with more RAM

### Import Errors

**Problem**: `ModuleNotFoundError: No module named 'security_news_agent'`

**Solution**:

1. Ensure you're in the correct directory:

   ```bash
   cd apps/security-news-agent
   ```

2. Activate Poetry environment:

   ```bash
   poetry shell
   python -m security_news_agent
   ```

3. Or use Poetry run:
   ```bash
   poetry run python -m security_news_agent
   ```

## Output Issues

### No Output Generated

**Problem**: Agent runs but no files are created

**Solution**:

1. Check permissions on output directory:

   ```bash
   ls -la slides/
   chmod 755 slides/
   ```

2. Verify workflow completed successfully:

   ```bash
   poetry run python -m security_news_agent --log-level INFO
   ```

3. Check for errors in logs

### Marp Rendering Fails

**Problem**: `MarpNotFoundError: Marp CLI not found`

**Solution**:

1. Install Marp CLI:

   ```bash
   npm install -g @marp-team/marp-cli
   ```

2. Or use Markdown-only output:

   ```bash
   poetry run python -m security_news_agent --format md
   ```

3. Verify Marp installation:
   ```bash
   marp --version
   ```

### PDF Generation Issues

**Problem**: PDF files are corrupted or empty

**Solution**:

1. Update Marp CLI:

   ```bash
   npm update -g @marp-team/marp-cli
   ```

2. Try different format:

   ```bash
   poetry run python -m security_news_agent --format html
   ```

3. Check Markdown content validity:
   ```bash
   # Look for syntax errors in generated .md files
   ```

### File Permission Errors

**Problem**: `PermissionError: [Errno 13] Permission denied`

**Solution**:

1. Check directory permissions:

   ```bash
   chmod 755 slides/
   ```

2. Run with appropriate user permissions
3. Change output directory:
   ```bash
   poetry run python -m security_news_agent --output-dir ~/reports
   ```

## Performance Problems

### Slow Execution

**Problem**: Agent takes very long to complete

**Solution**:

1. Use test mode for faster execution:

   ```bash
   poetry run python -m security_news_agent --test-mode
   ```

2. Check network connectivity
3. Monitor API response times
4. Reduce search query complexity

### High Memory Usage

**Problem**: System runs out of memory

**Solution**:

1. Use test mode to reduce content size
2. Close other applications
3. Monitor memory usage:
   ```bash
   top -p $(pgrep -f security_news_agent)
   ```

### API Quota Exhaustion

**Problem**: Hitting API limits frequently

**Solution**:

1. Use test mode for development
2. Implement caching (future enhancement)
3. Reduce execution frequency
4. Upgrade API plans if needed

## Testing Issues

### Unit Tests Failing

**Problem**: `pytest` tests fail

**Solution**:

1. Install test dependencies:

   ```bash
   poetry install --with dev
   ```

2. Run specific test files:

   ```bash
   poetry run pytest tests/unit/test_config.py -v
   ```

3. Check for missing fixtures or mocks

### Integration Tests Failing

**Problem**: Integration tests fail with mock errors

**Solution**:

1. Update mock data in `tests/fixtures/mock_data.py`
2. Check mock configurations in `conftest.py`
3. Run with verbose output:
   ```bash
   poetry run pytest tests/integration/ -v -s
   ```

### API Tests Failing

**Problem**: Real API tests fail

**Solution**:

1. Ensure API keys are set for testing
2. Check API quotas and limits
3. Run minimal tests only:
   ```bash
   python scripts/test_with_real_apis.py --type quick
   ```

## Getting Help

### Enable Debug Logging

For any issue, start with debug logging:

```bash
poetry run python -m security_news_agent \
  --log-level DEBUG \
  --log-file debug.log \
  --test-mode
```

### Collect System Information

```bash
# Python version
python --version

# Poetry version
poetry --version

# System information
uname -a

# Available memory
free -h

# Disk space
df -h
```

### Check Component Status

```bash
# Validate configuration
poetry run python -m security_news_agent --validate-only

# Test individual APIs
python scripts/test_with_real_apis.py --check-keys

# Run unit tests
poetry run pytest tests/unit/ -v
```

### Create Issue Report

When reporting issues, include:

1. **Error message** (full traceback)
2. **Command used** (with sensitive info removed)
3. **Environment details** (OS, Python version, etc.)
4. **Log output** (with `--log-level DEBUG`)
5. **Steps to reproduce**

### Common Log Patterns

- `ConfigurationError`: Check environment variables
- `TavilyError`: API key or network issues
- `ProcessingError`: Workflow or content generation issues
- `OutputError`: File system or rendering issues
- `APIError`: External service problems

### Emergency Debugging

If the agent is completely broken:

1. **Reset environment**:

   ```bash
   rm -rf .venv/
   poetry install
   ```

2. **Use minimal configuration**:

   ```bash
   poetry run python -m security_news_agent \
     --test-mode \
     --format md \
     --log-level DEBUG
   ```

3. **Check individual components**:
   ```bash
   poetry run python -c "from security_news_agent.config.settings import AgentConfig; print('Config OK')"
   ```

If you're still experiencing issues after trying these solutions, please create an issue on GitHub with the detailed information mentioned above.
