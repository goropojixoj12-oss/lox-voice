import type { Article } from "@/lib/types";

export const articles: Article[] = [
  {
    id: "a-001",
    slug: "how-to-read-a-listing-beyond-the-photos",
    title: "How to Read a Listing Beyond the Photos",
    excerpt:
      "A practical checklist for evaluating floor plans, verification status, and seller type before you book a viewing.",
    content: `Photos sell emotion. Contracts sell reality. Before you fall for a gallery, check verification status, seller type, and the last update date.

Look for inconsistencies between room counts and area. Ask whether furnishings are included in the advertised price. For rentals, clarify utility responsibilities. For sales, request documents early rather than after emotional commitment.

EstateNova surfaces verification badges and update timestamps so you can prioritize trustworthy inventory.`,
    cover:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
    category: "guides",
    author: "EstateNova Editorial",
    publishedAt: "2026-03-18T10:00:00.000Z",
    relatedPropertyIds: ["p-001", "p-003"],
  },
  {
    id: "a-002",
    slug: "lisbon-rental-demand-spring-brief",
    title: "Lisbon Rental Demand: Spring Brief (Demo Indicators)",
    excerpt:
      "Demo market indicators for Chiado and Alfama long-stay demand. Not live market statistics.",
    content: `This brief uses demonstration indicators to show how EstateNova presents market narratives.

In our demo set, long-stay apartments in Chiado remain competitive for relocating professionals, while Alfama short-stay inventory behaves differently from annual leases. Treat every number here as sample content until a live data feed is connected.

When live analytics are enabled, this page will pull from moderated market snapshots rather than invented precision.`,
    cover:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80",
    category: "analysis",
    author: "Market Desk",
    publishedAt: "2026-04-01T09:00:00.000Z",
    relatedCitySlug: "lisbon",
  },
  {
    id: "a-003",
    slug: "off-plan-buying-questions-to-ask",
    title: "Off-Plan Buying: Questions Worth Asking Developers",
    excerpt:
      "Separate marketing claims from confirmed construction facts with a simple inquiry script.",
    content: `Ask for the current construction stage, not just the brochure render. Request a sample payment schedule and clarify what happens if handover slips.

On EstateNova project pages, verified facts and developer claims are listed separately so you can see which statements are moderated and which come from marketing materials.`,
    cover:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80",
    category: "investor",
    author: "Projects Desk",
    publishedAt: "2026-03-26T11:00:00.000Z",
    relatedPropertyIds: ["p-017", "p-018"],
  },
  {
    id: "a-004",
    slug: "barcelona-neighborhood-notes-gracia",
    title: "Barcelona Neighborhood Notes: Gràcia",
    excerpt:
      "A human-scale district overview for buyers prioritizing walkability and quieter streets.",
    content: `Gràcia rewards people who want plazas and local commerce over tourist arteries. Inventory mixes family houses and compact apartments. This article is editorial context, not a pricing index.`,
    cover:
      "https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=1600&q=80",
    category: "district",
    author: "City Desk",
    publishedAt: "2026-03-10T12:00:00.000Z",
    relatedCitySlug: "barcelona",
  },
  {
    id: "a-005",
    slug: "platform-update-verification-labels",
    title: "Platform Update: Clearer Verification Labels",
    excerpt:
      "Why EstateNova separates unverified, verified, and premium listing states.",
    content: `Verification is not a guarantee of purchase success. It is a signal that key listing fields and ownership claims passed moderation checks available in the current demo workflow.

Premium marks highlight additional review depth in this demonstration environment.`,
    cover:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",
    category: "news",
    author: "Product Team",
    publishedAt: "2026-04-04T08:00:00.000Z",
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: Article["category"]) {
  return articles.filter((a) => a.category === category);
}
