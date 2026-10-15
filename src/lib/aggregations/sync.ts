import { nanoid } from "nanoid";
import {
  getAggregatedListings,
  saveAggregatedListings,
} from "@/lib/store";
import type { AggregatedListing } from "@/lib/types";
import { aggregationAdapters } from "./adapters";
import type { AggregatedDraft } from "./adapters/types";
import { resolveExternalId, shouldReplaceExisting } from "./dedupe";
import { sanitizeDescription } from "./sanitize";

export type SyncSummary = {
  adaptersRun: string[];
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
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
}): Promise<SyncSummary> {
  const adapters = options?.adapterIds?.length
    ? aggregationAdapters.filter((a) => options.adapterIds!.includes(a.id))
    : aggregationAdapters;

  const warnings: string[] = [];
  const drafts: AggregatedDraft[] = [];
  const adaptersRun: string[] = [];

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

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const draft of drafts) {
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
    fetched: drafts.length,
    created,
    updated,
    skipped,
    total: next.length,
    warnings,
  };
}

/** Upsert a single manually pasted / webhook listing. */
export async function importAggregatedDraft(
  draft: AggregatedDraft,
): Promise<{ listing: AggregatedListing; created: boolean }> {
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
