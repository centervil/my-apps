# タスクリスト (tasks.md)

- [ ] `apps/ui-automations/spotify-automation`ディレクトリに`project.json`ファイルを作成する。
- [ ] `project.json`に`test`ターゲットを定義し、`@nx/playwright:playwright`エクゼキュータを設定する。
- [ ] `project.json`に`lint`ターゲットを定義し、`@nx/linter:eslint`エクゼキュータを設定する。
- [ ] `apps/ui-automations/spotify-automation/package.json`を読み込み、現在のスクリプトを確認する。
- [ ] `apps/ui-automations/spotify-automation/package.json`から`test`および`lint`スクリプトを削除する。
- [ ] `.github/workflows/ci.yml`を読み込み、CIがNxの`affected`コマンドを使用していることを確認する。
- [ ] ローカルで`nx test spotify-automation`コマンドを実行し、テストが成功することを確認する。
- [ ] ローカルで`nx lint spotify-automation`コマンドを実行し、リンティングが成功することを確認する。
- [ ] 変更をコミットし、プルリクエストを作成する。
- [ ] CIが正常に完了することを確認する。
