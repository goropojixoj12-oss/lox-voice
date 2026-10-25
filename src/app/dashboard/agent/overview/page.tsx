import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";
import { propertyListingsEnabled } from "@/lib/listings-policy";
import { getInquiries } from "@/lib/store";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const session = await getSession();
  if (!session) return null;

  const inquiries = await getInquiries();

  const quickCards = [
    { label: "Inquiries", value: inquiries.length, href: agentDeskPath("inquiries") },
    ...(propertyListingsEnabled()
      ? [
          { label: "Favorites", value: 0, href: agentDeskPath("favorites") },
          { label: "Your runtime listings", value: 0, href: agentDeskPath("listings") },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Welcome back, {session.name}
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Role: {session.role}. Manage inquiries and your profile from this desk.
      </p>

      <div className="mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
          Quick counts
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {quickCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-[var(--radius-lg)] seaps-card p-5 transition hover:border-[rgba(212,175,55,0.55)]"
            >
              <p className="text-sm text-[var(--color-muted)]">{card.label}</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{card.value}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
