import { getAgentDeskUser } from "@/lib/admin-agent-manage";
import { getSession, type SessionUser } from "@/lib/auth";
import { hasAdminDeskAccess } from "@/lib/platform-roles";

/** Agent profile / documents / desk APIs — self or God-managed agent. */
export async function getAgentDeskActor(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  return getAgentDeskUser(session);
}

/** Blob / media storage key owner (managed agent or signed-in user). */
export async function getListingMediaOwnerId(): Promise<string | null> {
  const operator = await getSession();
  if (!operator) return null;
  const desk = await getAgentDeskUser(operator);
  if (desk?.role === "agent") return desk.id;
  if (operator.role === "owner" || operator.role === "agent") return operator.id;
  if (hasAdminDeskAccess(operator.role)) return operator.id;
  return null;
}

export async function canUploadListingMedia(): Promise<boolean> {
  return (await getListingMediaOwnerId()) != null;
}
