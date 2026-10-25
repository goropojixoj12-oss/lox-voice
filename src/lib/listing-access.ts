import type { SessionUser } from "@/lib/auth";
import type { Property, TransactionType } from "@/lib/types";

/** Sale and long-term rent inventory withdrawn from the public catalog (CEO site request). */
const WITHDRAWN_PUBLIC_CATALOG_DEALS = new Set<TransactionType>(["sale", "rent"]);

export function isWithdrawnSaleOrRentCatalogListing(property: Property): boolean {
  return WITHDRAWN_PUBLIC_CATALOG_DEALS.has(property.transactionType);
}

export function isPublicListing(property: Property): boolean {
  if (property.status !== "published") return false;
  if (isWithdrawnSaleOrRentCatalogListing(property)) return false;
  return true;
}

function staffCanPreviewListing(property: Property, session: SessionUser): boolean {
  if (session.role === "admin") return true;
  if (property.createdByUserId && property.createdByUserId === session.id) return true;
  if (property.ownerId && property.ownerId === session.id) return true;
  if (session.role === "agent" && property.agentId) return true;
  return false;
}

/** Who may open a non-published listing detail page. */
export function canViewListing(property: Property, session: SessionUser | null): boolean {
  if (isWithdrawnSaleOrRentCatalogListing(property)) {
    if (!session) return false;
    return staffCanPreviewListing(property, session);
  }
  if (property.status === "published") return true;
  if (!session) return false;
  return staffCanPreviewListing(property, session);
}
