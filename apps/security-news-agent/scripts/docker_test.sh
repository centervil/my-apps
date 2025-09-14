#!/bin/bash

# Docker環境でのテスト実行スクリプト
# Usage: ./scripts/docker_test.sh [test-type]

set -e

# カラー出力用の定数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 使用方法を表示
show_usage() {
    echo "Usage: $0 [test-type]"
    echo ""
    echo "Test types:"
    echo "  validate     - 設定検証のみ"
    echo "  unittest     - 単体テストのみ"
    echo "  integration  - 統合テストのみ"
    echo "  test-mode    - テストモードでアプリケーション実行"
    echo "  full         - フルモードでアプリケーション実行"
    echo "  all          - すべてのテストを実行"
    echo "  build        - Dockerイメージをビルドのみ"
    echo "  clean        - Dockerリソースをクリーンアップ"
    echo ""
    echo "例:"
    echo "  $0 validate"
    echo "  $0 unittest"
    echo "  $0 test-mode"
    echo "  $0 all"
}

# .envファイルの存在確認
check_env_file() {
    if [ ! -f ".env" ]; then
        log_warning ".envファイルが見つかりません"
        log_info ".env.exampleをコピーして.envファイルを作成してください"
        log_info "cp .env.example .env"
        log_info "その後、APIキーを設定してください"
        return 1
    fi
    return 0
}

# Dockerイメージをビルド
build_image() {
    log_info "Dockerイメージをビルド中..."
    docker-compose build security-news-agent
    if [ $? -eq 0 ]; then
        log_success "Dockerイメージのビルドが完了しました"
    else
        log_error "Dockerイメージのビルドに失敗しました"
        exit 1
    fi
}

# 設定検証
run_validate() {
    log_info "設定検証を実行中..."
    docker-compose run --rm security-news-agent-validate
    if [ $? -eq 0 ]; then
        log_success "設定検証が完了しました"
    else
        log_error "設定検証に失敗しました"
        return 1
    fi
}

# 単体テスト実行
run_unittest() {
    log_info "単体テストを実行中..."
    docker-compose run --rm security-news-agent-unittest
    if [ $? -eq 0 ]; then
        log_success "単体テストが完了しました"
    else
        log_error "単体テストに失敗しました"
        return 1
    fi
}

# 統合テスト実行
run_integration() {
    log_info "統合テストを実行中..."
    docker-compose run --rm security-news-agent-integration
    if [ $? -eq 0 ]; then
        log_success "統合テストが完了しました"
    else
        log_error "統合テストに失敗しました"
        return 1
    fi
}

# テストモードでアプリケーション実行
run_test_mode() {
    log_info "テストモードでアプリケーションを実行中..."
    docker-compose run --rm security-news-agent-test
    if [ $? -eq 0 ]; then
        log_success "テストモードでの実行が完了しました"
        log_info "生成されたファイルを確認してください: ./slides/"
    else
        log_error "テストモードでの実行に失敗しました"
        return 1
    fi
}

# フルモードでアプリケーション実行
run_full_mode() {
    log_info "フルモードでアプリケーションを実行中..."
    log_warning "これは実際のAPIを使用します。料金が発生する可能性があります。"
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose run --rm security-news-agent
        if [ $? -eq 0 ]; then
            log_success "フルモードでの実行が完了しました"
            log_info "生成されたファイルを確認してください: ./slides/"
        else
            log_error "フルモードでの実行に失敗しました"
            return 1
        fi
    else
        log_info "実行をキャンセルしました"
    fi
}

# すべてのテストを実行
run_all_tests() {
    log_info "すべてのテストを実行中..."
    
    # 設定検証
    run_validate || return 1
    
    # 単体テスト
    run_unittest || return 1
    
    # 統合テスト
    run_integration || return 1
    
    # テストモードでアプリケーション実行
    run_test_mode || return 1
    
    log_success "すべてのテストが完了しました！"
}

# Dockerリソースをクリーンアップ
clean_docker() {
    log_info "Dockerリソースをクリーンアップ中..."
    
    # コンテナを停止・削除
    docker-compose down --remove-orphans
    
    # 未使用のイメージを削除
    docker image prune -f
    
    # 未使用のボリュームを削除
    docker volume prune -f
    
    log_success "Dockerリソースのクリーンアップが完了しました"
}

# メイン処理
main() {
    # 引数チェック
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    # .envファイルチェック（cleanとbuild以外）
    if [ "$1" != "clean" ] && [ "$1" != "build" ]; then
        check_env_file || exit 1
    fi
    
    # テストタイプに応じて実行
    case "$1" in
        "build")
            build_image
            ;;
        "validate")
            build_image
            run_validate
            ;;
        "unittest")
            build_image
            run_unittest
            ;;
        "integration")
            build_image
            run_integration
            ;;
        "test-mode")
            build_image
            run_test_mode
            ;;
        "full")
            build_image
            run_full_mode
            ;;
        "all")
            build_image
            run_all_tests
            ;;
        "clean")
            clean_docker
            ;;
        *)
            log_error "不明なテストタイプ: $1"
            show_usage
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"