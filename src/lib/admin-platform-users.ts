import { demoUsers } from "@/data/users";
import type { DemoUser } from "@/lib/types";

/** Demo buyer/owner logins — not staff. Agent1 (user-agent) is the real platform agent. */
export const ADMIN_HIDDEN_USER_IDS = new Set(["user-buyer", "user-owner"]);

/** Public catalog seed profiles (Sokha, Dara, …) — not real staff; use platform user ids in admin. */
/** Catalog-only personas (Adam James on public pages) — not executive staff roster. */
export const ADMIN_HIDDEN_STAFF_IDS = new Set([
  "agent-dara",
  "agent-rith",
  "agent-srey",
  "agent-vann",
  "agent-chenda",
]);

export function isAdminVisibleUser(user: DemoUser): boolean {
  return !ADMIN_HIDDEN_USER_IDS.has(user.id);
}

export function isAdminVisibleStaffId(staffId: string): boolean {
  return !ADMIN_HIDDEN_STAFF_IDS.has(staffId);
}

/** Accounts shown in admin Users (CEO + Agent1 + future registrations). */
export function getAdminDirectoryUsers(): DemoUser[] {
  return demoUsers.filter(isAdminVisibleUser);
}

export function getPlatformAgents(): DemoUser[] {
  return getAdminDirectoryUsers().filter((u) => u.role === "agent");
}

export function getPlatformUserById(userId: string): DemoUser | null {
  const user = demoUsers.find((u) => u.id === userId);
  if (!user || !isAdminVisibleUser(user)) return null;
  return user;
}
