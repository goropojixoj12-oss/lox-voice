# SEAPS — changes since previous backup (2026-10-16)

This document records production-relevant changes between the **previous restore point** and the **2026-10-16 stable backup** (`f296e24`).

## Restore points

| Role | Identifier | Commit / artifact |
|------|------------|-----------------|
| **Previous (pre-auth)** | Git tag `backup/2026-10-16-pre-auth-signed-session` | `e337dde` |
| **Previous (pre-password)** | Git tag `backup/2026-10-16-pre-password-hash` | `f5446f8` |
| **Filesystem snapshot** | `backups/seaps-backup-20261015-031110.tar.gz` | Oct 15, 2026 UTC |
| **Current stable** | Git tag `backup/2026-10-16-post-design-cross-browser` | `f296e24` |
| **Current tarball** | `backups/seaps-backup-20261016-*.tar.gz` | Created with `scripts/create-site-backup.sh` |

Production site: [https://www.vps1.store](https://www.vps1.store)  
GitHub: `goropojixoj12-oss/lox-voice` branch `main`  
Deploy: push via `bash scripts/push-production.sh` (Vercel watches GitHub `main`).

---

## 1. Security & auth

- **Signed sessions** (`f5446f8`): `en_session` cookie is HMAC-SHA256 signed with `AUTH_SECRET`; forged `{"userId":"user-admin"}` cookies no longer work. See `src/lib/auth.ts`.
- **Password hashes** (`45e97f3`): demo users in `src/data/users.ts` use bcrypt (cost 12); login via `verifyPassword`. Smokes: `scripts/smoke-session-auth.mjs`, `scripts/smoke-password-hash.mjs`.
- **Vercel env**: set `AUTH_SECRET` in Production (and Preview if needed). Demo passwords documented in `README.md` (not stored plaintext in repo).

---

## 2. Market Feed — ingest, storage, cleanup

- **Non–real-estate blocked at ingest** (`01a7853`) and **admin prune** (`fb13506`, `POST /api/aggregations/prune`).
- **Default junk filters** (`e337dde`, `ec927c1`): titles with fewer than five words; keywords including `wife`, `domain`, `forum`, `organized`, `news`, `casino`, `kasino`, `khmerhomes`, `broker`, `dreams`, `situs`, `hugedomain`, `ips`, `aps`. Logic in `src/lib/aggregations/relevance.ts`.
- **Vercel Blob private store** (`e111543`, `b73888e`): `@vercel/blob` uses `access: "private"`; reads via SDK. `src/lib/store-persistence.ts`.
- **Hobby plan crons removed** (`d21147f`): `vercel.json` crons cleared so deploys succeed; sync is manual/cron-secret via Admin → Sync now.
- **GitHub production push** (`4871586`, `scripts/push-production.sh`, `.cursor/rules/vercel-github-push.mdc`).
- **773 sources** registry + batched sync (earlier commits on `main` before this backup window).
- **Horizontal row cards** on public/admin Market Feed (layout CSS in `globals.css`, `market-feed-card.tsx`).

---

## 3. Branding & content

- **Third-party agency names removed** (`17b1189`): public desks are SEAPS Phnom Penh / Siem Reap / Coastal / Commercial; developer label SEAPS Developments; listing/article dates refreshed (~Oct 2026).
- **Homepage hero copy** (`6e9da65`, `ca97b58`): full SEAPS positioning headline and services paragraph on `src/app/page.tsx`.
- **Person names** (`f05bb15`): agents, demo users, article authors → **Adam James** (`src/data/agencies.ts`, `src/data/users.ts`, `src/data/articles.ts`).

---

## 4. Homepage hero layout

- **Raised hero padding** (`16b7ba7`).
- **Logo + company name centered in the left column** only, not full-page center (`bf1fabf`) — grid `lg:grid-cols-[1.1fr_0.9fr]`.
- Company line uses `brand.fullName` with class `seaps-brand-subtitle`.

---

## 5. Navigation & gold UI (cross-browser)

- **Living gold nav** restored (`9fdf3b0`, `.seaps-gold-text` on `site-header.tsx`).
- **Cross-browser fixes** (`f296e24`):
  - Solid gold fallback when `background-clip: text` fails (invisible menu/labels).
  - `seaps-brand-subtitle` for hero company name (no clip).
  - Google Translate: `notranslate` on nav; `<font>` inherits gradient where clip is supported.
  - Header background `rgba(7,17,31,0.92)` fallback; nav visible from `md` breakpoint.
- **Build fix** (`14f7e80`): `normalize-branding.ts` uses `lastWarnings` on sync meta (Vercel TypeScript build).

---

## 6. Documentation & rules

- `b227628`: Cursor rules management guide.
- `docs/market-feed-vercel-setup-guide.md`, ingest filter notes, user-action rules (from earlier session).
- This changelog and `scripts/create-site-backup.sh`.

---

## Commit list (`e337dde` → `f296e24`)

```
b227628 docs: add cursor rules management guide (#1)
f5446f8 fix: HMAC-sign en_session cookies with AUTH_SECRET
45e97f3 fix: store demo passwords as bcrypt hashes
9fdf3b0 fix: restore living gold text on primary nav links
ec927c1 feat: expand market-feed junk keywords and URL blocks
17b1189 fix: rebrand public agencies/projects to SEAPS and refresh dates
6e9da65 content: update homepage hero copy for SEAPS positioning
14f7e80 fix: repair normalize-branding sync meta types for Vercel build
ca97b58 content: update homepage hero with full SEAPS company copy
f05bb15 content: replace all public person names with Adam James
16b7ba7 design: center hero logo and brand name, reduce top spacing
bf1fabf fix(hero): center logo and company name in left column only
f296e24 fix(a11y): solid gold fallbacks for nav and brand across browsers
```

---

## How to restore

**From git tag (recommended):**

```bash
git fetch github tag backup/2026-10-16-post-design-cross-browser
git checkout backup/2026-10-16-post-design-cross-browser
```

**From bundle in `backups/`:**

```bash
git clone backups/seaps-main-YYYYMMDD-HHMMSS.bundle restored-seaps
cd restored-seaps && npm ci && npm run build
```

**From tarball:**

```bash
mkdir restore && tar -xzf backups/seaps-backup-YYYYMMDD-HHMMSS.tar.gz -C restore
cd restore && npm ci && npm run build
```

Blob/KV data on Vercel is **not** in repo backups; export separately from Vercel Storage if needed.
