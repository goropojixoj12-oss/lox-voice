import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import {
  deleteRuntimeListing,
  getRuntimeListingById,
  saveRuntimeListing,
} from "@/lib/store";
import { resetListingViewTracking } from "@/lib/listing-view-store";
import type { ListingStatus, Property } from "@/lib/types";

const patchSchema = z.object({
  action: z.enum(["save", "publish", "reject"]).optional(),
  title: z.string().min(8).optional(),
  summary: z.string().min(12).optional(),
  description: z.string().min(40).optional(),
  price: z.number().positive().optional(),
  currency: z.string().min(3).optional(),
  status: z.enum(["pending", "published", "rejected"]).optional(),
});

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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const now = new Date().toISOString();
  let status: ListingStatus = existing.status;

  if (data.action === "publish") status = "published";
  else if (data.action === "reject") status = "rejected";
  else if (data.action === "save") status = existing.status === "published" ? "published" : "pending";
  else if (data.status) status = data.status;

  const updated: Property = {
    ...existing,
    title: data.title ?? existing.title,
    summary: data.summary ?? existing.summary,
    description: data.description ?? existing.description,
    price: data.price ?? existing.price,
    currency: data.currency ?? existing.currency,
    status,
    updatedAt: now,
    publishedAt: status === "published" ? now : existing.publishedAt,
  };

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
  await resetListingViewTracking(id).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
