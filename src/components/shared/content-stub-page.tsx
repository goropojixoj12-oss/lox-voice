import { Section } from "@/components/shared/section";

export function ContentStubPage({
  eyebrow,
  title,
  description = "Content for this section is coming soon.",
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)] md:text-5xl">
          {title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted)]">{description}</p>
      </div>
    </Section>
  );
}
