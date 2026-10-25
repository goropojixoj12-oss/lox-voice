# Admin site change composer

Admins send UI / signed-in experience tasks from **`/dashboard/admin/site-changes`** (textarea, optional screenshot, **Send**).

## Storage

Requests live in `admin-site-change-requests.json` (same Blob/KV/filesystem stack as analytics).

## Cloud agent (Cursor) pickup

1. Set **`SITE_AGENT_SECRET`** (or reuse **`CRON_SECRET`**) on Vercel Production.
2. Poll or cron **`GET /api/admin/site-requests/pull`** with  
   `Authorization: Bearer <secret>`  
   → returns one `queued` item as `in_progress`, plus `attachmentUrl` when present.
3. Download screenshots with the same Bearer:  
   `GET /api/admin/site-requests/file?key=...`
4. After deploy, **`PATCH /api/admin/site-requests/{id}`** with JSON:
   `{ "status": "done", "commitUrl": "https://github.com/...", "agentNote": "..." }`

Optional: **`SITE_AGENT_WEBHOOK_URL`** receives a JSON POST when an admin sends a request (wire to Cursor Automation).

## Scope

Only public-site UI and logged-in user flows — not infrastructure, billing, or staff HR.
