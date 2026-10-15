import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogRouteMetadata } from "@/lib/seo";

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

export default async function SearchRoute({ searchParams }: Props) {
  return (
    <CatalogPage
      searchParams={searchParams}
      title="Search properties"
      description="Combine filters freely. Results update in the URL so you can share or save the query."
    />
  );
}
