type CatalogCoverAdProps = {
  src: string;
  alt: string;
};

/** Portrait catalog cover — full document visible (no crop). */
export function CatalogCoverAd({ src, alt }: CatalogCoverAdProps) {
  return (
    <figure className="mx-auto mb-8 w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-mist)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:max-w-lg">
      {/* Native img: cover may be served from dynamic API with unknown dimensions. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="block h-auto w-full object-contain object-center"
        decoding="async"
        fetchPriority="high"
      />
    </figure>
  );
}
