import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";

export const metadata: Metadata = {
  title: "Short stays",
  description: "Nightly short-stay listings across Cambodia.",
};

export default async function ShortStayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      deal="short_stay"
      title="Short stays"
      description="Nightly priced listings intended for short stays rather than annual leases."
    />
  );
}
