#!/usr/bin/env bash
# Push SMTP_* from .env.local to Vercel (Production + Preview). Requires: vercel login, project linked.
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE="${1:-.env.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — create it from .env.example with SMTP_PASS set."
  exit 1
fi
# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a
: "${SMTP_PASS:?SMTP_PASS must be set in $ENV_FILE}"
PROJECT="${VERCEL_PROJECT:-lox-voice}"
SCOPE="${VERCEL_SCOPE:-estate11}"
add_var() {
  local key="$1" val="$2" sensitive="${3:-0}"
  echo "Setting $key on Vercel ($PROJECT, scope $SCOPE)..."
  if [[ "$sensitive" == "1" ]]; then
    printf '%s' "$val" | npx vercel@latest env add "$key" production preview --sensitive --force --scope "$SCOPE" --project "$PROJECT"
  else
    printf '%s' "$val" | npx vercel@latest env add "$key" production preview --force --scope "$SCOPE" --project "$PROJECT"
  fi
}
add_var SMTP_HOST "${SMTP_HOST:-smtp.hostinger.com}" 0
add_var SMTP_PORT "${SMTP_PORT:-465}" 0
add_var SMTP_USER "${SMTP_USER:-internal@seaps.asia}" 0
add_var SMTP_FROM "${SMTP_FROM:-internal@seaps.asia}" 0
add_var SMTP_TO "${SMTP_TO:-ceo@seaps.asia}" 0
add_var SMTP_PASS "$SMTP_PASS" 1
echo "Done. Redeploy production in Vercel Dashboard (Deployments → Redeploy)."
