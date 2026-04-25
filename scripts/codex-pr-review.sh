#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${CODEX_REVIEW_BASE:-main}"
MODEL="${CODEX_REVIEW_MODEL:-gpt-5.5}"
TITLE="${CODEX_REVIEW_TITLE:-}"
INCLUDE_UNCOMMITTED=false
EXTRA_PROMPT=""

usage() {
  cat <<'EOF'
Usage:
  scripts/codex-pr-review.sh [--base main] [--model gpt-5.5] [--title "PR title"] [--uncommitted] [extra prompt]

Runs Codex code review for a branch or local PR diff before PM merges to main.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_BRANCH="${2:?--base requires a branch name}"
      shift 2
      ;;
    --model)
      MODEL="${2:?--model requires a model id}"
      shift 2
      ;;
    --title)
      TITLE="${2:?--title requires text}"
      shift 2
      ;;
    --uncommitted)
      INCLUDE_UNCOMMITTED=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$EXTRA_PROMPT" ]]; then
        EXTRA_PROMPT+=" "
      fi
      EXTRA_PROMPT+="$1"
      shift
      ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "codex-pr-review: git repository is required" >&2
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "codex-pr-review: Codex CLI is not installed or not in PATH" >&2
  exit 1
fi

PROMPT="あなたはPMのためにmainマージ前のコードレビューを行います。各レビューコメントには必ず優先度を付けてください。優先度は 1. Crucial、2. High Priority、3. Medium、4. Low の4段階です。1と2はPR作成者がマージ前に対応すべき指摘として扱い、3と4はPMが後続対応または許容を判断できる指摘として扱ってください。重大な不具合、回帰、セキュリティ/データ破損リスク、テスト不足を優先して指摘してください。指摘はファイル/行、理由、修正方針が分かる形にし、問題がない場合は残リスクだけを簡潔に報告してください。"

if [[ "$INCLUDE_UNCOMMITTED" == true ]]; then
  ARGS=(review --base "$BASE_BRANCH" --uncommitted)
else
  ARGS=(review --base "$BASE_BRANCH")
fi

ARGS+=(-c "model=\"$MODEL\"")

if [[ -n "$EXTRA_PROMPT" ]]; then
  PROMPT+=" 追加観点: ${EXTRA_PROMPT}"
fi

if [[ -n "$TITLE" ]]; then
  ARGS+=(--title "$TITLE")
fi

ARGS+=("$PROMPT")

exec codex "${ARGS[@]}"
