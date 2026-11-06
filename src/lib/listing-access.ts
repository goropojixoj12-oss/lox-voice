import type { SessionUser } from "@/lib/auth";
import type { Property } from "@/lib/types";

/**
 * Publication is per-listing data (`visibility`), never a global rule.
 * The old implementation silently dropped every rent listing from the public
 * catalog; that is exactly how cards "disappeared" without a trace.
 */
export function isPublicListing(property: Property): boolean {
  if (property.status !== "published") return false;
  return property.visibility !== "hidden";
}

function staffCanPreviewListing(property: Property, session: SessionUser): boolean {
  if (session.role === "admin") return true;
  if (property.createdByUserId && property.createdByUserId === session.id) return true;
  if (property.ownerId && property.ownerId === session.id) return true;
  return false;
}

/** Who may open a listing detail page. */
export function canViewListing(property: Property, session: SessionUser | null): boolean {
  if (isPublicListing(property)) return true;
  if (!session) return false;
  return staffCanPreviewListing(property, session);
}

/** Kept for callers that used the old helpers. */
export function isWithdrawnSaleOrRentCatalogListing(property: Property): boolean {
  return property.visibility === "hidden";
}

export function isWithdrawnPromoCatalogListing(property: Property): boolean {
  return property.visibility === "hidden";
}