# self-hosted runnerのセットアップとサービス化 (2025-11-09)

## 概要

このドキュメントは、self-hosted runnerのセットアップと、システムの再起動後も自動的に起動するためのサービス化作業に関する引き継ぎ資料です。

## 達成したこと

-   `actions-runner/run.sh` を実行し、self-hosted runnerが正常に起動することを確認しました。
-   `gh workflow run` コマンドを使用して、`.github/workflows/spotify-upload.yml` ワークフローの手動実行をトリガーしました。
-   runnerの診断ログ (`actions-runner/_diag/`) を確認し、トリガーされたジョブがこのPC上のrunnerによって正常に受信・実行されることを検証しました。

## 次にやること (TODO)

現在、runnerは手動で起動している状態です。PCを再起動した際に自動で起動するように、runnerをsystemdサービスとして登録する必要があります。

次回の作業では、`sudo` 権限でCLIを起動し、以下の手順を実行してください。

1.  **runnerサービスをインストールする**
    -   このコマンドは、runnerをsystemdサービスとして登録します。
    -   **コマンド:**
        ```bash
        sudo /home/centervil/my-apps/actions-runner/svc.sh install
        ```
    -   *(注: もしユーザー名の入力を求められた場合は、`centervil` を指定してください。)*

2.  **runnerサービスを開始する**
    -   登録したサービスを起動します。
    -   **コマンド:**
        ```bash
        sudo /home/centervil/my-apps/actions-runner/svc.sh start
        ```

3.  **サービスの状態を確認する**
    -   サービスが正常に起動し、実行中（active）であることを確認します。
    -   **コマンド:**
        ```bash
        sudo /home/centervil/my-apps/actions-runner/svc.sh status
        ```

## セキュリティに関する補足

-   **現状のワークフロー (`spotify-upload.yml`)**:
    -   このワークフローは `workflow_dispatch` イベントによってのみトリガーされます。これは、リポジトリへの書き込み権限を持つ認証済みユーザーだけが実行できるため、forkされたリポジトリから不正に実行されるリスクは低いです。
-   **将来的な考慮事項**:
    -   もし将来、`pull_request` や `pull_request_target` をトリガーとするワークフローでこのself-hosted runnerを使用する場合は、セキュリティリスクを慎重に評価する必要があります。信頼できないコードがrunner上で実行されることを防ぐため、GitHubリポジトリの設定で「Fork pull request workflows from outside collaborators」を無効にする、`GITHUB_TOKEN` の権限を最小限に設定するなどの対策を検討してください。
