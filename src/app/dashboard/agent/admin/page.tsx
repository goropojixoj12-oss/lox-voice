import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getInquiries, getRuntimeListings } from "@/lib/store";
import { articles } from "@/data/articles";
import { cities } from "@/data/locations";
import { projects } from "@/data/projects";
import { properties } from "@/data/properties";
import { demoUsers } from "@/data/users";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";

export const metadata: Metadata = { title: "Admin" };

const links = [
  { href: agentDeskPath("admin", "users"), label: "Users" },
  { href: agentDeskPath("admin", "listings"), label: "Listings moderation" },
  { href: agentDeskPath("admin", "projects"), label: "Projects" },
  { href: agentDeskPath("admin", "articles"), label: "Articles" },
  { href: agentDeskPath("admin", "locations"), label: "Locations" },
];

export default async function AdminPage() {
  const session = await requireRole(["admin"]);
  if (!session) redirect("/auth/login");

  const [runtime, inquiries] = await Promise.all([getRuntimeListings(), getInquiries()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Admin panel
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Server-gated to the admin role. Platform counts below reflect current inventory and activity.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Users", demoUsers.length],
          ["Published seed listings", properties.length],
          ["Runtime listings", runtime.length],
          ["Projects", projects.length],
          ["Articles", articles.length],
          ["Cities", cities.length],
          ["Inquiries", inquiries.length],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <p className="text-sm text-[var(--color-muted)]">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 font-medium hover:border-[var(--color-primary)]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
