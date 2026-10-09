import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getFavorites, getInquiries, getRuntimeListings } from "@/lib/store";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const [favorites, inquiries, listings] = await Promise.all([
    getFavorites(session.id),
    getInquiries(),
    getRuntimeListings(),
  ]);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-primary)]">
        Welcome back, {session.name}
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Role: {session.role}. This desk stores favorites, inquiries, and draft listings in local
        demo files under <code>.data/</code>.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Favorites", value: favorites.length, href: "/favorites" },
          { label: "Inquiries", value: inquiries.length, href: "/dashboard/inquiries" },
          { label: "Your runtime listings", value: listings.length, href: "/dashboard/listings" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <p className="text-sm text-[var(--color-muted)]">{card.label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
