# Gemini CLI GitHub Actions セットアップガイド

このガイドでは、リポジトリで Gemini CLI GitHub Actions ワークフローをセットアップする方法を説明します。

## 前提条件

1. Gemini API が有効化された **Google Cloud プロジェクト**
2. Actions が有効化された **GitHub リポジトリ**
3. 適切に設定された **API クォータと課金**

## 必要なシークレット

GitHub リポジトリ設定で以下のシークレットを設定してください：

### 認証シークレット

| シークレット名    | 説明                                           | 必須                                      |
| ----------------- | ---------------------------------------------- | ----------------------------------------- |
| `GEMINI_API_KEY`  | 認証用 Gemini API キー                         | はい（または `GOOGLE_API_KEY` を使用）    |
| `GOOGLE_API_KEY`  | 代替 Google API キー                           | はい（`GEMINI_API_KEY` を使用しない場合） |
| `APP_PRIVATE_KEY` | GitHub App 秘密鍵（GitHub App を使用する場合） | オプション                                |

### シークレットのセットアップ手順

1. リポジトリ → Settings → Secrets and variables → Actions に移動
2. "New repository secret" をクリック
3. 適切な値で各必要なシークレットを追加

## 必要な変数

GitHub リポジトリ設定で以下の変数を設定してください：

### Google Cloud 変数

| 変数名                  | 説明                                      | 例の値                                                                        |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `GOOGLE_CLOUD_PROJECT`  | GCP プロジェクト ID                       | `my-project-123`                                                              |
| `GOOGLE_CLOUD_LOCATION` | GCP リージョン                            | `us-central1`                                                                 |
| `SERVICE_ACCOUNT_EMAIL` | GCP サービスアカウントメール              | `gemini-cli@my-project.iam.gserviceaccount.com`                               |
| `GCP_WIF_PROVIDER`      | Workload Identity Federation プロバイダー | `projects/123/locations/global/workloadIdentityPools/pool/providers/provider` |

### Gemini CLI 設定変数

| 変数名                      | 説明                                 | デフォルト値 |
| --------------------------- | ------------------------------------ | ------------ |
| `GEMINI_CLI_VERSION`        | 特定の Gemini CLI バージョン         | `latest`     |
| `GOOGLE_GENAI_USE_VERTEXAI` | 直接 API の代わりに Vertex AI を使用 | `false`      |
| `GOOGLE_GENAI_USE_GCA`      | Gemini Code Assist を使用            | `false`      |
| `DEBUG`                     | デバッグログを有効化                 | `false`      |

### GitHub App 変数（オプション）

| 変数名   | 説明          | 必須                          |
| -------- | ------------- | ----------------------------- |
| `APP_ID` | GitHub App ID | GitHub App を使用する場合のみ |

### 変数のセットアップ手順

1. リポジトリ → Settings → Secrets and variables → Actions に移動
2. "Variables" タブをクリック
3. "New repository variable" をクリック
4. 適切な値で各必要な変数を追加

## Google Cloud セットアップ

### 1. Google Cloud プロジェクトを作成

```bash
gcloud projects create YOUR_PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
```

### 2. 必要な API を有効化

```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable generativelanguage.googleapis.com
```

### 3. サービスアカウントを作成

```bash
gcloud iam service-accounts create gemini-cli-service \
    --display-name="Gemini CLI Service Account"
```

### 4. 必要な権限を付与

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:gemini-cli-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

### 5. Workload Identity Federation をセットアップ（推奨）

```bash
# ワークロード ID プールを作成
gcloud iam workload-identity-pools create "github-actions" \
    --location="global" \
    --display-name="GitHub Actions Pool"

# ワークロード ID プロバイダーを作成
gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
    --location="global" \
    --workload-identity-pool="github-actions" \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# サービスアカウントの偽装を許可
gcloud iam service-accounts add-iam-policy-binding \
    "gemini-cli-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

## GitHub App セットアップ（オプションですが推奨）

GitHub App を使用すると、個人アクセストークンと比較してより良いセキュリティとレート制限が提供されます。

### 1. GitHub App を作成

1. GitHub Settings → Developer settings → GitHub Apps に移動
2. "New GitHub App" をクリック
3. 以下の権限でアプリを設定：
   - リポジトリ権限：
     - Contents: Read
     - Issues: Write
     - Pull requests: Write
   - イベントの購読：
     - Issues
     - Pull request
     - Pull request review
     - Pull request review comment
     - Issue comment

### 2. アプリをインストール

1. リポジトリにアプリをインストール
2. App ID をメモし、秘密鍵を生成
3. `APP_ID` をリポジトリ変数として追加
4. 秘密鍵の内容を `APP_PRIVATE_KEY` シークレットとして追加

## Usage

Once configured, the workflows will automatically:

### Automatic Triggers

- **Pull Request Opened**: Automatically runs code review
- **Issue Opened/Reopened**: Automatically runs issue triage

### Manual Triggers

Comment on issues or pull requests with:

- `@gemini-cli /review [additional context]` - Request code review
- `@gemini-cli /triage` - Request issue triage
- `@gemini-cli [your question]` - General AI assistance

### Permissions

Only users with the following associations can trigger manual workflows:

- Repository owners (`OWNER`)
- Repository members (`MEMBER`)
- Repository collaborators (`COLLABORATOR`)

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API keys are correctly set
   - Check GCP project permissions
   - Ensure Workload Identity Federation is properly configured

2. **Workflow Not Triggering**
   - Check if user has required permissions
   - Verify the trigger conditions are met
   - Check repository settings for Actions enablement

3. **Rate Limiting**
   - Consider using GitHub App instead of personal tokens
   - Monitor API usage in Google Cloud Console

### Debug Mode

Enable debug mode by setting the `DEBUG` variable to `true`. This will:

- Show detailed execution logs
- Print GitHub event context
- Enable verbose Gemini CLI output

### Logs and Monitoring

- Check workflow execution logs in the Actions tab
- Monitor API usage in Google Cloud Console
- Review error messages in failed workflow runs

## Customization

### Adjusting Prompts

The AI prompts are embedded in the workflow files and can be customized by editing:

- `.github/workflows/gemini-review.yml` - Code review prompts
- `.github/workflows/gemini-triage.yml` - Issue triage prompts
- `.github/workflows/gemini-invoke.yml` - General assistance prompts

### Timeout Configuration

Adjust workflow timeouts in the respective YAML files:

- Review workflow: 7 minutes (default)
- Triage workflow: 5 minutes (default)
- Invoke workflow: 10 minutes (default)

### MCP Server Configuration

The workflows use the GitHub MCP server for repository interaction. You can customize the available tools by modifying the `includeTools` array in each workflow's settings.

## Security Considerations

1. **Secrets Management**: Never commit API keys or secrets to the repository
2. **Fork Protection**: Workflows automatically reject requests from forks
3. **Permission Boundaries**: Only authorized users can trigger workflows
4. **Input Validation**: All external inputs are treated as context only
5. **Audit Logging**: All actions are logged in GitHub Actions logs

## Support

For issues and questions:

1. Check the workflow execution logs
2. Review this documentation
3. Consult the [Gemini CLI documentation](https://github.com/google-github-actions/run-gemini-cli)
4. Open an issue in the repository
