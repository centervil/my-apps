# Design: CIワークフロー修正

## 1. 現状の問題分析
GitHub Actions のワークフロー `ci.yml` が実行されない問題が発生している。以下の2点が主な原因として疑われる。

1.  **pnpm バージョン指定**: `uses: pnpm/action-setup@v3` に対して `version: 10` が指定されている。
    - 現時点（2026年1月）において pnpm v10 が利用可能か、あるいは `action-setup` がこの指定形式をサポートしているか確認が必要。通常は `9` などの安定版を指定すべきである。
2.  **if 条件式の構文**: `if: ${{ secrets.SPOTIFY_AUTH_JSON_BASE64 != '' }}`
    - GitHub Actions の `if` 条件式内では `${{ }}` は不要であり、場合によっては構文エラーや予期しない評価を引き起こす原因となる。

## 2. 修正方針

### 2.1 pnpm バージョンの修正
`pnpm/action-setup` のバージョン指定を、現在のプロジェクトの `package.json` の `engines` フィールドや `packageManager` フィールドと整合させるか、安定版である `9` に変更する。
※ プロジェクトの `package.json` を確認し、推奨バージョンに合わせる。特になければ `9` とする。

### 2.2 if 条件式の簡素化
`if` 文の `${{ }}` を削除し、推奨される記法に変更する。

```yaml
# 変更前
if: ${{ secrets.SPOTIFY_AUTH_JSON_BASE64 != '' }}

# 変更後
if: secrets.SPOTIFY_AUTH_JSON_BASE64 != ''
```

## 3. 検証・テスト戦略

### 3.1 構文チェック
修正後の `ci.yml` に対して、ローカルで検証ツール（あれば）を使用するか、プッシュ後の GitHub Actions の挙動を確認する。

### 3.2 動作確認
本修正を含むブランチをプッシュし、GitHub Actions 上でワークフローがトリガーされることを確認する。
- ステータスが "Queued" -> "In Progress" になること。
- 各ステップ（Setup pnpm, Install dependencies 等）が実行されること。

## 4. 影響範囲
- CI プロセスのみ。アプリケーションコードへの影響はない。
