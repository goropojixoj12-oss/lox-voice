import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center",
        className,
      )}
    >
      <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-primary)]">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[var(--color-muted)]">{description}</p>
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} className="mt-6" variant="secondary">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading listings…" }: { label?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <div className="aspect-[4/3] bg-[var(--color-secondary)]" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-1/3 rounded bg-[var(--color-secondary)]" />
            <div className="h-5 w-4/5 rounded bg-[var(--color-secondary)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--color-secondary)]" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again or reset your filters.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-white px-6 py-10 text-center"
    >
      <h3 className="text-xl font-semibold text-[var(--color-danger)]">{title}</h3>
      <p className="mt-2 text-[var(--color-muted)]">{description}</p>
    </div>
  );
}
