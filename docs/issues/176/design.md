# Design: サブエージェント作成Skillの導入と自己改善ループの組み込み

## 目的
外部知見（Qiita 記事）に基づき、エージェントの自律性と拡張性を高める「サブエージェント作成 Skill」を導入し、さらに「自己改善ループ」を標準装備した Skill 生成プロセスを確立する。

## 実装方針

### 1. サブエージェント作成 Skill (`subagent-creator`) の導入
- Qiita記事のプロンプトを本プロジェクトの構成（`.gemini/skills/` 以下）に合わせて移植する。
- 以下のファイル構成とする：
  - `.gemini/skills/subagent-creator/SKILL.md`
  - `.gemini/skills/subagent-creator/references/examples.md`
  - `.gemini/skills/subagent-creator/references/advanced_topics.md`
  - `.gemini/skills/subagent-creator/references/known_issues.md`

### 2. 自己改善ループの組み込み (Skill 生成の高度化)
- 既存の `skill-project-and-skill-architect` (または新規の `skill-developer`) の指示を更新し、新しい Skill を作成する際に以下の要素を自動的に含めるようにする：
  - `references/known_issues.md` の自動生成。
  - `SKILL.md` のワークフロー開始時に `known_issues.md` を読み込み、過去の知見を確認する指示の追加。

## 成功基準
- `subagent-creator` Skill が正常に動作し、新しいダミーの Skill を生成できること。
- 生成された Skill に、自己改善のための「過去の失敗確認プロセス」がプロンプトとして含まれていること。
- `known_issues.md` が新規 Skill 作成時に自動セットアップされること。
