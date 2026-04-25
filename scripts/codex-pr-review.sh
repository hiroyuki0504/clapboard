#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${CODEX_REVIEW_BASE:-main}"
MODEL="${CODEX_REVIEW_MODEL:-}"
TITLE="${CODEX_REVIEW_TITLE:-}"
INCLUDE_UNCOMMITTED=false
EXTRA_PROMPT=""

usage() {
  cat <<'EOF'
Usage:
  scripts/codex-pr-review.sh [--base main] [--model model-id] [--title "PR title"] [--uncommitted]

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

if [[ "$INCLUDE_UNCOMMITTED" == true ]]; then
  ARGS=(review --uncommitted)
else
  ARGS=(review --base "$BASE_BRANCH")
fi

if [[ -n "$MODEL" ]]; then
  ARGS+=(-c "model=\"$MODEL\"")
fi

if [[ -n "$TITLE" ]]; then
  ARGS+=(--title "$TITLE")
fi

if [[ -n "$EXTRA_PROMPT" ]]; then
  ARGS+=("$EXTRA_PROMPT")
fi

exec codex "${ARGS[@]}"
