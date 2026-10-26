import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { adminListingPatchSchema, applyAdminListingPatch } from "@/lib/admin-listing-patch";
import {
  deleteRuntimeListing,
  getRuntimeListingById,
  saveRuntimeListing,
} from "@/lib/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const listing = await getRuntimeListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ listing });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await getRuntimeListingById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = adminListingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const updated = applyAdminListingPatch(existing, parsed.data);
  await saveRuntimeListing(updated);
  return NextResponse.json({ listing: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await getRuntimeListingById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "rejected") {
    return NextResponse.json(
      { error: "Only rejected listings can be deleted from this action" },
      { status: 400 },
    );
  }

  const removed = await deleteRuntimeListing(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
