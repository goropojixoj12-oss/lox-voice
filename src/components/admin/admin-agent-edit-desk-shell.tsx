"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import {
  adminEditAgentListPropertyStepPath,
  adminEditAgentPath,
} from "@/lib/admin-edit-agent-paths";
import { cn } from "@/lib/utils";

const NAV_SEGMENTS: { segment: string; label: string }[] = [
  { segment: "overview", label: "Overview" },
  { segment: "listings", label: "Listings" },
  { segment: "inquiries", label: "Inquiries" },
  { segment: "profile", label: "Profile" },
  { segment: "stats", label: "Stats" },
  { segment: "favorites", label: "Favorites" },
  { segment: "saved-searches", label: "Saved searches" },
];

export function AdminAgentEditDeskShell({
  agentSlug,
  agentLabel,
  adminName,
  children,
}: {
  agentSlug: string;
  agentLabel: string;
  adminName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const listPropertyBase = adminEditAgentPath(agentSlug, "list-property");

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function navHref(segment: string): string {
    return adminEditAgentPath(agentSlug, segment);
  }

  function isActive(segment: string): boolean {
    const href = navHref(segment);
    if (pathname === href) return true;
    if (segment === "overview" && pathname === adminEditAgentPath(agentSlug)) return true;
    return pathname.startsWith(`${href}/`);
  }

  const onListProperty = pathname.startsWith(`${listPropertyBase}/`);

  return (
    <div className="notranslate min-h-[70vh]">
      <div className="mb-6 space-y-3 border-b border-[var(--color-border)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-soft)]">
          Admin · Agent desk (edit mode)
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          Signed in as <span className="font-semibold text-[var(--color-text)]">{adminName}</span>{" "}
          (admin) — editing{" "}
          <span className="font-semibold text-[var(--color-text)]">{agentLabel}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={adminDeskPath("staff")}
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)]"
          >
            ← Employees
          </Link>
          <Link
            href={adminDeskPath()}
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)]"
          >
            Executive desk
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="seaps-card h-fit rounded-[var(--radius-lg)] p-3">
          <nav aria-label="Agent desk navigation">
            <ul className="space-y-1">
              {NAV_SEGMENTS.map(({ segment, label }) => (
                <li key={segment}>
                  <Link
                    href={navHref(segment)}
                    className={cn(
                      "block rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
                      isActive(segment)
                        ? "bg-[var(--color-primary)] text-white"
                        : "hover:bg-[var(--color-mist)]",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={adminEditAgentListPropertyStepPath(agentSlug, 1)}
                  className={cn(
                    "block rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
                    onListProperty
                      ? "bg-[var(--color-primary)] text-white"
                      : "hover:bg-[var(--color-mist)]",
                  )}
                >
                  Create listing
                </Link>
              </li>
            </ul>
          </nav>
          <Button type="button" variant="outline" className="mt-4 w-full" onClick={signOut}>
            Sign Out
          </Button>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
