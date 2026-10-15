export type AggregationSyncResponse = {
  ok?: boolean;
  error?: string;
  created?: number;
  updated?: number;
  fetched?: number;
  skippedNonRe?: number;
  total?: number;
  sourcesAttempted?: number;
  adaptersRun?: string[];
  storageBackend?: string;
  warnings?: string[];
  syncCursor?: {
    nextIndex: number;
    totalEnabled: number;
    updatedAt: string;
  };
};

export async function postAggregationSync(
  query?: Record<string, string>,
): Promise<{ res: Response; data: AggregationSyncResponse }> {
  const qs =
    query && Object.keys(query).length > 0
      ? `?${new URLSearchParams(query).toString()}`
      : "";
  const res = await fetch(`/api/aggregations/sync${qs}`, { method: "POST" });
  const data = (await res.json()) as AggregationSyncResponse;
  return { res, data };
}

/** Poll every enabled registry source in batches until the cursor completes one full rotation. */
export async function runFullRegistryImport(options: {
  batchSize?: number;
  onProgress?: (progress: {
    batch: number;
    sourcesPolled: number;
    totalEnabled: number;
    last: AggregationSyncResponse;
  }) => void;
  signal?: AbortSignal;
}): Promise<{
  ok: boolean;
  error?: string;
  batches: number;
  sourcesPolled: number;
  totalEnabled: number;
  totalListings: number;
  created: number;
  updated: number;
  last?: AggregationSyncResponse;
}> {
  const batchSize = String(options.batchSize ?? 50);
  let batches = 0;
  let sourcesPolled = 0;
  let totalEnabled = 0;
  let created = 0;
  let updated = 0;
  let totalListings = 0;
  let last: AggregationSyncResponse | undefined;

  const maxBatches = 80;

  while (batches < maxBatches) {
    if (options.signal?.aborted) {
      return {
        ok: false,
        error: "Cancelled",
        batches,
        sourcesPolled,
        totalEnabled,
        totalListings,
        created,
        updated,
        last,
      };
    }

    const { res, data } = await postAggregationSync({ batchSize });
    last = data;
    batches += 1;

    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? `Sync failed (${res.status})`,
        batches,
        sourcesPolled,
        totalEnabled,
        totalListings,
        created,
        updated,
        last,
      };
    }

    const attempted = data.sourcesAttempted ?? 0;
    sourcesPolled += attempted;
    totalEnabled = data.syncCursor?.totalEnabled ?? totalEnabled;
    created += data.created ?? 0;
    updated += data.updated ?? 0;
    totalListings = data.total ?? totalListings;

    options.onProgress?.({
      batch: batches,
      sourcesPolled,
      totalEnabled,
      last: data,
    });

    if (totalEnabled > 0 && sourcesPolled >= totalEnabled) {
      break;
    }
    if (attempted === 0) {
      break;
    }
  }

  const completed = totalEnabled > 0 && sourcesPolled >= totalEnabled;
  return {
    ok: completed,
    error: completed ? undefined : "Stopped before all sources were polled (timeout or empty batch)",
    batches,
    sourcesPolled,
    totalEnabled,
    totalListings,
    created,
    updated,
    last,
  };
}
