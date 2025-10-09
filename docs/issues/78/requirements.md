# 要件定義書: `/audit` コマンド

## 1. 概要

モノリポジトリ内の特定プロジェクトの現状分析を効率化するため、対象プロジェクトの基本情報を収集し、AIエージェントによる監査を支援する新しいスラッシュコマンド `/audit <project-name>` を実装する。

## 2. ユーザーストーリー

- **As a** 開発者 (Developer),
- **I want to** `/audit <project-name>` のように対象プロジェクトを指定して、そのプロジェクトの文脈情報を一括で収集したい (specify a target project like `/audit <project-name>` to collect its contextual information in bulk),
- **So that** 収集した情報をAIに渡すだけで、迅速かつ正確に特定のプロジェクトの現状分析を依頼できる (I can quickly and accurately request an analysis of the project's current state from an AI simply by providing the collected information).

## 3. 受け入れ基準

- [ ] 新しいスラッシュコマンドとして `.gemini/commands/audit.toml` が作成されていること。
- [ ] `/audit` コマンドは、必須の引数として`<project-name>`（例: `spotify-automation`）を受け取ること。
- [ ] 新しい情報収集スクリプト `scripts/collect-audit-context.ts` は、受け取った`<project-name>`を基に、動的に対象パス（例: `apps/ui-automations/<project-name>`）を解決すること。
- [ ] スクリプトは、対象プロジェクトの以下の情報を収集し、標準出力に書き出すこと:
    - [ ] `README.md` の内容
    - [ ] `package.json` （または `pyproject.toml` など）の内容
    - [ ] `src` および `scripts` ディレクトリのファイルツリー構造
- [ ] `/audit` コマンドのプロンプトは、AIに対して以下の指示を含むこと:
  > 「提供されたスクリプトの出力結果を**分析の出発点**としてください。ただし、正確な判断を下すためには、**プロジェクト内の関連ファイルを直接読み込み、内容を深く理解する**必要があります。全ての情報を踏まえた上で、指定されたプロジェクトの現状、課題、そして次に取るべきアクションを特定してください。」
