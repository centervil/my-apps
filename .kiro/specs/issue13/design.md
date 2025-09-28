# 設計書: エピソード詳細（タイトル・説明）の入力

## 1. 概要

本機能は、PlaywrightとPage Object Model（POM）を用いて、Spotifyの「新しいエピソード」ページでエピソードのタイトルと説明を入力する操作を自動化する。

## 2. アーキテクチャ

既存の`spotify-automation`アプリケーションのPOM構造に従う。UI要素のロケーターとそれらを操作するメソッドは、`NewEpisodePage.ts`にカプセル化する。

## 3. コンポーネント設計

### 3.1. Page Object (`NewEpisodePage.ts`)

- **ファイルパス:** `apps/ui-automations/spotify-automation/src/pages/NewEpisodePage.ts`
- **責務:** エピソード詳細ページのUI要素のロケーターと、それらを操作するメソッドを管理する。
- **追加するプロパティ:**
    - `titleInput`: タイトル入力フィールドのロケーター。
    - `descriptionIframe`: 説明入力フィールドが含まれるiframeのロケーター。
    - `descriptionInput`: 説明入力フィールドのロケーター（iframe内）。
- **追加するメソッド:**
    - `fillEpisodeDetails(details: { title: string; description: string }): Promise<void>`:
        1. `titleInput`に指定されたタイトルを入力する。
        2. `descriptionIframe`を`frameLocator`で特定し、その中の`descriptionInput`に指定された説明を入力する。
    - `assertEpisodeDetails(details: { title: string; description: string }): Promise<void>`:
        1. `titleInput`の値が指定されたタイトルと一致することを検証する。
        2. `descriptionInput`のテキストが指定された説明と一致することを検証する。

## 4. テスト戦略

- **ファイルパス:** `apps/ui-automations/spotify-automation/tests/uploadEpisode.spec.ts` （または既存の関連テストファイル）
- **テストケース:** `エピソードの詳細（タイトルと説明）を正しく入力できる`
    1. **Arrange**: `NewEpisodePage`のインスタンスを作成し、テストデータ（タイトル、説明）を準備する。
    2. **Act**: `fillEpisodeDetails`メソッドを呼び出す。
    3. **Assert**: `assertEpisodeDetails`メソッドを呼び出して、入力内容が正しいことを検証する。

## 5. エラーハンドリング

- 指定されたロケーターが見つからない場合、Playwrightのデフォルトタイムアウト機構によりテストは自動的に失敗する。
- 入力操作やアサーションに失敗した場合も同様にテストが失敗する。
