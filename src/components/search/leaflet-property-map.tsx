"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: L.LatLngExpression = [12.5657, 104.991];
const DEFAULT_ZOOM = 7;

function hasValidCoords(property: Property) {
  const { lat, lng } = property.location;
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function priceIcon(property: Property, active: boolean) {
  const label = escapeHtml(formatPrice(property.price, property.currency, { compact: true }));
  const title = escapeHtml(property.title);
  return L.divIcon({
    className: "seaps-map-pin",
    html: `<button type="button" class="seaps-map-pin__btn${active ? " is-active" : ""}" title="${title}">${label}</button>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function LeafletPropertyMap({
  items,
  activeId,
  onSelect,
}: {
  items: Property[];
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const mappable = items.filter(hasValidCoords);
  const activeProperty = items.find((p) => p.id === activeId);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const pins = items.filter(hasValidCoords);
    const nextIds = new Set(pins.map((p) => p.id));

    for (const [id, marker] of markersRef.current) {
      if (!nextIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    }

    for (const property of pins) {
      const { lat, lng } = property.location;
      const isActive = activeId === property.id;
      const existing = markersRef.current.get(property.id);

      if (existing) {
        existing.setLatLng([lat, lng]);
        existing.setIcon(priceIcon(property, isActive));
        existing.setZIndexOffset(isActive ? 1000 : 0);
        continue;
      }

      const marker = L.marker([lat, lng], {
        icon: priceIcon(property, isActive),
        zIndexOffset: isActive ? 1000 : 0,
      }).addTo(map);

      marker.on("click", () => onSelectRef.current?.(property.id));
      markersRef.current.set(property.id, marker);
    }

    if (pins.length === 1) {
      const only = pins[0];
      map.setView([only.location.lat, only.location.lng], 14);
    } else if (pins.length > 1) {
      const bounds = L.latLngBounds(pins.map((p) => [p.location.lat, p.location.lng]));
      map.fitBounds(bounds.pad(0.18), { maxZoom: 14 });
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }

    const frame = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [items, activeId]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div ref={containerRef} className="seaps-leaflet-map min-h-[420px] w-full" />
      {activeProperty ? (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--color-accent-soft)]">{activeProperty.title}</p>
              <p className="text-sm text-[var(--color-muted)]">
                {activeProperty.location.district}, {activeProperty.location.city}
              </p>
            </div>
            <Link
              href={`/property/${activeProperty.slug}`}
              className="text-sm font-semibold text-[var(--color-accent)]"
            >
              Open
            </Link>
          </div>
        </div>
      ) : null}
      {mappable.length === 0 ? (
        <div className="border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)]">
          No listings with map coordinates in this result set.
        </div>
      ) : null}
    </div>
  );
}
