# Design - Issue #127: refactor(spotify-automation): プロジェクト 監査に基づく品質向上と最適化

## 1. 目的
プロジェクト監査で指摘された課題を解決し、Spotifyオートメーションツールの信頼性、保守性、および実行速度を向上させます。

## 2. 実装方針

### 2.1. セレクタの堅牢化 (`NewEpisodePage.ts`)
- `data-testid` の有無を確認し、利用可能な場合は `page.getByTestId()` を使用する。
- `data-testid` がない場合、`getByRole` や `getByLabel` などのセマンティックなロケータを優先する。
- 変更対象:
    - `titleInput`: `#title-input` -> `getByLabel('Title')` または `getByTestId` (要確認)
    - `descriptionInput`: `[contenteditable="true"]` -> ロールベースまたはラベルベース
    - `publishNowOption`: `#publish-date-now` -> `getByRole('radio', { name: /publish now/i })`

### 2.2. 非決定的な待機の排除 (`NewEpisodePage.ts`)
- `await page.waitForTimeout(2000)` を削除。
- 代わりに `locator.waitFor({ state: 'visible' })` や `expect(locator).toBeVisible()` の自動リトライ機能を活用する。
- ファイルアップロード後の安定化待機は、特定の要素（タイトル入力欄など）が操作可能になることを待機するロジックに置き換える。

### 2.3. CLI環境の最適化
- `scripts/upload.sh`: `npx ts-node` を `npx tsx` に変更。
- `tsx` は `ts-node` よりも起動が高速であり、トランスパイル時間を短縮できる。

### 2.4. 認証セッションの堅牢化 (`authManager.ts`)
- `saveAuthState`:
    - `context.cookies()` に加え、`page.evaluate()` を使用して `localStorage` と `sessionStorage` を取得し、`AuthState` オブジェクトに保存する。
- `loadAuthState`:
    - `context.addCookies()` に加え、`page.evaluate()` を使用して `localStorage` と `sessionStorage` を復元する。
- 注意点: ストレージをセットする前に、対象のドメイン（spotify.com）に遷移している必要がある。

### 2.5. 未使用コードの削除
- `apps/ui-automations/spotify-automation/src/pages/EpisodesPage.ts` を削除。
- `git rm` を使用して追跡からも外す。

## 3. テスト戦略
- **単体テスト/統合テスト**: `AuthManager` の保存・復元ロジックが正しく動作することを、モックまたは実ブラウザで確認する。
- **E2Eテスト**: 既存の `spotify-upload.spec.ts` (または相当するテスト) を実行し、セレクタの変更や待機の削除によってテストが失敗しないことを確認する。
- **CLI検証**: `upload.sh` を実行し、エラーなく動作し、起動速度が改善されていることを確認する。

## 4. 懸念点・リスク
- SpotifyのUIは頻繁に変更されるため、新しいセレクタも将来的に無効になる可能性がある。
- `localStorage` の復元は、オリジンが一致していないとエラーになるため、適切なページ遷移のタイミングで実行する必要がある。
