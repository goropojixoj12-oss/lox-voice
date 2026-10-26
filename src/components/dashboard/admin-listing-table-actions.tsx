"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import type { ListingStatus } from "@/lib/types";

const actionButtonClass =
  "rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--color-accent)]";

type Props = {
  listingId: string;
  listingTitle: string;
  status: ListingStatus;
  canDeleteRejected: boolean;
  onRemoved?: () => void;
};

export function AdminListingTableActions({
  listingId,
  listingTitle,
  status,
  canDeleteRejected,
  onRemoved,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteListing() {
    const confirmed = window.confirm(
      `Delete rejected listing “${listingTitle}”? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not delete listing");
        return;
      }
      onRemoved?.();
      router.refresh();
    } catch {
      setError("Could not delete listing");
    } finally {
      setDeleting(false);
    }
  }

  const detailHref = adminDeskPath("listings", listingId);
  const manageLink = (
    <Link href={detailHref} className="text-[var(--color-accent-soft)] underline">
      Manage
    </Link>
  );
  const manageButton = (
    <Link
      href={detailHref}
      className={`${actionButtonClass} text-[var(--color-accent-soft)]`}
    >
      Manage
    </Link>
  );

  if (status === "rejected") {
    return (
      <div className="text-right">
        <span className="inline-flex flex-wrap items-center justify-end gap-2">
          {manageButton}
          {canDeleteRejected ? (
            <button
              type="button"
              onClick={() => void deleteListing()}
              disabled={deleting}
              className={`${actionButtonClass} border-red-500/40 text-red-400 hover:border-red-400 disabled:opacity-50`}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          ) : null}
        </span>
        {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
      </div>
    );
  }

  return manageLink;
}
