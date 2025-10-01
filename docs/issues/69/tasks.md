# タスクリスト: Spotifyアップロードロジックのリファクタリング

## 1. 準備
- [x] `feat/69-refactor-spotify-automation-src` ブランチを作成する。
- [x] `docs/issues/69/` ディレクトリを作成し、仕様関連ドキュメント（`requirements.md`, `design.md`, `tasks.md`）を配置する。

## 2. ロジックの分離と実装
- [ ] `apps/ui-automations/spotify-automation/src/features/` ディレクトリを作成する。
- [ ] `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts` ファイルを作成する。
- [ ] `spotifyUploader.ts` 内に、アップロードするエピソードのデータ構造を定義する `EpisodeDetails` インターフェースを作成する。
- [ ] `tests/newEpisode.spec.ts` から、Spotifyへのログイン、エピソード詳細入力、音声ファイルアップロードまでの一連の処理を特定する。
- [ ] 特定したロジックを `spotifyUploader.ts` に移植し、`async function uploadEpisode(page: Page, details: EpisodeDetails)` として実装する。
- [ ] `uploadEpisode` 関数内で、UI操作がPage Object（例: `LoginPage`, `UploadPage`）を介して行われるようにリファクタリングする。

## 3. テストコードのリファクタリング
- [ ] `tests/newEpisode.spec.ts` を修正する。
- [ ] `import { uploadEpisode } from '../src/features/spotifyUploader';` のように、新しく作成した関数をインポートする。
- [ ] テストケース内から古いアップロードロジックを削除し、代わりに `await uploadEpisode(page, episodeData);` を呼び出すように変更する。

## 4. 検証とクリーンアップ
- [ ] `pnpm test --project=spotify-automation` を実行し、すべてのE2Eテストが成功することを確認する。
- [ ] コード全体をレビューし、責務が適切に分離され、プロジェクトのコーディング規約に従っていることを確認する。
- [ ] 不要になったコメントやコードを削除する。
