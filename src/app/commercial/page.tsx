import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";

export const metadata: Metadata = {
  title: "Commercial property",
  description: "Offices, retail, warehouses, and commercial suites.",
};

export default async function CommercialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      title="Commercial property"
      description="Start from all inventory, then filter to office, retail, warehouse, or commercial."
    />
  );
}
