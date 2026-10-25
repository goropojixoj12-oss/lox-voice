import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogRouteMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/commercial",
    title: "Commercial property",
    description: "Offices, retail, warehouses, and commercial suites.",
    searchParams: await searchParams,
  });
}

export default async function CommercialPage({ searchParams }: Props) {
  return (
    <CatalogPage
      searchParams={searchParams}
      visibility="cleared"
      title="Commercial property"
      description="Start from all inventory, then filter to office, retail, warehouse, or commercial."
    />
  );
}
