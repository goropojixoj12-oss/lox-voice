import { nanoid } from "nanoid";
import { readStoreJson, writeStoreJson } from "@/lib/store-persistence";
import type {
  SiteChangeRequest,
  SiteChangeRequestStatus,
  SiteChangeScope,
} from "@/lib/site-agent-types";

const REQUESTS_FILE = "admin-site-change-requests.json";
const MAX_STORED = 200;

async function loadRequests(): Promise<SiteChangeRequest[]> {
  return readStoreJson<SiteChangeRequest[]>(REQUESTS_FILE, []);
}

async function saveRequests(items: SiteChangeRequest[]): Promise<void> {
  await writeStoreJson(REQUESTS_FILE, items.slice(0, MAX_STORED));
}

export async function listSiteChangeRequests(limit = 40): Promise<SiteChangeRequest[]> {
  const items = await loadRequests();
  return items.slice(0, limit);
}

export async function createSiteChangeRequest(input: {
  message: string;
  scope: SiteChangeScope;
  createdByUserId: string;
  createdByName: string;
  attachment: SiteChangeRequest["attachment"];
}): Promise<SiteChangeRequest> {
  const items = await loadRequests();
  const now = new Date().toISOString();
  const request: SiteChangeRequest = {
    id: nanoid(12),
    message: input.message.trim(),
    scope: input.scope,
    status: "queued",
    attachment: input.attachment,
    createdByUserId: input.createdByUserId,
    createdByName: input.createdByName,
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(request);
  await saveRequests(items);
  return request;
}

export async function claimNextSiteChangeRequest(): Promise<SiteChangeRequest | null> {
  const items = await loadRequests();
  const idx = items.findIndex((r) => r.status === "queued");
  if (idx < 0) return null;
  const now = new Date().toISOString();
  items[idx] = { ...items[idx]!, status: "in_progress", updatedAt: now };
  await saveRequests(items);
  return items[idx]!;
}

export async function updateSiteChangeRequest(
  id: string,
  patch: {
    status?: SiteChangeRequestStatus;
    agentNote?: string;
    commitUrl?: string;
  },
): Promise<SiteChangeRequest | null> {
  const items = await loadRequests();
  const idx = items.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  items[idx] = {
    ...items[idx]!,
    ...patch,
    updatedAt: now,
  };
  await saveRequests(items);
  return items[idx]!;
}

export async function getSiteChangeRequest(id: string): Promise<SiteChangeRequest | null> {
  const items = await loadRequests();
  return items.find((r) => r.id === id) ?? null;
}

export async function setSiteChangeRequestAttachment(
  id: string,
  attachment: NonNullable<SiteChangeRequest["attachment"]>,
): Promise<SiteChangeRequest | null> {
  const items = await loadRequests();
  const idx = items.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  items[idx] = { ...items[idx]!, attachment, updatedAt: now };
  await saveRequests(items);
  return items[idx]!;
}

export async function setSiteChangeRequestSecondAttachment(
  id: string,
  secondAttachment: NonNullable<SiteChangeRequest["secondAttachment"]>,
): Promise<SiteChangeRequest | null> {
  const items = await loadRequests();
  const idx = items.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  items[idx] = { ...items[idx]!, secondAttachment, updatedAt: now };
  await saveRequests(items);
  return items[idx]!;
}
