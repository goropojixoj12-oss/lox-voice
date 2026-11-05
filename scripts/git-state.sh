#!/usr/bin/env bash
# Fresh ahead/behind per remote: fetches first, so no claim can rest on a stale ref.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"

# Google Drive rewrites desktop.ini into .git/refs between our runs; git then reads them as
# broken refs and the fetch dies. Sweep immediately before fetching.
node scripts/sweep-windows-junk.mjs >/dev/null 2>&1 || true

git fetch --all --prune --quiet

echo "branch: $BRANCH  head: $(git rev-parse --short "$BRANCH")  tree: $(git rev-parse --short "$BRANCH^{tree}")"
for remote in $(git remote); do
  url="$(git remote get-url "$remote")"
  if git rev-parse --verify --quiet "refs/remotes/$remote/$BRANCH" >/dev/null; then
    ref="$remote/$BRANCH"
    ahead="$(git rev-list --count "$ref..$BRANCH")"
    behind="$(git rev-list --count "$BRANCH..$ref")"
    if [[ "$behind" == 0 ]]; then
      verdict="fast-forward possible"
    elif [[ "$ahead" == 0 ]]; then
      verdict="behind only; pull needed"
    else
      verdict="DIVERGED — do not force push"
    fi
    printf '%-8s %-52s +%-4s -%-4s %s\n' "$remote" "$url" "$ahead" "$behind" "$verdict"
  else
    printf '%-8s %-52s %s\n' "$remote" "$url" "no $BRANCH ref on remote"
  fi
done
