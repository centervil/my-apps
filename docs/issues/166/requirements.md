# Requirements: Project Configuration & Gemini CLI Optimization

## 1. Overview
本Issueでは、Gemini CLIの機能を最大限に活用し、かつプロジェクトのセキュリティと生産性を向上させるために、設定ファイル (`.gemini/settings.json`) および関連する構成を見直し、最適化を行う。
特に、参照された「エージェント型開発環境におけるGemini CLIの最適化」ガイドに基づき、Google推奨のベストプラクティスを適用する。

## 2. Goals
- **プロジェクト設定の共有化**: チーム全体で統一されたGemini CLIの挙動を実現するため、設定ファイルをGit管理下に置く。
- **コンテキストの最適化**: `AGENTS.md` などの既存ドキュメントを効果的に読み込ませ、エージェントの文脈理解度を向上させる。
- **UI/UXの向上**: 開発者の認知負荷を下げるためのUI設定（ステータス表示、バッファ制御など）を適用する。
- **セキュリティ強化**: 無許可の危険なコマンド実行を防ぐためのガードレール（ツール制限、YOLOモード無効化）を設ける。
- **トークン効率化**: 長時間のセッションでもコンテキスト溢れを防ぐ設定を導入する。

## 3. User Stories
- **As a Developer**, I want `.gemini/settings.json` to be tracked in Git, so that I share the same optimized environment with my team.
- **As a Developer**, I want Gemini CLI to automatically recognize `AGENTS.md` as the core context, so that the agent follows project rules without manual prompting.
- **As a Developer**, I want the terminal UI to clearly show when the agent is thinking or working, utilizing features like "Alternate Buffer" to keep my history clean.
- **As a Team Lead**, I want to disable "YOLO mode" (auto-execution) for critical operations by default, ensuring safety in CI and local environments.
- **As a Developer**, I want tool outputs to be summarized automatically if they are too long, saving token budget.

## 4. Acceptance Criteria
### 4.1 Configuration Management
- [ ] `.gitignore` is updated to allow tracking of `.gemini/settings.json` (while keeping other sensitive/temp files in `.gemini/` ignored).
- [ ] `.gemini/settings.json` is populated with the recommended configuration structure.

### 4.2 General & UI Settings
- [ ] `general.previewFeatures` is set to `true` (to enable advanced capabilities).
- [ ] `ui.useAlternateBuffer` and `ui.showStatusInTitle` are enabled.
- [ ] `ui.showMemoryUsage` is enabled.

### 4.3 Context & Model
- [ ] `contextFileName` is configured to point to `AGENTS.md` (or a composite configuration).
- [ ] `includeDirectories` is configured if shared libraries exist (currently seemingly monolithic or monorepo, check `libs/` or `packages/`).
- [ ] `model.summarizeToolOutput` is configured with appropriate token budgets.

### 4.4 Security
- [ ] `security.disableYoloMode` is set to `true` (or project equivalent).
- [ ] `allowedTools` is configured for harmless commands (`ls`, `grep`, `cat` etc.).

### 4.5 Documentation
- [ ] `README-GEMINI-CLI.md` (if exists) or `docs/gemini-cli-setup.md` is updated/created to explain the new settings.
