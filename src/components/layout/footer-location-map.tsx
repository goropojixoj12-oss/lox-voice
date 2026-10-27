import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

/** Footer map slot — thin gold frame with Google Maps embed and link. */
export function FooterLocationMap({ className }: { className?: string }) {
  const embedUrl = brand.googleMapsEmbedUrl;
  const mapsUrl = brand.googleMapsPlaceUrl;
  const { officeAddress } = brand;

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <div
        className="seaps-gold-border overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-accent)]/45 bg-[rgba(5,13,24,0.6)] shadow-[inset_0_0_24px_rgba(0,0,0,0.35)]"
        aria-label="SEAPS office location on Google Maps"
      >
        <Link
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-soft)]"
        >
          <div className="relative aspect-[5/3] w-full min-h-[132px] sm:min-h-[148px]">
            <iframe
              src={embedUrl}
              title="SEAPS location on Google Maps"
              className="pointer-events-none absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <span className="sr-only">Open SEAPS office location in Google Maps</span>
          </div>
          <p className="border-t border-[var(--color-accent)]/30 bg-[rgba(5,13,24,0.75)] px-3 py-2 text-center text-xs font-medium text-[var(--color-accent-soft)] transition group-hover:text-[var(--color-text)]">
            View on Google Maps
          </p>
        </Link>
      </div>
      <address className="space-y-1.5 text-left text-sm not-italic leading-relaxed text-white">
        <p className="notranslate text-base font-bold leading-snug text-white sm:text-lg">
          Address: {officeAddress.line1}
        </p>
        <p>{officeAddress.line2}</p>
        <p>{officeAddress.cityLine}</p>
        <p>{officeAddress.country}</p>
      </address>
    </div>
  );
}
