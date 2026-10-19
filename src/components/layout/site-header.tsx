"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SeapsLogo } from "@/components/brand/seaps-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NavMenuDropdown,
  NavMenuLink,
} from "@/components/layout/nav-menu-dropdown";
import { primaryNav as nav } from "@/components/layout/site-nav-config";

export function SiteHeader({
  userName,
}: {
  userName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const closeMobile = () => setOpen(false);

  return (
    <header className="sticky top-0 z-[100] overflow-visible border-b border-[var(--color-border)]/80 bg-[rgba(7,17,31,0.92)] backdrop-blur-md supports-[background:color-mix(in_srgb,red,blue)]:bg-[color-mix(in_srgb,var(--color-background)_90%,transparent)]">
      <div className="mx-auto grid h-[4.25rem] max-w-7xl grid-cols-[1fr_auto] items-center gap-2 px-4 sm:gap-3 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)_auto] lg:px-8">
        <Link
          href="/"
          className="group shrink-0 notranslate justify-self-start md:col-start-1"
          aria-label="SEAPS home"
        >
          <SeapsLogo size="header" />
        </Link>

        <nav
          className="notranslate relative z-[1] hidden min-w-0 items-center justify-center gap-0.5 overflow-visible md:col-start-2 md:flex md:flex-wrap md:px-2"
          aria-label="Primary"
        >
          {nav.map((entry) =>
            entry.type === "dropdown" ? (
              <NavMenuDropdown key={entry.label} entry={entry} variant="desktop" />
            ) : (
              <NavMenuLink key={entry.href} href={entry.href} label={entry.label} variant="desktop" />
            ),
          )}
        </nav>

        <div className="notranslate flex shrink-0 items-center justify-end gap-2 md:col-start-3">
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            {userName ? (
              <ButtonLink href="/dashboard/agent/overview" variant="ghost" size="sm">
                {userName}
              </ButtonLink>
            ) : (
              <ButtonLink href="/auth/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
            )}
            <ButtonLink href="/contact" variant="accent" size="sm">
              Contact Us
            </ButtonLink>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-accent-soft)] md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "notranslate border-t border-[var(--color-border)] bg-[var(--color-background)] md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
          <div className="mb-2">
            <LanguageSwitcher className="w-full [&_select]:w-full [&_select]:max-w-none" />
          </div>
          {nav.map((entry) =>
            entry.type === "dropdown" ? (
              <NavMenuDropdown
                key={entry.label}
                entry={entry}
                variant="mobile"
                onNavigate={closeMobile}
              />
            ) : (
              <NavMenuLink
                key={entry.href}
                href={entry.href}
                label={entry.label}
                variant="mobile"
                onNavigate={closeMobile}
              />
            ),
          )}
          <div className="mt-2 grid gap-2">
            <ButtonLink href={userName ? "/dashboard/agent/overview" : "/auth/login"} variant="outline">
              {userName ? "Dashboard" : "Sign in"}
            </ButtonLink>
            <ButtonLink href="/contact" variant="accent">
              Contact Us
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
