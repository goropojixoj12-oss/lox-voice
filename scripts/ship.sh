#!/usr/bin/env bash
# Ship: the pushing half of AGENTS.md §9 (steps 1, 5, 6) in one call.
#
#   bash scripts/ship.sh <short-name> [branch]
#   SHIP_SKIP_VERCEL=1 bash scripts/ship.sh <short-name>     # no deploy wait (rare)
#
# Refuses to push unless:
#   * the working tree has no uncommitted tracked changes (so what ships is what was checked);
#   * tmp/gate-pass.json from `npm run gate` covers exactly this HEAD and is < 60 min old;
#   * the branch is not behind/diverged from the remote (checked after a fresh fetch).
#
# It then does, in order: backup tag pushed to github (rule 12) → push github (production
# source, blocking) → push origin cursor-mirror (advisory, rule 11) → wait for the Vercel
# production deployment to be READY → prod smoke (§20). The visual check of the changed
# route (§19) stays a human/agent step and is NOT replaced by this script.
set -euo pipefail

NAME="${1:-}"
BRANCH="${2:-main}"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

die() { echo "ship aborted: $*" >&2; exit 1; }

[[ -n "$NAME" ]] || die "usage: bash scripts/ship.sh <short-name> [branch]"
git remote get-url github >/dev/null 2>&1 || die "remote 'github' is missing — production would not update"

HEAD_SHA="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[[ "$CURRENT_BRANCH" == "$BRANCH" ]] || echo "note: checked out '$CURRENT_BRANCH', shipping ref '$BRANCH'"

MARKER="tmp/gate-pass.json"
[[ -f "$MARKER" ]] || die "no $MARKER — run: npm run gate"
MARKER_HEAD="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).head)' "$MARKER")"
[[ "$MARKER_HEAD" == "$HEAD_SHA" ]] || die "gate marker is for $(printf %.7s "$MARKER_HEAD"), HEAD is $SHORT — run npm run gate again"
MARKER_AGE_MIN="$(node -e 'console.log(Math.floor((Date.now()-Date.parse(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).at))/60000))' "$MARKER")"
(( MARKER_AGE_MIN < 60 )) || die "gate marker is ${MARKER_AGE_MIN} min old — rerun npm run gate"

DIRTY="$(git status --porcelain --untracked-files=no)"
[[ -z "$DIRTY" ]] || die "uncommitted tracked changes would not be covered by the gate:
$DIRTY"

echo "▸ state of remotes (fresh fetch)"
bash scripts/git-state.sh "$BRANCH"
AHEAD="$(git rev-list --count "github/$BRANCH..$BRANCH" 2>/dev/null || echo 0)"
BEHIND="$(git rev-list --count "$BRANCH..github/$BRANCH" 2>/dev/null || echo 0)"
(( BEHIND == 0 )) || die "local $BRANCH is $BEHIND behind github — pull/rebase first, never force push"

TAG="backup/$(date -u +%Y-%m-%d)-${NAME}"
if git rev-parse -q --verify "$TAG" >/dev/null; then
  echo "note: tag $TAG already exists, keeping it as is"
else
  git tag "$TAG" "$HEAD_SHA"
fi
echo "▸ backup tag $TAG → github"
git push github "refs/tags/$TAG"

echo "▸ push $BRANCH → github (Vercel production source)"
git push github "$BRANCH"

if git remote get-url origin >/dev/null 2>&1; then
  echo "▸ push $BRANCH → origin (cursor mirror, advisory)"
  git push origin "$BRANCH" || echo "warning: origin push failed; production from github is unaffected"
else
  echo "note: no origin remote; skipped"
fi

echo "▸ pushed $SHORT ($(git log -1 --format=%s)) to github; ahead count was $AHEAD"

if [[ "${SHIP_SKIP_VERCEL:-0}" == "1" ]]; then
  echo "note: SHIP_SKIP_VERCEL=1 — deploy wait skipped"
  exit 0
fi

echo "▸ waiting for the Vercel production deployment of $SHORT to be READY"
node scripts/wait-vercel.mjs "$HEAD_SHA" || die "deployment did not reach READY — investigate before touching prod data, rollback tag is $TAG"

echo "▸ prod smoke (§20)"
npm run smoke -- --base=https://www.seaps.asia

echo
echo "SHIP DONE — $SHORT live on https://www.seaps.asia"
echo "rollback only on the owner's decision (§9.7): git reset --hard $TAG && git push github --force-with-lease $BRANCH"
echo "still yours (§19/§16): open the changed route on prod at ~390/~820/~1440 and the §8 checkpoints"
