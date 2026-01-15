# Design Document - Issue #130

## 1. アーキテクチャ概要
`spotify-automation` の `src/features/spotifyUploader.ts` にあるエラーハンドリングロジックを改修する。
スクリーンショットの保存パス決定ロジックを分離し、環境変数やデフォルト設定に基づいて動的にパスを生成するように変更する。

## 2. 実装方針

### 2.1 パス解決ロジック (`getScreenshotPath`)
スクリーンショットの保存先ディレクトリとファイル名を決定するヘルパー関数またはロジックを実装する。

**ロジックフロー:**
1.  保存先ディレクトリ (`dir`) の決定:
    *   環境変数 `SPOTIFY_AUTOMATION_OUTPUT_DIR` があればそれを使用。
    *   なければ、デフォルトとして `path.join(process.cwd(), 'dist', 'apps', 'ui-automations', 'spotify-automation', 'screenshots')` を使用（Nxの慣習に合わせる）。
    *   ※ `test-results` は Playwright Test Runner の管理下にあるため、CLI実行時の出力先としては `dist` 配下が適切と判断。
2.  ディレクトリの存在確認と作成:
    *   `fs.existsSync(dir)` で確認し、なければ `fs.mkdirSync(dir, { recursive: true })` で作成。
3.  ファイル名 (`filename`) の決定:
    *   `error-${timestamp}.png` 形式。
    *   timestamp は `new Date().toISOString().replace(/[:.]/g, '-')` 等でファイルシステムで使用可能な文字列にする。
4.  完全なパス (`fullPath`) の返却:
    *   `path.join(dir, filename)`

### 2.2 `runSpotifyUpload` の修正
`src/features/spotifyUploader.ts` 内の `try-catch` ブロックを修正する。

```typescript
try {
  // ... existing code ...
} catch (error) {
  // ... log error ...
  
  // 新しいパス解決ロジックを使用
  const screenshotPath = getScreenshotPath(); 
  
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.error(`📸 Screenshot saved to ${screenshotPath}`);
  
  throw error;
}
```

### 2.3 Nx設定の確認 (`project.json`)
`apps/ui-automations/spotify-automation/project.json` を確認し、`targets.upload` または `targets.e2e` の `outputs` に、新しいデフォルト保存先（`dist/...`）が含まれているか確認する。含まれていなければ追加を検討するが、`nx run-script` (pnpm run upload) で実行される場合、Nxの出力キャッシュの対象外となることが多い。今回は「CIでのアーティファクト収集の容易化」が主眼であるため、出力先を明確にすることが最優先。

## 3. テスト戦略

### 3.1 手動検証 / E2Eテスト
1.  **環境変数あり**: `SPOTIFY_AUTOMATION_OUTPUT_DIR=/tmp/test-screens ./scripts/upload.sh ...` でわざと失敗させ（認証エラーや不正なID指定など）、指定ディレクトリにファイルが生成されるか確認。
2.  **デフォルト**: 環境変数を指定せずに実行し、`dist/...` 配下に生成されるか確認。

### 3.2 ユニットテスト（可能であれば）
パス解決ロジックを別関数として切り出せば (`src/utils/paths.ts` 等)、その関数に対して環境変数のモックを用いたユニットテストが可能。
今回はリファクタリングも兼ねて、パス解決ロジックを `src/utils/paths.ts` に追加することを推奨。

## 4. 影響範囲
- `src/features/spotifyUploader.ts`
- `src/utils/paths.ts` (新規追加または既存修正)
