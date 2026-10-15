import catalogJson from "@/data/aggregation-sources.json";
import type {
  AggregationSourceCatalogEntry,
  AggregationSourceRuntime,
  AggregationSourceView,
  AggregationSourcesCatalog,
} from "./types";
import {
  getAggregationSourceOverrides,
  getAggregationSourceRuntimeMap,
} from "@/lib/store";

const catalog = catalogJson as AggregationSourcesCatalog;

export function getSourcesCatalog(): AggregationSourcesCatalog {
  return catalog;
}

export function getCatalogSources(): AggregationSourceCatalogEntry[] {
  return catalog.sources;
}

export async function getEnabledPortalSources(): Promise<AggregationSourceCatalogEntry[]> {
  const overrides = await getAggregationSourceOverrides();
  return catalog.sources.filter((s) => {
    if (s.type !== "portal") return false;
    if (s.id in overrides) return overrides[s.id].enabled;
    return s.enabled;
  });
}

export async function countEnabledSourcesByType(): Promise<{
  total: number;
  portal: number;
  agency: number;
  facebook: number;
  telegram: number;
  other: number;
}> {
  const overrides = await getAggregationSourceOverrides();
  const counts = {
    total: 0,
    portal: 0,
    agency: 0,
    facebook: 0,
    telegram: 0,
    other: 0,
  };

  for (const s of catalog.sources) {
    const enabled =
      s.id in overrides ? overrides[s.id].enabled : s.enabled;
    if (!enabled) continue;
    counts.total += 1;
    counts[s.type] += 1;
  }
  return counts;
}

export async function getSourcesAdminView(): Promise<AggregationSourceView[]> {
  const overrides = await getAggregationSourceOverrides();
  const runtimeMap = await getAggregationSourceRuntimeMap();

  return catalog.sources.map((s) => {
    const enabled =
      s.id in overrides ? overrides[s.id].enabled : s.enabled;
    const runtime: AggregationSourceRuntime = runtimeMap[s.id] ?? {
      lastRun: null,
      itemsFetched: 0,
      status: "idle",
      message: null,
    };
    return { ...s, enabled, runtime };
  });
}

export async function resolveSourceEnabled(
  sourceId: string,
): Promise<boolean | null> {
  const entry = catalog.sources.find((s) => s.id === sourceId);
  if (!entry) return null;
  const overrides = await getAggregationSourceOverrides();
  if (sourceId in overrides) return overrides[sourceId].enabled;
  return entry.enabled;
}
