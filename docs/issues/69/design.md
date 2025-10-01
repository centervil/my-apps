# 設計書: Spotifyアップロードロジックのリファクタリング

## 1. はじめに
このドキュメントは、Spotifyへのエピソードアップロードロジックをリファクタリングするための技術的な設計を定義します。目的は、現在のテストコードからビジネスロジックを分離し、より堅牢で保守性の高いアーキテクチャを構築することです。

## 2. 現状のアーキテクチャ
- 主要なアップロードロジックは、Playwrightのテストファイル `apps/ui-automations/spotify-automation/tests/newEpisode.spec.ts` 内に直接記述されています。
- ビジネスロジック（UI操作の手順）とテストのアサーションが混在しており、ロジックの再利用が困難です。

## 3. 新しいアーキテクチャ

### 3.1. 方針
- ビジネスプロセスをカプセル化する「フィーチャー」または「サービス」レイヤーを導入します。
- UIとのインタラクションは、既存のPage Object Model (POM) パターンを引き続き活用し、フィーチャーレイヤーから呼び出します。

### 3.2. コンポーネント設計
1.  **`spotifyUploader.ts` (フィーチャーモジュール)**
    - **場所**: `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts`
    - **責務**: Spotifyへのエピソードアップロードに関する一連のビジネスロジックを管理します。
    - **インターフェース**:
        ```typescript
        import { Page } from '@playwright/test';

        // エピソード詳細のデータ構造を定義
        export interface EpisodeDetails {
          title: string;
          description: string;
          audioFilePath: string;
          // その他の必要なメタデータ
        }

        /**
         * 指定されたエピソード情報をSpotifyにアップロードします。
         * @param page - PlaywrightのPageオブジェクト
         * @param details - アップロードするエピソードの詳細
         */
        export async function uploadEpisode(page: Page, details: EpisodeDetails): Promise<void> {
          // ... ログイン、ページ遷移、フォーム入力、ファイルアップロードのロジック ...
        }
        ```

2.  **Page Objects (POM)**
    - **場所**: `apps/ui-automations/spotify-automation/src/pages/`
    - **責務**: 特定のページにおけるUI要素のロケーターと、それらを操作するための低レベルなメソッドを提供します。
    - `spotifyUploader.ts`は、これらのPage Objectを利用してUIを操作します。例えば、`LoginPage.login()`、`UploadPage.fillEpisodeDetails()`、`UploadPage.submit()`のようなメソッドを呼び出します。

3.  **`newEpisode.spec.ts` (テストファイル)**
    - **場所**: `apps/ui-automations/spotify-automation/tests/newEpisode.spec.ts`
    - **責務**: E2Eテストの実行とアサーションに専念します。
    - **実装**:
        ```typescript
        import { test, expect } from '@playwright/test';
        import { uploadEpisode, EpisodeDetails } from '../src/features/spotifyUploader';
        import { LoginPage } from '../src/pages/LoginPage'; // 必要に応じて

        test('should upload a new episode to Spotify', async ({ page }) => {
          // 1. 準備 (テストデータ)
          const episodeData: EpisodeDetails = {
            title: 'Test Episode Title',
            description: 'This is a test episode.',
            audioFilePath: 'path/to/test/audio.mp3',
          };

          // 2. 実行 (リファクタリングされた関数を呼び出す)
          await uploadEpisode(page, episodeData);

          // 3. 検証 (アップロード成功を確認するアサーション)
          await expect(page.locator('text=エピソードが公開されました')).toBeVisible();
        });
        ```

## 4. 実装手順
1.  `apps/ui-automations/spotify-automation/src/features/` ディレクトリを作成します。
2.  `spotifyUploader.ts` ファイルを作成し、`EpisodeDetails`インターフェースと`uploadEpisode`関数の骨格を定義します。
3.  `tests/newEpisode.spec.ts` からアップロードに関連するロジック（ログイン、フォーム入力、ファイル選択など）を`uploadEpisode`関数に移植します。
4.  移植したロジック内で、UI操作を抽象化するために既存または新規のPage Objectメソッドを呼び出すようにリファクタリングします。
5.  `tests/newEpisode.spec.ts` をリファクタリングし、`uploadEpisode`関数を呼び出すように変更します。テストファイルからは具体的なUI操作のコードを削除します。

## 5. テスト戦略
- リファクタリングの正当性は、既存のE2Eテストスイートを実行することで検証します。
- `pnpm test --project=spotify-automation` コマンドを実行し、すべてのテストがパスすることを確認します。
- 新しいテストケースの追加は不要ですが、テストがリファクタリング後の構造を正しく反映していることを確認します。
