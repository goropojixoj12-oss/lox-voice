"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/listings", label: "Listings" },
  { href: "/dashboard/inquiries", label: "Inquiries" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/stats", label: "Stats" },
  { href: "/favorites", label: "Favorites" },
  { href: "/saved-searches", label: "Saved searches" },
  { href: "/list-property", label: "Create listing" },
  { href: "/admin", label: "Admin" },
];

export function DashboardNav() {
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
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "block rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition",
                pathname === link.href
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
