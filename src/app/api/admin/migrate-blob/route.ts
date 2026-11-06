import { NextResponse } from "next/server";
import { list, get } from "@vercel/blob";
import { authorizeSiteAgent } from "@/lib/site-agent-auth";
import { writeStoreRaw, writeStoreBlob, pingStore } from "@/lib/store-persistence";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const STORE_PREFIX = "seaps-data/";
const MAX_ITEMS = 5000;

/**
 * One-off migration: Vercel Blob -> Postgres.
 * Bearer SITE_AGENT_SECRET / CRON_SECRET. Safe to run twice (upsert).
 */
export async function POST(request: Request) {
  const auth = await authorizeSiteAgent(request);
  if (!auth.ok || auth.viaAdminSession) {
    return NextResponse.json({ error: "Use Bearer token" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN missing" }, { status: 503 });

  let cursor: string | undefined;
  let migratedJson = 0;
  let migratedBinary = 0;
  const errors: string[] = [];
  let scanned = 0;

  do {
    const page = await list({ token, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      scanned += 1;
      if (scanned > MAX_ITEMS) break;
      const pathname = blob.pathname;

      try {
        const res = await get(pathname, { token, access: "private" });
        if (!res || res.statusCode !== 200 || !res.stream) {
          errors.push(`${pathname}: read ${res?.statusCode ?? "null"}`);
          continue;
        }
        const bytes = Buffer.from(await new Response(res.stream).arrayBuffer());

        if (pathname.startsWith(STORE_PREFIX) && pathname.endsWith(".json")) {
          const key = pathname.slice(STORE_PREFIX.length);
          await writeStoreRaw(key, bytes.toString("utf8"));
          migratedJson += 1;
        } else {
          await writeStoreBlob(pathname, bytes, res.blob.contentType ?? "application/octet-stream");
          migratedBinary += 1;
        }
      } catch (error) {
        errors.push(`${pathname}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor && scanned <= MAX_ITEMS);

  const health = await pingStore();
  return NextResponse.json({
    ok: errors.length === 0,
    scanned,
    migratedJson,
    migratedBinary,
    errors: errors.slice(0, 20),
    store: health,
  });
}