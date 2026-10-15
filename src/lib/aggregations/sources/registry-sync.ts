import type { AggregatedDraft } from "../adapters/types";
import {
  fetchKnownPortalAdapter,
  fetchGenericPortalUrl,
} from "../adapters/html-portal";
import type { AggregationSourceCatalogEntry } from "./types";
import { getEnabledPortalSources } from "./catalog";
import { saveAggregationSourceRuntime } from "@/lib/store";

export type RegistrySyncResult = {
  sourcesAttempted: number;
  drafts: AggregatedDraft[];
  warnings: string[];
  sourcesRun: string[];
};

/**
 * Poll every enabled portal row from the source registry.
 * Known hosts reuse dedicated HTML adapters; others get a lightweight fetch.
 */
export async function syncEnabledRegistryPortals(): Promise<RegistrySyncResult> {
  const enabled = await getEnabledPortalSources();
  const drafts: AggregatedDraft[] = [];
  const warnings: string[] = [];
  const sourcesRun: string[] = [];
  const adapterHostsRun = new Set<string>();

  for (const source of enabled) {
    sourcesRun.push(source.id);
    const now = new Date().toISOString();

    if (source.type !== "portal") {
      await saveAggregationSourceRuntime(source.id, {
        lastRun: now,
        itemsFetched: 0,
        status: "skipped",
        message: "Only portal URLs are polled automatically",
      });
      continue;
    }

    try {
      const result = await syncOnePortalSource(source, adapterHostsRun);
      drafts.push(...result.items);
      warnings.push(...result.warnings);
      await saveAggregationSourceRuntime(source.id, {
        lastRun: now,
        itemsFetched: result.items.length,
        status: result.status,
        message: result.message,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "sync failed";
      warnings.push(`${source.id}: ${msg}`);
      await saveAggregationSourceRuntime(source.id, {
        lastRun: now,
        itemsFetched: 0,
        status: "error",
        message: msg,
      });
    }
  }

  return {
    sourcesAttempted: enabled.length,
    drafts,
    warnings,
    sourcesRun,
  };
}

async function syncOnePortalSource(
  source: AggregationSourceCatalogEntry,
  adapterHostsRun: Set<string>,
): Promise<{
  items: AggregatedDraft[];
  warnings: string[];
  status: "ok" | "adapter_needed" | "error";
  message: string | null;
}> {
  if (source.adapterId) {
    const hostKey = source.adapterId;
    if (adapterHostsRun.has(hostKey)) {
      return {
        items: [],
        warnings: [`${source.id}: adapter ${source.adapterId} already ran this cycle`],
        status: "ok",
        message: "Deduped — same adapter as another enabled URL",
      };
    }
    adapterHostsRun.add(hostKey);
    const { items, warnings } = await fetchKnownPortalAdapter(source.adapterId);
    return {
      items,
      warnings,
      status: items.length > 0 ? "ok" : "adapter_needed",
      message:
        items.length > 0
          ? null
          : "Dedicated adapter returned no parseable listings",
    };
  }

  const generic = await fetchGenericPortalUrl({
    sourceId: source.id,
    sourceName: source.name,
    listUrl: source.url,
  });

  const status =
    generic.items.length > 0
      ? "ok"
      : generic.adapterNeeded
        ? "adapter_needed"
        : "error";

  return {
    items: generic.items,
    warnings: generic.warnings,
    status,
    message:
      generic.adapterNeeded && generic.items.length === 0
        ? "adapter needed — HTML fetch did not yield listing cards"
        : generic.warnings[0] ?? null,
  };
}
