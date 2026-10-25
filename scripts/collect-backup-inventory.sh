#!/usr/bin/env bash
# Machine-readable inventory for SEAPS backups (no secret values).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
STAMP="${1:?usage: collect-backup-inventory.sh STAMP}"
OUT="${ROOT}/backups/seaps-inventory-${STAMP}.json"

ENV_KEYS="$(grep -E '^[A-Z_][A-Z0-9_]*=' "$ROOT/.env.example" 2>/dev/null | cut -d= -f1 | sort -u | jq -R . | jq -s . || echo '[]')"

DOCS="$(find "$ROOT/docs" -type f 2>/dev/null | sed "s|^$ROOT/||" | sort | jq -R . | jq -s . || echo '[]')"
SCRIPTS="$(find "$ROOT/scripts" -type f 2>/dev/null | sed "s|^$ROOT/||" | sort | jq -R . | jq -s . || echo '[]')"

REMOTES="$(git remote -v | awk '{print $1, $2}' | sort -u | jq -R . | jq -s .)"
TAGS="$(git tag -l 'backup/*' | sort | jq -R . | jq -s .)"
BRANCHES="$(git branch -a | sed 's/^[* ]*//' | sort -u | jq -R . | jq -s .)"

HAS_DATA="false"
if [[ -d "$ROOT/.data" ]]; then HAS_DATA="true"; fi

STORE_SNAPSHOT=""
if [[ -d "/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8" ]]; then
  STORE_SNAPSHOT="/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8"
fi

jq -n \
  --arg createdAtUtc "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg commit "$(git rev-parse HEAD)" \
  --arg branch "$(git rev-parse --abbrev-ref HEAD)" \
  --arg site "https://www.vps1.store" \
  --arg githubRepo "goropojixoj12-oss/lox-voice" \
  --arg hasLocalData "$HAS_DATA" \
  --arg agentStorePath "$STORE_SNAPSHOT" \
  --argjson envKeys "$ENV_KEYS" \
  --argjson docs "$DOCS" \
  --argjson scripts "$SCRIPTS" \
  --argjson remotes "$REMOTES" \
  --argjson backupTags "$TAGS" \
  --argjson branches "$BRANCHES" \
  '{
    createdAtUtc: $createdAtUtc,
    commit: $commit,
    branch: $branch,
    production: { site: $site, githubRepo: $githubRepo },
    git: { remotes: $remotes, backupTags: $backupTags, branches: $branches },
    envVarNamesFromExample: $envKeys,
    docs,
    scripts,
    localDataDir: { path: ".data", present: ($hasLocalData == "true") },
    agentStoreSnapshotHint: $agentStorePath,
    externalNotInArchive: [
      "Vercel Production environment variable VALUES (export manually from dashboard)",
      "Vercel Blob object store binary data",
      "Vercel KV / Redis live keys",
      "Cursor Automation webhook URL and Bearer (regenerate if leaked)",
      "node_modules and .next (rebuild with npm ci && npm run build)"
    ],
    vercelManualChecklist: [
      "Project Settings → Environment Variables → Export or copy each Production key",
      "Storage → Blob store name and connection",
      "Storage → Redis/KV connection if used",
      "Settings → Cron Jobs → confirm /api/cron/site-agent",
      "Deployments → note latest production deployment ID"
    ],
    githubManualChecklist: [
      "Repository → Settings → confirm default branch main",
      "Releases → optional: attach backup kit zip from local backups/",
      "Tags → verify backup/* tag pushed after running create-site-backup.sh"
    ]
  }' > "$OUT"

echo "$OUT"
