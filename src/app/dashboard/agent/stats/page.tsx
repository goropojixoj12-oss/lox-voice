import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isPublicListing } from "@/lib/listing-access";
import { getInquiriesForSession } from "@/lib/inquiry-access";
import { getAllProperties } from "@/lib/catalog";

export const metadata: Metadata = { title: "Listing stats" };

export default async function StatsPage() {
  const session = await requireRole(["owner", "agent", "buyer"]);
  if (!session) redirect("/auth/login");

  const [listings, inquiries] = await Promise.all([
    getAllProperties(),
    getInquiriesForSession(session),
  ]);
  const mine = listings.filter(
    (l) => l.createdByUserId === session.id || l.ownerId === session.id,
  );
  const cards = [
    { label: "My listings", value: mine.length },
    { label: "Live for the public", value: mine.filter(isPublicListing).length },
    { label: "Inquiries on my listings", value: inquiries.length },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Performance snapshot
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Counts cover only the listings this account authored or owns.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[var(--radius-lg)] seaps-card p-5">
            <p className="text-sm text-[var(--color-muted)]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
