import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogRouteMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/rent/residential",
    title: "Homes for rent",
    description: "Long-term residential rental listings across Cambodia.",
    searchParams: await searchParams,
  });
}

export default async function RentResidentialPage({ searchParams }: Props) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="rent"
      title="Long-term rentals"
      description="Monthly rentals for apartments, condos, and residential homes."
    />
  );
}
