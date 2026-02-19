# my-apps: AI Agent Monorepo

このリポジトリは、複数の AI エージェント、ブラウザ自動化ツール、およびそれらを支える共有ライブラリを管理する Nx モノレポです。

## 🧠 Knowledge Layer (Source of Truth)

プロジェクトの意思決定と情報は、以下の階層で管理されます。

1.  **GitHub Issues (Source of Truth)**
    - プロジェクトのタスク管理、バグトラッキング、進捗管理の「正」です。
    - すべての開発作業は、GitHub Issue から始まります。
2.  **Universal Guidelines ([AGENTS.md](./AGENTS.md))**
    - エージェントの行動規範、禁止事項、および普遍的な開発フローを定義した「憲法」です。
3.  **Task Blueprints ([docs/issues/](./docs/issues/))**
    - 各 GitHub Issue に対応する詳細な設計情報、要件定義、タスク分解を格納します。
    - GitHub Issue の抽象的な内容を、このリポジトリでどう実装するかを具体化した図面です。

## 🗺️ Physical Map (Directory Structure)

```text
/ (root)
├── apps/               # 実行可能なアプリケーション・エージェント
│   ├── agents/         # 自律型 AI エージェント
│   ├── web-bots/       # Playwright 等を用いたブラウザ自動化
│   └── tools/          # 開発・運用を支援する CLI ツール
├── libs/               # 再利用可能なモジュール
│   ├── shared/         # 言語横断的なユーティリティ・AIプロンプト
│   ├── typescript/     # TypeScript 用の共有コンポーネント・Page Objects
│   └── python/         # Python 用のデータロジック・APIクライアント
├── docs/               # ドキュメント
│   └── issues/         # 各 Issue ごとの設計ドキュメント (Blueprints)
├── development_logs/   # 開発の経緯と意思決定の記録 (日本語)
└── .ops/               # 運用スクリプト (監査、開発開始支援など)
```

## 🛠️ Technology Stack

- **Core**: Nx (Monorepo Management)
- **Languages**: TypeScript (pnpm), Python (Poetry)
- **Automation**: Playwright
- **CI/CD**: GitHub Actions

## 🚀 Operational Protocols

憲法 ([AGENTS.md](./AGENTS.md)) で定義されたフローを実行するための具体的なコマンド群です。

### 1. 開発の開始
GitHub Issue を作成後、以下のスクリプトを実行して作業ブランチと設計ドキュメントの雛形を作成します。
```bash
./.ops/scripts/dev-start.sh [Issue_ID]
```

### 2. 依存関係の管理
- **TypeScript**: `pnpm install`
- **Python**: `poetry install`

### 3. タスクの実行 (Nx)
```bash
npx nx run [project-name]:[target]
# 例: npx nx test security-news-agent
```

### 4. 監査の実行
リポジトリの健全性を確認します。
```bash
./.ops/scripts/audit.ts
```
