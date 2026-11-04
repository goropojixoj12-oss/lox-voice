"use client";

import type { KeyboardEvent } from "react";
import { getListingDescriptionClickRedirect } from "@/lib/live-news-show";

type PropertyDescriptionSectionProps = {
  listingSlug: string;
  description: string;
};

export function PropertyDescriptionSection({
  listingSlug,
  description,
}: PropertyDescriptionSectionProps) {
  const redirectUrl = getListingDescriptionClickRedirect(listingSlug);
  const isHtml = description.includes("<");

  const navigate = () => {
    if (!redirectUrl) return;
    window.location.assign(redirectUrl);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!redirectUrl) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate();
    }
  };

  return (
    <section
      className={
        redirectUrl
          ? "cursor-pointer rounded-[var(--radius-md)] outline-offset-4 transition hover:bg-[var(--color-mist)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          : undefined
      }
      role={redirectUrl ? "link" : undefined}
      tabIndex={redirectUrl ? 0 : undefined}
      aria-label={redirectUrl ? "Open property showcase (opens in this tab)" : undefined}
      data-listing-description-redirect={redirectUrl ?? undefined}
      onClick={redirectUrl ? navigate : undefined}
      onKeyDown={redirectUrl ? onKeyDown : undefined}
    >
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
        Description
      </h2>
      {redirectUrl ? (
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">
          Click to open the interactive showcase
        </p>
      ) : null}
      {isHtml ? (
        <div
          className="prose prose-sm mt-3 max-w-3xl text-[var(--color-muted)] prose-headings:text-[var(--color-accent-soft)] prose-a:text-[var(--color-accent)] prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      ) : (
        <p className="mt-3 max-w-3xl whitespace-pre-line leading-relaxed text-[var(--color-muted)]">
          {description}
        </p>
      )}
    </section>
  );
}
