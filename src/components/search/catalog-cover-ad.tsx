import Link from "next/link";

type CatalogCoverAdProps = {
  src: string;
  alt: string;
  href?: string;
};

/** Portrait catalog cover — full document visible (no crop). */
export function CatalogCoverAd({ src, alt, href }: CatalogCoverAdProps) {
  const figure = (
    <figure className="mx-auto mb-8 w-full max-w-[21rem] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-accent)]/40 bg-[var(--color-mist)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:max-w-[24rem]">
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

  if (!href) return figure;

  return (
    <Link href={href} className="block transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]">
      {figure}
    </Link>
  );
}
