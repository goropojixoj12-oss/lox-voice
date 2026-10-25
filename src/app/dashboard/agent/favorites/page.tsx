"use client";

import { useEffect, useState } from "react";
import { PropertyGrid } from "@/components/property/property-card";
import { EmptyState } from "@/components/shared/states";
import { properties } from "@/data/properties";
import type { Property } from "@/lib/types";

export default function FavoritesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [mode, setMode] = useState<"guest" | "user">("guest");
  const [userId, setUserId] = useState<string>();

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = (await sessionRes.json()) as { user?: { id: string } | null };
      if (sessionData.user) {
        setMode("user");
        setUserId(sessionData.user.id);
        const favRes = await fetch("/api/favorites");
        const favData = (await favRes.json()) as { ids: string[] };
        setItems(properties.filter((p) => favData.ids.includes(p.id)));
        return;
      }
      setMode("guest");
      try {
        const ids = JSON.parse(localStorage.getItem("en_guest_favorites") ?? "[]") as string[];
        setItems(properties.filter((p) => ids.includes(p.id)));
      } catch {
        setItems([]);
      }
    }
    void load();
  }, []);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Favorites
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {mode === "guest"
          ? "Guest favorites stay in this browser until you sign in."
          : "Signed-in favorites sync to your SEAPS account."}
      </p>
      <div className="mt-6">
        {items.length ? (
          <PropertyGrid items={items} userId={userId} />
        ) : (
          <EmptyState
            title="No saved homes yet"
            description="Tap the heart on any property card to save it here."
            actionHref="/search"
            actionLabel="Browse listings"
          />
        )}
      </div>
    </div>
  );
}
