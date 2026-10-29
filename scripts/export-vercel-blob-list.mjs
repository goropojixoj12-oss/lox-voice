#!/usr/bin/env node
/**
 * List all blobs in the connected store (metadata). Full binary export needs separate download script with token.
 */
import { writeFileSync } from "node:fs";

const outPath = process.argv[2] ?? "blob-list.json";
const token =
  process.env.BLOB_READ_WRITE_TOKEN ??
  process.env.VERCEL_BLOB_READ_WRITE_TOKEN ??
  "";

if (!token) {
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        error: "missing_token",
        hint: "Run: vercel env pull .env.vercel.production --environment=production then BLOB_READ_WRITE_TOKEN=... node scripts/export-vercel-blob-list.mjs",
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const { list } = await import("@vercel/blob");

const all = [];
let cursor;
do {
  const page = await list({ token, cursor });
  for (const b of page.blobs) {
    all.push({
      pathname: b.pathname,
      url: b.url,
      size: b.size,
      uploadedAt: b.uploadedAt,
    });
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

writeFileSync(outPath, JSON.stringify({ count: all.length, blobs: all }, null, 2));
console.log(`Wrote ${all.length} blob entries to ${outPath}`);
