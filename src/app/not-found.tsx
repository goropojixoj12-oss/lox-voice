import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        404
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--color-primary)]">
        Page not found
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        That route does not exist or the listing was removed from the demo catalog.
      </p>
      <ButtonLink href="/" className="mt-6">
        Back to home
      </ButtonLink>
    </div>
  );
}
