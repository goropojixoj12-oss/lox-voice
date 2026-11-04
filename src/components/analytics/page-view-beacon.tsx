"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ANALYTICS_SESSION_COOKIE } from "@/lib/analytics-session";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const part = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!part) return null;
  return decodeURIComponent(part.slice(name.length + 1));
}

let blockedSessionId: string | null = null;

function sessionKey(): string {
  const fromCookie = readCookie(ANALYTICS_SESSION_COOKIE);
  if (fromCookie && fromCookie.length >= 8) return fromCookie;

  const key = "seaps-analytics-session";
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    // storage blocked (private mode) — reuse one id per tab so a single visitor
    // is not counted as a new unique session on every route change
    if (!blockedSessionId) blockedSessionId = crypto.randomUUID();
    return blockedSessionId;
  }
}

export function PageViewBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    // Sole writer of page views — including the document load that brought us here.
    if (!pathname || pathname.startsWith("/api")) return;
    if (last.current === pathname) return;
    last.current = pathname;

    const payload = {
      path: pathname,
      sessionKey: sessionKey(),
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    };

    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
