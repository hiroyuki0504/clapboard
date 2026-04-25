#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${CODEX_REVIEW_BASE:-main}"
MODEL="${CODEX_REVIEW_MODEL:-gpt-5.5}"
TITLE="${CODEX_REVIEW_TITLE:-}"
PR_NUMBER="${PR_NUMBER:-}"
DRY_RUN=false
EXTRA_PROMPT=""

usage() {
  cat <<'EOF'
Usage:
  scripts/codex-pr-review-comment.sh [--pr 123] [--base main] [--model gpt-5.5] [--title "PR title"] [--dry-run] [extra prompt]

Runs Codex review and posts the result as a GitHub PR review comment.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr)
      PR_NUMBER="${2:?--pr requires a pull request number}"
      shift 2
      ;;
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
    --dry-run)
      DRY_RUN=true
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
  echo "codex-pr-review-comment: git repository is required" >&2
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "codex-pr-review-comment: Codex CLI is not installed or not in PATH" >&2
  exit 1
fi

if [[ "$DRY_RUN" != true ]] && ! command -v gh >/dev/null 2>&1; then
  echo "codex-pr-review-comment: GitHub CLI is not installed or not in PATH" >&2
  exit 1
fi

if [[ -z "$PR_NUMBER" && -n "${GITHUB_EVENT_PATH:-}" && -f "${GITHUB_EVENT_PATH:-}" ]]; then
  PR_NUMBER="$(
    node -e "const fs=require('fs'); const e=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')); process.stdout.write(String(e.pull_request?.number ?? ''));"
  )"
fi

if [[ -z "$PR_NUMBER" && "$DRY_RUN" != true ]]; then
  PR_NUMBER="$(gh pr view --json number --jq '.number')"
fi

if [[ -z "$TITLE" && -n "${GITHUB_EVENT_PATH:-}" && -f "${GITHUB_EVENT_PATH:-}" ]]; then
  TITLE="$(
    node -e "const fs=require('fs'); const e=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')); process.stdout.write(String(e.pull_request?.title ?? ''));"
  )"
fi

if [[ -z "$TITLE" && -n "$PR_NUMBER" && "$DRY_RUN" != true ]]; then
  TITLE="$(gh pr view "$PR_NUMBER" --json title --jq '.title')"
fi

if [[ -z "$TITLE" ]]; then
  TITLE="Codex PR review"
fi

review_output="$(mktemp)"
body_file="$(mktemp)"
trap 'rm -f "$review_output" "$body_file"' EXIT

review_args=(--base "$BASE_BRANCH" --model "$MODEL" --title "$TITLE")

if [[ -n "$EXTRA_PROMPT" ]]; then
  review_args+=("$EXTRA_PROMPT")
fi

scripts/codex-pr-review.sh "${review_args[@]}" | tee "$review_output"

{
  printf '<!-- clapboard-codex-pr-review -->\n'
  printf '## Codex PR Review\n\n'
  printf '- Model: `%s`\n' "$MODEL"
  printf '- Base: `%s`\n' "$BASE_BRANCH"
  printf -- '- Priority: `1. Crucial` > `2. High Priority` > `3. Medium` > `4. Low`\n'
  printf -- '- Required before merge: PR author must resolve `Crucial` and `High Priority` comments.\n\n'
  printf '### Review Comments\n\n'
  cat "$review_output"
  printf '\n'
} > "$body_file"

if [[ "$DRY_RUN" == true ]]; then
  cat "$body_file"
  exit 0
fi

if [[ -z "$PR_NUMBER" ]]; then
  echo "codex-pr-review-comment: pull request number could not be determined" >&2
  exit 1
fi

gh pr review "$PR_NUMBER" --comment --body-file "$body_file"
