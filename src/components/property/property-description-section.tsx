type PropertyDescriptionSectionProps = {
  description: string;
};

export function PropertyDescriptionSection({ description }: PropertyDescriptionSectionProps) {
  const isHtml = description.includes("<");

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
        Description
      </h2>
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