# 日次ポッドキャスト配信ランブック（実装メモ）

> **⚠️ 正本への参照**
> 日次ルーチンの全体手順・品質チェック・公開フローの正本は `centervil/my-life` リポジトリの `domains/habits/daily-podcast-runbook.md` に移管されました。
> 全体的な実行手順や品質基準については、必ず正本を参照してください。
> 
> 本ファイル（`docs/daily-podcast-runbook.md`）には、`centervil/my-apps` 側の実装（`spotify-automation` や関連スクリプト等）に紐づく実装依存のメモ・注意事項のみを記載しています。

---

## 1. `spotify-automation` の呼び出しと実行手順

`centervil/my-apps` 内の `apps/ui-automations/spotify-automation` を用いた Spotify アップロード自動化に関する実装メモです。

- **作業ディレクトリ**: `apps/ui-automations/spotify-automation`
- **前提セッション**: 
  - 事前に認証情報を保存しておく必要があります。
  - 認証ファイルの生成コマンド（初回または期限切れ時）：
    ```bash
    pnpm --filter @my-apps/spotify-automation run login
    # または
    pnpm --filter @my-apps/spotify-automation exec tsx scripts/saveAuth.ts
    ```
  - 保存先デフォルト: `~/.my-apps/credentials/spotify-auth.json`（環境変数 `SPOTIFY_AUTH_PATH` で変更可能）。
- **実行スクリプト・コマンド**:
  - シェルスクリプトまたは tsx による直接実行：
    ```bash
    ./scripts/upload.sh --showId "YOUR_SHOW_ID" --audioPath "./path/to/episode.mp3" --title "タイトル" --description "説明..." --season 1 --episode 10
    ```
  - 設定ファイル（JSON）を用いた実行：
    ```bash
    ./scripts/upload.sh --config "./config.json"
    ```
- **オプション一覧**:
  - `--showId, -s`: (必須) アップロード先のPodcast番組ID
  - `--title, -t`: (必須) エピソードのタイトル
  - `--description, -d`: (必須) エピソードの説明
  - `--audioPath, -a`: (必須) アップロードする音声ファイルのパス、またはディレクトリパス（ディレクトリ指定時は最も新しく更新されたファイルが対象）
  - `--season`: (オプション) エピソードのシーズン番号
  - `--episode`: (オプション) エピソードのエピソード番号
  - `--dryRun`: (オプション) ドライラン実行
  - `--config`: (オプション) JSON設定ファイルのパス

---

## 2. NotebookLM / note 操作に関する実装依存の注意点

- **NotebookLM**:
  - 音声化の音源生成時にフォーカス文やテンプレートを適用する際、二重貼り付けに注意する。
  - 学習系はノートブック内のソース・音源が1世代しか残らないため、生成前に前日音源のバックアップDL推奨。
  - ページ表示が固着する場合があるが、実体が完成していることが多いためリロードして音源の有無を確認する。
- **note 操作**:
  - ヘッダー画像は複製で引き継がれないため、前日記事と同じシリーズ画像をアップロードする。画像 URL は note API（`https://note.com/api/v3/notes/<前日記事ID>` の `eyecatch`）から取得可能。
  - Spotify 埋め込みプレイヤー化：番組の Spotify リンクを貼っただけではテキストリンクのままになるため、リンク末尾にカーソルを置いて Enter キーを押し、埋め込みプレイヤーに変換する。
  - 目次ブロックが本文と一緒に消えていないか、埋め込み直後にあるかを確認する。
  - 番号付き見出しが自動リスト化することがあるため、リスト書式を外してから見出し化し、番号はテキストとして保持する。

---

## 3. 運用・公開ルールに関する補足

- **公開ゲートの前提**: 日次ルーチンは公開前の承認を待たず、3つの品質チェック（本文の原文一致、目次ブロック、Spotify 埋め込みプレイヤー化）が通り次第即時公開し、公開後に URL と内容サマリを報告するフローに従う。
