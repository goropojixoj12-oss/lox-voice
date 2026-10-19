import type { SessionUser } from "@/lib/auth";
import type { Property } from "@/lib/types";

export function isPublicListing(property: Property): boolean {
  return property.status === "published";
}

/** Who may open a non-published listing detail page. */
export function canViewListing(property: Property, session: SessionUser | null): boolean {
  if (property.status === "published") return true;
  if (!session) return false;
  if (session.role === "admin") return true;
  if (property.createdByUserId && property.createdByUserId === session.id) return true;
  if (property.ownerId && property.ownerId === session.id) return true;
  if (session.role === "agent" && property.agentId) return true;
  return false;
}
