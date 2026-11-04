import {
  agentHasRequiredProfilePhoto,
  type AgentProfileRecord,
} from "@/lib/agent-profile-shared";
import type { PageViewEvent } from "@/lib/admin-types";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";
import { isPublicListing } from "@/lib/listing-access";
import type { Inquiry, Property } from "@/lib/types";

/** Maps a desk segment (e.g. "inquiries") to the route that shows it. */
export type DeskLinkFor = (...segments: string[]) => string;

export type ProfileCompletionItem = {
  id: string;
  label: string;
  weight: number;
  complete: boolean;
};

export type AgentDeskMetrics = {
  profileCompletionPercent: number;
  profileItems: ProfileCompletionItem[];
};

export type UrgentAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "high" | "medium" | "low";
};

export type InquiryStageRow = {
  id: string;
  label: string;
  count: number;
};

export type ActivitySnapshot = {
  leads7d: number;
  leads30d: number;
  openThreads: number;
  closedThreads: number;
};

export type ListingHealthRow = {
  id: string;
  label: string;
  count: number;
  href: string;
  tone: "ok" | "warn" | "neutral";
};

export type TopListingRow = {
  title: string;
  slug: string;
  views: number;
  unique: number;
};

export type AgentOverviewBundle = {
  metrics: AgentDeskMetrics;
  urgentActions: UrgentAction[];
  inquiryStages: InquiryStageRow[];
  activity: ActivitySnapshot;
  listingHealth: ListingHealthRow[];
  topListings: TopListingRow[];
  deskLinks: { inquiries: string; profile: string; newListings: string };
};

function hasDoc(profile: AgentProfileRecord, kind: string): boolean {
  return profile.documents.some((d) => d.kind === kind);
}

export function buildProfileCompletion(profile: AgentProfileRecord): {
  percent: number;
  items: ProfileCompletionItem[];
} {
  const items: ProfileCompletionItem[] = [
    {
      id: "fullName",
      label: "Full name",
      weight: 10,
      complete: profile.fullName.trim().length >= 2,
    },
    {
      id: "email",
      label: "Email",
      weight: 10,
      complete: profile.email.includes("@"),
    },
    {
      id: "phone",
      label: "Phone",
      weight: 15,
      complete: profile.phone.replace(/\D/g, "").length >= 8,
    },
    {
      id: "residence",
      label: "Place of residence",
      weight: 15,
      complete: profile.residence.trim().length >= 2,
    },
    {
      id: "profile_photo",
      label: "Portrait photo",
      weight: 20,
      complete: agentHasRequiredProfilePhoto(profile),
    },
    {
      id: "id_front",
      label: "ID — front",
      weight: 10,
      complete: hasDoc(profile, "id_front"),
    },
    {
      id: "id_back",
      label: "ID — back",
      weight: 10,
      complete: hasDoc(profile, "id_back"),
    },
    {
      id: "employment_contract",
      label: "Employment contract",
      weight: 10,
      complete: hasDoc(profile, "employment_contract"),
    },
  ];

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const earned = items.reduce(
    (sum, item) => sum + (item.complete ? item.weight : 0),
    0,
  );
  const percent = totalWeight === 0 ? 0 : Math.round((earned / totalWeight) * 100);
  return { percent, items };
}

export function buildAgentDeskMetrics(profile: AgentProfileRecord): AgentDeskMetrics {
  const { percent, items } = buildProfileCompletion(profile);
  return { profileCompletionPercent: percent, profileItems: items };
}

function buildUrgentActions(
  profile: AgentProfileRecord,
  metrics: AgentDeskMetrics,
  inquiries: Inquiry[],
  link: DeskLinkFor,
): UrgentAction[] {
  const actions: UrgentAction[] = [];
  const newInquiries = inquiries.filter((i) => i.status === "new");

  if (newInquiries.length > 0) {
    actions.push({
      id: "reply-inquiries",
      title: `Reply to ${newInquiries.length} new inquir${newInquiries.length === 1 ? "y" : "ies"}`,
      detail: "Target response within 2 hours to protect conversion.",
      href: link("inquiries"),
      priority: "high",
    });
  }

  if (metrics.profileCompletionPercent < 100) {
    actions.push({
      id: "finish-profile",
      title: "Complete agent profile",
      detail: `${100 - metrics.profileCompletionPercent}% remaining for HR verification.`,
      href: link("profile"),
      priority: metrics.profileCompletionPercent < 60 ? "high" : "medium",
    });
  } else if (!agentHasRequiredProfilePhoto(profile)) {
    actions.push({
      id: "upload-portrait",
      title: "Upload portrait photo",
      detail: "Required for public agent cards across SEAPS.",
      href: link("profile"),
      priority: "high",
    });
  }

  const openThreads = inquiries.filter((i) => i.status === "in_progress");
  if (openThreads.length > 0) {
    actions.push({
      id: "follow-up",
      title: `Follow up on ${openThreads.length} open thread${openThreads.length === 1 ? "" : "s"}`,
      detail: "Move contacted leads toward a viewing or offer.",
      href: link("inquiries"),
      priority: "medium",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "pipeline-ok",
      title: "Inbox clear — grow pipeline",
      detail: "Share listings or publish a new property to attract leads.",
      href: link("list-property", "step1"),
      priority: "low",
    });
  }

  return actions.slice(0, 4);
}

