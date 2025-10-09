# 設計書: `/audit` コマンド

## 1. アーキテクチャ

本機能は、Gemini CLIのカスタムコマンド機能を利用して実装する。主要なコンポーネントは以下の通り。

1.  **Gemini CLI Command (`.gemini/commands/audit.toml`)**:
    - ユーザーが `/audit` コマンドを呼び出すためのエントリポイント。
    - 必須引数として `<project-name>` を受け取る。
    - 収集スクリプト `collect-audit-context.ts` を実行し、その出力をプロンプトに含めてAIに渡す。

2.  **情報収集スクリプト (`scripts/collect-audit-context.ts`)**:
    - Node.jsで実行されるTypeScriptスクリプト。
    - 引数で渡された `<project-name>` に基づき、対象プロジェクトの情報を収集する。
    - 収集した情報を整形し、標準出力へ出力する。

3.  **実行環境**:
    - `zx` ライブラリを利用して、シェルコマンド（`cat`, `ls`, `gh`）の実行と出力のハンドリングを簡素化する。

## 2. 実装方針

### 2.1. `.gemini/commands/audit.toml`

- `name`: `audit`
- `description`: "指定されたプロジェクトの監査情報を収集します。"
- `prompt`: AIへの指示を記述。収集した情報を分析の出発点としつつ、詳細なファイル読み込みを促す内容とする。
- `command`: `pnpm exec ts-node --transpile-only scripts/collect-audit-context.ts {{.project-name}}`
- `argument`:
    - `name`: `project-name`
    - `description`: "監査対象のプロジェクト名 (例: spotify-automation)"
    - `required`: `true`

### 2.2. `scripts/collect-audit-context.ts`

- **ライブラリ**: `zx` を使用してスクリプトを作成する。
- **引数処理**: `process.argv` を通じてプロジェクト名を取得する。
- **パス解決**:
    - プロジェクトのベースディレクトリは `apps/ui-automations` と `apps/cli-tools` などを想定するが、まずは `apps` ディレクトリ全体を探索する汎用的なロジックを実装する。
    - `fs.existsSync` を使って、複数の可能性のあるパス（例: `apps/ui-automations/${projectName}`, `apps/cli-tools/${projectName}`）をチェックし、最初に見つかったものを対象とする。見つからない場合はエラーを投げる。
- **情報収集ロジック**:
    1.  **README**: `cat ${projectPath}/README.md` を実行。ファイルが存在しない場合はその旨を出力する。
    2.  **プロジェクト定義ファイル**: `package.json`, `pyproject.toml` の順で存在を確認し、最初に見つかったファイルの内容を `cat` で出力する。
    3.  **ディレクトリ構造**: `ls -R ${projectPath}/src` と `ls -R ${projectPath}/scripts` を実行。存在しない場合はスキップする。
    4.  **GitHub Issues**: `gh issue list --repo ${owner}/${name}` で取得する。
- **出力形式**: 各セクションが明確に区別できるよう、Markdown形式で見出しを付けて標準出力する。

## 3. テスト戦略

- **ユニットテスト**: `collect-audit-context.ts` の各情報収集ロジックは、シェルコマンドの呼び出しが主であるため、ユニットテストは限定的。パス解決ロジックの純粋な部分はテスト可能。
- **結合テスト/E2Eテスト**:
    1.  テスト用のダミープロジェクトを `apps/tmp` などに配置する。
    2.  ダミープロジェクトには `README.md`, `package.json`, `src` ディレクトリなどを含める。
    3.  `/audit dummy-project` を実行し、期待される情報が標準出力に含まれているかを確認する。
    4.  ファイルが存在しない場合やプロジェクトが見つからない場合のエラーハンドリングもテストする。
