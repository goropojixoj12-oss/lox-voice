#!/usr/bin/env bash
# Build SEAPS-ONE-CLICK-RESTORE tar.gz (code + secrets + Postgres + Vercel Blob).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT_DIR="${ROOT}/backups"
KIT_NAME="SEAPS-ONE-CLICK-RESTORE-${STAMP}"
STAGING="${OUT_DIR}/kit-staging-${STAMP}"
FINAL="${OUT_DIR}/${KIT_NAME}.tar.gz"
ENV_FILE="${1:-${OUT_DIR}/export-drop/.env.vercel.production}"

mkdir -p "${STAGING}/payload/project" "${STAGING}/payload/secrets" \
  "${STAGING}/payload/database" "${STAGING}/payload/blob"

echo "==> Project tree (full: node_modules, .git, .next)"
tar -cf - \
  --exclude="./backups/kit-staging-*" \
  --exclude="./backups/SEAPS-ONE-CLICK-RESTORE-*.tar.gz" \
  -C "$ROOT" . | tar -xf - -C "${STAGING}/payload/project"

echo "==> Restore installer"
cp -a "${ROOT}/scripts/restore-kit/"* "${STAGING}/"

if [[ -f "$ENV_FILE" ]]; then
  cp "$ENV_FILE" "${STAGING}/payload/secrets/.env.vercel.production"
  cp "$ENV_FILE" "${STAGING}/payload/secrets/.env.production.full"
else
  echo "WARN: Run ./scripts/export-vercel-env-production.sh first" >&2
  [[ -f "${ROOT}/.env.local" ]] && cp "${ROOT}/.env.local" "${STAGING}/payload/secrets/.env.production.full"
fi

if [[ -f "${ROOT}/backups/export-drop/postgres.dump.sql" ]] && [[ $(wc -c <"${ROOT}/backups/export-drop/postgres.dump.sql") -gt 1000 ]]; then
  cp "${ROOT}/backups/export-drop/postgres.dump.sql" "${STAGING}/payload/database/postgres.dump.sql"
fi

if [[ -f "${STAGING}/payload/secrets/.env.vercel.production" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${STAGING}/payload/secrets/.env.vercel.production" 2>/dev/null || true
  set +a
fi

echo "==> Postgres dump"
DUMP="${STAGING}/payload/database/postgres.dump.sql"
if [[ ! -f "$DUMP" ]] || [[ $(wc -c <"$DUMP") -lt 1000 ]]; then
  if [[ -n "${DATABASE_URL:-}" ]] && command -v pg_dump >/dev/null 2>&1; then
    pg_dump "$DATABASE_URL" --no-owner --no-acl -F p -f "$DUMP"
    echo "  dump bytes: $(wc -c <"$DUMP")"
  else
    echo "Run export-postgres-vercel.sh after vercel env pull" >"$DUMP"
  fi
fi

echo "==> Vercel Blob (listing media + private store objects)"
if [[ -d "${ROOT}/backups/export-drop/vercel-blob-files" ]]; then
  cp -a "${ROOT}/backups/export-drop/vercel-blob-files/." "${STAGING}/payload/blob/"
fi
node "${ROOT}/scripts/export-vercel-blob-download.mjs" "${STAGING}/payload/blob" 2>/dev/null || true
node "${ROOT}/scripts/export-vercel-blob-list.mjs" "${STAGING}/payload/blob/blob-list.json" 2>/dev/null || true

COMMIT="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
cat >"${STAGING}/manifest.json" <<EOF
{
  "kind": "SEAPS_ONE_CLICK_RESTORE",
  "createdAtUtc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit": "${COMMIT}",
  "installToWindows": "%USERPROFILE%\\\\lox-voice",
  "includes": ["full project", "vercel production secrets", "postgres dump", "vercel blob files"]
}
EOF

mv "${STAGING}" "${OUT_DIR}/${KIT_NAME}"
echo "==> Pack ${FINAL}"
tar -czf "$FINAL" -C "$OUT_DIR" "$KIT_NAME"

SHA="$(sha256sum "$FINAL" | awk '{print $1}')"
echo "${SHA}  $(basename "$FINAL")" >"${FINAL}.sha256"

echo "DONE: $FINAL ($(du -h "$FINAL" | awk '{print $1}')) sha256=$SHA"
