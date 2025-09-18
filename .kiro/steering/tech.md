# Technology Stack

## Build System & Package Management

- **Monorepo Manager**: Nx workspace with TypeScript support
- **Package Manager**: pnpm (primary), Poetry (Python apps)
- **Node.js**: ES modules (`"type": "module"`)

## Languages & Frameworks

### TypeScript/JavaScript
- **Runtime**: Node.js with ES modules
- **Testing**: Playwright Test for UI automation
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier

### Python
- **Version**: Python 3.9+
- **Dependency Management**: Poetry
- **Testing**: pytest with coverage, mock, and asyncio support
- **Code Quality**: black, isort, flake8, mypy
- **AI/ML**: LangChain, LangGraph, Google Gemini

## Key Libraries & Tools

### UI Automation
- **Playwright**: Browser automation framework
- **Page Object Model**: Structured test organization

### AI & Data Processing
- **LangChain/LangGraph**: AI workflow orchestration
- **Google Gemini**: Content generation
- **Tavily**: News search API
- **Marp**: Presentation generation

## Common Commands

### Development
```bash
# Install dependencies
pnpm install
poetry install  # For Python apps

# Run linting and formatting
pnpm lint
pnpm format

# Build projects
npx nx build <project-name>

# Run tests
npx nx test <project-name>
playwright test  # For UI automation
poetry run pytest  # For Python apps
```

### Nx Workspace
```bash
# View project graph
npx nx graph

# Run any task
npx nx <target> <project-name>

# Sync TypeScript references
npx nx sync
```

### Python Apps (Security News Agent)
```bash
# Run the agent
poetry run python -m security_news_agent

# Run with options
poetry run python -m security_news_agent --topic "Custom Topic" --format pdf

# Run tests with coverage
make test-coverage
```

## CI/CD

- **Platform**: GitHub Actions
- **Security**: CodeQL, Dependabot, Secret Scanning
- **Quality Gates**: Linting, testing, coverage reports