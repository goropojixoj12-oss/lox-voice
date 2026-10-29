#!/usr/bin/env bash
# Dump Postgres using DATABASE_URL or POSTGRES_URL from environment or .env file.
set -euo pipefail

OUT="${1:?usage: postgres-dump.sh /path/to/postgres-dump.sql}"

if [[ -z "${DATABASE_URL:-}" && -z "${POSTGRES_URL:-}" ]]; then
  for f in .env.vercel.production .env.local .env; do
    if [[ -f "$f" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "$f" 2>/dev/null || true
      set +a
    fi
  done
fi

URL="${DATABASE_URL:-${POSTGRES_URL:-}}"
if [[ -z "$URL" ]]; then
  echo "ERROR: DATABASE_URL not set. Run vercel env pull first." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump not found. Install PostgreSQL client tools." >&2
  exit 1
fi

pg_dump "$URL" --no-owner --no-acl -F p -f "$OUT"
echo "Wrote $OUT ($(wc -c <"$OUT") bytes)"
