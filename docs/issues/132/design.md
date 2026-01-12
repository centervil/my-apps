# Design - Issue 132

## Architecture

- **CLI Layer**: `src/cli.ts`
  - `yargs` を使用してコマンドライン引数をパースし、検証する。
  - パースされた引数は `SpotifyUploadOptions` オブジェクトに変換され、`spotifyUploader.ts` に渡される。
- **Shell Wrapper**: `scripts/upload.sh`
  - ユーザーフレンドリーなエントリポイントとして機能し、内部で `npx tsx src/cli.ts` を実行する。

## Implementation Policy

1.  **Strict Argument Definition**: `yargs` の `.option()` メソッドを使用して、型、エイリアス、説明、必須チェックを厳密に定義する。
2.  **Configuration Merging**: 設定ファイル（`--config`）と CLI 引数のマージロジックを整理し、CLI 引数が常に優先されるようにする。
3.  **Modern Execution**: `ts-node` への依存を排除し、より高速で ESM 親和性の高い `tsx` を全面的に採用する。
4.  **Documentation Sync**: コード内のオプション定義と `README.md` の説明を完全に一致させる。

## Test Strategy

- **E2E Tests**: `tests/e2e/cli.spec.ts` を使用して以下の項目を検証する。
  - エイリアス（`-s`, `-a` 等）が正しく認識されること。
  - `--help` の出力内容が正しいこと。
  - 必須引数が欠けている場合にエラーになること。
  - `--dryRun` モードで引数が正しく解釈され、実際のアップロードが行われないこと。
- **Manual Verification**: `scripts/upload.sh --help` を実行し、ユーザー視点での動作を確認する。
