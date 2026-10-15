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

- Adapters: **demo** (always seeds sample Cambodia listings), plus soft HTML polls for `realestate.com.kh` and `khmer24` property paths (fallback samples when blocked/SPA).
- Dedupes by `externalId` or hash of `title|price|location`.
- Rate-limited. Set `AGGREGATION_SYNC_SECRET` for cron/webhook auth without a browser session.
- First visit to Market Feed auto-seeds the demo adapter if the store is empty (`.data/aggregated-listings.json` or `/tmp/seaps-data`).

### Facebook / Telegram

True zero-delay scrape of Facebook Groups, Marketplace, and Telegram for 600+ sources is **not** reliably possible without official APIs (and is blocked for private groups). Use:

- Admin **Import / paste listing** form on `/admin/market-feed`
- `POST /api/aggregations/import` (admin session or Bearer secret) for future Meta Graph / Telegram Bot connectors

We do not scrape private messages or bypass platform login walls.

## Deploy

Connect the GitHub repository to Vercel, then add your custom domain (for example `vps1.store`) in Vercel → Settings → Domains.
