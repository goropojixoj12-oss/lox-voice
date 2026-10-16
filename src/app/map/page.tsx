import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogRouteMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/map",
    title: "Map search",
    description: "Browse listings with list and map synchronization.",
    searchParams: await searchParams,
  });
}

export default async function MapPage({ searchParams }: Props) {
  return (
    <CatalogPage
      searchParams={searchParams}
      title="Map search"
      description="Use the Map view toggle to synchronize pins with the listing list. OpenStreetMap is used by default; set NEXT_PUBLIC_MAPBOX_TOKEN to switch to Mapbox later."
    />
  );
}
