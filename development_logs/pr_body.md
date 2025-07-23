## 概要
Issue #1「環境設定を行う」の作業を完了しました。

主な変更点:
- ESLintとPrettierのセットアップと設定を行いました。
- 未使用のインポート文を削除しました。
- `package.json`に`type: module`と`lint`, `format`スクリプトを追加しました。
- `eslint.config.js`を新規作成し、`pnpm-lock.yaml`を更新しました。
- GitHub Issueテンプレートが正しく機能するように、`.github/ISSUE_TEMPLATE/config.yml`を追加しました。

## テスト方法
1. `pnpm install` を実行
2. `pnpm lint` を実行し、エラーがないことを確認
3. `pnpm format` を実行し、ファイルがフォーマットされることを確認

## 備考
本PRマージ後、GitHub上で以下の設定が正しく反映されているか、または追加設定が必要かをご確認ください。

- **GitHub Issue Templates**:
    1.  リポジトリの「Issues」タブに移動し、「New issue」ボタンをクリックしてください。
    2.  「Choose a template」セクションに「Feature or Task Request」テンプレートが表示され、選択できることを確認してください。
- **GitHub Actions (CI/CD)**:
    1.  このプルリクエストの「Checks」タブで、CIワークフローが正常に完了していることを確認してください。
    2.  本PRが`main`ブランチにマージされた後、リポジトリの「Actions」タブに移動し、`main`ブランチに対する最新のワークフロー実行が成功していることを確認してください。
- **GitHub CodeQL (SAST)**:
    1.  リポジトリの「Security」タブに移動し、「Code scanning alerts」をクリックしてください。
    2.  CodeQLによるコードスキャンが実行され、結果が表示されていることを確認してください。もしスキャンが実行されていない場合は、手動でトリガーするか、次回のプッシュを待つ必要があります。
- **GitHub Dependabot (Dependency Vulnerabilities)**:
    1.  リポジトリの「Security」タブに移動し、「Dependabot alerts」をクリックしてください。
    2.  依存関係の脆弱性アラートが正しく表示されていることを確認してください。
- **GitHub Secret Scanning**: 
    1.  リポジトリの「Settings」タブに移動し、左側のメニューから「Code security and analysis」をクリックしてください。
    2.  「Secret scanning」が「Enabled」になっていることを確認してください。