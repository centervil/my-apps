import argparse
import subprocess
import sys
from pathlib import Path
import os
from dotenv import load_dotenv


def main():
    load_dotenv() # .envファイルを読み込む
    print("[DEBUG] .env file loaded.")
    print(f"[DEBUG] Length of GEMINI_API_KEY: {len(os.getenv('GEMINI_API_KEY')) if os.getenv('GEMINI_API_KEY') else 0}")

    # 環境変数の存在確認 (値は出力しない)
    print(f"[DEBUG] NOTE_EMAIL exists: {'NOTE_EMAIL' in os.environ}")
    print(f"[DEBUG] NOTE_PASSWORD exists: {'NOTE_PASSWORD' in os.environ}")
    print(f"[DEBUG] NOTE_USER_ID exists: {'NOTE_USER_ID' in os.environ}")
    print(f"[DEBUG] GEMINI_API_KEY exists: {'GEMINI_API_KEY' in os.environ}")
    print(f"[DEBUG] LLM_MODEL exists: {'LLM_MODEL' in os.environ}")

    parser = argparse.ArgumentParser(description="指定ディレクトリ内のMarkdownをNote.comに投稿する（OASIS利用）")
    parser.add_argument('--folder', required=True, help='投稿対象のMarkdownファイルが入ったディレクトリ')
    # Note.com認証情報は環境変数から取得することを推奨するため、引数から削除
    parser.add_argument('--firefox-headless', action='store_true', help='Firefoxをヘッドレスで実行（デフォルトTrue）')
    args = parser.parse_args()

    folder_path = Path(args.folder)
    if not folder_path.exists() or not folder_path.is_dir():
        print(f"[ERROR] 指定ディレクトリが存在しません: {folder_path}")
        sys.exit(1)

    from oasis import OASIS

    # Firefoxのパスとプロファイルパスを環境変数から取得。なければデフォルト値を設定
    firefox_binary_path = os.getenv("FIREFOX_BINARY_PATH", "/usr/bin/firefox")
    firefox_profile_path = os.getenv("FIREFOX_PROFILE_PATH", os.path.expanduser("~/.firefox_profile_oasis"))

    print(f"[INFO] Firefox Binary Path: {firefox_binary_path}")
    print(f"[INFO] Firefox Profile Path: {firefox_profile_path}")

    # OASISインスタンスを初期化（Firefox関連パスを明示的に渡す）
    # LLM_MODELについては、.envでNoneまたは空文字が設定されていればAI機能はスキップされる
    oasis = OASIS(
        firefox_headless=args.firefox_headless,
        firefox_binary_path=firefox_binary_path,
        firefox_profile_path=firefox_profile_path
    )
    print("[DEBUG] OASIS instance initialized.")

    print(f"[INFO] Note.comへの投稿を開始します: {folder_path}")
    print(f"[DEBUG] Calling oasis.process_folder with folder: {folder_path}")

    result = oasis.process_folder(
        str(folder_path),
        post_to_qiita=False,
        post_to_note=True,
        post_to_wp=False,
        post_to_zenn=False
    )
    print("[INFO] OASIS処理結果:")
    print(result)

    if result.get('note', {}).get('status') == 'success':
        print("[INFO] Note.comへの投稿が成功しました！")
    else:
        error_message = result.get('note', {}).get('message', '不明なエラー')
        print(f"[ERROR] Note.comへの投稿に失敗した可能性があります。詳細: {error_message}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main() 