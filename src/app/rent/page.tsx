import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";

export const metadata: Metadata = {
  title: "Homes for rent",
  description: "Long-term rental listings across Cambodia.",
};

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="rent"
      title="Long-term rentals"
      description="Monthly rentals for apartments, condos, offices, and commercial suites."
    />
  );
}
