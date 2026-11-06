import { NextResponse } from "next/server";
import { getListingFromRepo } from "@/lib/listing-git-store";
import { getPropertyById } from "@/data/properties";
import { getSession } from "@/lib/auth";
import {
  adminListingPatchSchema,
  applyAdminListingPatch,
  type AdminListingPatchInput,
} from "@/lib/admin-listing-patch";

import { syncListingToRepo } from "@/lib/listing-sync";
import type { Property } from "@/lib/types";

export const runtime = "nodejs";

const ADMIN_ONLY_KEYS = [
  "action",
  "slug",
  "status",
  "verification",
  "sellerType",
  "isFeatured",
  "isPremium",
] as const;

type RouteContext = { params: Promise<{ id: string }> };

function isOwnerOf(listing: Property, session: { id: string; role: string }): boolean {
  return (
    session.role === "admin" ||
    (listing.createdByUserId != null && listing.createdByUserId === session.id) ||
    (listing.ownerId != null && listing.ownerId === session.id)
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || !["owner", "agent", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = (await getListingFromRepo(id)) ?? getPropertyById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isOwnerOf(existing, session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = adminListingPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const input: AdminListingPatchInput = { ...parsed.data };
  for (const key of ADMIN_ONLY_KEYS) delete input[key];

  // `action` and `status` are admin-only keys, so a saved edit can never move the
  // listing out of whatever moderation state it is in: publishing is revoked only
  // by an explicit admin reject (owner ruling 2026-11-04)
  const updated: Property = applyAdminListingPatch(existing, input);
  const synced = await syncListingToRepo(updated);
    try {
        return NextResponse.json({
      listing: updated,
            exported: synced.ok,
      commitUrl: synced.ok ? synced.commitUrl : null,
      exportError: synced.ok ? null : synced.error,
    });
  } catch (error) {
    console.error("owner listing media cleanup failed", updated.id, error);
    return NextResponse.json(
      {
        listing: updated,
                exported: synced.ok,
        commitUrl: synced.ok ? synced.commitUrl : null,
        exportError: synced.ok ? null : synced.error,
      },
      { status: 200 },
    );
  }
}
