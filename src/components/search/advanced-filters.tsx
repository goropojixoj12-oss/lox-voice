"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Filter, X } from "lucide-react";
import { cities } from "@/data/locations";
import {
  amenityOptions,
  furnishingLabels,
  propertyTypeLabels,
  verificationLabels,
} from "@/lib/labels";
import type { AmenityKey } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdvancedFilters({
  resultCount,
  basePath = "/search",
}: {
  resultCount: number;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectedAmenities = useMemo(
    () => new Set((searchParams.get("amenities") ?? "").split(",").filter(Boolean)),
    [searchParams],
  );

  const citySlug = searchParams.get("city") ?? "";
  const districts = cities.find((c) => c.slug === citySlug)?.districts ?? [];

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  function toggleAmenity(key: AmenityKey) {
    const next = new Set(selectedAmenities);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    update({ amenities: next.size ? [...next].join(",") : null });
  }

  function reset() {
    startTransition(() => router.push(basePath));
    setOpen(false);
  }

  const fields = (
    <div className="grid gap-3">
      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Deal
        </span>
        <Select
          value={searchParams.get("deal") ?? "all"}
          onChange={(e) => update({ deal: e.target.value === "all" ? null : e.target.value })}
        >
          <option value="all">All deals</option>
          <option value="sale">Buy</option>
          <option value="rent">Rent</option>
          <option value="short_stay">Short stay</option>
        </Select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          City
        </span>
        <Select
          value={citySlug}
          onChange={(e) =>
            update({ city: e.target.value || null, district: null })
          }
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          District
        </span>
        <Select
          value={searchParams.get("district") ?? ""}
          onChange={(e) => update({ district: e.target.value || null })}
          disabled={!citySlug}
        >
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Property type
        </span>
        <Select
          value={searchParams.get("type") ?? "all"}
          onChange={(e) => update({ type: e.target.value === "all" ? null : e.target.value })}
        >
          <option value="all">Any type</option>
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Min price
          </span>
          <Input
            defaultValue={searchParams.get("minPrice") ?? ""}
            inputMode="numeric"
            onBlur={(e) => update({ minPrice: e.target.value || null })}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Max price
          </span>
          <Input
            defaultValue={searchParams.get("maxPrice") ?? ""}
            inputMode="numeric"
            onBlur={(e) => update({ maxPrice: e.target.value || null })}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Beds
          </span>
          <Select
            value={searchParams.get("bedrooms") ?? ""}
            onChange={(e) => update({ bedrooms: e.target.value || null })}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Baths
          </span>
          <Select
            value={searchParams.get("bathrooms") ?? ""}
            onChange={(e) => update({ bathrooms: e.target.value || null })}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Min area
          </span>
          <Input
            defaultValue={searchParams.get("minArea") ?? ""}
            inputMode="numeric"
            onBlur={(e) => update({ minArea: e.target.value || null })}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Min land
          </span>
          <Input
            defaultValue={searchParams.get("minLand") ?? ""}
            inputMode="numeric"
            onBlur={(e) => update({ minLand: e.target.value || null })}
          />
        </label>
      </div>
      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Furnishing
        </span>
        <Select
          value={searchParams.get("furnishing") ?? "all"}
          onChange={(e) =>
            update({ furnishing: e.target.value === "all" ? null : e.target.value })
          }
        >
          <option value="all">Any</option>
          {Object.entries(furnishingLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Verification
        </span>
        <Select
          value={searchParams.get("verification") ?? "all"}
          onChange={(e) =>
            update({ verification: e.target.value === "all" ? null : e.target.value })
          }
        >
          <option value="all">Any</option>
          {Object.entries(verificationLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Seller type
        </span>
        <Select
          value={searchParams.get("sellerType") ?? "all"}
          onChange={(e) =>
            update({ sellerType: e.target.value === "all" ? null : e.target.value })
          }
        >
          <option value="all">Any</option>
          <option value="owner">Owner</option>
          <option value="agent">Agent</option>
          <option value="developer">Developer</option>
        </Select>
      </label>
      <label>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Published
        </span>
        <Select
          value={searchParams.get("publishedWithinDays") ?? ""}
          onChange={(e) => update({ publishedWithinDays: e.target.value || null })}
        >
          <option value="">Any time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </Select>
      </label>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Amenities
        </legend>
        <div className="flex flex-wrap gap-2">
          {amenityOptions.map((amenity) => {
            const active = selectedAmenities.has(amenity.value);
            return (
              <button
                key={amenity.value}
                type="button"
                onClick={() => toggleAmenity(amenity.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text)]",
                )}
              >
                {amenity.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={reset} className="flex-1">
          Reset
        </Button>
        <Button type="button" className="flex-1 lg:hidden" onClick={() => setOpen(false)}>
          Show {resultCount}
        </Button>
      </div>
      {pending ? <p className="text-xs text-[var(--color-muted)]">Updating results…</p> : null}
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-24 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-primary)]">Filters</h2>
            <span className="text-xs text-[var(--color-muted)]">{resultCount} results</span>
          </div>
          {fields}
        </div>
      </aside>

      <div className="lg:hidden">
        <Button type="button" variant="outline" onClick={() => setOpen(true)} className="w-full">
          <Filter className="h-4 w-4" /> Filters · {resultCount}
        </Button>
        {open ? (
          <div className="fixed inset-0 z-50 bg-black/40" role="dialog" aria-modal="true">
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-xl)] bg-[var(--color-background)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close filters">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {fields}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
