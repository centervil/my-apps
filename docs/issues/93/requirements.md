# 要件定義書 (requirements.md)

## 1. 概要

本ドキュメントは、Issue #93「feat(spotify-automation): Allow dynamic episode details via CLI arguments」の要件を定義する。
現在ハードコードされているエピソードのタイトルと説明を、コマンドライン引数を通じて動的に設定できるようにすることで、ツールの実用性を向上させることを目的とする。

## 2. ユーザーストーリー

**As a** 開発者,
**I want to** コマンドラインからエピソードのタイトルと説明を指定してSpotifyにアップロードしたい,
**So that** 毎回ソースコードを修正することなく、異なる内容のエピソードを効率的にアップロードできる。

## 3. 受け入れ基準 (Acceptance Criteria)

| # | 基準 | 確認方法 |
|---|---|---|
| AC-1 | `scripts/upload.ts` 実行時に `--title` 引数でエピソードのタイトルを指定できる。 | コマンドライン実行 |
| AC-2 | `scripts/upload.ts` 実行時に `--description` 引数でエピソードの説明を指定できる。 | コマンドライン実行 |
| AC-3 | 指定された `--title` と `--description` の内容が、Spotifyにアップロードされたエピソードに正しく反映されている。 | Spotify for PodcastersのUIで確認 |
| AC-4 | `--title` または `--description` のいずれかの引数が指定されなかった場合、スクリプトはエラーメッセージを出力して異常終了する。 | コマンドライン実行 |
| AC-5 | (任意) スクリプトのヘルプ情報に、`--title` と `--description` に関する説明が追加されている。 | コマンドラインでヘルプオプションを実行 |
