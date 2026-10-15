"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/states";

type Saved = { id: string; name: string; params: Record<string, string>; createdAt: string };

export default function SavedSearchesPage() {
  const [items, setItems] = useState<Saved[]>([]);
  const [name, setName] = useState("My search");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("en_saved_searches") ?? "[]") as Saved[]);
    } catch {
      setItems([]);
    }
  }, []);

  function persist(next: Saved[]) {
    setItems(next);
    localStorage.setItem("en_saved_searches", JSON.stringify(next));
  }

  function saveCurrent() {
    const params = Object.fromEntries(new URLSearchParams(window.location.search).entries());
    // default to a useful starter if opened directly
    const payload = Object.keys(params).length ? params : { deal: "sale", city: "phnom-penh" };
    const entry: Saved = {
      id: crypto.randomUUID(),
      name,
      params: payload,
      createdAt: new Date().toISOString(),
    };
    persist([entry, ...items]);
    setMessage("Search saved in this browser. Notification delivery requires a worker + email provider.");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Saved searches
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Restore filter sets instantly. Alert emails are prepared as an integration point, not faked.
      </p>
      <div className="mt-6 rounded-[var(--radius-lg)] seaps-card p-4">
        <Label htmlFor="search-name">Name</Label>
        <Input id="search-name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="button" className="mt-3" onClick={saveCurrent}>
          Save starter search (Phnom Penh sale)
        </Button>
        {message ? <p className="mt-2 text-sm text-[var(--color-success)]">{message}</p> : null}
      </div>
      <div className="mt-6">
        {items.length ? (
          <ul className="space-y-3">
            {items.map((item) => {
              const qs = new URLSearchParams(item.params).toString();
              return (
                <li
                  key={item.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4"
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-[var(--color-muted)]">{qs || "no params"}</p>
                  <Link
                    href={`/search?${qs}`}
                    className="mt-2 inline-block text-sm font-semibold text-[var(--color-accent)]"
                  >
                    Open results
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No saved searches"
            description="Save a filter set to reopen it later."
            actionHref="/search"
            actionLabel="Build a search"
          />
        )}
      </div>
    </div>
  );
}
