import type { Article } from "@/lib/types";
import { photoUrl } from "@/lib/media";

const img = (id: string) => photoUrl(id);

export const articles: Article[] = [
  {
    id: "a-001",
    slug: "how-to-read-a-listing-in-cambodia",
    title: "How to Read a Cambodian Listing Beyond the Photos",
    excerpt:
      "A practical checklist for evaluating floor plans, verification status, and seller type before you book a viewing in Phnom Penh or Siem Reap.",
    content: `Photos sell emotion. Contracts sell reality. Before you fall for a gallery, check verification status, seller type, and the last update date.

Look for inconsistencies between room counts and area. Ask whether furnishings are included in the advertised price. For rentals, clarify utility responsibilities and building rules. For sales, request documents early rather than after emotional commitment.

SEAPS surfaces verification badges and update timestamps so you can prioritize trustworthy inventory across Cambodia.`,
    cover: img("photo-1560518883-ce09059eeffa"),
    category: "guides",
    author: "SEAPS Editorial",
    publishedAt: "2026-03-18T10:00:00.000Z",
    relatedPropertyIds: ["p-001", "p-003"],
  },
  {
    id: "a-002",
    slug: "phnom-penh-rental-demand-brief",
    title: "Phnom Penh Rental Demand: Market Brief",
    excerpt:
      "Long-stay demand notes for BKK 1, Daun Penh, and Toul Kork based on SEAPS listing activity.",
    content: `Long-stay apartments in BKK 1 remain competitive for relocating professionals, while Daun Penh attracts tenants who want riverside walkability. Toul Kork continues to draw families seeking compound living with parking.

When comparing asking rents, weigh building amenities, generator reliability, and commute times to common business districts rather than relying on photos alone.`,
    cover: img("photo-1552465011-b4e21bf6e79a"),
    category: "analysis",
    author: "Market Desk",
    publishedAt: "2026-04-01T09:00:00.000Z",
    relatedCitySlug: "phnom-penh",
  },
  {
    id: "a-003",
    slug: "off-plan-buying-questions-cambodia",
    title: "Off-Plan Buying in Cambodia: Questions Worth Asking",
    excerpt:
      "Separate marketing claims from confirmed construction facts with a simple inquiry script.",
    content: `Ask for the current construction stage, not just the brochure render. Request a sample payment schedule and clarify what happens if handover slips.

On SEAPS project pages, verified facts and developer claims are listed separately so you can see which statements are moderated and which come from marketing materials.`,
    cover: img("photo-1503387762-592deb58ef4e"),
    category: "investor",
    author: "Projects Desk",
    publishedAt: "2026-03-26T11:00:00.000Z",
    relatedPropertyIds: ["p-017", "p-018"],
  },
  {
    id: "a-004",
    slug: "siem-reap-neighborhood-notes",
    title: "Siem Reap Neighborhood Notes: Svay Dangkum",
    excerpt:
      "A human-scale district overview for buyers prioritizing access to services without living on the busiest tourist streets.",
    content: `Svay Dangkum rewards people who want cafés and services with quieter residential lanes nearby. Inventory mixes villas and compact apartments. This article is editorial context to support viewing trips, not a pricing index.`,
    cover: img("photo-1528183429752-a97d14bf51b1"),
    category: "district",
    author: "City Desk",
    publishedAt: "2026-03-10T12:00:00.000Z",
    relatedCitySlug: "siem-reap",
  },
  {
    id: "a-005",
    slug: "seaps-since-1997",
    title: "SEAPS Since 1997: Clearer Verification Labels",
    excerpt:
      "Why SEAPS separates unverified, verified, and premium listing states for Cambodian property searchers.",
    content: `Since 1997, South East Asia Property Services has helped clients navigate Cambodian property with practical local guidance.

Verification is not a guarantee of purchase success. It is a signal that key listing fields and ownership claims passed moderation checks. Premium marks highlight additional review depth on selected inventory.`,
    cover: img("photo-1454165804606-c3d57bc86b40"),
    category: "news",
    author: "SEAPS Team",
    publishedAt: "2026-04-04T08:00:00.000Z",
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: Article["category"]) {
  return articles.filter((a) => a.category === category);
}
