# 要件定義書

## 1. 概要

現在の`spotify-automation`ツールのCLIは、コマンドが長く複雑で、シェルのエスケープ処理が煩雑なため、ユーザーにとって使いにくいという問題を抱えています。本要件では、ラッパースクリプトの導入と設定ファイルのサポートにより、CLIのユーザビリティを向上させることを目的とします。

## 2. ユーザーストーリー

- **As a** 開発者,
- **I want** to be able to run the `spotify-automation` tool with a simple command,
- **So that** I can avoid dealing with complex command structures and shell escaping.

- **As a** 開発者,
- **I want** to be able to configure the tool's parameters using a JSON file,
- **So that** I can easily manage and reuse different configurations without passing all arguments on the command line.

- **As a** 開発者,
- **I want** command-line arguments to override the settings in the configuration file,
- **So that** I can quickly make temporary adjustments to my configuration.

## 3. 受け入れ基準

- **AC1: ラッパースクリプトによる実行**
  - `spotify-automation`ツールを実行するためのシェルスクリプト（例: `upload.sh`）が提供されていること。
  - シェルスクリプトを使用して、コマンドライン引数を渡すことでツールが正常に実行できること。
  - 例: `./scripts/upload.sh --title "My Episode"`

- **AC2: 設定ファイルによる設定**
  - `--config`フラグを使用して、JSON形式の設定ファイルを指定できること。
  - 例: `./scripts/upload.sh --config /path/to/config.json`
  - 設定ファイルには、`showId`, `audioPath`, `title`, `description` などの主要な引数を含めることができること。

- **AC3: 引数の優先順位**
  - コマンドラインで指定された引数が、設定ファイル内の同じ引数よりも優先されること。
  - 例えば、設定ファイルで `title` が指定されていても、コマンドラインで `--title` が指定されていれば、コマンドラインの値が使用されること。

- **AC4: ドキュメントの更新**
  - `README.md` が更新され、ラッパースクリプトと設定ファイルの使用方法が明確に記載されていること。