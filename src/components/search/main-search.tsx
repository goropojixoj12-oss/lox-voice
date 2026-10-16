"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cities } from "@/data/locations";
import { propertyTypeLabels } from "@/lib/labels";
import type { PropertyType, TransactionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const deals: { id: TransactionType | "invest"; label: string; deal: TransactionType }[] = [
  { id: "sale", label: "Buy", deal: "sale" },
  { id: "rent", label: "Rent", deal: "rent" },
  { id: "invest", label: "Invest", deal: "sale" },
];

const types = Object.entries(propertyTypeLabels).slice(0, 8);

export function MainSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof deals)[number]["id"]>("sale");
  const [city, setCity] = useState("");
  const [type, setType] = useState<PropertyType | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const deal = deals.find((d) => d.id === mode)?.deal ?? "sale";
    const params = new URLSearchParams();
    params.set("deal", deal);
    if (mode === "invest") params.set("sort", "relevance");
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className={cn("rounded-[var(--radius-xl)] border border-[var(--color-accent)]/25 bg-[var(--color-surface)]/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur md:p-5 seaps-gold-border", className)}>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Search intent">
        {deals.map((deal) => (
          <button
            key={deal.id}
            type="button"
            role="tab"
            aria-selected={mode === deal.id}
            onClick={() => setMode(deal.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              mode === deal.id
                ? "bg-[var(--color-accent)] text-[#0B1C33]"
                : "bg-[var(--color-mist)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]",
            )}
          >
            {deal.label}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-6">
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            City or district
          </span>
          <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Type
          </span>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as PropertyType | "")}
            aria-label="Property type"
          >
            <option value="">Any type</option>
            {types.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Min price
          </span>
          <Input
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            aria-label="Minimum price"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Max price
          </span>
          <Input
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-label="Maximum price"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Bedrooms
          </span>
          <Select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            aria-label="Bedrooms"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </Select>
        </label>
        <div className="md:col-span-6">
          <Button type="submit" className="w-full md:w-auto" size="lg">
            Search properties
          </Button>
        </div>
      </form>
    </div>
  );
}
