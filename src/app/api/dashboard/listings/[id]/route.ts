import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  adminListingPatchSchema,
  applyAdminListingPatch,
  type AdminListingPatchInput,
} from "@/lib/admin-listing-patch";
import { getRuntimeListingById, getRuntimeListings, saveRuntimeListing } from "@/lib/store";
import { deleteRemovedListingMedia } from "@/lib/listing-media-files";
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
  const existing = await getRuntimeListingById(id);
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

  const patched = applyAdminListingPatch(existing, input);
  // moderation is the admin's call, so an edit of a live listing goes back to the queue
  const updated: Property = {
    ...patched,
    status: existing.status === "published" ? "pending" : patched.status,
  };

  await saveRuntimeListing(updated);
  const otherListings = (await getRuntimeListings()).filter((l) => l.id !== updated.id);
  try {
    const removedMedia = await deleteRemovedListingMedia(existing, updated, otherListings);
    return NextResponse.json({ listing: updated, removedMedia });
  } catch (error) {
    console.error("owner listing media cleanup failed", updated.id, error);
    return NextResponse.json(
      { listing: updated, mediaCleanupError: "Saved, but some removed files could not be deleted" },
      { status: 200 },
    );
  }
}
