import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { findUserByEmail, demoUsers } from "@/data/users";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/password";
import type { DemoUser, UserRole } from "@/lib/types";

const SESSION_COOKIE = "en_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;

export type SessionUser = Omit<DemoUser, "passwordHash">;

type SessionPayload = {
  userId: string;
  iat: number;
  exp: number;
};

function toSessionUser(user: DemoUser): SessionUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret === "replace-with-long-random-string") {
    throw new Error(
      "AUTH_SECRET is missing or still the placeholder. Set a long random value in env before using sessions.",
    );
  }
  return secret;
}

function base64UrlEncode(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function signPayload(payloadB64: string, secret: string): string {
  return base64UrlEncode(
    createHmac("sha256", secret).update(payloadB64).digest(),
  );
}

function signaturesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Create HMAC-signed cookie value. Role is never stored in the cookie. */
export function signSession(userId: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const secret = getAuthSecret();
  const payload: SessionPayload = {
    userId,
    iat: nowSec,
    exp: nowSec + SESSION_MAX_AGE_SEC,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = signPayload(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

/**
 * Verify signed session cookie. Rejects unsigned JSON, bad signatures, and expired payloads.
 * Returns userId only — callers must load role from server-side user data.
 */
export function verifySession(raw: string): { userId: string } | null {
  if (!raw || raw.trimStart().startsWith("{")) {
    // Legacy unsigned JSON cookie — refuse
    return null;
  }

  const dot = raw.lastIndexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return null;

  const payloadB64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  let secret: string;
  try {
    secret = getAuthSecret();
  } catch {
    return null;
  }

  const expected = signPayload(payloadB64, secret);
  if (!signaturesEqual(sig, expected)) return null;

  try {
    const json = base64UrlDecode(payloadB64).toString("utf8");
    const parsed = JSON.parse(json) as SessionPayload;
    if (!parsed?.userId || typeof parsed.userId !== "string") return null;
    if (typeof parsed.exp !== "number" || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { userId: parsed.userId };
  } catch {
    return null;
  }
}

export function readSessionTokenFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;
  const part = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  if (!part) return null;
  const raw = part.slice(SESSION_COOKIE.length + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** True when a valid signed-in session cookie is present (staff and public accounts). */
export function hasAuthenticatedSessionCookie(
  cookieHeader: string | null | undefined,
): boolean {
  const raw = readSessionTokenFromCookieHeader(cookieHeader);
  if (!raw) return false;
  return verifySession(raw) !== null;
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const verified = verifySession(raw);
  if (!verified) return null;

  const user = demoUsers.find((u) => u.id === verified.userId);
  return user ? toSessionUser(user) : null;
}

export async function login(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return { ok: false as const, error: "Invalid email or password" };
  }

  const match = await verifyPassword(password, user.passwordHash);
  if (!match) {
    return { ok: false as const, error: "Invalid email or password" };
  }

  let token: string;
  try {
    token = signSession(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth misconfigured";
    return { ok: false as const, error: message };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
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
