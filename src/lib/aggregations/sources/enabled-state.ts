import type { AggregationSourceCatalogEntry } from "./types";

export type AggregationSourceOverride = { enabled: boolean };

/** Normalize persisted override blobs (legacy bare booleans or partial objects). */
export function normalizeAggregationSourceOverrides(
  raw: unknown,
): Record<string, AggregationSourceOverride> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, AggregationSourceOverride> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "boolean") {
      out[id] = { enabled: value };
      continue;
    }
    if (value && typeof value === "object" && "enabled" in value) {
      const enabled = (value as { enabled: unknown }).enabled;
      if (typeof enabled === "boolean") {
        out[id] = { enabled };
      }
    }
  }
  return out;
}

export function resolveCatalogSourceEnabled(
  entry: AggregationSourceCatalogEntry,
  overrides: Record<string, AggregationSourceOverride>,
): boolean {
  const ov = overrides[entry.id];
  if (ov) return ov.enabled;
  return entry.enabled;
}
