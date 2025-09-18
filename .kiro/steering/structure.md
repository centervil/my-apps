# Project Structure

## Monorepo Organization

This is an Nx-managed monorepo with clear separation of concerns:

```
/
├── apps/                    # Application projects
│   ├── security-news-agent/ # AI-powered security news aggregator
│   ├── ui-automations/      # Browser automation projects
│   └── cli-tools/           # Command-line utilities
├── libs/                    # Shared libraries (currently empty)
├── packages/                # Publishable packages
├── tools/                   # Custom Nx executors and tooling
├── development_logs/        # Development session logs (Japanese)
├── docs/                    # Documentation
└── .kiro/                   # Kiro AI assistant configuration
```

## Application Structure

### Security News Agent (`apps/security-news-agent/`)
```
src/security_news_agent/
├── config/          # Configuration management
├── search/          # Tavily API integration
├── processing/      # LangGraph workflows and nodes
├── output/          # Report rendering (Marp)
└── utils/           # Logging, error handling, helpers

tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
└── api/             # Real API tests
```

### UI Automations (`apps/ui-automations/`)
```
src/
├── pages/           # Page Object Model classes
└── components/      # Reusable UI components

tests/               # Playwright test specifications
```

## Configuration Files

### Root Level
- `nx.json` - Nx workspace configuration
- `package.json` - Node.js dependencies and scripts
- `pyproject.toml` - Python workspace configuration
- `tsconfig.base.json` - Base TypeScript configuration

### Code Quality
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier formatting rules
- `.gitignore` - Git ignore patterns

### CI/CD
- `.github/workflows/` - GitHub Actions workflows
- `.github/ISSUE_TEMPLATE/` - Issue templates

## Development Conventions

### File Naming
- **TypeScript**: PascalCase for classes, camelCase for files
- **Python**: snake_case for all files and functions
- **Tests**: `*.spec.ts` (Playwright), `test_*.py` (pytest)

### Directory Structure
- Each app is self-contained with its own dependencies
- Shared code goes in `libs/` (when needed)
- Documentation in `docs/` or app-specific README files
- Development logs in `development_logs/` (Japanese language)

### Project Configuration
- Each app has `project.json` for Nx configuration
- Python apps use `pyproject.toml` for Poetry
- TypeScript apps use local `tsconfig.json` extending base

## Development Workflow

### Issue-Driven Development
- All work tracked through GitHub Issues
- Branch naming: `[type]/[issue-number]-[description]`
- Specification documents in `.kiro/specs/[issue]/`

### Test Organization
- **Unit tests**: Fast, isolated component testing
- **Integration tests**: Multi-component interaction testing
- **API tests**: Real external service integration testing