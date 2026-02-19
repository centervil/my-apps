# 開発ログ: README.md および AGENTS.md の役割整理と刷新

## セッション情報
- 日付: 2026-02-14
- 担当: Gemini CLI
- 目的: README.md と AGENTS.md の役割を整理し、GitHub Issues を Source of Truth とする運用を明文化する。

## 実施内容
1. README.md の刷新 (プロジェクトの地図、技術スタック、SSOT の定義) - 完了
2. AGENTS.md のリファクタリング (抽象的な憲法・フローへの特化、物理情報の README への委譲) - 完了

## 成果物
- [README.md](./README.md)
- [AGENTS.md](./AGENTS.md)

## 今後の課題
- 監査結果に基づき、理想のディレクトリ構造への再編 (apps/ 以下の整理等) を Issue として起票し、順次対応する。

## 決定事項
- プロジェクト管理の正 (Source of Truth) は GitHub Issues とする。
- `docs/issues/[ID]/` は、GitHub Issue を具体化した設計情報 (Blueprints) として扱う。
- `README.md` はリポジトリの物理的な構造と具体的な操作手順を記述する。
- `AGENTS.md` はエージェントの行動規範と抽象的な開発フローを記述する。
