import { NextResponse } from "next/server";
import { pingStore } from "@/lib/store-persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Proves where the non-listing data actually lives right now. */
export async function GET() {
  const ping = await pingStore();
  return NextResponse.json({
    ...ping,
    at: new Date().toISOString(),
  });
}
