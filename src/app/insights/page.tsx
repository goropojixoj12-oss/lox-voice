import type { Metadata } from "next";
import { ArticleCard } from "@/components/article/article-card";
import { Section, SectionHeader } from "@/components/shared/section";
import { articles } from "@/data/articles";
import { marketStats } from "@/data/market";

export const metadata: Metadata = {
  title: "Market insights",
  description: "News, analysis, and market notes from the EstateNova editorial desk.",
};

export default function InsightsPage() {
  const items = articles.filter((a) => a.category !== "guides");
  return (
    <Section>
      <SectionHeader
        eyebrow="Editorial"
        title="Market insights and reports"
        description="Demo indicators and original articles. Statistics are labeled as sample data."
      />
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {marketStats.slice(0, 3).map((stat) => (
          <div
            key={stat.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{stat.label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--color-primary)]">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{stat.note}</p>
          </div>
        ))}
      </div>
      <div className="space-y-8">
        {items.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </Section>
  );
}
