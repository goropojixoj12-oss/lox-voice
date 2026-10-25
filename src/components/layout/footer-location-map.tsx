import { brand } from "@/config/brand";

/** Footer map slot — thin gold frame; fill with Google embed URL in env when ready. */
export function FooterLocationMap() {
  const embedUrl = brand.googleMapsEmbedUrl;

  return (
    <div className="mt-4 max-w-sm">
      <div
        className="seaps-gold-border overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-accent)]/45 bg-[rgba(5,13,24,0.6)] shadow-[inset_0_0_24px_rgba(0,0,0,0.35)]"
        aria-label={embedUrl ? "SEAPS office location on Google Maps" : "Location map"}
      >
        <div className="relative aspect-[5/3] w-full min-h-[132px] sm:min-h-[148px]">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="SEAPS location on Google Maps"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div
              className="absolute inset-0 bg-[linear-gradient(145deg,rgba(11,28,51,0.85)_0%,rgba(5,13,24,0.95)_100%)]"
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
}
