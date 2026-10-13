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

## Offline / self-contained assets

Runtime assets are local (no Unsplash / Google Fonts / Google Translate CDN):

- Fonts: `src/fonts/*.woff2` via `next/font/local`
- Photos: `public/media/photos/*.jpg`
- Videos: `public/videos/*`
- Brand mark: `public/brand/seaps-logo.png`
- Language boot: `public/scripts/seaps-lang-boot.js`

The language menu (EN / ខ្មែរ / 中文 / 日本語) stores a local preference only — it does not call external translation APIs.

## Deploy

Connect the GitHub repository to Vercel, then add your custom domain (for example `vps1.store`) in Vercel → Settings → Domains.
