import { ButtonLink } from "@/components/ui/button";

/** Gold Contact Us CTA — links to the contact form page. */
export function AboutContactCta() {
  return (
    <div className="mt-16 flex flex-col items-center border-t border-[rgba(212,175,55,0.35)] pt-12 text-center">
      <p className="max-w-md text-base text-[var(--color-muted)]">
        Ready to speak with South East Asia Property Services about your next move?
      </p>
      <ButtonLink
        href="/contact"
        variant="accent"
        size="lg"
        className="seaps-btn-gold mt-6 min-w-[14rem] px-8 text-base shadow-[0_12px_40px_rgba(212,175,55,0.28)]"
      >
        Contact Us
      </ButtonLink>
    </div>
  );
}
