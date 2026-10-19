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

- Page views: `analytics-pageviews.json` (+ live beacon on navigation)
- Tasks & comments: `admin-tasks.json`, `admin-comments.json`
- Legal catalog: `admin-legal-docs.json` (seeded on first load)

Admin API: `/api/admin/tasks`, `/api/admin/comments` (admin session required).
