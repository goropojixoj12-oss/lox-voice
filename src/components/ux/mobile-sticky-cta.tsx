"use client";

import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";

const HIDDEN = ["/auth", "/dashboard", "/admin", "/contact", "/list-property"];

export function MobileStickyCta() {
  const pathname = usePathname();
  if (HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg gap-2 pb-[env(safe-area-inset-bottom)]">
        <ButtonLink href="/search" className="min-h-11 flex-1" size="md">
          Browse listings
        </ButtonLink>
        <ButtonLink href="/contact" variant="outline" className="min-h-11 flex-1" size="md">
          Contact
        </ButtonLink>
      </div>
    </div>
  );
}
