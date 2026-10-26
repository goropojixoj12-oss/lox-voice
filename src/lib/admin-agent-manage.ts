import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoUsers } from "@/data/users";
import type { SessionUser } from "@/lib/auth";
import { getSession } from "@/lib/auth";
import { getPlatformUserById } from "@/lib/admin-platform-users";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { canManageAgentDesk } from "@/lib/platform-roles";
import type { DemoUser } from "@/lib/types";

export const MANAGE_AGENT_COOKIE = "en_manage_agent";
const MAX_AGE_SEC = 60 * 60 * 8;

export type AgentDeskContext = {
  operator: SessionUser;
  /** Whose agent desk data to read/write (agent login or operator when role is agent). */
  deskUser: SessionUser;
  isGodManaging: boolean;
};

function toDeskSession(user: DemoUser): SessionUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function getManagedAgentUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(MANAGE_AGENT_COOKIE)?.value?.trim();
  if (!raw) return null;
  const user = demoUsers.find((u) => u.id === raw && u.role === "agent");
  return user ? user.id : null;
}

export async function setManagedAgentUserId(userId: string): Promise<boolean> {
  const user = getPlatformUserById(userId);
  if (!user || user.role !== "agent") return false;
  const jar = await cookies();
  jar.set(MANAGE_AGENT_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return true;
}

export async function clearManagedAgentUserId(): Promise<void> {
  const jar = await cookies();
  jar.delete(MANAGE_AGENT_COOKIE);
}

export async function resolveAgentDeskContext(
  operator: SessionUser | null,
): Promise<AgentDeskContext | null> {
  if (!operator) return null;

  if (operator.role === "agent") {
    return { operator, deskUser: operator, isGodManaging: false };
  }

  if (!canManageAgentDesk(operator.role)) {
    return null;
  }

  const managedId = await getManagedAgentUserId();
  if (!managedId) return null;

  const agent = demoUsers.find((u) => u.id === managedId && u.role === "agent");
  if (!agent) return null;

  return {
    operator,
    deskUser: toDeskSession(agent),
    isGodManaging: true,
  };
}

/** Agent-scoped API/pages: active agent account (self or God-managed). */
export async function getAgentDeskUser(operator: SessionUser | null): Promise<SessionUser | null> {
  const ctx = await resolveAgentDeskContext(operator);
  return ctx?.deskUser ?? null;
}

/** Agent desk pages: agents always; God only when managing an agent via staff list. */
export async function requireAgentDeskContext(): Promise<AgentDeskContext> {
  const operator = await getSession();
  if (!operator) redirect("/auth/login");

  if (operator.role === "agent") {
    return { operator, deskUser: operator, isGodManaging: false };
  }

  if (canManageAgentDesk(operator.role)) {
    const ctx = await resolveAgentDeskContext(operator);
    if (ctx?.isGodManaging) return ctx;
    redirect(adminDeskPath("staff"));
  }

  redirect("/dashboard");
}
