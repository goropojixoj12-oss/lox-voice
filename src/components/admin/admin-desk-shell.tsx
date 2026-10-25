"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: adminDeskPath(), label: "Site analytics", match: (p: string) => p === adminDeskPath() },
  {
    href: adminDeskPath("site-changes"),
    label: "Site Changes",
    match: (p: string) => p.startsWith(adminDeskPath("site-changes")),
  },
  {
    href: adminDeskPath("staff"),
    label: "Staff & performance",
    match: (p: string) => p.startsWith(adminDeskPath("staff")),
  },
  {
    href: adminDeskPath("legal"),
    label: "Legal & contracts",
    match: (p: string) => p.startsWith(adminDeskPath("legal")),
  },
  {
    href: adminDeskPath("listings"),
    label: "Listing moderation",
    match: (p: string) => p.startsWith(adminDeskPath("listings")),
  },
  {
    href: adminDeskPath("operations"),
    label: "Operations",
    match: (p: string) => p.startsWith(adminDeskPath("operations")),
  },
];

export function AdminDeskShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="notranslate min-h-[70vh]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-soft)]">
            SEAPS executive desk
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            Signed in as <span className="font-semibold text-[var(--color-text)]">{userName}</span>{" "}
            (admin)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)]"
          >
            Public Site
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="seaps-card h-fit rounded-[var(--radius-lg)] p-3">
          <nav aria-label="Admin navigation">
            <ul className="space-y-1">
              {NAV.map((item) => {
                const active = item.match(pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-[var(--color-primary)] text-white"
                          : "hover:bg-[var(--color-mist)]",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Button type="button" variant="outline" className="mt-4 w-full" onClick={signOut}>
            Sign out
          </Button>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
