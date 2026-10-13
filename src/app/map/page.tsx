import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";

export const metadata: Metadata = {
  title: "Map search",
  description: "Browse listings with list and map synchronization.",
};

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      title="Map search"
      description="Use the Map view toggle to synchronize pins with the listing list. Mapbox activates when a token is configured."
    />
  );
}
