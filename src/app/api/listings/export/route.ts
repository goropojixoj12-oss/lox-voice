import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getRuntimeListingById } from "@/lib/store";
import { getPropertyById } from "@/data/properties";
import { exportListingToRepo } from "@/lib/listing-export";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  id: z.string().min(1).max(200),
});

/**
 * Publish a cabinet listing into the repository (single source of truth).
 * Admin: any listing. Agent/owner: only the listings they created.
 */
export async function POST(request: Request) {
  const session = await requireRole(["admin", "agent", "owner"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const listing = (await getRuntimeListingById(parsed.data.id)) ?? getPropertyById(parsed.data.id) ?? null;
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  if (session.role !== "admin") {
    const mine = listing.createdByUserId === session.id || listing.ownerId === session.id;
    if (!mine) return NextResponse.json({ error: "Not your listing" }, { status: 403 });
  }

  try {
    const result = await exportListingToRepo(listing);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    console.error("[listings/export]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}