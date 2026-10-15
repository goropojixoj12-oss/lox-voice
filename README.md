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
| Admin | admin@seaps.com.kh    | seaps-admin-123  |

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

## Market Feed (aggregation)

Public page: [/market-feed](http://127.0.0.1:43123/market-feed) — cards with title, price, location, type, and photo previews. **No** phone/email/messenger and **no** source name/URL on the public UI or `GET /api/aggregations`.

Admin (sign in as `admin@seaps.com.kh`): [/admin/market-feed](http://127.0.0.1:43123/admin/market-feed) — same list with contacts + source + original URL. JSON: `GET /api/aggregations/admin` (admin session required).

### Sync (polling adapters)

```bash
# While signed in as admin (browser cookie), or with a shared secret:
curl -X POST http://127.0.0.1:43123/api/aggregations/sync \
  -H "Authorization: Bearer $AGGREGATION_SYNC_SECRET"
```

- **Source registry:** `src/data/aggregation-sources.json` (773 URLs). All rows are **enabled by default**; disable per URL in Admin → **Market Feed → source registry** if needed.
- **Connected** = registered in JSON + last sync status (`ok`, `adapter_needed`, `fetch_error`, `blocked`, `skipped`) — not a guarantee of live listings on every site.
- Batched sync: **24 sources per cron run** by default (`AGGREGATION_BATCH_SIZE`, max 50), up to **4** parallel fetches (`AGGREGATION_SYNC_CONCURRENCY`), **52s** wall-clock cap (`AGGREGATION_SYNC_MAX_MS`). Cursor advances by sources actually processed. Query `?batchSize=30` or `?fullCycle=1` (admin; may timeout). ~773 enabled URLs ≈ **32 runs** → **~2.5 h** full rotation at a **5-minute** cron.
- **18** dedicated portal adapters (realestate.com.kh, khmer24, FazWaz, BongThom, DotProperty, …) plus generic HTML/RSS/JSON-LD heuristics for other portals and agencies. **No fake fallback listings.**
- Facebook/Telegram rows sync to status `blocked` (manual import / future API only).
- Dedupes by `externalId` or hash of `title|price|location`.
- Rate-limited. Set `AGGREGATION_SYNC_SECRET` (or Vercel `CRON_SECRET`) for cron/webhook auth without a browser session.
- **Automatic sync:**
  - **Netlify (primary):** `netlify/functions/aggregation-sync-scheduled.ts` → `GET /api/aggregations/sync` with `Authorization: Bearer …` (every minute).
  - **Vercel (Hobby):** `vercel.json` cron `0 3 * * *` (once daily, 03:00 UTC) when secrets are set. **Hobby allows at most one cron invocation per day** — for sub-hour sync use Netlify, Vercel Pro/Enterprise (e.g. `*/5 * * * *`), or an external scheduler hitting `GET /api/aggregations/sync` with Bearer auth.
  - Locally: **Sync now** in Admin → Market Feed or curl POST/GET above.
- Regenerate catalog JSON: `node scripts/build-aggregation-sources.mjs` (reads Project store markdown).
- First visit to Market Feed auto-seeds **only the demo adapter** if the store is empty. Full sync runs registry portals.
- Storage: JSON via **Redis** (`KV_REST_API_*`), **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`), or filesystem (`.data/` locally, `/tmp/seaps-data` on serverless). On Vercel without Blob/Redis, each instance has its own empty `/tmp` — cron imports will not show up on the public feed. Attach Blob or Redis in the Vercel project, redeploy, then run **Sync now** once.

### Facebook / Telegram

True zero-delay scrape of Facebook Groups, Marketplace, and Telegram for 600+ sources is **not** reliably possible without official APIs (and is blocked for private groups). Use:

- Admin **Import / paste listing** form on `/admin/market-feed`
- `POST /api/aggregations/import` (admin session or Bearer secret) for future Meta Graph / Telegram Bot connectors

We do not scrape private messages or bypass platform login walls.

### Market Feed production checklist (Vercel @ vps1.store)

1. **Persistent storage (required)** — In the Vercel project, add **Blob** or **Redis/Upstash** from Storage/Marketplace and **Redeploy**. Without this, `/tmp` is per-instance and the public feed stays empty even when cron runs.
2. **Cron auth** — Set `CRON_SECRET` (and/or `AGGREGATION_SYNC_SECRET`) in Production env. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` to `GET /api/aggregations/sync` once daily at 03:00 UTC on Hobby (`vercel.json`); use **Sync now** or curl for ad-hoc runs.
3. **Verify after deploy** — `curl -s https://www.vps1.store/api/aggregations/status` should show `storageBackend` ≠ `filesystem` (or `ephemeralFilesystem: false`) and `total` > 0 after sync.
4. **Manual sync once** — Sign in as admin → **Market Feed** → **Sync now** (or `curl -H "Authorization: Bearer $CRON_SECRET" -X POST https://www.vps1.store/api/aggregations/sync`).
5. **Expectations** — Demo + ~18 portal adapters always run; registry adds up to 24 URLs per cron batch. Many of 773 sites need dedicated parsers or return zero rows; that is normal.

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
