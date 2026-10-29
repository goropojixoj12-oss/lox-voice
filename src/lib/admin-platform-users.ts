import { demoUsers } from "@/data/users";
import { getAllPlatformUsers } from "@/lib/platform-users-store";
import type { DemoUser } from "@/lib/types";

/** Demo buyer/owner logins — not staff. Adam James (user-agent) is the real platform agent. */
export const ADMIN_HIDDEN_USER_IDS = new Set(["user-buyer", "user-owner"]);

/** Public catalog seed profiles (Sokha, Dara, …) — not real staff; use platform user ids in admin. */
export const ADMIN_HIDDEN_STAFF_IDS = new Set([
  "agent-sokha",
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

/** Accounts shown in admin Users (CEO admin + agents + future registrations). */
export async function getAdminDirectoryUsers(): Promise<DemoUser[]> {
  const all = await getAllPlatformUsers();
  return all.filter(isAdminVisibleUser);
}

export async function getPlatformAgents(): Promise<DemoUser[]> {
  const users = await getAdminDirectoryUsers();
  return users.filter((u) => u.role === "agent");
}

export async function getPlatformUserById(userId: string): Promise<DemoUser | null> {
  const all = await getAllPlatformUsers();
  const user = all.find((u) => u.id === userId);
  if (!user || !isAdminVisibleUser(user)) return null;
  return user;
}

/** Synchronous lookup for built-in demo accounts only (legacy call sites). */
export function getBuiltinPlatformUserById(userId: string): DemoUser | null {
  const user = demoUsers.find((u) => u.id === userId);
  if (!user || !isAdminVisibleUser(user)) return null;
  return user;
}
