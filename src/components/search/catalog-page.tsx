import { Suspense } from "react";
import { CatalogClient } from "@/components/search/catalog-client";
import { LoadingState } from "@/components/shared/states";
import { getSession } from "@/lib/auth";
import { dealDefault, runCatalogSearch, type CatalogVisibility } from "@/lib/catalog";
import type { SearchFilters, TransactionType } from "@/lib/types";

export type CatalogCoverAdConfig = {
  src: string;
  alt: string;
};

export async function CatalogPage({
  searchParams,
  title,
  description,
  deal,
  defaults,
  visibility = "normal",
  coverAd,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  title: string;
  description: string;
  deal?: TransactionType;
  defaults?: Partial<SearchFilters>;
  visibility?: CatalogVisibility;
  coverAd?: CatalogCoverAdConfig;
}) {
  const params = await searchParams;
  const session = await getSession();
  const result = await runCatalogSearch(
    params,
    {
      ...(deal ? dealDefault(deal) : {}),
      ...defaults,
    },
    { visibility },
  );

  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10"><LoadingState /></div>}>
      <CatalogClient
        items={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        userId={session?.id}
        title={title}
        description={description}
        coverAd={coverAd}
      />
    </Suspense>
  );
}
