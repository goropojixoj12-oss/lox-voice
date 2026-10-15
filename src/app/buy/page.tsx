import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogRouteMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/buy",
    title: "Homes for sale",
    description: "Browse sale listings across Cambodian cities.",
    searchParams: await searchParams,
  });
}

export default async function BuyPage({ searchParams }: Props) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="sale"
      title="Homes for sale"
      description="Sale inventory including apartments, villas, land, and project units."
    />
  );
}
