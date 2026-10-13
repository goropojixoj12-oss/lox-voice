import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";

export const metadata: Metadata = {
  title: "Homes for sale",
  description: "Browse sale listings across SEAPS demo cities.",
};

export default async function BuyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="sale"
      title="Homes for sale"
      description="Sale inventory including apartments, villas, land, and project units."
    />
  );
}
