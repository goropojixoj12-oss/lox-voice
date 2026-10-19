import { agents } from "@/data/agencies";
import { properties } from "@/data/properties";
import {
  agentHasRequiredProfilePhoto,
  type AgentProfileRecord,
} from "@/lib/agent-profile-shared";
import type { Inquiry, Property } from "@/lib/types";

export type ProfileCompletionItem = {
  id: string;
  label: string;
  weight: number;
  complete: boolean;
};

export type AgentAward = {
  id: string;
  title: string;
  detail: string;
  earnedAt: string;
};

export type AgentDeskMetrics = {
  profileCompletionPercent: number;
  profileItems: ProfileCompletionItem[];
  salesEffectivenessPercent: number;
  salesEffectivenessLabel: string;
  ytdSalesBonusUsd: number;
  closedDealsYtd: number;
  companyRank: number;
  companyAgentCount: number;
  awards: AgentAward[];
};

export type UrgentAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: "high" | "medium" | "low";
};

export type PipelineStage = {
  id: string;
  label: string;
  count: number;
};

export type ActivitySnapshot = {
  leads7d: number;
  replies7d: number;
  shortlists7d: number;
  leads30d: number;
  avgResponseMinutes: number;
  deskAvgResponseMinutes: number;
};

export type QuarterlyGoal = {
  targetDeals: number;
  closedDeals: number;
  percent: number;
  dealsToNextBonus: number;
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
  views: number;
  slug: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  whenLabel: string;
  kind: "viewing" | "call" | "signing";
};

export type AgentOverviewBundle = {
  metrics: AgentDeskMetrics;
  urgentActions: UrgentAction[];
  pipeline: PipelineStage[];
  activity: ActivitySnapshot;
  quarterlyGoal: QuarterlyGoal;
  listingHealth: ListingHealthRow[];
  topListings: TopListingRow[];
  calendar: CalendarEvent[];
  usesEstimatedMetrics: boolean;
};

