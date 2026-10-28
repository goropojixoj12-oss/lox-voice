import Image from "next/image";
import { InquiryForm } from "@/components/forms/inquiry-form";
import type { Property } from "@/lib/types";
import { propertyInquiryPromoLines } from "@/lib/property-inquiry-promo-lines";

export function PropertyListingInquiry({
  propertyId,
  propertyTitle,
  coverUrl,
  coverAlt,
  promoLines,
}: {
  propertyId: string;
  propertyTitle: string;
  coverUrl?: string;
  coverAlt?: string;
  promoLines?: string[];
}) {
  const lines = promoLines ?? [];

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
      <div className="space-y-3 px-4 pt-4">
        <p className="text-center font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-[0.14em] text-[var(--color-accent-soft)]">
          30% OFF
        </p>
        {coverUrl ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <Image
              src={coverUrl}
              alt={coverAlt ?? propertyTitle}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 360px"
              priority
            />
          </div>
        ) : null}
        {lines.length ? (
          <div className="space-y-2.5 pb-2 text-center">
            {lines.map((line) => (
              <p
                key={line}
                className="text-pretty text-sm leading-[1.65] tracking-normal text-[var(--color-text)]"
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <InquiryForm
        variant="property"
        embedded
        propertyId={propertyId}
        propertyTitle={propertyTitle}
      />
    </div>
  );
}

export function propertyListingInquiryFromProperty(property: Property) {
  const cover = property.images[0];
  return {
    propertyId: property.id,
    propertyTitle: property.title,
    coverUrl: cover?.url,
    coverAlt: cover?.alt ?? property.title,
    promoLines: propertyInquiryPromoLines(property),
  };
}
