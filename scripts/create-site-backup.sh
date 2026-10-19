#!/usr/bin/env bash
# Create a restorable SEAPS site backup: tarball + git bundle + manifest + local kit zip.
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
FULL_ARCHIVE="${OUT_DIR}/seaps-backup-full-${STAMP}.tar.gz"
BUNDLE="${OUT_DIR}/seaps-main-${STAMP}.bundle"
MANIFEST="${OUT_DIR}/seaps-backup-${STAMP}-manifest.json"
README="${OUT_DIR}/seaps-backup-${STAMP}-README.txt"
ZIP_KIT="${OUT_DIR}/seaps-backup-kit-${STAMP}.zip"

TAR_EXCLUDES=(
  --exclude='./node_modules'
  --exclude='./.next'
  --exclude='./out'
  --exclude='./backups'
)

echo "Creating source archive (excluding node_modules, .next, backups)..."
tar -czf "$ARCHIVE" "${TAR_EXCLUDES[@]}" --exclude='./.git' -C "$ROOT" .

echo "Creating full repo archive (includes .git history; still excludes node_modules/.next)..."
tar -czf "$FULL_ARCHIVE" "${TAR_EXCLUDES[@]}" -C "$ROOT" .

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
    "fullArchive": "$(basename "$FULL_ARCHIVE")",
    "gitBundle": "$(basename "$BUNDLE")",
    "zipKit": "$(basename "$ZIP_KIT")"
  },
  "restore": {
    "fromTag": "git fetch github tag ${TAG} && git checkout ${COMMIT}",
    "fromBundle": "git clone ${BUNDLE} restored-seaps && cd restored-seaps && git checkout ${COMMIT}",
    "fromArchive": "tar -xzf $(basename "$ARCHIVE") -C /path/to/restore && npm ci && npm run build",
    "fromFullArchive": "tar -xzf $(basename "$FULL_ARCHIVE") -C /path/to/restore && npm ci && npm run build"
  },
  "production": {
    "githubRepo": "goropojixoj12-oss/lox-voice",
    "site": "https://www.vps1.store"
  },
  "notes": "Blob/KV on Vercel is not in these files; export from Vercel Storage separately if needed."
}
EOF

cat > "$README" <<EOF
SEAPS local backup kit — ${STAMP}
================================

Commit: ${COMMIT}
Branch: ${BRANCH}
Tag:    ${TAG}

Files in this kit:
  - $(basename "$ARCHIVE")       — project tree (no .git, no node_modules)
  - $(basename "$FULL_ARCHIVE")  — same + .git (full history offline)
  - $(basename "$BUNDLE")        — git bundle (git clone seaps-main-*.bundle restored)
  - $(basename "$MANIFEST")      — machine-readable restore hints

Quick restore (recommended):
  unzip seaps-backup-kit-*.zip
  tar -xzf seaps-backup-full-*.tar.gz -C ~/Projects/seaps-restore
  cd ~/Projects/seaps-restore && npm ci && npm run build

Or from GitHub tag:
  git fetch github tag ${TAG}
  git checkout ${COMMIT}
EOF

echo "Creating single download zip (kit)..."
(
  cd "$OUT_DIR"
  zip -q -9 "$ZIP_KIT" \
    "$(basename "$ARCHIVE")" \
    "$(basename "$FULL_ARCHIVE")" \
    "$(basename "$BUNDLE")" \
    "$(basename "$MANIFEST")" \
    "$(basename "$README")"
)

git tag -f "${TAG}" "${COMMIT}" 2>/dev/null || git tag "${TAG}" "${COMMIT}"

STORE_COPY="${SEAPS_BACKUP_STORE_DIR:-}"
if [[ -n "$STORE_COPY" ]]; then
  DEST="${STORE_COPY%/}/${STAMP}"
  mkdir -p "$DEST"
  cp "$ARCHIVE" "$FULL_ARCHIVE" "$BUNDLE" "$MANIFEST" "$README" "$DEST/"
  if cp "$ZIP_KIT" "$DEST/" 2>/dev/null; then
    echo "Copied zip kit to agent store."
  else
    echo "Note: zip kit stayed in ${OUT_DIR} only (store copy skipped if over limit)."
  fi
  echo "Copied backup artifacts to agent store: ${DEST}"
fi

echo ""
echo "Backup complete:"
echo "  Archive:      ${ARCHIVE}"
echo "  Full archive: ${FULL_ARCHIVE}"
echo "  Bundle:       ${BUNDLE}"
echo "  Manifest:     ${MANIFEST}"
echo "  Zip kit:      ${ZIP_KIT}"
echo "  Git tag:      ${TAG} @ ${COMMIT}"
echo ""
echo "Push tag: git push -f github ${TAG} && git push -f origin ${TAG}"
