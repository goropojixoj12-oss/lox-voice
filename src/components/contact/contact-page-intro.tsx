import Link from "next/link";
import { brand } from "@/config/brand";

/** Centered gold Contact heading and intro copy for /contact and /inquires. */
export function ContactPageIntro() {
  return (
    <header className="mb-8 space-y-4 text-center">
      <h1 className="seaps-gold-text text-3xl font-bold tracking-tight md:text-4xl notranslate">
        Contact a SEAPS Specialist.
      </h1>
      <div className="mx-auto max-w-2xl space-y-3 text-base leading-relaxed text-[var(--color-muted)] md:text-lg">
        <p>Welcome to our SEAPS Contact Page.</p>
        <p>
          Please complete the fields below and upon submission, the information provided will be
          assessed and forwarded to the most appropriate SEAPS Specialist.
        </p>
        <p>
          Please click &ldquo;
          <Link
            href={brand.googleMapsPlaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="seaps-gold-text font-semibold notranslate underline decoration-[var(--color-accent)]/50 underline-offset-2 hover:decoration-[var(--color-accent)]"
          >
            MAP
          </Link>
          &rdquo; to view our convenient location, within the prestigious Hotel Cambodiana.
        </p>
      </div>
    </header>
  );
}
