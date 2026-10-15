# Market Feed ingest filters

Non–real-estate headlines are **blocked at ingest** (before save/merge) via `classifyIngestRelevance` in `src/lib/aggregations/relevance.ts`. Ingest is **stricter than prune**: bare “for sale” / “rent” is not enough if the headline is clearly jobs, vehicles, phones, or services. Admin **Remove non-RE listings** still uses the conservative prune classifier.

## What is kept

- Demo seeds (`externalId` prefix `demo:` or `example.local/demo` URLs)
- Drafts with a known `propertyType` (apartment, house, land, …)
- Title/description/URL signals for property, rent, sale, land, condo, etc. (English + Khmer)
- Property portal URL paths (property, for-sale, for-rent, …)

## What is rejected at ingest

- Clear **jobs**, **vehicles**, **phones/electronics**, **tutoring/visa/translation services** keywords when no RE signal is present
- Registry **list URLs** whose path is a known non-RE category (jobs, cars, phones, …) — source is marked `skipped`, not polled
- Parsed headlines from generic HTML/RSS that fail the classifier (counted as `skippedNonRe` / `itemsSkippedNonRe`, status `ok` — **not** `adapter_needed`)

## Stats

- Sync API summary: `skippedNonRe`
- Sync meta: `lastSkippedNonRe`
- Per registry source runtime: `itemsSkippedNonRe`

Manual import (`POST /api/aggregations/import`) returns **422** when the payload fails the filter.

## Smoke test

```bash
npx tsx scripts/smoke-ingest-filters.mjs
```

Prune remains available for legacy rows imported before ingest filtering.
