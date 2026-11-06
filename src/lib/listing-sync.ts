import { exportListingToRepo } from "@/lib/listing-export";
import type { Property } from "@/lib/types";

export type ListingSyncResult =
  | { ok: true; commitUrl: string; slug: string }
  | { ok: false; error: string };

/**
 * Every save in the cabinet must land in the repository, otherwise the card
 * stays invisible on the site (the catalog reads content/listings only).
 * Failures never roll back the save: the caller reports them and the user can
 * retry from the same screen.
 */
export async function syncListingToRepo(listing: Property): Promise<ListingSyncResult> {
  try {
    const result = await exportListingToRepo(listing);
    return { ok: true, commitUrl: result.commitUrl, slug: result.slug };
  } catch (error) {
    const message = error instanceof Error ? error.message : "export failed";
    console.error("[listings/sync]", listing.id, message);
    return { ok: false, error: message };
  }
}