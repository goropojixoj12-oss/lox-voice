"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function sessionKey(): string {
  const key = "seaps-analytics-session";
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function PageViewBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
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
