#!/usr/bin/env bash
# One archive: entire repo tree (node_modules, .git, .env*, .next, backups) + Vercel metadata + optional blob export.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT_DIR="${ROOT}/backups/absolute-${STAMP}"
mkdir -p "$OUT_DIR/export-drop" "$OUT_DIR/agent-store-hint"

COMMIT="$(git rev-parse HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "==> Vercel env metadata (names + non-secret values; sensitive need vercel env pull)"
if command -v node >/dev/null 2>&1; then
  node <<'NODE' >"$OUT_DIR/export-drop/vercel-env-pull-instructions.txt" 2>/dev/null || true
console.log(`From a machine with Vercel CLI logged in:
  cd lox-voice
  vercel link --project lox-voice
  vercel env pull .env.vercel.production --environment=production
Copy .env.vercel.production into this backup folder before re-pack if needed.
Docs: https://vercel.com/docs/cli/env
`);
NODE
fi

for f in .env .env.local .env.production .env.production.local .env.development.local; do
  if [[ -f "$ROOT/$f" ]]; then
    cp "$ROOT/$f" "$OUT_DIR/export-drop/$f"
  fi
done

if [[ -f "$ROOT/.env.example" ]]; then
  cp "$ROOT/.env.example" "$OUT_DIR/export-drop/.env.example"
fi

if [[ -x "$ROOT/scripts/collect-backup-inventory.sh" ]]; then
  "$ROOT/scripts/collect-backup-inventory.sh" "$STAMP" >/dev/null 2>&1 || true
  inv="$(ls -1 "$ROOT/backups"/seaps-inventory-"${STAMP}".json 2>/dev/null | head -1)"
  [[ -n "$inv" && -f "$inv" ]] && cp "$inv" "$OUT_DIR/export-drop/"
fi

STORE_HINT="/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8"
if [[ -d "$STORE_HINT/internal" ]]; then
  tar -czf "$OUT_DIR/agent-store-hint/cursor-agent-internal-docs.tar.gz" -C "$STORE_HINT" internal 2>/dev/null || true
fi

cat >"$OUT_DIR/MANIFEST.json" <<EOF
{
  "createdAtUtc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "kind": "SEAPS_ABSOLUTE_BACKUP",
  "branch": "${BRANCH}",
  "commit": "${COMMIT}",
  "includes": [
    "full git working tree at backup time (node_modules, .next, .git, backups, secrets in export-drop/)",
    "git bundle all refs",
    "Vercel Blob export if BLOB_READ_WRITE_TOKEN or VERCEL_BLOB_READ_WRITE_TOKEN is set when running export script"
  ],
  "production": {
    "site": "https://www.seaps.asia",
    "github": "goropojixoj12-oss/lox-voice",
    "vercelProject": "lox-voice",
    "blobStore": "lox-voice-blob (store_IDo30yZRNSGtCc8W)"
  },
  "media": "Vercel Blob — run export-vercel-blob-download.mjs with BLOB_READ_WRITE_TOKEN from vercel env pull"
}
EOF

ARCHIVE="${ROOT}/backups/SEAPS-ABSOLUTE-${STAMP}.tar.gz"
BUNDLE="${OUT_DIR}/seaps-git-all-refs.bundle"

echo "==> Git bundle (all refs)"
git bundle create "$BUNDLE" --all

echo "==> Optional Vercel Blob listing export (requires token in env)"
if [[ -f "$ROOT/scripts/export-vercel-blob-list.mjs" ]]; then
  node "$ROOT/scripts/export-vercel-blob-list.mjs" "$OUT_DIR/export-drop/blob-list.json" 2>/dev/null || \
    echo '{"error":"Set BLOB_READ_WRITE_TOKEN and re-run export-vercel-blob-list.mjs"}' >"$OUT_DIR/export-drop/blob-list.json"
fi

echo "==> Full tree tarball (NO excludes except staging dir itself)"
tar -czf "$ARCHIVE" \
  --exclude="./backups/absolute-${STAMP}" \
  --exclude="./backups/SEAPS-ABSOLUTE-${STAMP}.tar.gz" \
  -C "$ROOT" .

echo "==> Append export-drop + bundle + manifest to kit tar"
KIT="${ROOT}/backups/SEAPS-ABSOLUTE-KIT-${STAMP}.tar.gz"
tar -czf "$KIT" -C "$OUT_DIR" .

FINAL="${ROOT}/backups/SEAPS-ABSOLUTE-ONE-${STAMP}.tar.gz"
echo "==> Single outer archive"
tar -czf "$FINAL" \
  -C "$ROOT/backups" \
  "SEAPS-ABSOLUTE-${STAMP}.tar.gz" \
  "SEAPS-ABSOLUTE-KIT-${STAMP}.tar.gz" \
  "absolute-${STAMP}/MANIFEST.json"

SHA="$(sha256sum "$FINAL" | awk '{print $1}')"
echo "$SHA  $(basename "$FINAL")" >"${FINAL}.sha256"

STORE_MEDIA="/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8/media/backups"
if [[ -d "$STORE_MEDIA" ]]; then
  cp "$FINAL" "${FINAL}.sha256" "$STORE_MEDIA/" 2>/dev/null && echo "Copied to agent store media/backups"
fi

echo ""
echo "DONE"
echo "  ONE FILE: $FINAL"
echo "  SHA256:   $SHA"
echo "  Size:     $(du -h "$FINAL" | awk '{print $1}')"
echo "  Commit:   $COMMIT"
