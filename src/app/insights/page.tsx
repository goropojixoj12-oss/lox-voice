import type { Metadata } from "next";
import { ArticleCard } from "@/components/article/article-card";
import { Section, SectionHeader } from "@/components/shared/section";
import { articles } from "@/data/articles";

export const metadata: Metadata = {
  title: "Market insights",
  description:
    "Why SEAPS separates unverified, verified, and premium listing states for Cambodian property searchers.",
};

const INSIGHTS_SLUG = "seaps-since-1997";

export default function InsightsPage() {
  const items = articles.filter((a) => a.slug === INSIGHTS_SLUG);

  return (
    <Section>
      <SectionHeader
        eyebrow="Editorial"
        title="Market insights"
        description="Updates from South East Asia Property Services on search quality and listing verification."
      />
      <div className="space-y-8">
        {items.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </Section>
  );
}
