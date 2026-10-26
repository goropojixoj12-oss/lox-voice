"use client";

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
    return crypto.randomUUID();
  }
}

type Props = {
  listingId: string;
  /** When true, do not record (signed-in visitor). */
  skip: boolean;
};

export function ListingViewRecorder({ listingId, skip }: Props) {
  const recorded = useRef(false);

  useEffect(() => {
    if (skip || recorded.current) return;
    recorded.current = true;

    void fetch("/api/analytics/listing-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, sessionKey: sessionKey() }),
      keepalive: true,
    }).catch(() => undefined);
  }, [listingId, skip]);

  return null;
}
