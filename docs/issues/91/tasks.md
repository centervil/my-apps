---
issue_number: 91
title: geminiスラッシュコマンドのauditコマンドを修正する
---

## タスクリスト

- [ ] `.gemini/commands/audit.toml` の内容を読み込み、現在の設定を分析する。
- [ ] `scripts/collect-audit-context.ts` の内容を読み込み、スクリプトの目的と出力を理解する。
- [ ] `audit.toml` を修正し、`run_shell_command` を使って `pnpm tsx scripts/collect-audit-context.ts` を実行するようにコマンドを更新する。
- [ ] `audit.toml` のプロンプトを修正し、前のステップの `{{stdout}}` を使って監査コンテキストを注入するように更新する。
- [ ] Gemini CLIで `/audit` コマンドを実際に実行し、スクリプトの実行と監査レポートの生成が正常に行われることを確認する。
- [ ] 変更内容をコミットし、プルリクエストを作成する。