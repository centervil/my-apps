# Design

## Architecture

```mermaid
graph TD
    CLI[gemini audit [args]] -->|Invoke| Skill[skill-auditor]
    Skill -->|Execute| Script[.ops/scripts/audit.ts]
    Script -->|Read| RepoFiles[Repository Files]
    Script -->|Run| E2ETests[E2E Tests (pnpm test)]
    Script -->|Output| Stdout[Log & Test Results]
    Stdout -->|Analyze| Skill
    Skill -->|Report| User[User Output / Issue Creation]
```

## Component Details

### 1. `.gemini/commands/audit.toml`
*   **Prompt**:
    ```toml
    prompt = """
    ユーザーはリポジトリまたはプロジェクトの監査を行いたいと考えています。
    `activate_skill` ツールを使って `skill-auditor` を有効化し、ユーザーの意図（引数 `{{args}}`）に従って監査を実行し、結果を分析・報告してください。
    """
    ```

### 2. `.gemini/skills/skill-auditor/SKILL.md`
*   **Description**: Analyzes repository health, compliance, and project status.
*   **Instructions**:
    1.  Check for `.ops/scripts/audit.ts`. If not found, report error.
    2.  Execute `.ops/scripts/audit.ts [args]`.
    3.  Capture output.
    4.  Analyze for:
        *   Directory structure violations (AGENTS.md).
        *   Missing tests.
        *   Missing documentation.
        *   E2E test failures.
    5.  Summarize findings and suggest next steps (e.g., "Create Issue for missing docs").

### 3. `.ops/scripts/audit.ts` (Refactored `collect-audit-context.ts`)
*   **Dependencies**: `zx`, `fs`, `path`.
*   **Logic**:
    *   **Repo Audit (No args)**:
        *   Check `AGENTS.md` compliance (directory structure, file conventions).
        *   Check for secret leaks.
    *   **Project Audit (With args)**:
        *   Find project directory.
        *   Dump `README.md`, `package.json`.
        *   List file tree.
        *   Fetch GitHub Issues.
        *   **NEW**: Execute `pnpm --filter <project> test`. Capture and print output.

## Implementation Steps
1.  Move `.gemini/scripts/collect-audit-context.ts` to `.ops/scripts/audit.ts`.
2.  Update `.ops/scripts/audit.ts` to include `pnpm test` execution logic.
3.  Create `.gemini/skills/skill-auditor/SKILL.md`.
4.  Update `.gemini/commands/audit.toml`.
5.  Verify execution.
