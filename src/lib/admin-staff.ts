import { agents, getAgencyById } from "@/data/agencies";
import { properties } from "@/data/properties";
import { getAgentProfile } from "@/lib/agent-profile";
import { buildProfileCompletion } from "@/lib/agent-desk-metrics";
import { isAdminVisibleStaffId } from "@/lib/admin-platform-users";
import { getInquiries, getRuntimeListings } from "@/lib/store";
import type { Agent } from "@/lib/types";

export type StaffRow = {
  staffId: string;
  name: string;
  title: string;
  agencyName: string;
  platformUserId: string | null;
  profilePercent: number;
  profileMissing: string[];
  listingCount: number;
  pendingListings: number;
  leadCount: number;
  openTasks: number;
};

function listingCountForAgent(agent: Agent, runtime: Awaited<ReturnType<typeof getRuntimeListings>>): {
  total: number;
  pending: number;
} {
  const seed = properties.filter((p) => p.agentId === agent.id).length;
  const runtimeMine = runtime.filter(
    (p) =>
      p.agentId === agent.id ||
      (agent.platformUserId && p.createdByUserId === agent.platformUserId),
  );
  return {
    total: seed + runtimeMine.length,
    pending: runtimeMine.filter((p) => p.status === "pending").length,
  };
}

function leadCountForAgent(agent: Agent, inquiries: Awaited<ReturnType<typeof getInquiries>>): number {
  const props = new Set(
    properties.filter((p) => p.agentId === agent.id).map((p) => p.id),
  );
  return inquiries.filter((i) => props.has(i.propertyId)).length;
}

export async function buildStaffRoster(openTasksByStaff: Record<string, number>): Promise<StaffRow[]> {
  const [runtime, inquiries] = await Promise.all([getRuntimeListings(), getInquiries()]);
  const rows: StaffRow[] = [];

  for (const agent of agents) {
    if (!isAdminVisibleStaffId(agent.id)) continue;
    const agency = getAgencyById(agent.agencyId);
    let profilePercent = 0;
    let profileMissing: string[] = [];
    if (agent.platformUserId) {
      const profile = await getAgentProfile(agent.platformUserId, {
        email: "",
        name: agent.name,
      });
      const { percent, items } = buildProfileCompletion(profile);
      profilePercent = percent;
      profileMissing = items.filter((i) => !i.complete).map((i) => i.label);
    } else {
      profilePercent = 35;
      profileMissing = ["Platform login not linked"];
    }
    const { total, pending } = listingCountForAgent(agent, runtime);
    rows.push({
      staffId: agent.id,
      name: agent.name,
      title: agent.title,
      agencyName: agency?.name ?? "—",
      platformUserId: agent.platformUserId ?? null,
      profilePercent,
      profileMissing,
      listingCount: total,
      pendingListings: pending,
      leadCount: leadCountForAgent(agent, inquiries),
      openTasks: openTasksByStaff[agent.id] ?? 0,
    });
  }

  return rows.sort((a, b) => b.leadCount - a.leadCount || b.listingCount - a.listingCount);
}

export function getAgentByStaffId(staffId: string) {
  if (!isAdminVisibleStaffId(staffId)) return null;
  return agents.find((a) => a.id === staffId) ?? null;
}
