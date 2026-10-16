"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cities } from "@/data/locations";
import { propertyTypeLabels } from "@/lib/labels";
import type { PropertyType, TransactionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const deals: { id: TransactionType; label: string; deal: TransactionType }[] = [
  { id: "sale", label: "Buy", deal: "sale" },
  { id: "rent", label: "Rent", deal: "rent" },
];

const heroSearchTagline =
  "The country's top real estate from Cambodia's best market broker";

const types = Object.entries(propertyTypeLabels).slice(0, 8);

export function MainSearch({
  className,
  stretch,
}: {
  className?: string;
  /** Fill hero column height; keeps the submit button at the bottom. */
  stretch?: boolean;
}) {
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
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div
      className={cn(
        "seaps-card rounded-[var(--radius-xl)] bg-[var(--color-surface)]/95 p-4 backdrop-blur md:p-5",
        stretch && "flex min-h-0 flex-1 flex-col",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Search intent">
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
        <p className="text-sm font-medium leading-snug text-[var(--color-accent-soft)] sm:ml-auto sm:max-w-[16rem] sm:flex-1 sm:text-right md:text-[0.9375rem]">
          {heroSearchTagline}
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className={cn(
          stretch ? "flex min-h-0 flex-1 flex-col gap-3" : "grid gap-3 md:grid-cols-6",
        )}
      >
        <div className={cn(stretch && "grid gap-3 md:grid-cols-6", !stretch && "contents")}>
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
        </div>
        <div className={cn("md:col-span-6", stretch && "mt-auto pt-1")}>
          <Button type="submit" className="w-full md:w-auto" size="lg">
            Search properties
          </Button>
        </div>
      </form>
    </div>
  );
}
