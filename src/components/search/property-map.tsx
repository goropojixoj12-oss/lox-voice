"use client";

import dynamic from "next/dynamic";
import { brand } from "@/config/brand";
import type { Property } from "@/lib/types";

const LeafletPropertyMap = dynamic(
  () =>
    import("@/components/search/leaflet-property-map").then((mod) => mod.LeafletPropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-muted)]">
        Loading map…
      </div>
    ),
  },
);

function isMapboxEnabled() {
  return (
    brand.mapProvider === "mapbox" && Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN)
  );
}

export function PropertyMap({
  items,
  activeId,
  onSelect,
}: {
  items: Property[];
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  if (isMapboxEnabled()) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
        Mapbox is selected via <code className="text-[var(--color-accent-soft)]">NEXT_PUBLIC_MAP_PROVIDER</code>.
        Wire the Mapbox GL widget here when ready; until then set the provider to{" "}
        <code className="text-[var(--color-accent-soft)]">none</code> to use the free OpenStreetMap map.
      </div>
    );
  }

  return <LeafletPropertyMap items={items} activeId={activeId} onSelect={onSelect} />;
}
