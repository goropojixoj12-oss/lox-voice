import { NextResponse } from "next/server";

function envEnabled(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/**
 * Bulk aggregation import/sync/prune from an admin browser session (default: off).
 * Cron may still use AGGREGATION_SYNC_SECRET / CRON_SECRET when configured.
 */
export function adminAggregationControlEnabled(): boolean {
  return envEnabled("SEAPS_ENABLE_ADMIN_AGGREGATION_CONTROL");
}

export const ADMIN_AGGREGATION_DISABLED_MESSAGE =
  "Aggregation controls from the admin desk are disabled. Use scheduled jobs or ask a developer.";

export function adminAggregationForbiddenResponse(): NextResponse {
  return NextResponse.json({ error: ADMIN_AGGREGATION_DISABLED_MESSAGE }, { status: 403 });
}
