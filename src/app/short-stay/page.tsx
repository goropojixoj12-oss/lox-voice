import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogRouteMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/short-stay",
    title: "Short stays",
    description: "Nightly short-stay listings across Cambodia.",
    searchParams: await searchParams,
  });
}

export default async function ShortStayPage({ searchParams }: Props) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="short_stay"
      title="Short stays"
      description="Nightly priced listings intended for short stays rather than annual leases."
    />
  );
}
