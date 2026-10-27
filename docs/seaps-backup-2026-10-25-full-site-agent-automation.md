# SEAPS backup · 2026-10-25 (full · site agent + automation)

| Field | Value |
| ----- | ----- |
| **Tag (local)** | `backup/2026-10-25-full-site-agent-automation` @ `1084dd9` |
| **GitHub branch** | `backup/2026-10-25-full-site-agent-automation` (restore point on GitHub) |
| **Branch** | `main` |
| **Production** | https://www.vps1.store |
| **GitHub** | `goropojixoj12-oss/lox-voice` |
| **Local stamp** | `20261025-093252` |

## Snapshot includes (high level)

- Admin **Site changes** composer + **Run agent** dispatch
- **SITE_AGENT** webhook/cron automation wiring
- Store persistence fallback (KV/Blob/filesystem)
- Prior shipped SEAPS UI, auth, listings, aggregations, analytics

## Restore from GitHub branch

```bash
git clone https://github.com/goropojixoj12-oss/lox-voice.git seaps-restore
cd seaps-restore
git checkout backup/2026-10-25-full-site-agent-automation
npm ci
npm run build
```

## Local backup kit (20261025-093252)

| File | ~Size |
| ---- | ----- |
| `seaps-backup-kit-20261025-093252.zip` | 202 MB (workspace `backups/`) |
| `seaps-backup-full-*.tar.gz` | full tree + `.git` |
| `seaps-all-refs-*.bundle` | all git refs offline |
| `seaps-inventory-*.json` | env **names**, docs/scripts lists |

**Agent store copy:** `/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8/media/backups/20261025-093252/` (archives; zip may be 0 bytes there — use workspace zip or re-run script).

Run again anytime:

```bash
./scripts/create-site-backup.sh backup/2026-10-25-full-site-agent-automation
```

**Playbook (RU):** `docs/full-backup-playbook-ru.md`

## Not in git archives

- Vercel env **values**, Blob/KV live data — export from Vercel dashboard
- Cursor webhook Bearer — password manager only
- `node_modules` / `.next` — rebuild after restore
