import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogVisibilityForDeal } from "@/lib/catalog";
import { catalogRouteMetadata } from "@/lib/seo";
import type { TransactionType } from "@/lib/types";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/search",
    title: "Search properties",
    description: "Filter SEAPS listings by deal type, city, price, amenities, and more.",
    searchParams: await searchParams,
  });
}

function dealFromParams(params: Record<string, string | string[] | undefined>): TransactionType | undefined {
  const raw = params.deal;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "sale" || value === "rent" || value === "short_stay") return value;
  return undefined;
}

export default async function SearchRoute({ searchParams }: Props) {
  const params = await searchParams;
  const deal = dealFromParams(params);
  return (
    <CatalogPage
      searchParams={searchParams}
      visibility={catalogVisibilityForDeal(deal)}
      title="Search properties"
      description="Combine filters freely. Results update in the URL so you can share or save the query."
    />
  );
}
