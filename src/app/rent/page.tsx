import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogRouteMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/rent",
    title: "Homes for rent",
    description: "Long-term rental listings across Cambodia.",
    searchParams: await searchParams,
  });
}

export default async function RentPage({ searchParams }: Props) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="rent"
      title="Long-term rentals"
      description="Monthly rentals for apartments, condos, offices, and commercial suites."
    />
  );
}
