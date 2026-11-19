# 要件定義書: Issue #198 日次ルーチンの本番適用（Spotify & note 自動化）

## 1. 概要
日次ルーチンの本番運用において、Spotify 自動化 (#183) および note 下書き自動作成 (#184) を dev-container または実環境で確実に実行できるようにするための CLI、認証管理スクリプト、および本番実行手順を整備する。

## 2. ゴール・完了条件
- note 下書き作成が CLI 1コマンドで実行できる。
- dev-container 上で Spotify アップロードが CLI で実行できる（認証ファイルの初回作成手順を含む）。
- 両方の実行結果が JSON（`ExecutionResult` 形式）と終了コード（0=成功、2=認証切れ、3=一時失敗、1=その他）で判定できる。
- note 認証ファイルが無い場合やログイン画面にリダイレクトされた場合に `AUTH_EXPIRED` (終了コード 2) で終了する。
- `--dryRun` オプションにより、ブラウザを起動せずに検証と結果 JSON 出力を行える。

## 3. 要件詳細
### 3.1. note 下書き作成 CLI
- **エントリポイント**: `src/noteCli.ts`（ラッパーシェル `scripts/note.sh` を併設、package.json に `"note-draft"` スクリプトを追加）
- **引数**:
  - `--contentType` (`study` | `news`, 必須)
  - `--source` (元ファイルのパス, 必須)
  - `--seriesName` (任意)
  - `--dayNumber` (任意, 数値)
  - `--targetDate` (任意)
  - `--spotifyShowUrl` (必須)
  - `--previousNoteId` (任意)
  - `--dryRun` (ブール, デフォルト false)
  - `--headed` (ブール, デフォルト false, 任意)
- **認証管理**: 環境変数 `NOTE_AUTH_PATH`、未指定時は `credentials/note-auth.json`。認証ファイル未達またはログインページリダイレクト時は終了コード 2 (`AUTH_EXPIRED`)。
- **品質チェック**: `performQualityCheck` を用いて、本文 verbatim チェック、目次位置チェック、埋め込みプレイヤー変換チェックを実施。

### 3.2. note 初回認証スクリプト
- **スクリプト**: `scripts/saveNoteAuth.ts` + package.json スクリプト `"login:note"`。
- **動作**: headed ブラウザで note のログインページ (`https://note.com/login` 等) を開き、ユーザーがログインしてウィンドウを閉じたら認証状態を保存する。

### 3.3. ドキュメントと実機検証
- `apps/ui-automations/spotify-automation/README.md` に「本番実行手順」節を追加。
- Spotify アップロード CLI の実機テスト実施、note CLI のドライラン・認証エラー検知テストの実施。
