import { brand } from "@/config/brand";

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: brand.name,
    alternateName: brand.fullName,
    url: brand.url,
    description: brand.description,
    foundingDate: String(brand.foundedYear),
    areaServed: {
      "@type": "Country",
      name: brand.country,
    },
    email: brand.supportEmail,
    logo: `${brand.url}/brand/seaps-logo.png`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${brand.url}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function PropertyJsonLd({
  title,
  description,
  url,
  image,
  price,
  currency,
  locality,
  region,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  price?: number;
  currency?: string;
  locality?: string;
  region?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    description,
    url: url.startsWith("http") ? url : `${brand.url}${url}`,
    image: image ? (image.startsWith("http") ? image : `${brand.url}${image}`) : undefined,
    offers:
      price != null
        ? {
            "@type": "Offer",
            price,
            priceCurrency: currency ?? "USD",
            availability: "https://schema.org/InStock",
          }
        : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: locality,
      addressRegion: region,
      addressCountry: "KH",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
