"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "seaps-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(value: "accepted" | "rejected") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm text-[var(--color-text)]">
          We use essential cookies for sign-in and preferences. Optional analytics are not loaded
          unless you accept. See our{" "}
          <Link href="/privacy" className="font-semibold text-[var(--color-accent-soft)] underline">
            Privacy policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => choose("rejected")}>
            Reject optional
          </Button>
          <Button type="button" size="sm" onClick={() => choose("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
