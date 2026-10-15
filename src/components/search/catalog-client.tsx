"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdvancedFilters } from "@/components/search/advanced-filters";
import { PropertyMap } from "@/components/search/property-map";
import { PropertyGrid, PropertyList } from "@/components/property/property-card";
import { EmptyState } from "@/components/shared/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import type { Property } from "@/lib/types";

export function CatalogClient({
  items,
  total,
  page,
  totalPages,
  userId,
  title,
  description,
}: {
  items: Property[];
  total: number;
  page: number;
  totalPages: number;
  userId?: string;
  title: string;
  description: string;
}) {
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageLinks = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  function setSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") params.delete("sort");
    else params.set("sort", sort);
    router.push(`${pathname}?${params.toString()}`);
  }

  function goPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
          {title}
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">{description}</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {total} matching {total === 1 ? "listing" : "listings"}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <AdvancedFilters resultCount={total} basePath={pathname} />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {(["grid", "list", "map"] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  size="sm"
                  variant={view === mode ? "primary" : "outline"}
                  onClick={() => setView(mode)}
                >
                  {mode === "grid" ? "Cards" : mode === "list" ? "List" : "Map"}
                </Button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-muted)]">Sort</span>
              <Select
                value={searchParams.get("sort") ?? "newest"}
                onChange={(e) => setSort(e.target.value)}
                className="w-44"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="area_desc">Largest area</option>
                <option value="relevance">Relevance</option>
              </Select>
            </label>
          </div>

          {total === 0 ? (
            <div className="space-y-4">
              <EmptyState
                title="No properties match these filters"
                description="Try widening price, removing amenities, or resetting the search. Suggested next steps: browse all sale homes, Phnom Penh listings, or open map search."
                actionHref={pathname}
                actionLabel="Reset filters"
              />
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/buy" variant="outline" size="sm">
                  Homes for sale
                </ButtonLink>
                <ButtonLink href="/locations/phnom-penh" variant="outline" size="sm">
                  Phnom Penh
                </ButtonLink>
                <ButtonLink href="/map" variant="outline" size="sm">
                  Map search
                </ButtonLink>
              </div>
            </div>
          ) : view === "map" ? (
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <PropertyMap items={items} activeId={activeId} onSelect={setActiveId} />
              <PropertyList items={items} userId={userId} />
            </div>
          ) : view === "list" ? (
            <PropertyList items={items} userId={userId} />
          ) : (
            <PropertyGrid items={items} userId={userId} />
          )}

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >
                Previous
              </Button>
              {pageLinks.map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={n === page ? "primary" : "outline"}
                  onClick={() => goPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}

          <div className="rounded-[var(--radius-md)] bg-[var(--color-mist)] p-4 text-sm text-[var(--color-muted)]">
            Want alerts for this filter set?{" "}
            <ButtonLink href="/saved-searches" variant="ghost" size="sm" className="inline px-1">
              Save this search
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
