import { nanoid } from "nanoid";
import { commitFiles, gitRepoConfigured, readGitFile } from "@/lib/github-repo";
import type {
  SiteChangeRequest,
  SiteChangeRequestStatus,
  SiteChangeScope,
} from "@/lib/site-agent-types";

/**
 * The admin command queue lives in the repository: content/requests.json.
 * Every queue transition is a commit on main, so the request, the reviewer and
 * the resulting build are one history. No Blob/KV/database involved.
 */
const REQUESTS_FILE = "content/requests.json";
const MAX_STORED = 200;

export class GitQueueUnavailableError extends Error {
  constructor() {
    super(
      "Admin commands need GITHUB_CONTENT_TOKEN on the server (fine-grained PAT with Contents: read & write for this repo).",
    );
  }
}

function assertConfigured(): void {
  if (!gitRepoConfigured()) throw new GitQueueUnavailableError();
}

async function loadRequests(): Promise<SiteChangeRequest[]> {
  assertConfigured();
  const file = await readGitFile(REQUESTS_FILE);
  if (!file) return [];
  try {
    const parsed = JSON.parse(file.text) as { requests?: SiteChangeRequest[] };
    return Array.isArray(parsed.requests) ? parsed.requests : [];
  } catch {
    throw new Error(`${REQUESTS_FILE} is not valid JSON - refusing to overwrite it`);
  }
}

async function saveRequests(items: SiteChangeRequest[], message: string): Promise<void> {
  assertConfigured();
  await commitFiles(message, [
    {
      path: REQUESTS_FILE,
      text: `${JSON.stringify({ requests: items.slice(0, MAX_STORED) }, null, 2)}\n`,
    },
  ]);
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
  secondAttachment?: SiteChangeRequest["secondAttachment"];
}): Promise<SiteChangeRequest> {
  const items = await loadRequests();
  const now = new Date().toISOString();
  const request: SiteChangeRequest = {
    id: nanoid(12),
    message: input.message.trim(),
    scope: input.scope,
    status: "queued",
    attachment: input.attachment,
    secondAttachment: input.secondAttachment ?? null,
    createdByUserId: input.createdByUserId,
    createdByName: input.createdByName,
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(request);
  await saveRequests(items, `feat(requests): ${request.scope} request from ${input.createdByName}`);
  return request;
}

export async function claimNextSiteChangeRequest(): Promise<SiteChangeRequest | null> {
  const items = await loadRequests();
  const idx = items.findIndex((r) => r.status === "queued");
  if (idx < 0) return null;
  const now = new Date().toISOString();
  items[idx] = { ...items[idx]!, status: "in_progress", updatedAt: now };
  await saveRequests(items, `chore(requests): claim ${items[idx]!.id}`);
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
  items[idx] = { ...items[idx]!, ...patch, updatedAt: now };
  await saveRequests(items, `chore(requests): ${patch.status ?? "update"} ${id}`);
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
  await saveRequests(items, `chore(requests): attach screenshot to ${id}`);
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
  await saveRequests(items, `chore(requests): attach second screenshot to ${id}`);
  return items[idx]!;
}