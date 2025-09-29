# Configuration Examples

This document provides configuration examples for different project types and use cases.

## Basic Configuration

### Minimal Setup (API Key Authentication)

**Repository Secrets:**

```
GEMINI_API_KEY=your_gemini_api_key_here
```

**Repository Variables:**

```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_CLI_VERSION=latest
DEBUG=false
```

### Advanced Setup (Workload Identity Federation)

**Repository Secrets:**

```
APP_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
your_github_app_private_key_content
-----END PRIVATE KEY-----
```

**Repository Variables:**

```
APP_ID=123456
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
SERVICE_ACCOUNT_EMAIL=gemini-cli@your-project.iam.gserviceaccount.com
GCP_WIF_PROVIDER=projects/123456789/locations/global/workloadIdentityPools/github-actions/providers/github-actions-provider
GEMINI_CLI_VERSION=v1.2.3
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_GENAI_USE_GCA=false
DEBUG=false
```

## Project-Specific Configurations

### Open Source Project

Focus on community contributions and code quality:

**Repository Variables:**

```
GOOGLE_CLOUD_PROJECT=opensource-project
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_CLI_VERSION=latest
DEBUG=false
# Enable more detailed reviews for open source
GOOGLE_GENAI_USE_VERTEXAI=true
```

**Workflow Customization:**

- Enable automatic reviews on all PRs
- Focus on documentation and code style
- Provide beginner-friendly feedback

### Enterprise Project

Focus on security and compliance:

**Repository Variables:**

```
GOOGLE_CLOUD_PROJECT=enterprise-project-prod
GOOGLE_CLOUD_LOCATION=us-east1
SERVICE_ACCOUNT_EMAIL=gemini-cli-prod@enterprise-project.iam.gserviceaccount.com
GCP_WIF_PROVIDER=projects/987654321/locations/global/workloadIdentityPools/enterprise-pool/providers/github-provider
GEMINI_CLI_VERSION=v1.2.3
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_GENAI_USE_GCA=true
DEBUG=false
```

**Additional Security:**

- Use GitHub App authentication
- Enable Workload Identity Federation
- Pin specific Gemini CLI version
- Enable audit logging

### Development/Testing Project

Focus on experimentation and debugging:

**Repository Variables:**

```
GOOGLE_CLOUD_PROJECT=dev-testing-project
GOOGLE_CLOUD_LOCATION=us-west1
GEMINI_CLI_VERSION=latest
DEBUG=true
GOOGLE_GENAI_USE_VERTEXAI=false
```

**Development Features:**

- Enable debug mode
- Use latest Gemini CLI version
- Shorter timeout for faster iteration

## Environment-Specific Configurations

### Production Environment

```yaml
# Repository Variables
GOOGLE_CLOUD_PROJECT: 'production-project'
GOOGLE_CLOUD_LOCATION: 'us-central1'
SERVICE_ACCOUNT_EMAIL: 'gemini-cli-prod@production-project.iam.gserviceaccount.com'
GCP_WIF_PROVIDER: 'projects/123456789/locations/global/workloadIdentityPools/prod-pool/providers/github-provider'
GEMINI_CLI_VERSION: 'v1.2.3' # Pin to stable version
GOOGLE_GENAI_USE_VERTEXAI: 'true'
GOOGLE_GENAI_USE_GCA: 'true'
DEBUG: 'false'
```

### Staging Environment

```yaml
# Repository Variables
GOOGLE_CLOUD_PROJECT: 'staging-project'
GOOGLE_CLOUD_LOCATION: 'us-central1'
SERVICE_ACCOUNT_EMAIL: 'gemini-cli-staging@staging-project.iam.gserviceaccount.com'
GCP_WIF_PROVIDER: 'projects/123456789/locations/global/workloadIdentityPools/staging-pool/providers/github-provider'
GEMINI_CLI_VERSION: 'latest' # Use latest for testing
GOOGLE_GENAI_USE_VERTEXAI: 'true'
GOOGLE_GENAI_USE_GCA: 'false'
DEBUG: 'true' # Enable debug for troubleshooting
```

### Development Environment

```yaml
# Repository Variables
GOOGLE_CLOUD_PROJECT: 'dev-project'
GOOGLE_CLOUD_LOCATION: 'us-west1'
GEMINI_CLI_VERSION: 'latest'
GOOGLE_GENAI_USE_VERTEXAI: 'false' # Use direct API for cost savings
DEBUG: 'true'

# Repository Secrets (simpler auth for dev)
GEMINI_API_KEY: 'your_dev_api_key'
```

