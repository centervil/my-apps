# 設計書: `spotify-automation` CLI E2Eテスト

## 1. 概要

`spotify-automation` CLIツールのE2Eテストを実装するための技術設計。Node.jsの`child_process`モジュールと、既存のテストフレームワークである`@playwright/test`を活用し、実際の外部API（Spotify, Google Drive）と連携するテストを構築する。

## 2. アーキテクチャ

- **テストフレームワーク**: `@playwright/test`
  - プロジェクトで既に採用されており、非同期処理やテストの並列実行に優れているため、CLIのテストランナーとしても活用する。
- **テストファイル配置**: `apps/ui-automations/spotify-automation/tests/e2e/cli.spec.ts`
  - UIテストと区別するため、`e2e`ディレクトリを新設してE2Eテストを格納する。
- **CLI実行**: `child_process`モジュール
  - `spawn`または`exec`を利用して、テストコードからCLIツールをサブプロセスとして実行する。これにより、`stdout`, `stderr`, `exitCode`を捕捉し、テストのアサーションに利用できる。
- **設定と認証**: `.env`ファイル
  - CLIツールは`dotenv`を利用して環境変数を読み込む。テストもこの仕組みに依存し、開発者のローカル`.env`ファイルに設定された実際の認証情報を利用する。認証失敗のテストでは、環境変数を上書きしてサブプロセスを実行する。

## 3. 実装方針

### 3.1. CLI実行ヘルパー

`cli.spec.ts`内に、CLIコマンドを実行するための非同期ヘルパー関数を作成する。

```typescript
// 例: CLI実行ヘルパー
import { spawn } from 'child_process';

const runCli = (args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> => {
  return new Promise((resolve) => {
    const command = 'pnpm';
    const defaultArgs = ['nx', 'cli', 'spotify-automation', '--'];
    const process = spawn(command, [...defaultArgs, ...args]);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => (stdout += data.toString()));
    process.stderr.on('data', (data) => (stderr += data.toString()));

    process.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });
  });
};
```

### 3.2. テストデータ

- **音声ファイル**: `apps/ui-automations/spotify-automation/tests/e2e/fixtures/`に、テスト用の小さな音声ファイル（例: `test-audio.mp3`）を配置する。
- **Google Drive**: テスト実行の前提条件として、開発者が特定のGoogle Driveフォルダ（テスト用）をセットアップする必要がある。この手順は`README.md`に明記する。

### 3.3. テストケースの実装

`@playwright/test`の`test`関数と`expect`を使用してアサーションを行う。

- **正常系**: `stdout`に成功メッセージが含まれ、`code`が`0`であることを検証する。
- **異常系**: `stderr`に適切なエラーメッセージが含まれ、`code`が`0`以外であることを検証する。

```typescript
// 例: テストケース
test('should fail if --showId is not provided', async () => {
  const { stderr, code } = await runCli([]);
  expect(code).not.toBe(0);
  expect(stderr).toContain('Missing required argument: --showId');
});
```

## 4. テスト戦略

- **TDD (Test-Driven Development)**: Issueで定義された各シナリオに対して、「失敗するテストを書く → テストをパスさせる（この場合はCLIの既存の振る舞いを確認する） → リファクタリングする」のサイクルで進める。
- **独立性**: 各テストは他のテストに依存せず、独立して実行可能であること。各テストの開始時にCLIプロセスを新規に起動することで状態の独立性を担保する。
- **ドキュメント**: `apps/ui-automations/spotify-automation/README.md`を更新し、以下の内容を追記する。
  - E2Eテストの概要
  - 実行に必要な環境設定（`.env`ファイルの作成と必須変数、Google Driveのフォルダ構成）
  - テストの実行コマンド

## 5. 考慮事項

- **実行時間**: 外部APIとの通信を含むため、テストの実行には時間がかかる可能性がある。タイムアウト設定に注意する。
- **APIレート制限**: 頻繁なテスト実行が外部サービスのレート制限に抵触しないよう注意する。
- **認証情報**: テストコードに認証情報をハードコードしない。`.env`ファイルと`.gitignore`を適切に利用し、機密情報がリポジトリにコミットされないように徹底する。
