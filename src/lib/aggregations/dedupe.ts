import { createHash } from "crypto";
import type { AggregatedListing } from "@/lib/types";

export function listingContentHash(input: {
  title: string;
  price: number | null;
  location: string | null;
}): string {
  const raw = [
    input.title.trim().toLowerCase(),
    input.price == null ? "" : String(input.price),
    (input.location ?? "").trim().toLowerCase(),
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

export function resolveExternalId(input: {
  externalId?: string;
  title: string;
  price: number | null;
  location: string | null;
}): string {
  if (input.externalId?.trim()) return input.externalId.trim();
  return `hash:${listingContentHash(input)}`;
}

/** Prefer newer publishedAt / updatedAt when merging duplicates. */
export function shouldReplaceExisting(
  existing: AggregatedListing,
  incoming: AggregatedListing,
): boolean {
  const a = Date.parse(incoming.publishedAt ?? incoming.updatedAt ?? incoming.createdAt);
  const b = Date.parse(existing.publishedAt ?? existing.updatedAt ?? existing.createdAt);
  if (Number.isNaN(a)) return false;
  if (Number.isNaN(b)) return true;
  return a >= b;
}