## Language-Specific Configurations

### JavaScript/TypeScript Projects

**Workflow Customization Focus:**

- ESLint and Prettier integration
- Package.json security scanning
- Node.js best practices
- TypeScript type checking

### Python Projects

**Workflow Customization Focus:**

- PEP 8 compliance
- Security vulnerability scanning
- Virtual environment best practices
- Requirements.txt analysis

### Java Projects

**Workflow Customization Focus:**

- Google Java Style Guide compliance
- Maven/Gradle security scanning
- JUnit test coverage
- Performance optimization

### Go プロジェクト

**ワークフローカスタマイゼーションの焦点:**

- Go fmt 準拠
- Go vet 分析
- モジュールセキュリティスキャン
- 並行処理ベストプラクティス

## カスタムプロンプト例

### セキュリティ重視のレビュー

セキュリティを重視するようにレビューワークフロープロンプトを変更：

```yaml
# .github/workflows/gemini-review.yml 内
prompt: |-
  ## 役割
  あなたはセキュリティ重視のコードレビューエージェントです...

  ## レビュー基準（優先順位順）
  1. **セキュリティ**: 脆弱性、インジェクション攻撃、安全でないデータ保存を特定
  2. **正確性**: ロジックエラーとエッジケース
  3. **パフォーマンス**: ボトルネックと最適化
  # ... プロンプトの残り
```

### ドキュメント重視のレビュー

ドキュメント品質を重視：

```yaml
prompt: |-
  ## 役割
  あなたはドキュメント重視のコードレビューエージェントです...

  ## レビュー基準（優先順位順）
  1. **ドキュメント**: API ドキュメント、コードコメント、README 更新
  2. **正確性**: ロジックエラーとエッジケース
  3. **保守性**: コードの可読性と構造
  # ... プロンプトの残り
```

## モニタリングとアラート設定

### Google Cloud モニタリング

```yaml
# モニタリング設定例
TELEMETRY_ENABLED: 'true'
TELEMETRY_TARGET: 'gcp'
```

### カスタムメトリクス

ワークフローのパフォーマンスと使用状況を追跡：

```yaml
# ワークフローファイル内でカスタムメトリクスを追加
- name: 'メトリクスを記録'
  run: |
    echo "workflow_duration_seconds $(date +%s)" >> metrics.txt
    echo "api_calls_count $API_CALLS" >> metrics.txt
```

## コスト最適化

### API 使用量最適化

```yaml
# コスト削減のため API 呼び出しを削減
GOOGLE_GENAI_USE_VERTEXAI: 'false' # 直接 API を使用
GEMINI_CLI_VERSION: 'latest' # 最新の最適化を取得
```

### ワークフロータイムアウト最適化

```yaml
# プロジェクトのニーズに基づいてタイムアウトを調整
timeout-minutes: 3  # シンプルなプロジェクトでは短縮
timeout-minutes: 10 # 複雑なプロジェクトでは延長
```

## トラブルシューティング設定

### デバッグ設定

```yaml
DEBUG: 'true'
ACTIONS_STEP_DEBUG: 'true' # GitHub Actions デバッグを有効化
```

### 詳細ログ

```yaml
# ワークフローファイル内
gemini_debug: true
```

### テスト設定

```yaml
# ワークフローテスト用
GOOGLE_CLOUD_PROJECT: 'test-project'
DEBUG: 'true'
GEMINI_CLI_VERSION: 'latest'
```

## 移行例

### 個人アクセストークンから GitHub App への移行

**移行前:**

```yaml
# リポジトリシークレット
GITHUB_TOKEN: 'ghp_your_personal_access_token'
```

**移行後:**

```yaml
# リポジトリシークレット
APP_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----...'

# リポジトリ変数
APP_ID: '123456'
```

### 直接 API から Workload Identity Federation への移行

**移行前:**

```yaml
# リポジトリシークレット
GEMINI_API_KEY: 'your_api_key'
```

**移行後:**

```yaml
# リポジトリ変数
GCP_WIF_PROVIDER: 'projects/.../providers/github-provider'
SERVICE_ACCOUNT_EMAIL: 'service@project.iam.gserviceaccount.com'
GOOGLE_GENAI_USE_VERTEXAI: 'true'
```
