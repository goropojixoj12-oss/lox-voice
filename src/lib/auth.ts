import { cookies } from "next/headers";
import { findUserByEmail, demoUsers } from "@/data/users";
import type { DemoUser, UserRole } from "@/lib/types";

const SESSION_COOKIE = "en_session";

export type SessionUser = Omit<DemoUser, "password">;

function toSessionUser(user: DemoUser): SessionUser {
  const { password: _password, ...rest } = user;
  return rest;
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { userId: string };
    const user = demoUsers.find((u) => u.id === parsed.userId);
    return user ? toSessionUser(user) : null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return { ok: false as const, error: "Invalid email or password" };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, JSON.stringify({ userId: user.id }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return { ok: true as const, user: toSessionUser(user) };
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function requireRole(roles: UserRole[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) return null;
  return session;
}
