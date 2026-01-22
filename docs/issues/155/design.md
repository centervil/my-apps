# Design: ブラウザバイナリパスの環境変数化

## Architecture

本変更は、アプリケーションの実行環境への依存を疎結合にするためのリファクタリングです。
主要な変更点は、`SpotifyUploader` クラスおよびテストランナーにおけるブラウザパス解決ロジックの簡素化です。

### 現状の課題
- `src/features/spotifyUploader.ts` および `tests/e2e/cli.spec.ts` に `/ms-playwright` という DevContainer 特有のパスがハードコードされている。
- これにより、Playwrightの標準インストールパスを使用する環境（ローカルMac/Windows、GitHub Actionsの標準ランナーなど）で実行する際に、パスが見つからずエラーになるか、環境変数の手動設定が必須となっている。

### 変更方針
Playwright はデフォルトで適切なブラウザパス解決ロジックを持っています。
ハードコードされたパス設定ロジックを削除し、Playwright に解決を委譲します。
特定のパスを強制したい場合（DevContainerなど）は、コードではなく **環境変数 (`PLAYWRIGHT_BROWSERS_PATH`)** を通じて制御します。

## Implementation Details

### 1. `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts`
以下のロジックを削除します。

```typescript
  // Set browsers path if it exists but is not set in env
  const expectedBrowsersPath = '/ms-playwright';
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(expectedBrowsersPath)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = expectedBrowsersPath;
  }
```

### 2. `apps/ui-automations/spotify-automation/tests/e2e/cli.spec.ts`
`runCli` 関数内で `PLAYWRIGHT_BROWSERS_PATH` を強制的にセットしている箇所を修正します。

```typescript
    const childProcess = spawn(command, fullArgs, {
      env: {
        ...process.env,
        ...envConfig,
        ...env,
        LANG: 'en_US.UTF-8',
        // PLAYWRIGHT_BROWSERS_PATH: '/ms-playwright', // <-- 削除または条件付きに変更
      },
```

環境変数が既にセットされている場合はそれを優先し、ハードコードは行わないようにします。

### 3. 環境設定 (DevContainer)
DevContainer 環境で `/ms-playwright` を引き続き使用するため、`.devcontainer/devcontainer.json` または `.devcontainer/.env` (もしあれば) で環境変数を明示的に設定することを推奨します。
ただし、現状の DevContainer 環境でも `PLAYWRIGHT_BROWSERS_PATH` が環境変数として既に定義されているか、あるいは `devcontainer.json` の `containerEnv` で設定されていればコード側の変更だけで済みます。
もし設定されていない場合は、`devcontainer.json` に以下を追加します。

```json
"containerEnv": {
  "PLAYWRIGHT_BROWSERS_PATH": "/ms-playwright"
}
```

## Test Strategy

### Unit Tests
- `spotifyUploader.ts` の変更はロジックの削除のみであるため、既存のユニットテストが通過することを確認します。

### E2E Tests
以下のシナリオでE2Eテストを実行し、ブラウザが正常に起動することを確認します。

1.  **DevContainer環境 (現状)**:
    - `PLAYWRIGHT_BROWSERS_PATH` が適切に設定されている（またはPlaywrightが解決できる）状態でテストがパスすること。
2.  **標準環境 (シミュレーション)**:
    - 環境変数 `PLAYWRIGHT_BROWSERS_PATH` を unset した状態で、Playwright が標準インストールされたブラウザを認識できるか確認する（※ローカル環境依存のため、CIでの確認が主となる）。

### Regression Testing
- 既存のアップロード機能（DryRun含む）が動作すること。
