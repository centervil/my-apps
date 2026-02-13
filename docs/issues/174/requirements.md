# Requirements

## Overview
現在の `audit` コマンドは、特定のスクリプトパスやプロジェクト構造に強く依存しており、汎用性に欠ける。また、E2Eテストの実行ロジックがCLI定義ファイル(`audit.toml`)に含まれている。
これを改善するため、CLI定義をシンプルにし、ロジックをリポジトリ固有のスクリプト(`.ops/scripts/audit.ts`)と、汎用的な判断を行うSkill(`skill-auditor`)に分離する。

## Goals
1.  **汎用化**: `audit` コマンド定義 (`audit.toml`) から固有の実装詳細（スクリプトパスなど）を排除し、Skillへの委譲のみにする。
2.  **責務の分離**:
    *   **Skill (`skill-auditor`)**: ユーザーの意図解釈、スクリプト実行指示、結果分析、報告。
    *   **Ops Script (`.ops/scripts/audit.ts`)**: 実際の情報収集、ディレクトリ構造チェック、テスト実行（プロジェクト固有の実装）。
3.  **機能維持**: 既存の `audit` コマンドが持っていた機能（ファイル読み込み、ディレクトリ構造チェック、E2Eテスト実行）を完全に維持する。

## Non-Goals
*   監査内容自体の大幅な変更（今回はリファクタリングと構造変更が主）。
*   他の言語（Pythonなど）の監査ロジックの追加（今回は既存TSスクリプトの移行）。

## User Stories
*   **As a developer**, I want to run `gemini audit` to get a comprehensive analysis of the repository's health based on defined standards.
*   **As a developer**, I want to run `gemini audit <project-name>` to analyze a specific project and run its E2E tests automatically.
*   **As an ops engineer**, I want to modify audit logic in `.ops/scripts/audit.ts` without changing the CLI command definition or skill logic.

## Functional Requirements
1.  **Command Execution**: `gemini audit [args]` should trigger `skill-auditor`.
2.  **Skill Logic**: `skill-auditor` should:
    *   Detect if arguments (project name) are provided.
    *   Execute `.ops/scripts/audit.ts` with appropriate arguments.
    *   Read the output (stdout/stderr).
    *   Analyze the output for errors, violations, and test failures.
    *   Provide a summary and actionable recommendations.
3.  **Script Logic (`.ops/scripts/audit.ts`)**:
    *   **No args**: Run repository-wide checks (AGENTS.md compliance, directory structure).
    *   **With args**:
        *   Locate the project.
        *   Collect context (README, package.json, file tree, issues).
        *   **Execute Tests**: Run `pnpm --filter <project> test`.
        *   Output all results to stdout/stderr.

## Technical Constraints
*   The script must be executable (`chmod +x`).
*   The script uses `zx` and `typescript` (via `tsx`).
