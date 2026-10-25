import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogVisibilityForDeal } from "@/lib/catalog";
import { catalogRouteMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/land",
    title: "Land for sale",
    description: "Land parcels across Cambodia.",
    searchParams: await searchParams,
  });
}

export default async function LandPage({ searchParams }: Props) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="sale"
      visibility={catalogVisibilityForDeal("sale")}
      defaults={{ type: "land" }}
      title="Land"
      description="Plots and parcels with land area filters."
    />
  );
}
