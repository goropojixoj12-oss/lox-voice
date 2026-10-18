"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SeapsGoldLabel } from "@/components/brand/seaps-gold-label";
import { cn } from "@/lib/utils";

export type NavDropdownItem = { href: string; label: string };

export type NavEntry =
  | { type: "link"; href: string; label: string }
  | { type: "dropdown"; label: string; href: string; items: NavDropdownItem[] };

const linkShellClass =
  "seaps-nav-pill seaps-gold-border-flow rounded-full px-2.5 py-2 text-sm font-medium transition hover:bg-[var(--color-mist)]";

const subLinkClass =
  "block rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--color-mist)]";

export function NavMenuDropdown({
  entry,
  variant,
  onNavigate,
}: {
  entry: Extract<NavEntry, { type: "dropdown" }>;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  if (variant === "desktop") {
    return (
      <div className="group relative z-[1] hover:z-[110] focus-within:z-[110]">
        <Link href={entry.href} className={cn(linkShellClass, "inline-flex items-center gap-0.5")}>
          <SeapsGoldLabel>{entry.label}</SeapsGoldLabel>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent-soft)] opacity-90 transition group-hover:rotate-180"
            aria-hidden
          />
        </Link>
        <div
          className="invisible absolute left-0 top-full z-[110] min-w-[11rem] pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          role="menu"
        >
          <div className="seaps-card rounded-[var(--radius-lg)] bg-[var(--color-background)] py-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
            {entry.items.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                role="menuitem"
                className={subLinkClass}
              >
                <SeapsGoldLabel>{item.label}</SeapsGoldLabel>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1">
      <Link
        href={entry.href}
        onClick={onNavigate}
        className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-base font-semibold"
      >
        <SeapsGoldLabel>{entry.label}</SeapsGoldLabel>
        <ChevronDown className="h-4 w-4 text-[var(--color-accent-soft)] opacity-70" aria-hidden />
      </Link>
      <div className="ml-3 border-l border-[var(--color-border)] pl-3">
        {entry.items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            onClick={onNavigate}
            className="block rounded-[var(--radius-md)] px-3 py-2.5 text-base font-medium transition hover:bg-[var(--color-mist)]"
          >
            <SeapsGoldLabel>{item.label}</SeapsGoldLabel>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function NavMenuLink({
  href,
  label,
  variant,
  onNavigate,
}: {
  href: string;
  label: string;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  if (variant === "desktop") {
    return (
      <Link href={href} className={linkShellClass}>
        <SeapsGoldLabel>{label}</SeapsGoldLabel>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-[var(--radius-md)] px-3 py-3 text-base font-medium transition hover:bg-[var(--color-mist)]"
    >
      <SeapsGoldLabel>{label}</SeapsGoldLabel>
    </Link>
  );
}
