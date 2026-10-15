#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-main}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if ! git remote get-url github &>/dev/null; then
  echo "error: remote 'github' is not configured (required for Vercel production)" >&2
  exit 1
fi

current="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current" != "$BRANCH" && "$BRANCH" == "main" ]]; then
  echo "note: checked out branch is '$current'; pushing ref '$BRANCH' to remotes" >&2
fi

echo "Pushing ${BRANCH} to github (Vercel production: goropojixoj12-oss/lox-voice)..."
git push -u github "$BRANCH"

if git remote get-url origin &>/dev/null; then
  echo "Pushing ${BRANCH} to origin (Cursor mirror)..."
  git push -u origin "$BRANCH"
else
  echo "note: no origin remote; skipped" >&2
fi

echo "Production push finished successfully."
