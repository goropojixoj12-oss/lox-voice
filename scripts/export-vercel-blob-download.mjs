#!/usr/bin/env node
/**
 * Download all blobs from Vercel Blob store into a local directory (photos, uploads).
 */
import { mkdirSync, writeFileSync, createWriteStream } from "node:fs";
import { join, dirname } from "node:path";
import { pipeline } from "node:stream/promises";

const outDir = process.argv[2] ?? "backups/export-drop/vercel-blob-files";
const token =
  process.env.BLOB_READ_WRITE_TOKEN ??
  process.env.VERCEL_BLOB_READ_WRITE_TOKEN ??
  "";

mkdirSync(outDir, { recursive: true });

if (!token) {
  writeFileSync(
    join(outDir, "ERROR.txt"),
    "Set BLOB_READ_WRITE_TOKEN from vercel env pull .env.vercel.production",
  );
  console.error("Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

const { list } = await import("@vercel/blob");

const manifest = [];
let cursor;
do {
  const page = await list({ token, cursor });
  for (const b of page.blobs) {
    const safeName = b.pathname.replace(/[^a-zA-Z0-9._/-]/g, "_");
    const filePath = join(outDir, safeName);
    mkdirSync(dirname(filePath), { recursive: true });
    const res = await fetch(b.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      manifest.push({ pathname: b.pathname, error: res.status, url: b.url });
      continue;
    }
    await pipeline(res.body, createWriteStream(filePath));
    manifest.push({
      pathname: b.pathname,
      file: safeName,
      size: b.size,
      uploadedAt: b.uploadedAt,
    });
    console.log("OK", b.pathname);
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

writeFileSync(join(outDir, "blob-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Done: ${manifest.length} entries in ${outDir}`);
