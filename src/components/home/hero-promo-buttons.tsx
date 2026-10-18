import { ButtonLink } from "@/components/ui/button";

const heroPromoClass =
  "seaps-gold-shine w-full rounded-[var(--radius-lg)] px-5 py-4 text-base font-semibold uppercase tracking-[0.06em] shadow-[0_12px_40px_rgba(212,175,55,0.32)] sm:py-5 sm:text-lg";

export function HeroPromoButtons() {
  return (
    <div className="mb-4 grid shrink-0 gap-3 sm:mb-5 sm:grid-cols-2">
      <ButtonLink href="/sale" variant="accent" size="lg" className={heroPromoClass}>
        Sell property
      </ButtonLink>
      <ButtonLink href="/inquires" variant="accent" size="lg" className={heroPromoClass}>
        All enquiries
      </ButtonLink>
    </div>
  );
}
