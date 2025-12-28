# Design - Issue #136: パイプライン管理用プライベートリポジトリの構築

## アーキテクチャ

### リポジトリ構成 (private-ops)
```text
private-ops/
├── configs/
│   ├── spotify/
│   │   ├── test-show.json
│   │   ├── main-show-1.json
│   │   └── main-show-2.json
│   └── notebooklm/
│       └── global-settings.json
├── .github/
│   └── workflows/
│       ├── spotify-ci.yml        # テスト用
│       └── spotify-publish.yml   # 本番用 (Dispatch引数で設定を切り替え)
└── README.md
```

### 連携メカニズム
1. **Trigger**: `my-apps` 側の CI 完了時、またはマニュアル操作により `repository_dispatch` を送信。
2. **Payload**: 送信時に `event_type` や `client_payload` にターゲットとなる設定（例: `show_config: main-show-1`）を含める。
3. **Execution**: `private-ops` 側のワークフローが起動し、指定された JSON を読み込んで `my-apps` の CLI ツールを叩く。

## 実装方針

### 1. 設定ファイルの設計
`configs/spotify/*.json` の基本構造：
```json
{
  "name": "My Awesome Podcast",
  "spotify_show_id": "YOUR_SHOW_ID",
  "base_url": "https://podcasters.spotify.com",
  "is_test": false
}
```

### 2. GitHub Actions (Orchestrator) の設計
- `my-apps` を `git clone` する。
- 認証情報 (`spotify-auth.json`) はセルフホストランナー上の特定ディレクトリ（コンテナ内一時パス）にあることを前提とする。
- CLI ツールの引数として設定ファイルの値を展開する。

### 3. セキュリティ設定
- `my-apps` の Secrets に、`private-ops` へのアクセス権限を持つ **Fine-grained Personal Access Token (PAT)** を登録する。

## テスト戦略
- **疎通テスト**: `repository_dispatch` で `private-ops` のダミージョブが起動するか。
- **設定読み込みテスト**: ワークフロー内で指定した JSON ファイルの値を `echo` して正しくパースできるか。
- **クローン確認**: ジョブ実行中に `my-apps` を最新状態で取得できるか。
