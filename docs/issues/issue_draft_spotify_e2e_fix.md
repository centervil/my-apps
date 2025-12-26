# Bug: Fix Spotify Automation E2E failure - "Select a file" button not found

## 概要 (Overview)
`spotify-automation` の E2E テスト (`tests/e2e/cli.spec.ts`) において、実際のアップロードプロセスをテストする `should attempt a real upload process` が失敗しています。これは、Spotifyへの自動アップロード機能が現在正常に動作していない可能性を示唆しています。

## 現象 (Symptoms)
`nx run spotify-automation:e2e` を実行すると、以下のエラーが発生し、要素が見つからずタイムアウトします。

```text
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: getByRole('button', { name: /select a file/i })
```

発生箇所: `apps/ui-automations/spotify-automation/src/pages/NewEpisodePage.ts` の `assertPageIsVisible` メソッド内。

## 原因 (Root Cause)
Spotify for Creators (旧 Spotify for Podcasters) のUI変更により、「Select a file」ボタンのロケータが現状の画面と一致しなくなっている可能性が高いです。
また、認証状態によっては正しいページ（エピソード作成ウィザード）に遷移できていない可能性も考えられます。

## 修正案 (Proposed Solution)
1.  **現状のUI確認**: Playwrightの `debug` モードやスクリーンショット、あるいは手動でのブラウザ操作を通じて、現在の「エピソード作成画面」のDOM構造を確認し、正しいロケータを特定する。
2.  **`NewEpisodePage.ts` の修正**: `selectFileButton` (および必要であれば他のロケータ) の定義を現在のUIに合わせて更新する。
3.  **待機処理の強化**: ページロードや要素の表示待ちが不安定な場合は、適切な `waitFor` ロジックを追加する。

## タスク (Tasks)
- [ ] `apps/ui-automations/spotify-automation/src/pages/NewEpisodePage.ts` の `selectFileButton` ロケータを修正する。
- [ ] `nx run spotify-automation:e2e` を実行し、全てのテストがパスすることを確認する。

## 関連ファイル
- `apps/ui-automations/spotify-automation/src/pages/NewEpisodePage.ts`
- `apps/ui-automations/spotify-automation/tests/e2e/cli.spec.ts`
