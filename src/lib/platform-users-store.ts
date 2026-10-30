import { nanoid } from "nanoid";
import { demoUsers, findUserByEmail as findBuiltinUserByEmail } from "@/data/users";
import { hashPassword } from "@/lib/password";
import { readStoreJson, writeStoreJson } from "@/lib/store-persistence";
import type { DemoUser } from "@/lib/types";

const STORE_FILE = "platform-registered-users.json";

/** Agent accounts created from the admin desk (persisted in KV/Blob). */
export type RegisteredPlatformUser = DemoUser;

async function loadRegistered(): Promise<RegisteredPlatformUser[]> {
  return readStoreJson<RegisteredPlatformUser[]>(STORE_FILE, []);
}

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "Agent";
  const cleaned = local.replace(/[._+-]+/g, " ").trim();
  if (!cleaned) return "Registered agent";
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export async function getRegisteredPlatformUsers(): Promise<RegisteredPlatformUser[]> {
  return loadRegistered();
}

/** Built-in demo accounts plus admin-created agent logins. */
export async function getAllPlatformUsers(): Promise<DemoUser[]> {
  const registered = await loadRegistered();
  return [...demoUsers, ...registered];
}

export async function findPlatformUserByEmail(email: string): Promise<DemoUser | undefined> {
  const normalized = email.trim().toLowerCase();
  const builtin = findBuiltinUserByEmail(normalized);
  if (builtin) return builtin;
  const registered = await loadRegistered();
  return registered.find((u) => u.email.toLowerCase() === normalized);
}

export async function findPlatformUserById(userId: string): Promise<DemoUser | undefined> {
  const builtin = demoUsers.find((u) => u.id === userId);
  if (builtin) return builtin;
  const registered = await loadRegistered();
  return registered.find((u) => u.id === userId);
}

export type CreateRegisteredAgentResult =
  | { ok: true; user: RegisteredPlatformUser }
  | { ok: false; error: string; status: number };

export async function createRegisteredAgent(input: {
  email: string;
  password: string;
}): Promise<CreateRegisteredAgentResult> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Enter a valid email address.", status: 400 };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters.", status: 400 };
  }

  const existing = await findPlatformUserByEmail(email);
  if (existing) {
    return { ok: false, error: "An account with this email already exists.", status: 409 };
  }

  const registered = await loadRegistered();
  const user: RegisteredPlatformUser = {
    id: `user-agent-${nanoid(10)}`,
    email,
    passwordHash: await hashPassword(input.password),
    name: displayNameFromEmail(email),
    role: "agent",
  };

  registered.push(user);
  await writeStoreJson(STORE_FILE, registered);
  return { ok: true, user };
}

export type UpdatePlatformUserResult =
  | { ok: true; user: DemoUser }
  | { ok: false; error: string; status: number };

export async function updatePlatformUser(
  userId: string,
  fields: { name?: string; email?: string; password?: string; suspended?: boolean },
): Promise<UpdatePlatformUserResult> {
  const builtin = demoUsers.find((u) => u.id === userId);
  if (builtin) {
    if (fields.name !== undefined) builtin.name = fields.name;
    if (fields.email !== undefined) builtin.email = fields.email;
    if (fields.password !== undefined) builtin.passwordHash = await hashPassword(fields.password);
    if (fields.suspended !== undefined) builtin.suspended = fields.suspended;
    return { ok: true, user: builtin };
  }

  const registered = await loadRegistered();
  const idx = registered.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return { ok: false, error: "User not found.", status: 404 };
  }

  const user = registered[idx]!;
  if (fields.name !== undefined) user.name = fields.name;
  if (fields.email !== undefined) user.email = fields.email.trim().toLowerCase();
  if (fields.password !== undefined) user.passwordHash = await hashPassword(fields.password);
  if (fields.suspended !== undefined) user.suspended = fields.suspended;

  await writeStoreJson(STORE_FILE, registered);
  return { ok: true, user };
}
