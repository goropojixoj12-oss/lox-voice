#!/usr/bin/env bash
# Full Production env file for backup kit (requires: vercel login + project link).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-${ROOT}/backups/export-drop/.env.vercel.production}"

mkdir -p "$(dirname "$OUT")"
cd "$ROOT"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Install: npm i -g vercel" >&2
  exit 1
fi

vercel link --yes --project lox-voice 2>/dev/null || vercel link --project lox-voice
vercel env pull "$OUT" --environment=production --yes

echo "Wrote $(wc -l <"$OUT") lines -> $OUT"
echo "Keys present:"
grep -E '^[A-Z_]+=' "$OUT" | cut -d= -f1 | sort -u
