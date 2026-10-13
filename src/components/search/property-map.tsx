"use client";

import { brand } from "@/config/brand";
import type { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PropertyMap({
  items,
  activeId,
  onSelect,
}: {
  items: Property[];
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  if (brand.mapProvider === "none" || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[linear-gradient(160deg,#dfe8e3,#f4efe7_45%,#e7dfd3)]">
        <div className="border-b border-[var(--color-border)] bg-white/80 px-4 py-3 text-sm text-[var(--color-muted)]">
          Interactive map provider is not configured. Showing a schematic pin board instead.
          Set <code className="mx-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable Mapbox.
        </div>
        <div className="relative min-h-[420px] p-4">
          {items.map((property, index) => {
            const left = 8 + ((index * 17) % 78);
            const top = 12 + ((index * 23) % 68);
            const active = activeId === property.id;
            return (
              <button
                key={property.id}
                type="button"
                onClick={() => onSelect?.(property.id)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm transition",
                  active
                    ? "z-10 border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                    : "border-[var(--color-primary)] bg-white text-[var(--color-accent-soft)] hover:bg-[var(--color-primary)] hover:text-white",
                )}
                style={{ left: `${left}%`, top: `${top}%` }}
                title={property.title}
              >
                {formatPrice(property.price, property.currency, { compact: true })}
              </button>
            );
          })}
          {activeId ? (
            <div className="absolute bottom-4 left-4 right-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white/95 p-3 shadow-[var(--shadow-soft)]">
              {(() => {
                const property = items.find((p) => p.id === activeId);
                if (!property) return null;
                return (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--color-accent-soft)]">{property.title}</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {property.location.district}, {property.location.city}
                      </p>
                    </div>
                    <Link
                      href={`/property/${property.slug}`}
                      className="text-sm font-semibold text-[var(--color-accent)]"
                    >
                      Open
                    </Link>
                  </div>
                );
              })()}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-muted)]">
      Map provider selected. Configure map tokens to enable the live map widget.
    </div>
  );
}
