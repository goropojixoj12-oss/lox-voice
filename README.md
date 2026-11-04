# SEAPS

South East Asia Property Services — Cambodian real estate marketplace built with Next.js, TypeScript, and Tailwind CSS.

Founded in **1997**. Listings, projects, agencies, and market guides focused on Cambodia.

## Run locally

From a fresh clone of [goropojixoj12-oss/lox-voice](https://github.com/goropojixoj12-oss/lox-voice) `main`:

```bash
node scripts/restore-package-lock.mjs
npm ci
npm run dev
```

If `npm ci` still complains about the lockfile, run `npm install` once (regenerates `package-lock.json` from `package.json`), then `npm run dev`.

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Smoke contract

`npm run smoke` walks the running build with GET requests only (plus one login POST
per role) and fails with exit 1 on the first broken contract: route statuses, the
nav and brand checkpoints of section 8 in `AGENTS.md`, the Vue Aston card, retired
photo sets staying 404, and `\uXXXX` escapes printing as visible text.

```bash
npm run smoke -- --base=http://127.0.0.1:43123   # or https://www.seaps.asia
npm run smoke -- --only dashboard                # subset by path/name
npm run smoke -- --json                          # machine-readable summary
npm run smoke -- --list                          # print the checklist, no requests
```

Roles use `SMOKE_AGENT_EMAIL` / `SMOKE_AGENT_PASSWORD` / `SMOKE_ADMIN_EMAIL` /
`SMOKE_ADMIN_PASSWORD`, taken from the environment first and then from `.env.test`
(gitignored). The script never prints a password and never sends a mutating
request, so it is safe against prod. Add a check to `CHECKS` in
`scripts/smoke-site.mjs` with the same commit that lands or retires a feature
(rule 20 in `AGENTS.md`).

### Two local folders on Windows?

If you have both `C:\Users\Administrator\lox-voice` and a `khmer_backup\lox-voice` copy, read **[docs/local-windows-clones-guide-ru.md](docs/local-windows-clones-guide-ru.md)** and run **`scripts/compare-windows-clones.ps1`** to pick one primary clone before `git push`.

## Access accounts

Log in at [/auth/login](http://127.0.0.1:43123/auth/login) with one of these emails.
Passwords are not published here any more: keep them in the gitignored `.env.test`
next to this README, one per line:

```
SMOKE_AGENT_EMAIL=agent@seaps.com.kh
SMOKE_AGENT_PASSWORD=...
SMOKE_ADMIN_EMAIL=ceo@seaps.asia
SMOKE_ADMIN_PASSWORD=...
```

`npm run smoke` reads the same file. Windows: `notepad .env.test` shows what you
saved there. The demo accounts are `buyer@seaps.com.kh`, `owner@seaps.com.kh`,
`agent@seaps.com.kh`, `ceo@seaps.asia` (admin); their bcrypt hashes live in
`src/data/users.ts`. Note: the old values are still in git history from when this
table was public, so rotating them is the only real cleanup — ask before rotating,
it changes every existing login.

## Brand

Edit `src/config/brand.ts` and CSS variables in `src/app/globals.css`.

## Self-contained assets + translation

Local (no Unsplash / Google Fonts CDN):

- Fonts: `src/fonts/*.woff2` via `next/font/local`
- Photos: `public/media/photos/*.jpg`
- Videos: `public/videos/*`
- Brand mark: `public/brand/seaps-logo.png`
- Language boot: `public/scripts/seaps-lang-boot.js`

Translation uses the hidden Google Website Translator (network). Browser/OS locale can be any language; the header menu (EN / ខ្មែរ / 中文 / 日本語) overrides and persists.

## Deploy path

**Vercel production:** `main` on GitHub [`goropojixoj12-oss/lox-voice`](https://github.com/goropojixoj12-oss/lox-voice) → Vercel. That repo is the only deploy trigger for production (e.g. `vps1.store`).

| Remote   | Role |
| -------- | ---- |
| `github` | Public GitHub repo — **must** receive every production change |
| `origin` | Cursor cloud mirror — optional sync; **not** wired to Vercel |

After commits on `main`, run:

```bash
./scripts/push-production.sh
```

Agents and CI must not treat work as done until `git push` to **`github`** succeeds. Для Vercel продакшена пуш в `github`, а не только в `origin`.

## Deploy

**Netlify (recommended):** Connect the GitHub repo, set build command `npm run build`, and in **production** env set at least:

| Variable | Purpose |
| -------- | ------- |
| `AGGREGATION_SYNC_SECRET` | Bearer token for scheduled sync (generate a long random string) |
| `CRON_SECRET` | Optional alias; Netlify scheduler and `/api/aggregations/sync` accept either secret |
| `AUTH_SECRET` | Session signing |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (e.g. `https://www.vps1.store`) |

Scheduled aggregation sync: `netlify.toml` + `netlify/functions/aggregation-sync-scheduled.ts` (`* * * * *`).

**Vercel (optional):** Set the same env vars in **Production**. Set `CRON_SECRET` and/or `AGGREGATION_SYNC_SECRET` to the same value you expect on the Bearer header. `vercel.json` uses **`0 3 * * *`** (daily) so **Hobby** deploys succeed; on **Pro/Enterprise** you may change the schedule to `*/5 * * * *` or similar for frequent sync.

Add your custom domain (for example `vps1.store`) in the host’s domain settings.
