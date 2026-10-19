# SEAPS

South East Asia Property Services — Cambodian real estate marketplace built with Next.js, TypeScript, and Tailwind CSS.

Founded in **1997**. Listings, projects, agencies, and market guides focused on Cambodia.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Access accounts

| Role  | Email                 | Password         |
| ----- | --------------------- | ---------------- |
| Buyer | buyer@seaps.com.kh    | seaps-buyer-123  |
| Owner | owner@seaps.com.kh    | seaps-owner-123  |
| Agent | agent@seaps.com.kh    | seaps-agent-123  |
| Admin | ceo@seaps.asia        | ceo@seaps.asiaQ  |

## Brand

Edit `src/config/brand.ts` and CSS variables in `src/app/globals.css`.

## Self-contained assets + translation

Local (no Unsplash / Google Fonts CDN):

- Fonts: `src/fonts/*.woff2` via `next/font/local`
- Photos: `public/media/photos/*.jpg`
- Videos: `public/videos/*`
- Brand mark: `public/brand/seaps-logo.png`
- Language boot: `public/scripts/seaps-lang-boot.js`

Translation uses the hidden Google Website Translator (network). Browser/OS locale can be any language; the header menu (EN / ខ្� hidden Google Website Translator (network). Browser/OS locale can be any language; the header menu (EN / ខ្មែរ / 中文 / 日本語) overrides and persists.

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
