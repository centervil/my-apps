# Design Document - Issue 151

## アーキテクチャ

`apps/ui-automations/spotify-automation/project.json` の設定変更のみを行う。
コードロジックの変更は伴わない。

## 変更対象コンポーネント

- **Project Config**: `apps/ui-automations/spotify-automation/project.json`

## 実装詳細

### project.json の修正

現状の `test` ターゲット設定:
```json
"test": {
  "executor": "nx:run-commands",
  "options": {
    "command": "pnpm --filter @my-apps/spotify-automation test > /dev/null 2>&1"
  }
}
```

修正後の `test` ターゲット設定:
```json
"test": {
  "executor": "nx:run-commands",
  "options": {
    "command": "pnpm --filter @my-apps/spotify-automation test"
  }
}
```
これにより、`pnpm` コマンドの出力がそのまま親プロセス（Nx）の標準出力/エラー出力に流れるようになり、終了コードも隠蔽されずに伝播する。

## エラーハンドリング

- 特になし。`nx:run-commands` は指定されたコマンドの終了コードをそのまま返すため、`pnpm` がエラーを返せば Nx もエラーとなる。

## テスト戦略

### 手動検証手順

1. **現状確認（修正前）**:
    - わざとテストを失敗させる（例: 存在しないファイルを import する、assert false を書くなど）。
    - `nx run spotify-automation:test` を実行。
    - 出力がなく、終了コードが 0（成功）または出力なしで何が起きたかわからない状態であることを確認（現状の課題再現）。
      - ※ 注: `> /dev/null 2>&1` でも終了コード自体は伝播するはずだが、もしシェル実行の挙動で成功扱いになっているならそれも確認。Issue記述によると「常に成功として扱われてしまう」とのこと。

2. **修正適用**:
    - `project.json` を修正。

3. **修正後確認**:
    - 再度 `nx run spotify-automation:test` を実行（失敗する状態のまま）。
    - コンソールにエラーログが表示されることを確認。
    - コマンドが失敗（終了コード非0）することを確認。

4. **正常系確認**:
    - テストを成功する状態に戻す。
    - `nx run spotify-automation:test` を実行。
    - 正常に成功し、ログが表示されることを確認。
