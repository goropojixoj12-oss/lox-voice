#!/usr/bin/env bash
# Dump Vercel Postgres using DATABASE_URL from Production env file.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-${ROOT}/backups/export-drop/.env.vercel.production}"
OUT="${2:-${ROOT}/backups/export-drop/postgres.dump.sql}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — run: ./scripts/export-vercel-env-production.sh" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

URL="${DATABASE_URL:-${POSTGRES_URL:-${PRISMA_DATABASE_URL:-}}}"
if [[ -z "$URL" ]]; then
  echo "No DATABASE_URL in $ENV_FILE" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Install postgresql-client (pg_dump)" >&2
  exit 1
fi

pg_dump "$URL" --no-owner --no-acl -F p -f "$OUT"
echo "OK: $(wc -c <"$OUT") bytes -> $OUT"
