import { getPlatformAgents, getPlatformUserById } from "@/lib/admin-platform-users";
import { getAgentProfile } from "@/lib/agent-profile";
import { buildProfileCompletion } from "@/lib/agent-desk-metrics";
import { getInquiries, getRuntimeListings } from "@/lib/store";
import type { DemoUser } from "@/lib/types";

export type StaffRow = {
  staffId: string;
  name: string;
  email: string;
  title: string;
  agencyLabel: string;
  profilePercent: number;
  profileMissing: string[];
  listingCount: number;
  pendingListings: number;
  publishedListings: number;
  rejectedListings: number;
  leadCount: number;
  openTasks: number;
};

function runtimeListingsForUser(userId: string, runtime: Awaited<ReturnType<typeof getRuntimeListings>>) {
  return runtime.filter((p) => p.createdByUserId === userId);
}

function leadCountForUser(
  userId: string,
  runtime: Awaited<ReturnType<typeof getRuntimeListings>>,
  inquiries: Awaited<ReturnType<typeof getInquiries>>,
): number {
  const ids = new Set(runtimeListingsForUser(userId, runtime).map((p) => p.id));
  return inquiries.filter((i) => ids.has(i.propertyId)).length;
}

export async function buildStaffRoster(openTasksByStaff: Record<string, number>): Promise<StaffRow[]> {
  const [runtime, inquiries] = await Promise.all([getRuntimeListings(), getInquiries()]);
  const rows: StaffRow[] = [];

  for (const user of await getPlatformAgents()) {
    const profile = await getAgentProfile(user.id, {
      email: user.email,
      name: user.name,
    });
    const { percent, items } = buildProfileCompletion(profile);
    const profileMissing = items.filter((i) => !i.complete).map((i) => i.label);
    const mine = runtimeListingsForUser(user.id, runtime);

    rows.push({
      staffId: user.id,
      name: user.name,
      email: user.email,
      title: "Registered agent",
      agencyLabel: user.agencyId ?? "—",
      profilePercent: percent,
      profileMissing,
      listingCount: mine.length,
      pendingListings: mine.filter((p) => p.status === "pending").length,
      publishedListings: mine.filter((p) => p.status === "published").length,
      rejectedListings: mine.filter((p) => p.status === "rejected").length,
      leadCount: leadCountForUser(user.id, runtime, inquiries),
      openTasks: openTasksByStaff[user.id] ?? 0,
    });
  }

  return rows.sort(
    (a, b) =>
      b.pendingListings - a.pendingListings ||
      b.listingCount - a.listingCount ||
      a.name.localeCompare(b.name),
  );
}

export async function getStaffPlatformUser(staffId: string): Promise<DemoUser | null> {
  return getPlatformUserById(staffId);
}
