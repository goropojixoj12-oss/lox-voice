import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";

export const metadata: Metadata = {
  title: "Search properties",
  description: "Filter SEAPS listings by deal type, city, price, amenities, and more.",
};

export default async function SearchRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      title="Search properties"
      description="Combine filters freely. Results update in the URL so you can share or save the query."
    />
  );
}
