import { getAllProperties } from "@/lib/catalog";
import { getInquiries } from "@/lib/store";
import type { SessionUser } from "@/lib/auth";

/**
 * Client contacts are personal data: an account may only read the inquiries that
 * arrived on listings it authored or owns. Admins keep the full view.
 */
export async function getInquiriesForSession(session: SessionUser) {
  const inquiries = await getInquiries();
  if (session.role === "admin") return inquiries;
  const listings = await getAllProperties();
  const mine = new Set(
    listings
      .filter((l) => l.createdByUserId === session.id || l.ownerId === session.id)
      .map((l) => l.id),
  );
  return inquiries.filter((inquiry) => mine.has(inquiry.propertyId));
}
