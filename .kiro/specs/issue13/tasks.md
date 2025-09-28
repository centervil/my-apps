# タスクリスト: エピソード詳細（タイトル・説明）の入力

## 1. 準備

- [x] `feat/13-episode-details-input` の名称でフィーチャーブランチを作成する。

## 2. Page Objectの修正 (`NewEpisodePage.ts`)

- [x] `NewEpisodePage.ts`にタイトル入力用のロケーターを追加する。
- [x] `NewEpisodePage.ts`に説明入力用の`frameLocator`およびテキストエリアのロケーターを追加する。
- [x] `NewEpisodePage.ts`に`fillEpisodeDetails({ title: string; description: string })` メソッドを実装する。
- [x] `NewEpisodePage.ts`に`assertEpisodeDetails({ title: string; description: string })` メソッドを実装する。

## 3. テストの実装

- [x] `apps/ui-automations/spotify-automation/tests/` 内の適切なテストファイルに、新しいテストケースを追加する。
- [x] テスト内で `NewEpisodePage` を利用して、タイトルと説明が入力できることをテストする。
- [x] `assertEpisodeDetails` を使用して、入力された値が正しいことをアサーションする。

## 4. リファクタリングとレビュー

- [ ] コードとテストの可読性や効率性を向上させるためのリファクタリングを行う。
- [ ] `main`ブランチへのマージを目的としたPull Requestを作成し、レビューを依頼する。
