type CatalogCoverAdProps = {
  src: string;
  alt: string;
};

/** Full-width catalog cover advertisement (typical residential sale hero sizing). */
export function CatalogCoverAd({ src, alt }: CatalogCoverAdProps) {
  return (
    <figure className="mb-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-mist)] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      {/* Native img: cover may be served from dynamic API with unknown dimensions. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="block h-auto max-h-[min(480px,56vw)] w-full object-cover object-center"
        decoding="async"
        fetchPriority="high"
      />
    </figure>
  );
}
