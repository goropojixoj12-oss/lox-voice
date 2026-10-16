# SEAPS backup · 2026-10-16 (footer nav + homepage trim)

| Field | Value |
| ----- | ----- |
| **Tag** | `backup/2026-10-16-footer-nav-homepage-trim` |
| **Commit** | `4cf4ab1` |
| **Branch** | `main` |
| **Production** | https://www.vps1.store |
| **GitHub** | `goropojixoj12-oss/lox-voice` |

Tag pushed to `github` and `origin`.

## Restore from tag

```bash
git fetch github tag backup/2026-10-16-footer-nav-homepage-trim
git checkout 4cf4ab1
```

## Local backup artifacts (not in git)

Created on the machine that ran `scripts/create-site-backup.sh`:

- `backups/seaps-backup-20261016-155001.tar.gz`
- `backups/seaps-main-20261016-155001.bundle`
- `backups/seaps-backup-20261016-155001-manifest.json`

## Snapshot includes (high level)

- Footer menu aligned with header via shared `primaryNav`
- Support email `sales@seaps.asia` via `brand.supportEmail`
- Homepage trim: popular cities (names only), single market insights article, tailored shortlist CTA
- Prior shipped: hero social + promo buttons, nav dropdowns, Property Guide, Careers, `/sale`, `/inquires`, no Market Feed
