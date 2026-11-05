#!/usr/bin/env node
/**
 * Download a site-request attachment (Bearer SITE_AGENT_SECRET or CRON_SECRET)
 * into public/ for static catalog covers.
 *
 *   node scripts/sync-site-request-attachment.mjs C9pb-Jyw9jfg/cover.JPG public/media/catalog/vue-aston-search-card-cover.jpg
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const storageKey = process.argv[2];
const outPath = process.argv[3];
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.seaps.asia").replace(/\/+$/, "");
const secret =
  process.env.SITE_AGENT_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "";

if (!storageKey || !outPath) {
  console.error("Usage: node scripts/sync-site-request-attachment.mjs <storageKey> <outPath>");
  process.exit(1);
}
if (!secret) {
  console.error("Missing SITE_AGENT_SECRET or CRON_SECRET");
  process.exit(1);
}

const url = `${siteUrl}/api/admin/site-requests/file?key=${encodeURIComponent(storageKey)}`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(60_000),
});
if (!res.ok) {
  console.error(`Download failed: HTTP ${res.status}`);
  process.exit(1);
}
const bytes = Buffer.from(await res.arrayBuffer());
if (bytes.length < 1024) {
  console.error(`Download too small (${bytes.length} bytes)`);
  process.exit(1);
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, bytes);
console.log(`Wrote ${bytes.length} bytes → ${outPath}`);
