# Design Document

## Overview

This design implements GitHub Actions workflows that leverage Gemini CLI to provide AI-powered automation for code review, issue triage, and general development assistance. The system follows a modular architecture with a main dispatcher workflow that routes requests to specialized workflows based on triggers and commands.

## Architecture

The system consists of four main GitHub Actions workflows:

1. **Dispatcher Workflow** (`gemini-dispatch.yml`) - Main entry point that routes requests
2. **Review Workflow** (`gemini-review.yml`) - Handles pull request code reviews
3. **Triage Workflow** (`gemini-triage.yml`) - Manages issue triage and categorization
4. **Invoke Workflow** (`gemini-invoke.yml`) - Handles general AI assistance requests

### Workflow Interaction Flow

```mermaid
graph TD
    A[GitHub Event] --> B[Dispatcher Workflow]
    B --> C{Event Type}
    C -->|PR opened| D[Review Workflow]
    C -->|Issue opened| E[Triage Workflow]
    C -->|@gemini-cli comment| F{Command Parser}
    F -->|/review| D
    F -->|/triage| E
    F -->|general| G[Invoke Workflow]
    D --> H[Post Review Comments]
    E --> I[Add Issue Labels/Comments]
    G --> J[Respond to Request]
```

## Components and Interfaces

### 1. Dispatcher Component

- **Purpose**: Route incoming GitHub events to appropriate workflows
- **Triggers**:
  - Pull request events (opened)
  - Issue events (opened, reopened)
  - Comments containing `@gemini-cli`
- **Security**: Only processes requests from repository owners, members, and collaborators
- **Command Parsing**: Extracts commands and additional context from comments

### 2. Review Component

- **Purpose**: Perform AI-powered code reviews on pull requests
- **Features**:
  - Comprehensive code analysis using Gemini CLI
  - Security vulnerability detection
  - Performance optimization suggestions
  - Code quality and maintainability feedback
- **Integration**: Uses GitHub MCP server for PR interaction
- **Output**: Structured review comments with severity levels

### 3. Triage Component

- **Purpose**: Automatically categorize and prioritize issues
- **Features**:
  - Issue classification and labeling
  - Priority assessment
  - Duplicate detection
  - Assignment suggestions
- **Output**: Issue labels, comments, and metadata updates

### 4. Invoke Component

- **Purpose**: Handle general AI assistance requests
- **Features**:
  - Custom prompt processing
  - Context-aware responses
  - Multi-turn conversations
- **Flexibility**: Supports arbitrary AI assistance tasks

## Data Models

### Workflow Configuration

```yaml
# Environment Variables
GEMINI_API_KEY: string # Gemini API authentication
GOOGLE_API_KEY: string # Google API authentication (alternative)
GITHUB_TOKEN: string # GitHub API access
GCP_PROJECT_ID: string # Google Cloud Project ID
GCP_LOCATION: string # Google Cloud region
SERVICE_ACCOUNT_EMAIL: string # GCP service account
GCP_WIF_PROVIDER: string # Workload Identity Federation

# Repository Variables
APP_ID: string # GitHub App ID (optional)
GEMINI_CLI_VERSION: string # Specific Gemini CLI version
GOOGLE_GENAI_USE_VERTEXAI: bool # Use Vertex AI instead of direct API
GOOGLE_GENAI_USE_GCA: bool # Use Gemini Code Assist
DEBUG: bool # Enable debug logging
```

### Review Comment Structure

```typescript
interface ReviewComment {
  severity: '🔴' | '🟠' | '🟡' | '🟢'; // Critical, High, Medium, Low
  line_number: number;
  file_path: string;
  comment_text: string;
  code_suggestion?: string;
}
```

### Command Structure

```typescript
interface GeminiCommand {
  command: 'review' | 'triage' | 'invoke' | 'fallthrough';
  additional_context?: string;
  issue_number: number;
  repository: string;
}
```

## Error Handling

### Authentication Errors

- Fallback from GitHub App token to GITHUB_TOKEN
- Clear error messages for missing credentials
- Graceful degradation when optional services unavailable

### API Rate Limiting

- Implement exponential backoff for API calls
- Queue management for multiple concurrent requests
- Timeout handling (7-minute workflow timeout)

### Workflow Failures

- Fallthrough job handles all failure scenarios
- User notification with links to detailed logs
- Prevents silent failures

### Security Constraints

- Input validation for all external data
- Sandboxed execution environment
- No exposure of sensitive configuration in logs

## Testing Strategy

### Unit Testing

- Mock GitHub API responses
- Test command parsing logic
- Validate security constraints
- Test error handling scenarios

### Integration Testing

- End-to-end workflow testing in test repository
- GitHub App permission validation
- API integration testing with rate limiting
- Multi-workflow coordination testing

### Security Testing

- Input sanitization validation
- Permission boundary testing
- Secret exposure prevention
- Fork security validation

### Performance Testing

- Workflow execution time optimization
- Concurrent request handling
- Resource usage monitoring
- Timeout scenario testing

## Configuration Management

### Repository Setup Requirements

1. **Secrets Configuration**:
   - `GEMINI_API_KEY` or `GOOGLE_API_KEY`
   - `APP_PRIVATE_KEY` (if using GitHub App)

2. **Variables Configuration**:
   - `GCP_PROJECT_ID`, `GCP_LOCATION`, `SERVICE_ACCOUNT_EMAIL`
   - `GEMINI_CLI_VERSION`, feature flags

3. **Permissions Setup**:
   - Workflow permissions for contents, issues, pull-requests
   - GitHub App permissions (if applicable)

### Customization Options

- Configurable Gemini CLI prompts
- Adjustable severity thresholds
- Custom MCP server configurations
- Project-specific analysis rules

## Deployment Considerations

### Prerequisites

- Google Cloud Project with Gemini API enabled
- GitHub repository with Actions enabled
- Appropriate API quotas and billing setup

### Rollout Strategy

1. Deploy to test repository first
2. Validate core functionality with sample PRs/issues
3. Gradually enable additional features
4. Monitor performance and adjust configurations

### Monitoring and Observability

- GitHub Actions workflow logs
- API usage tracking
- Error rate monitoring
- User feedback collection
