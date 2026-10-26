"use client";

import { useState } from "react";
import { AdminListingTableActions } from "@/components/dashboard/admin-listing-table-actions";
import type { ListingStatus } from "@/lib/types";

type Props = {
  listingId: string;
  title: string;
  status: ListingStatus;
  locationLabel: string;
  submitterLabel: string;
  updatedLabel: string;
  canDeleteRejected: boolean;
};

export function AdminListingTableRow({
  listingId,
  title,
  status,
  locationLabel,
  submitterLabel,
  updatedLabel,
  canDeleteRejected,
}: Props) {
  const [removed, setRemoved] = useState(false);

  if (removed) {
    return null;
  }

  return (
    <tr className="border-t border-[var(--color-border)]">
      <td className="p-3 font-semibold">{title}</td>
      <td className="p-3 capitalize">{status}</td>
      <td className="p-3 text-[var(--color-muted)]">{locationLabel}</td>
      <td className="p-3 text-xs">{submitterLabel}</td>
      <td className="p-3 text-xs text-[var(--color-muted)]">{updatedLabel}</td>
      <td className="p-3 text-right">
        <AdminListingTableActions
          listingId={listingId}
          listingTitle={title}
          status={status}
          canDeleteRejected={canDeleteRejected}
          onRemoved={() => setRemoved(true)}
        />
      </td>
    </tr>
  );
}
