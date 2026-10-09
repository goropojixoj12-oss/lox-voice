import type { Metadata } from "next";
import { ArticleCard } from "@/components/article/article-card";
import { Section, SectionHeader } from "@/components/shared/section";
import { articles } from "@/data/articles";

export const metadata: Metadata = {
  title: "Buyer & renter guides",
  description: "Practical guides for buyers, renters, and investors.",
};

export default function GuidesPage() {
  const guides = articles.filter(
    (a) => a.category === "guides" || a.category === "investor",
  );
  return (
    <Section>
      <SectionHeader
        eyebrow="Guides"
        title="Buyer and renter playbooks"
        description="Short practical guides designed to support real decisions — not keyword stuffing."
      />
      <div className="space-y-8">
        {guides.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </Section>
  );
}
