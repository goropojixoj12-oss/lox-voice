import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug } from "@/data/articles";

export function generateStaticParams() {
  return articles
    .filter((a) => a.category !== "guides")
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  return { title: article.title, description: article.excerpt };
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article || article.category === "guides") notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        {article.category}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)] md:text-5xl">
        {article.title}
      </h1>
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        {article.author} ·{" "}
        {new Date(article.publishedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <div className="relative my-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-xl)]">
        <Image src={article.cover} alt={article.title} fill className="object-cover" sizes="800px" />
      </div>
      <div className="space-y-4 whitespace-pre-line text-lg leading-relaxed text-[var(--color-text)]">
        {article.content}
      </div>
    </article>
  );
}
