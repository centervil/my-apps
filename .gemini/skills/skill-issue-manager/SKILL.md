# Skill: GitHub Issue Manager

GitHub上へのIssue登録を、プロジェクトの統一基準（ラベル、テンプレート）に則って自動化します。

## Description
ユーザーからバグ報告や機能要望があった際、適切なテンプレートを選択し、統一されたラベルを付与して `gh issue create` を実行します。

## Usage Guidelines

1. **タイプ判別**:
   ユーザーの入力から以下のいずれかに分類します：
   - `bug` (不具合)
   - `feature` / `enhancement` (機能追加・改善)
   - `question` (質問・相談)
   - `reflect` (ナレッジ反映)

2. **テンプレートの取得**:
   `.gemini/skills/skill-issue-manager/scripts/get-issue-template.sh [タイプ]` を実行して、Issue本文の雛形を取得してください。

3. **ラベルの選定**:
   `.gemini/skills/skill-issue-manager/references/label-guidelines.md` を参照し、最も適切なラベルを決定してください。

4. **Issueの作成**:
   以下のコマンドを使用してIssueを作成します：
   ```bash
   gh issue create --title "[タイトル]" --body "[テンプレートを埋めた本文]" --label "[選定したラベル]"
   ```

## 注意事項
- **タイトル**: 簡潔かつ具体的なタイトルを付けてください。
- **本文**: 取得したテンプレートの項目（`### Description` など）を埋める形で作成してください。ユーザーの情報が不足している場合は、推測せず空欄にするか、ユーザーに確認してください。
- **既存Issueの確認**: `gh issue list` を使用して、似た内容のIssueが既に存在しないか確認することを推奨します。