function buildInquiryStages(inquiries: Inquiry[]): InquiryStageRow[] {
  return [
    { id: "new", label: "New", count: inquiries.filter((i) => i.status === "new").length },
    {
      id: "in_progress",
      label: "In progress",
      count: inquiries.filter((i) => i.status === "in_progress").length,
    },
    { id: "closed", label: "Closed", count: inquiries.filter((i) => i.status === "closed").length },
  ];
}

function withinDays(inquiries: Inquiry[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return inquiries.filter((i) => new Date(i.createdAt).getTime() >= cutoff).length;
}

function ownListings(userId: string, listings: Property[]): Property[] {
  return listings.filter((l) => l.createdByUserId === userId || l.ownerId === userId);
}

function buildListingHealth(own: Property[], link: DeskLinkFor): ListingHealthRow[] {
  const live = own.filter(isPublicListing).length;
  const pending = own.filter((l) => l.status === "pending").length;
  const needsMedia = own.filter((l) => (l.images?.length ?? 0) < 2).length;

  return [
    {
      id: "live",
      label: "Live for the public",
      count: live,
      href: link("listings"),
      tone: live > 0 ? "ok" : "neutral",
    },
    {
      id: "pending",
      label: "Waiting on moderation",
      count: pending,
      href: link("listings"),
      tone: pending > 0 ? "warn" : "ok",
    },
    {
      id: "media",
      label: "Needs more photos",
      count: needsMedia,
      href: link("listings"),
      tone: needsMedia > 0 ? "warn" : "ok",
    },
    {
      id: "total",
      label: "Listings on this account",
      count: own.length,
      href: link("listings"),
      tone: "neutral",
    },
  ];
}

function buildTopListings(
  own: Property[],
  events: PageViewEvent[],
  periodDays: number,
): TopListingRow[] {
  const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
  const views = new Map<string, number>();
  const visitors = new Map<string, Set<string>>();

  for (const event of events) {
    if (new Date(event.at).getTime() < cutoff) continue;
    const slug = event.path.replace(/^\/property\//, "");
    if (slug === event.path) continue;
    views.set(slug, (views.get(slug) ?? 0) + 1);
    const set = visitors.get(slug) ?? new Set<string>();
    set.add(event.sessionKey);
    visitors.set(slug, set);
  }

  return own
    .map((listing) => ({
      title: listing.title,
      slug: listing.slug,
      views: views.get(listing.slug) ?? 0,
      unique: visitors.get(listing.slug)?.size ?? 0,
    }))
    .filter((row) => row.views > 0)
    .sort((a, b) => b.views - a.views || a.title.localeCompare(b.title))
    .slice(0, 3);
}

export function buildAgentOverviewBundle(input: {
  userId: string;
  profile: AgentProfileRecord;
  inquiries: Inquiry[];
  listings: Property[];
  pageViews: PageViewEvent[];
  periodDays?: number;
  linkFor?: DeskLinkFor;
}): AgentOverviewBundle {
  const { userId, profile, inquiries, listings, pageViews } = input;
  const periodDays = input.periodDays ?? 30;
  const link = input.linkFor ?? agentDeskPath;
  const metrics = buildAgentDeskMetrics(profile);
  const own = ownListings(userId, listings);

  return {
    metrics,
    urgentActions: buildUrgentActions(profile, metrics, inquiries, link),
    inquiryStages: buildInquiryStages(inquiries),
    activity: {
      leads7d: withinDays(inquiries, 7),
      leads30d: withinDays(inquiries, 30),
      openThreads: inquiries.filter((i) => i.status !== "closed").length,
      closedThreads: inquiries.filter((i) => i.status === "closed").length,
    },
    listingHealth: buildListingHealth(own, link),
    topListings: buildTopListings(own, pageViews, periodDays),
    deskLinks: {
      inquiries: link("inquiries"),
      profile: link("profile"),
      newListings: link("list-property", "step1"),
    },
  };
}
