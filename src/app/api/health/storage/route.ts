import { NextResponse } from "next/server";
import { pingStore, resolveStorePersistenceBackend } from "@/lib/store-persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Proves where the non-listing data actually lives right now. */
export async function GET() {
  const ping = await pingStore();
  return NextResponse.json({
    ...ping,
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    at: new Date().toISOString(),
  });
}