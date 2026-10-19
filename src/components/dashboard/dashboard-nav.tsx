"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; roles?: UserRole[] }[] = [
  { href: agentDeskPath("overview"), label: "Overview" },
  { href: agentDeskPath("listings"), label: "Listings" },
  { href: agentDeskPath("inquiries"), label: "Inquiries" },
  { href: agentDeskPath("profile"), label: "Profile" },
  { href: agentDeskPath("stats"), label: "Stats" },
  { href: agentDeskPath("favorites"), label: "Favorites" },
  { href: agentDeskPath("saved-searches"), label: "Saved searches" },
  { href: agentDeskPath("list-property"), label: "Create listing" },
  { href: agentDeskPath("admin"), label: "Admin", roles: ["admin"] },
];

function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === agentDeskPath("overview") && pathname === "/dashboard") return true;
  if (href !== agentDeskPath("overview") && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function DashboardNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="seaps-card rounded-[var(--radius-lg)] p-3">
      <ul className="space-y-1">
        {links
          .filter((link) => !link.roles || link.roles.includes(role))
          .map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "block rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
                  isNavActive(pathname, link.href)
                    ? "bg-[var(--color-primary)] text-white"
                    : "hover:bg-[var(--color-mist)]",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
      </ul>
      <Button type="button" variant="outline" className="mt-3 w-full" onClick={signOut}>
        Sign out
      </Button>
    </nav>
  );
}
