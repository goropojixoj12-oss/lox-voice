import { nanoid } from "nanoid";
import {
  getAggregatedListings,
  saveAggregatedListings,
} from "@/lib/store";
import type { AggregatedListing } from "@/lib/types";
import { aggregationAdapters } from "./adapters";
import type { AggregatedDraft } from "./adapters/types";
import { resolveExternalId, shouldReplaceExisting } from "./dedupe";
import { draftToRelevanceInput, filterIngestDrafts } from "./ingest-filter";
import { shouldRejectListingAtIngest } from "./relevance";
import { sanitizeDescription } from "./sanitize";
import { syncEnabledRegistryPortals } from "./sources/registry-sync";

export type SyncSummary = {
  adaptersRun: string[];
  sourcesRun: string[];
  sourcesAttempted: number;
  batchSize?: number;
  syncCursor?: {
    nextIndex: number;
    totalEnabled: number;
    updatedAt: string;
  };
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  /** Drafts rejected by ingest RE filter (jobs, cars, phones, etc.). */
  skippedNonRe: number;
  total: number;
  warnings: string[];
};

function draftToListing(draft: AggregatedDraft, now: string): AggregatedListing {
  const externalId = resolveExternalId({
    externalId: draft.externalId,
    title: draft.title,
    price: draft.price,
    location: draft.location,
  });

  return {
    id: `agg-${nanoid(10)}`,
    title: draft.title.trim().slice(0, 200),
    description: sanitizeDescription(draft.description),
    price: draft.price,
    currency: draft.currency || "USD",
    location: draft.location?.trim() || null,
    propertyType: draft.propertyType,
    photos: draft.photos.filter(Boolean).slice(0, 12),
    publishedAt: draft.publishedAt,
    sourceName: draft.sourceName,
    sourceUrl: draft.sourceUrl,
    contacts: {
      phone: draft.contacts.phone?.trim() || undefined,
      email: draft.contacts.email?.trim() || undefined,
      messenger: draft.contacts.messenger?.trim() || undefined,
    },
    externalId,
    createdAt: now,
    updatedAt: now,
  };
}

export async function runAggregationSync(options?: {
  adapterIds?: string[];
  /** When false, skip registry portal polling (demo-only seed). */
  includeRegistry?: boolean;
  batchSize?: number;
  /** Process all enabled registry rows in one run (may exceed serverless timeout). */
  fullCycle?: boolean;
}): Promise<SyncSummary> {
  const includeRegistry = options?.includeRegistry !== false;
  const onlyDemo =
    options?.adapterIds?.length === 1 && options.adapterIds[0] === "demo";

  const adapters = options?.adapterIds?.length
    ? aggregationAdapters.filter((a) => options.adapterIds!.includes(a.id))
    : aggregationAdapters;

  const warnings: string[] = [];
  const drafts: AggregatedDraft[] = [];
  const adaptersRun: string[] = [];
  let sourcesRun: string[] = [];
  let sourcesAttempted = 0;
  let registryBatchSize: number | undefined;
  let syncCursor: SyncSummary["syncCursor"];
  let registrySkippedNonRe = 0;

  if (onlyDemo) {
    const demo = aggregationAdapters.find((a) => a.id === "demo");
    if (demo) {
      adaptersRun.push(demo.id);
      const result = await demo.fetchDrafts();
      drafts.push(...result.items);
      warnings.push(...result.warnings);
    }
  } else {
    for (const adapter of adapters) {
      adaptersRun.push(adapter.id);
      try {
        const result = await adapter.fetchDrafts();
        drafts.push(...result.items);
        warnings.push(...result.warnings);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        warnings.push(`${adapter.id}: crashed — ${msg}`);
      }
    }

    if (includeRegistry) {
      try {
        const registry = await syncEnabledRegistryPortals({
          batchSize: options?.batchSize,
          fullCycle: options?.fullCycle,
        });
        sourcesAttempted = registry.sourcesAttempted;
        sourcesRun = registry.sourcesRun;
        registryBatchSize = registry.batchSize;
        syncCursor = registry.cursor;
        drafts.push(...registry.drafts);
        registrySkippedNonRe = registry.skippedNonRe;
        warnings.push(...registry.warnings);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "registry sync failed";
        warnings.push(`registry: ${msg}`);
      }
    }
  }

  const existing = await getAggregatedListings();
  const byExternal = new Map(existing.map((l) => [l.externalId, l]));
  const contentKeys = new Map(
    existing.map((l) => [
      resolveExternalId({
        title: l.title,
        price: l.price,
        location: l.location,
      }),
      l,
    ]),
  );

  const ingestFiltered = filterIngestDrafts(drafts);
  let skippedNonRe = ingestFiltered.skippedNonRe + registrySkippedNonRe;
  const ingestDrafts = ingestFiltered.kept;

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const draft of ingestDrafts) {
    if (!draft.title?.trim()) {
      skipped += 1;
      continue;
    }

    const incoming = draftToListing(draft, now);
    const match =
      byExternal.get(incoming.externalId) ??
      contentKeys.get(
        resolveExternalId({
          title: incoming.title,
          price: incoming.price,
          location: incoming.location,
        }),
      );

    if (!match) {
      byExternal.set(incoming.externalId, incoming);
      contentKeys.set(
        resolveExternalId({
          title: incoming.title,
          price: incoming.price,
          location: incoming.location,
        }),
        incoming,
      );
      created += 1;
      continue;
    }

    if (!shouldReplaceExisting(match, incoming)) {
      skipped += 1;
      continue;
    }

    const merged: AggregatedListing = {
      ...incoming,
      id: match.id,
      createdAt: match.createdAt,
      updatedAt: now,
    };
    byExternal.set(merged.externalId, merged);
    contentKeys.set(
      resolveExternalId({
        title: merged.title,
        price: merged.price,
        location: merged.location,
      }),
      merged,
    );
    updated += 1;
  }

  const next = Array.from(byExternal.values()).sort((a, b) => {
    const ta = Date.parse(a.publishedAt ?? a.createdAt);
    const tb = Date.parse(b.publishedAt ?? b.createdAt);
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });

  await saveAggregatedListings(next);

  return {
    adaptersRun,
    sourcesRun,
    sourcesAttempted,
    batchSize: registryBatchSize,
    syncCursor,
    fetched: drafts.length,
    created,
    updated,
    skipped,
    skippedNonRe,
    total: next.length,
    warnings:
      skippedNonRe > 0
        ? [
            `Ingest filter: skipped ${skippedNonRe} non–real-estate draft(s) before save`,
            ...warnings,
          ]
        : warnings,
  };
}

/** Upsert a single manually pasted / webhook listing. */
export async function importAggregatedDraft(
  draft: AggregatedDraft,
): Promise<{ listing: AggregatedListing; created: boolean } | { rejected: true; reason: string }> {
  if (shouldRejectListingAtIngest(draftToRelevanceInput(draft))) {
    return { rejected: true as const, reason: "non_real_estate_ingest_filter" };
  }

  const now = new Date().toISOString();
  const incoming = draftToListing(draft, now);
  const all = await getAggregatedListings();
  const idx = all.findIndex((l) => l.externalId === incoming.externalId);

  if (idx < 0) {
    all.unshift(incoming);
    await saveAggregatedListings(all);
    return { listing: incoming, created: true };
  }

  const merged: AggregatedListing = {
    ...incoming,
    id: all[idx].id,
    createdAt: all[idx].createdAt,
    updatedAt: now,
  };
  all[idx] = merged;
  await saveAggregatedListings(all);
  return { listing: merged, created: false };
}
