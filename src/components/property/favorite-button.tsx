"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const GUEST_KEY = "en_guest_favorites";

function readGuest(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function FavoriteButton({
  propertyId,
  userId,
  className,
}: {
  propertyId: string;
  userId?: string;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (userId) {
        const res = await fetch("/api/favorites");
        if (!res.ok) return;
        const data = (await res.json()) as { ids: string[] };
        if (!cancelled) setActive(data.ids.includes(propertyId));
        return;
      }
      if (!cancelled) setActive(readGuest().includes(propertyId));
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [propertyId, userId]);

  async function toggle() {
    if (pending) return;
    setPending(true);
    try {
      if (userId) {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { ids: string[] };
        setActive(data.ids.includes(propertyId));
      } else {
        const next = new Set(readGuest());
        if (next.has(propertyId)) next.delete(propertyId);
        else next.add(propertyId);
        localStorage.setItem(GUEST_KEY, JSON.stringify([...next]));
        setActive(next.has(propertyId));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/95 text-[var(--color-primary)] backdrop-blur transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
        active && "border-[var(--color-accent)] text-[var(--color-accent)]",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} />
    </button>
  );
}
