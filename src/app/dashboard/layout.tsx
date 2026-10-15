import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
      <aside>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          Signed in as <span className="font-semibold text-[var(--color-text)]">{session.name}</span>{" "}
          ({session.role})
        </p>
        <DashboardNav />
      </aside>
      <div>{children}</div>
    </div>
  );
}
