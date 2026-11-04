import { getAllProperties } from "@/lib/catalog";
import { getInquiries } from "@/lib/store";
import type { SessionUser } from "@/lib/auth";
import type { Inquiry, Property } from "@/lib/types";

/**
 * Client contacts are personal data: an account may only read the inquiries that
 * arrived on listings it authored or owns. Admins keep the full view.
 */
export function filterInquiriesToAccount(
  inquiries: Inquiry[],
  listings: Property[],
  userId: string,
): Inquiry[] {
  const mine = new Set(
    listings
      .filter((l) => l.createdByUserId === userId || l.ownerId === userId)
      .map((l) => l.id),
  );
  return inquiries.filter((inquiry) => mine.has(inquiry.propertyId));
}

export async function getInquiriesForSession(session: SessionUser) {
  const inquiries = await getInquiries();
  if (session.role === "admin") return inquiries;
  return filterInquiriesToAccount(inquiries, await getAllProperties(), session.id);
}
