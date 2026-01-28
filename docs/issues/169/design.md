# Design - Issue 169: AGENTS.mdとの乖離を監査するリポジトリ全体監査機能の実装

## Architecture
- **Tool**: `scripts/collect-audit-context.ts` (TypeScript / zx)
- **Scope**: Repository-wide audit based on `AGENTS.md`.

## Implementation Strategy
1. **Argument Parsing**:
   - `projectName` が存在しない場合、`auditRepository()` 関数を呼び出す。
2. **`auditRepository()` の詳細**:
   - **Step 1: Directory Structure Audit**:
     - `AGENTS.md` の記述をスキャンするか、ハードコードされた理想の構造リストと比較する。
     - `apps/`, `libs/`, `tools/` の直下を確認。
   - **Step 2: Non-negotiables Audit**:
     - `development_logs/*.md` を読み込み、日本語が含まれているか（マルチバイト文字の存在）を確認。
     - `git ls-files` で秘密情報っぽいファイル（`.env`, `*.pem`, `*.key`）が追跡されていないか確認。
     - `src/` と `test/` (または同等) の対応関係をチェック。
   - **Step 3: Issue Docs Audit**:
     - `docs/issues/` 配下の各ディレクトリを走査し、3つの必須ファイルが存在するか確認。
3. **Reporter**:
   - 監査結果を構造化されたMarkdownとして出力する。

## Test Strategy
- **Unit Tests**: `scripts/collect-audit-context.ts` 自体の主要なロジック（言語判定、構造チェック等）をテストする。
- **Integration Test**: ダミーのリポジトリ構造を作成し、監査スクリプトが正しく乖離を検出できるか確認する。
