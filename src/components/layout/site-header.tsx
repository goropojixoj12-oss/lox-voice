"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SeapsLogo } from "@/components/brand/seaps-logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/buy", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/projects", label: "New homes" },
  { href: "/commercial", label: "Commercial" },
  { href: "/agencies", label: "Agencies" },
  { href: "/insights", label: "Market insights" },
];

export function SiteHeader({
  userName,
}: {
  userName?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 overflow-x-hidden border-b border-[var(--color-border)]/80 bg-[color-mix(in_srgb,var(--color-background)_90%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="group shrink-0" aria-label="SEAPS home">
          <SeapsLogo compact variant="image" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-mist)] hover:text-[var(--color-accent-soft)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <label className="sr-only" htmlFor="lang">
            Language
          </label>
          <select
            id="lang"
            className="h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
            defaultValue="en"
            aria-label="Language"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="pt">PT</option>
          </select>
          {userName ? (
            <ButtonLink href="/dashboard" variant="ghost" size="sm">
              {userName}
            </ButtonLink>
          ) : (
            <ButtonLink href="/auth/login" variant="ghost" size="sm">
              Sign in
            </ButtonLink>
          )}
          <ButtonLink href="/list-property" variant="accent" size="sm">
            List a property
          </ButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-accent-soft)] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-[var(--color-border)] bg-[var(--color-background)] lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-md)] px-3 py-3 text-base font-medium hover:bg-[var(--color-mist)]"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 grid gap-2">
            <ButtonLink href={userName ? "/dashboard" : "/auth/login"} variant="outline">
              {userName ? "Dashboard" : "Sign in"}
            </ButtonLink>
            <ButtonLink href="/list-property" variant="accent">
              List a property
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
