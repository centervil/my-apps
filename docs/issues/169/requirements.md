# Requirements - Issue 169: AGENTS.mdとの乖離を監査するリポジトリ全体監査機能の実装

`collect-audit-context.ts` を拡張し、引数なしで実行された場合にリポジトリ全体を対象とした `AGENTS.md` への準拠性監査（理想と現実の乖離チェック）を行う機能を実装する。

## User Stories
- 開発者として、リポジトリ全体が `AGENTS.md` で定義された規約（ディレクトリ構造、言語方針、セキュリティ等）に従っているかを確認したい。
- AIアシスタントとして、リポジトリ全体のコンテキストを把握し、規約違反を特定してリファクタリング案を提示したい。

## Acceptance Criteria
1. **引数なし実行のサポート**:
   - `collect-audit-context.ts` が引数なしで実行された場合、エラーにならず「リポジトリ全体監査モード」で動作すること。
2. **ディレクトリ構造の監査**:
   - `AGENTS.md` の「8. Project Architecture & Map」に定義された理想の構造（`apps/agents/`, `apps/web-bots/` 等）と現状の乖離をリストアップすること。
3. **Non-negotiables の監査**:
   - `development_logs/` 内のファイルが日本語で記述されているかチェックすること。
   - `.env` や秘密情報が誤ってコミットされていないか（基本的なチェック）。
   - `src/` 配下のソースコードに対して、対応するテストファイルが存在するかチェックすること。
4. **知見ドキュメントの整合性監査**:
   - `docs/issues/[ID]/` 配下の構成が `AGENTS.md` の規定（`requirements.md`, `design.md`, `tasks.md`）通りかチェックすること。
5. **監査レポートの出力**:
   - 監査結果を標準出力に構造化されたMarkdown形式で出力すること。