function hashUserId(userId: string): number {
  let h = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

function effectivenessLabel(score: number): string {
  if (score >= 90) return "Elite performer";
  if (score >= 75) return "Strong momentum";
  if (score >= 55) return "Building pipeline";
  return "Focus onboarding";
}

export function buildAgentDeskMetrics(
  userId: string,
  profile: AgentProfileRecord,
): AgentDeskMetrics {
  const { percent, items } = buildProfileCompletion(profile);
  const seed = hashUserId(userId);
  const companyAgentCount = agents.length;

  const baseEffectiveness = 42 + (seed % 38);
  const profileBoost = Math.round(percent * 0.35);
  const salesEffectivenessPercent = Math.min(98, baseEffectiveness + profileBoost);

  const closedDealsYtd = 3 + (seed % 14);
  const ytdSalesBonusUsd = closedDealsYtd * 850 + (seed % 7) * 200;

  const linked = agents.find((a) => a.platformUserId === userId);
  const peerScores = agents.map((agent, index) => {
    const peerSeed = hashUserId(agent.platformUserId ?? agent.id);
    const score = 40 + (peerSeed % 50) + index * 2;
    return { agentId: agent.id, score };
  });
  peerScores.sort((a, b) => b.score - a.score);
  const rankIndex = linked
    ? peerScores.findIndex((row) => row.agentId === linked.id)
    : seed % companyAgentCount;
  const companyRank = rankIndex >= 0 ? rankIndex + 1 : 1 + (seed % companyAgentCount);

  const awards: AgentAward[] = [
    {
      id: "verified",
      title: "SEAPS verified",
      detail: linked?.verified ? "Public profile active on SEAPS" : "Complete verification docs",
      earnedAt: "2026-09-01",
    },
  ];

  if (percent >= 100) {
    awards.push({
      id: "profile-complete",
      title: "Profile complete",
      detail: "All HR and contact fields submitted",
      earnedAt: new Date().toISOString().slice(0, 10),
    });
  }
  if (closedDealsYtd >= 10) {
    awards.push({
      id: "deals-10",
      title: "Double-digit closings",
      detail: `${closedDealsYtd} deals closed year to date`,
      earnedAt: "2026-08-15",
    });
  }
  if (salesEffectivenessPercent >= 80) {
    awards.push({
      id: "top-quartile",
      title: "Top quartile efficiency",
      detail: "Response and conversion score in top 25% of desk",
      earnedAt: "2026-10-01",
    });
  }

  return {
    profileCompletionPercent: percent,
    profileItems: items,
    salesEffectivenessPercent,
    salesEffectivenessLabel: effectivenessLabel(salesEffectivenessPercent),
    ytdSalesBonusUsd,
    closedDealsYtd,
    companyRank,
    companyAgentCount,
    awards,
  };
}

function buildUrgentActions(
  profile: AgentProfileRecord,
  metrics: AgentDeskMetrics,
  inquiries: Inquiry[],
): UrgentAction[] {
  const actions: UrgentAction[] = [];
  const newInquiries = inquiries.filter((i) => i.status === "new");

  if (newInquiries.length > 0) {
    actions.push({
      id: "reply-inquiries",
      title: `Reply to ${newInquiries.length} new inquir${newInquiries.length === 1 ? "y" : "ies"}`,
      detail: "Target response within 2 hours to protect conversion.",
      href: "/dashboard/inquiries",
      priority: "high",
    });
  }

  if (metrics.profileCompletionPercent < 100) {
    actions.push({
      id: "finish-profile",
      title: "Complete agent profile",
      detail: `${100 - metrics.profileCompletionPercent}% remaining for HR verification.`,
      href: "/dashboard/profile",
      priority: metrics.profileCompletionPercent < 60 ? "high" : "medium",
    });
  } else if (!agentHasRequiredProfilePhoto(profile)) {
    actions.push({
      id: "upload-portrait",
      title: "Upload portrait photo",
      detail: "Required for public agent cards across SEAPS.",
      href: "/dashboard/profile",
      priority: "high",
    });
  }

  const stale = inquiries.filter((i) => i.status === "in_progress");
  if (stale.length > 0) {
    actions.push({
      id: "follow-up",
      title: `Follow up on ${stale.length} open thread${stale.length === 1 ? "" : "s"}`,
      detail: "Move contacted leads toward a viewing or offer.",
      href: "/dashboard/inquiries",
      priority: "medium",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "pipeline-ok",
      title: "Inbox clear — grow pipeline",
      detail: "Share listings or publish a new property to attract leads.",
      href: "/list-property",
      priority: "low",
    });
  }

  return actions.slice(0, 4);
}

function buildPipeline(inquiries: Inquiry[], seed: number): PipelineStage[] {
  const lead = inquiries.filter((i) => i.status === "new").length + (seed % 4);
  const contacted =
    inquiries.filter((i) => i.status === "in_progress").length + 1 + (seed % 3);
  const viewing = 1 + ((seed >> 3) % 5);
  const offer = (seed >> 5) % 4;
  const contract = (seed >> 7) % 3;
  const closed = inquiries.filter((i) => i.status === "closed").length + (seed >> 9) % 2;

  return [
    { id: "lead", label: "Lead", count: lead },
    { id: "contacted", label: "Contacted", count: contacted },
    { id: "viewing", label: "Viewing", count: viewing },
    { id: "offer", label: "Offer", count: offer },
    { id: "contract", label: "Contract", count: contract },
    { id: "closed", label: "Closed", count: closed },
  ];
}

function buildActivity(seed: number, inquiries: Inquiry[]): ActivitySnapshot {
  const leads7d = inquiries.length + 2 + (seed % 6);
  return {
    leads7d,
    replies7d: Math.max(1, leads7d - (seed % 3)),
    shortlists7d: 2 + ((seed >> 2) % 8),
    leads30d: leads7d * 3 + (seed % 9),
    avgResponseMinutes: 18 + (seed % 45),
    deskAvgResponseMinutes: 35 + (seed % 20),
  };
}

function buildListingHealth(
  agentId: string | undefined,
  runtimeListings: Property[],
): { health: ListingHealthRow[]; top: TopListingRow[] } {
  const catalog = agentId
    ? properties.filter((p) => p.agentId === agentId)
    : [];
  const published = catalog.filter((p) => p.status === "published").length;
  const needsMedia = catalog.filter((p) => p.images.length < 2).length;
  const premium = catalog.filter((p) => p.isPremium || p.isFeatured).length;

  const health: ListingHealthRow[] = [
    {
      id: "published",
      label: "Published in catalog",
      count: published,
      href: "/dashboard/listings",
      tone: "ok",
    },
    {
      id: "runtime",
      label: "Your runtime drafts",
      count: runtimeListings.length,
      href: "/dashboard/listings",
      tone: runtimeListings.length > 0 ? "neutral" : "ok",
    },
    {
      id: "media",
      label: "Needs more photos",
      count: needsMedia,
      href: "/dashboard/listings",
      tone: needsMedia > 0 ? "warn" : "ok",
    },
    {
      id: "featured",
      label: "Featured / premium",
      count: premium,
      href: "/dashboard/listings",
      tone: "neutral",
    },
  ];

  const top = [...catalog]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 3)
    .map((p) => ({
      title: p.title,
      views: p.views ?? 0,
      slug: p.slug,
    }));

  return { health, top };
}

function buildCalendar(seed: number): CalendarEvent[] {
  const hour = 9 + (seed % 6);
  const hour2 = 14 + (seed % 4);
  return [
    {
      id: "cal-1",
      title: "Buyer viewing — BKK 1 condo",
      whenLabel: `Today · ${hour}:00`,
      kind: "viewing",
    },
    {
      id: "cal-2",
      title: "Follow-up call — relocation client",
      whenLabel: `Today · ${hour2}:30`,
      kind: "call",
    },
    {
      id: "cal-3",
      title: "Lease signing — Chamkarmon villa",
      whenLabel: "Tomorrow · 11:00",
      kind: "signing",
    },
  ];
}

export function buildAgentOverviewBundle(
  userId: string,
  profile: AgentProfileRecord,
  inquiries: Inquiry[],
  runtimeListings: Property[],
): AgentOverviewBundle {
  const metrics = buildAgentDeskMetrics(userId, profile);
  const seed = hashUserId(userId);
  const linked = agents.find((a) => a.platformUserId === userId);

  const targetDeals = 12;
  const closedDeals = metrics.closedDealsYtd;
  const quarterlyGoal: QuarterlyGoal = {
    targetDeals,
    closedDeals,
    percent: Math.min(100, Math.round((closedDeals / targetDeals) * 100)),
    dealsToNextBonus: Math.max(0, 10 - (closedDeals % 10)),
  };

  const { health, top } = buildListingHealth(linked?.id, runtimeListings);

  return {
    metrics,
    urgentActions: buildUrgentActions(profile, metrics, inquiries),
    pipeline: buildPipeline(inquiries, seed),
    activity: buildActivity(seed, inquiries),
    quarterlyGoal,
    listingHealth: health,
    topListings: top,
    calendar: buildCalendar(seed),
    usesEstimatedMetrics: true,
  };
}
