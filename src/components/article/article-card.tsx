import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";

export function ArticleCard({ article }: { article: Article }) {
  const href =
    article.category === "guides" ? `/guides/${article.slug}` : `/insights/${article.slug}`;
  return (
    <article className="seaps-card group grid gap-4 overflow-hidden rounded-[var(--radius-lg)] p-3 md:grid-cols-[180px_1fr] md:p-4">
      <Link href={href} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] md:aspect-square">
        <Image
          src={article.cover}
          alt={article.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="180px"
        />
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {article.category}
        </p>
        <Link href={href} className="mt-1 block font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
          {article.title}
        </Link>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{article.excerpt}</p>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          {article.author} ·{" "}
          {new Date(article.publishedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </article>
  );
}
