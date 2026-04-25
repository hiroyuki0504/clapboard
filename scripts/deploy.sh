#!/usr/bin/env bash
# deploy.sh — clapboard 本番デプロイスクリプト (Mac mini 上で実行)
#
# 使い方:
#   手動: bash scripts/deploy.sh
#   自動: GitHub Actions (self-hosted runner) から呼び出される
#
# 前提:
#   - node / npm が PATH に入っている
#   - リポジトリが DEPLOY_DIR に clone 済み
#   - pm2 がインストール済み (未インストール時はこのスクリプトが自動インストール)
#   - .env.local が DEPLOY_DIR に設置済み

set -euo pipefail

# ---------- 設定 ----------
APP_NAME="${APP_NAME:-clapboard}"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/srv/clapboard}"
BRANCH="${BRANCH:-main}"
# --------------------------

log() { echo "[deploy] $(date '+%H:%M:%S') $*"; }
die() { echo "[deploy] ERROR: $*" >&2; exit 1; }

log "=== clapboard deploy start ==="
log "dir: $DEPLOY_DIR  branch: $BRANCH"

# 1. リポジトリが無ければ clone
if [[ ! -d "$DEPLOY_DIR/.git" ]]; then
  log "clone hiroyuki0504/clapboard → $DEPLOY_DIR"
  git clone --branch "$BRANCH" https://github.com/hiroyuki0504/clapboard.git "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"

# 2. 最新を取得
log "git pull origin $BRANCH"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

# 3. 依存関係インストール
log "npm ci"
npm ci --prefer-offline

# 4. production build
log "npm run build"
npm run build

# 5. PM2 がなければインストール
if ! command -v pm2 &>/dev/null; then
  log "pm2 not found — installing globally"
  npm install -g pm2
fi

# 6. プロセス再起動 / 初回起動
if pm2 describe "$APP_NAME" &>/dev/null; then
  log "pm2 reload $APP_NAME"
  pm2 reload "$APP_NAME" --update-env
else
  log "pm2 start (first time)"
  pm2 start ecosystem.config.cjs --env production
fi

# 7. pm2 起動リストを保存 (Mac 再起動後も自動起動)
pm2 save

log "=== deploy complete ==="
