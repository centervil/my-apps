# 設計書: feat(spotify-podcast-automation): 新しいエピソードの公開と確認

## 1. 概要

本ドキュメントは、Issue #14「feat(spotify-podcast-automation): 新しいエピソードの公開と確認」の技術的な設計を定義する。

## 2. アーキテクチャ

既存のPlaywrightとPage Object Model (POM) に基づくアーキテクチャを踏襲する。テストコード (`tests/`) とページオブジェクト (`src/pages/`) の分離を維持し、保守性と再利用性を確保する。

## 3. 実装方針

### 3.1. Page Objectの変更

#### `src/pages/NewEpisodePage.ts`

- **ロケーター**:
  - `publishButton`: エピソードを公開するためのボタンのロケーターを追加する。
- **メソッド**:
  - `publishEpisode(): Promise<void>`: `publishButton` をクリックし、公開プロセスを開始するメソッドを実装する。必要に応じて、公開後の遷移や待機処理もこのメソッドに含める。

#### `src/pages/EpisodesPage.ts` (または関連するエピソード一覧ページ)

- **ロケーター**:
  - `episodeListItem(title: string)`: 特定のタイトルのエピソードを一覧から特定するための動的なロケーターを追加する。
- **メソッド**:
  - `isEpisodeVisible(title: string): Promise<boolean>`: 指定されたタイトルのエピソードが一覧に表示されているかを確認するメソッドを実装する。

### 3.2. テストファイルの実装

#### `tests/spotify-podcast-automation.spec.ts`

- 新しいテストケース `should publish a new episode and verify it appears in the list` を追加する。
- テストのフロー:
  1.  ログイン処理を実行する。
  2.  「新しいエピソード」ページに遷移する。
  3.  `NewEpisodePage` を利用して、エピソードのタイトルや説明など、必須事項を入力する。
  4.  `NewEpisodePage.publishEpisode()` を呼び出し、エピソードを公開する。
  5.  エピソード一覧ページに遷移する。
  6.  `EpisodesPage.isEpisodeVisible(episodeTitle)` を使用して、公開したエピソードがリストに表示されていることをアサーションで確認する。

## 4. テスト戦略

Test-Driven Development (TDD) の「Red-Green-Refactor」サイクルに従う。

1.  **Red**: まず、上記3.2で定義したテストケースを実装する。この時点では、必要なページオブジェクトのメソッドが存在しないため、テストは失敗する。
2.  **Green**: 次に、3.1で定義したページオブジェクトのロケーターとメソッドを実装し、テストがパスするようにする。
3.  **Refactor**: 最後に、コードの可読性や保守性を向上させるためのリファクタリングを行う。テストがグリーンであり続けることを確認しながら進める。
