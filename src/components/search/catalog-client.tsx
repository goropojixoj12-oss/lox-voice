"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CatalogCoverAd } from "@/components/search/catalog-cover-ad";
import { AdvancedFilters } from "@/components/search/advanced-filters";
import { PropertyMap } from "@/components/search/property-map";
import { PropertyGrid, PropertyList } from "@/components/property/property-card";
import { EmptyState } from "@/components/shared/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { hasMapCoords } from "@/lib/property-coords";
import { ParallaxSection } from "@/components/shared/parallax-section";
import type { Property } from "@/lib/types";

export function CatalogClient({
  items,
  total,
  page,
  totalPages,
  userId,
  title,
  description,
  coverAd,
}: {
  items: Property[];
  total: number;
  page: number;
  totalPages: number;
  userId?: string;
  title: string;
  description: string;
  coverAd?: { src: string; alt: string; href?: string };
}) {
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  // the strip under the map describes the selected pin, so start on a listing that has one
  const [activeId, setActiveId] = useState<string | undefined>(
    () => items.find(hasMapCoords)?.id,
  );
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

  /** Listings set to the slides design open the presentation straight away. */
  function presentationHrefForProperty(property: Property): string | undefined {
    if (property.design !== "slides") return undefined;
    return `/property/${property.slug}?presentation=1`;
  }

  /** Backdrop for the catalog header: a real property photo, never a test card. */
  function catalogHeroImage(): { url: string; alt: string } | null {
    for (const item of items) {
      if (item.slug.startsWith("test-card")) continue;
      const image = item.images?.[0];
      if (image?.url) return { url: image.url, alt: image.alt || item.title };
    }
    return null;
  }

  const heroImage = catalogHeroImage();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ParallaxSection
        imageUrl={heroImage?.url ?? null}
        alt={heroImage?.alt || title}
        className="mb-6 flex min-h-[clamp(260px,38vh,420px)] flex-col justify-end rounded-[var(--radius-xl)]"
        contentClassName="px-5 py-10 sm:px-10 sm:py-14"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.45)] bg-[rgba(11,28,51,0.6)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent-soft)] backdrop-blur-sm">
          SEAPS · Listings
        </p>
        <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(1.9rem,4.4vw,3.4rem)] leading-[1.05] text-balance text-white">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
          {description}
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
          {total} matching {total === 1 ? "listing" : "listings"}
        </p>
      </ParallaxSection>

      {coverAd ? (
        <div className="mb-2 flex justify-center">
          <CatalogCoverAd src={coverAd.src} alt={coverAd.alt} href={coverAd.href} />
        </div>
      ) : null}

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
              <PropertyList
                items={items}
                userId={userId}
                presentationHrefForProperty={presentationHrefForProperty}
              />
            </div>
          ) : view === "list" ? (
            <PropertyList
              items={items}
              userId={userId}
              presentationHrefForProperty={presentationHrefForProperty}
            />
          ) : (
            <PropertyGrid
              items={items}
              userId={userId}
              presentationHrefForProperty={presentationHrefForProperty}
            />
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
            <ButtonLink href="/dashboard/agent/saved-searches" variant="ghost" size="sm" className="inline px-1">
              Save this search
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
