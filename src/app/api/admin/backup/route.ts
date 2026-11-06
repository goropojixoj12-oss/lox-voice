import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { authorizeSiteAgent } from "@/lib/site-agent-auth";
import {
  listStoreBlobKeys,
  readStoreBlob,
  readStoreRaw,
  writeStoreBlob,
} from "@/lib/store-persistence";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const BYTE_BUDGET = 2_500_000;

async function authorized(request: Request): Promise<boolean> {
  const agent = await authorizeSiteAgent(request);
  if (agent.ok) return true;
  const session = await requireRole(["admin"]);
  return session !== null;
}

/**
 * Full inventory dump of the service store.
 *
 * Blobs are paginated: a single buffered response is capped by the platform, so
 * the caller walks `nextOffset` until it is null and reassembles the archive on
 * its side. Store keys (JSON documents) come only with the first page.
 */
export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "Admin only" }, { status: 401 });
  }

  const url = new URL(request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);

  const keys = await listStoreBlobKeys();
  const page: { key: string; contentType: string; size: number; base64: string }[] = [];
  let bytes = 0;
  let index = offset;

  for (; index < keys.length; index += 1) {
    const key = keys[index];
    const blob = await readStoreBlob(key);
    if (!blob) continue;
    const base64 = blob.bytes.toString("base64");
    if (page.length > 0 && bytes + base64.length > BYTE_BUDGET) break;
    page.push({ key, contentType: blob.contentType, size: blob.bytes.length, base64 });
    bytes += base64.length;
  }

  const store: Record<string, string> = {};
  if (offset === 0) {
    const storeKeys = await listStoreKeys();
    for (const key of storeKeys) {
      const value = await readStoreRaw(key);
      if (value != null) store[key] = value;
    }
  }

  return NextResponse.json({
    total: keys.length,
    offset,
    nextOffset: index < keys.length ? index : null,
    store,
    blobs: page,
  });
}

/** Stores a finished archive next to the service data (Postgres). */
export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "Admin only" }, { status: 401 });
  }

  const url = new URL(request.url);
  const name = (url.searchParams.get("name") ?? "backup.zip").replace(/[^\w.-]+/g, "_");
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }
  if (bytes.length > 120 * 1024 * 1024) {
    return NextResponse.json({ error: "Archive is larger than 120 MB" }, { status: 413 });
  }

  const key = `backups/${name}`;
  await writeStoreBlob(key, bytes, "application/zip");
  return NextResponse.json({ ok: true, key, size: bytes.length });
}

async function listStoreKeys(): Promise<string[]> {
  const { listStoreTextKeys } = await import("@/lib/store-persistence");
  return listStoreTextKeys();
}