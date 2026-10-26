#!/usr/bin/env bash
# Apply cloud-agent commits (blob fix + homepage card) and push production GitHub only.
# Run from a clone of goropojixoj12-oss/lox-voice after you can `git push` to GitHub (PAT).
set -euo pipefail

AGENT_MIRROR="https://origin.cursor.com/git/sari-code/tmp-cd39198097607f86.git"
GITHUB_REMOTE="${GITHUB_REMOTE:-github}"
BRANCH="${BRANCH:-main}"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if ! git remote get-url "$GITHUB_REMOTE" &>/dev/null; then
  echo "Adding remote '$GITHUB_REMOTE' -> goropojixoj12-oss/lox-voice"
  git remote add "$GITHUB_REMOTE" "https://github.com/goropojixoj12-oss/lox-voice.git"
fi

echo "Fetching agent mirror (read-only, no originold required)..."
git fetch "$AGENT_MIRROR" "$BRANCH:refs/remotes/agent-mirror/$BRANCH"

echo "Merging agent-mirror/$BRANCH into $BRANCH..."
git checkout "$BRANCH"
git merge --no-edit "refs/remotes/agent-mirror/$BRANCH"

echo "Pushing to $GITHUB_REMOTE $BRANCH (Vercel production)..."
git push -u "$GITHUB_REMOTE" "$BRANCH"

echo "Done. Wait for Vercel deploy, then check https://www.seaps.asia"
