import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";

export const metadata: Metadata = {
  title: "Land for sale",
  description: "Land parcels in the SEAPS demo catalog.",
};

export default async function LandPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="sale"
      defaults={{ type: "land" }}
      title="Land"
      description="Plots and parcels with land area filters."
    />
  );
}
