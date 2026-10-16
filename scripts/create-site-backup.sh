#!/usr/bin/env bash
# Create a restorable SEAPS site backup: tarball + git bundle + manifest.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT_DIR="${ROOT}/backups"
mkdir -p "$OUT_DIR"

COMMIT="$(git rev-parse HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
TAG="${1:-backup/${STAMP}-manual}"

ARCHIVE="${OUT_DIR}/seaps-backup-${STAMP}.tar.gz"
BUNDLE="${OUT_DIR}/seaps-main-${STAMP}.bundle"
MANIFEST="${OUT_DIR}/seaps-backup-${STAMP}-manifest.json"

echo "Creating source archive (excluding node_modules, .next, backups)..."
tar -czf "$ARCHIVE" \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./backups' \
  --exclude='./.git' \
  -C "$ROOT" .

echo "Creating git bundle for branch ${BRANCH}..."
git bundle create "$BUNDLE" "${BRANCH}"

cat > "$MANIFEST" <<EOF
{
  "createdAtUtc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project": "SEAPS / lox-voice",
  "branch": "${BRANCH}",
  "commit": "${COMMIT}",
  "tag": "${TAG}",
  "files": {
    "archive": "$(basename "$ARCHIVE")",
    "gitBundle": "$(basename "$BUNDLE")"
  },
  "restore": {
    "fromTag": "git fetch github tag ${TAG} && git checkout ${COMMIT}",
    "fromBundle": "git clone ${BUNDLE} restored-seaps && cd restored-seaps && git checkout ${COMMIT}",
    "fromArchive": "tar -xzf $(basename "$ARCHIVE") -C /path/to/restore && npm ci && npm run build"
  },
  "production": {
    "githubRepo": "goropojixoj12-oss/lox-voice",
    "site": "https://www.vps1.store"
  }
}
EOF

git tag -f "${TAG}" "${COMMIT}" 2>/dev/null || git tag "${TAG}" "${COMMIT}"

echo ""
echo "Backup complete:"
echo "  Archive:  ${ARCHIVE}"
echo "  Bundle:   ${BUNDLE}"
echo "  Manifest: ${MANIFEST}"
echo "  Git tag:  ${TAG} @ ${COMMIT}"
echo ""
echo "Push tag: git push -f github ${TAG} && git push -f origin ${TAG}"
