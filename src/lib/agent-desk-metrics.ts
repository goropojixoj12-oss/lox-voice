import { agents } from "@/data/agencies";
import {
  agentHasRequiredProfilePhoto,
  type AgentProfileRecord,
} from "@/lib/agent-profile-shared";

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
