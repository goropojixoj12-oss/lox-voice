# EstateNova

International real estate marketplace demo built with Next.js, TypeScript, and Tailwind CSS.

EstateNova is an original product concept inspired by the *category* of large property portals (buy, rent, short stay, developments, agencies, insights). It does **not** copy the design system, branding, or content of any reference site.

## What works in this demo

- Multi-page marketplace UI in English
- Configurable brand tokens in `src/config/brand.ts` and CSS variables in `src/app/globals.css`
- Seed catalog: 20 properties, projects, agencies, agents, cities/districts, articles
- Working search filters + sort + pagination with URL state
- List / map toggle (schematic map until Mapbox token is set)
- Property detail pages with gallery lightbox and inquiry form
- Favorites (guest localStorage or signed-in `.data` store)
- Saved searches (browser storage) with restore links
- Demo auth roles: buyer, owner, agent, admin
- Listing wizard (owner/agent) writing pending listings to `.data/listings.json`
- Admin overview gated by server-side role checks
- SEO basics: metadata, sitemap, robots
- Prisma PostgreSQL schema prepared in `prisma/schema.prisma`

All inventory is **demo data**. Market indicators are labeled as sample figures.

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

Copy `.env.example` to `.env.local` when you need maps or Postgres.

## Demo accounts

| Role  | Email                   | Password         |
| ----- | ----------------------- | ---------------- |
| Buyer | buyer@estatenova.demo   | demo-buyer-123   |
| Owner | owner@estatenova.demo   | demo-owner-123   |
| Agent | agent@estatenova.demo   | demo-agent-123   |
| Admin | admin@estatenova.demo   | demo-admin-123   |

Open registration returns `501` until Prisma user persistence is connected.

## Architecture

```
src/
  config/brand.ts          # replaceable brand parameters
  data/                    # demo seed inventory
  lib/                     # search, auth, store, catalog helpers
  components/              # UI, property, search, layout modules
  app/                     # App Router pages + API routes
prisma/schema.prisma       # production-oriented Postgres model
.data/                     # runtime demo persistence (gitignored)
```

### API contracts

- `GET/POST /api/favorites`
- `GET/POST /api/inquiries`
- `GET/POST /api/properties`
- `POST /api/auth/login|logout|register`
- `GET /api/auth/session`

### Integrations not faked

- Mapbox / Google Maps: configure tokens; otherwise schematic pin board
- S3 uploads: listing wizard accepts image URLs in demo mode
- Email / SMS / WhatsApp / payments: UI copy documents required setup only

## Brand swap

1. Edit `src/config/brand.ts` (name, tagline, support email, map provider)
2. Edit CSS variables in `src/app/globals.css`
3. Replace logo mark text in the header or point it to an SVG asset

## Production path

1. Provision PostgreSQL and set `DATABASE_URL`
2. Run `npx prisma migrate dev`
3. Replace `.data` JSON store with Prisma repositories
4. Hash passwords with bcrypt (or better) and rotate `AUTH_SECRET`
5. Connect S3-compatible storage for image uploads
6. Enable Mapbox or Google Maps
7. Add rate limiting at the edge and real email delivery for inquiries/alerts

## Scripts

- `npm run dev` — development server on port `43123`
- `npm run build` — production build
- `npm run start` — start production server on port `43123`
- `npm run lint` — ESLint

## License / media

Unsplash photographs are used for demonstration only. Replace with licensed inventory media before commercial launch.
