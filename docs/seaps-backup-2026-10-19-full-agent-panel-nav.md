# SEAPS backup · 2026-10-19 (full · agent panel + nav)

| Field | Value |
| ----- | ----- |
| **Tag** | `backup/2026-10-19-full-agent-panel-nav` |
| **Commit** | `95ab620` (archives built at `10058a4`; tag tracks latest restore doc) |
| **Branch** | `main` |
| **Production** | https://www.vps1.store |
| **GitHub** | `goropojixoj12-oss/lox-voice` |

Tag pushed to `github` and `origin`.

## Restore from tag (easiest on your PC)

```bash
git clone https://github.com/goropojixoj12-oss/lox-voice.git seaps-restore
cd seaps-restore
git fetch origin tag backup/2026-10-19-full-agent-panel-nav
git checkout 95ab620
npm ci
npm run build
```

## Local backup artifacts (not in git)

Created with `scripts/create-site-backup.sh` — stamp **20261019-013123**:

| File | Purpose |
| ---- | ------- |
| `seaps-backup-20261019-013123.tar.gz` | Source tree (no `.git`, no `node_modules`) |
| `seaps-backup-full-20261019-013123.tar.gz` | Same + full `.git` history |
| `seaps-main-20261019-013123.bundle` | Offline `git clone` bundle |
| `seaps-backup-kit-20261019-013123.zip` | All of the above + manifest + README (on cloud VM under `backups/`) |
| `seaps-backup-20261019-013123-manifest.json` | Restore commands |

**Cursor agent store copy** (download from project Files / media):

`/cursor/stores/bc-73660627-477d-47a4-92a5-8d15712a5dd8/media/backups/20261019-013123/`

Individual archives are there; use the `.tar.gz` / `.bundle` files if a single zip is too large to sync.

## Snapshot includes (high level)

- Agent demo display name **Agent1** (`agent@seaps.com.kh`)
- **Admin** hidden from dashboard nav for non-admin roles
- Prior shipped: hero/search/footer/nav/gold UI, auth, listings, aggregations, etc.

## Not included

- Vercel Blob/KV runtime data — export from Vercel Storage if you need live listing blobs.
- `node_modules` / `.next` — run `npm ci && npm run build` after restore.
