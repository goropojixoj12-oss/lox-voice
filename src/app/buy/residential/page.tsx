import type { Metadata } from "next";
import { CatalogPage } from "@/components/search/catalog-page";
import { catalogVisibilityForDeal } from "@/lib/catalog";
import { resolveCatalogCoverSrc } from "@/lib/catalog-page-covers";
import { catalogRouteMetadata } from "@/lib/seo";

const BUY_RESIDENTIAL_COVER_SLUG = "buy-residential-vue-aston";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogRouteMetadata({
    path: "/buy/residential",
    title: "Homes for sale",
    description: "Browse residential sale listings across Cambodian cities.",
    searchParams: await searchParams,
  });
}

export default async function BuyResidentialPage({ searchParams }: Props) {
  const coverSrc = resolveCatalogCoverSrc(BUY_RESIDENTIAL_COVER_SLUG);

  return (
    <CatalogPage
      searchParams={searchParams}
      deal="sale"
      visibility={catalogVisibilityForDeal("sale")}
      title="Homes for sale"
      description="Sale inventory including apartments, villas, and project units."
      coverAd={
        coverSrc
          ? {
              src: coverSrc,
              alt: "Vue Aston — residential property for sale",
            }
          : undefined
      }
    />
  );
}
