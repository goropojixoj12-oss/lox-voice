# Executive admin desk (`/dashboard/admin`)

Separate from the agent desk (`/dashboard/agent`). After sign-in, **admin** users land on `/dashboard/admin`.

## Sections

| Path | Purpose |
|------|---------|
| `/dashboard/admin` | Site analytics — page views, session depth, top paths |
| `/dashboard/admin/staff` | Staff roster — profile %, listings, leads, tasks |
| `/dashboard/admin/staff/[id]` | Assign tasks, HR messages, profile gaps |
| `/dashboard/admin/legal` | Legal & policy library with per-document comments |
| `/dashboard/admin/listings` | Listing moderation queue |
| `/dashboard/admin/operations` | Links to users, projects, articles, locations |

## Data

- Page views: `analytics-pageviews.json` — real visits only (middleware on HTML loads + client beacon on SPA navigations). Legacy seed rows are purged automatically.
- On Vercel, JSON store writes need Blob with **`BLOB_STORE_ID` (or `VERCEL_BLOB_STORE_ID`) and the read-write token** on the same store; if writes fail, analytics stays empty until storage is fixed.
- Tasks & comments: `admin-tasks.json`, `admin-comments.json`
- Legal catalog: `admin-legal-docs.json` (seeded on first load)

Admin API: `/api/admin/tasks`, `/api/admin/comments` (admin session required).
