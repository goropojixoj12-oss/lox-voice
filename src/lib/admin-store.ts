import { nanoid } from "nanoid";
import { readStoreJson, writeStoreJson } from "@/lib/store-persistence";
import type {
  AdminComment,
  AdminCommentSubject,
  AdminTask,
  LegalDocRecord,
  PageViewEvent,
} from "@/lib/admin-types";
import { LEGAL_DOCS_SEED } from "@/data/admin-legal-seed";

const PAGE_VIEWS_FILE = "analytics-pageviews.json";
const TASKS_FILE = "admin-tasks.json";
const COMMENTS_FILE = "admin-comments.json";
const LEGAL_FILE = "admin-legal-docs.json";

const DEDUPE_MS = 4000;

function isRealPageView(event: PageViewEvent): boolean {
  return !event.sessionKey.startsWith("seed-");
}

async function loadRealPageViews(): Promise<PageViewEvent[]> {
  const raw = await readStoreJson<PageViewEvent[]>(PAGE_VIEWS_FILE, []);
  const real = raw.filter(isRealPageView);
  if (real.length !== raw.length) {
    await writeStoreJson(PAGE_VIEWS_FILE, real);
  }
  return real;
}

export async function getPageViewEvents(): Promise<PageViewEvent[]> {
  return loadRealPageViews();
}

export async function appendPageView(input: {
  path: string;
  sessionKey: string;
  referrer?: string;
}): Promise<void> {
  if (input.sessionKey.startsWith("seed-")) return;

  const path = input.path.slice(0, 512);
  const sessionKey = input.sessionKey.slice(0, 64);
  const now = Date.now();

  const events = await loadRealPageViews();
  const last = events[events.length - 1];
  if (
    last &&
    last.path === path &&
    last.sessionKey === sessionKey &&
    now - new Date(last.at).getTime() < DEDUPE_MS
  ) {
    return;
  }

  events.push({
    id: nanoid(10),
    path,
    sessionKey,
    referrer: input.referrer?.slice(0, 512),
    at: new Date().toISOString(),
  });
  await writeStoreJson(PAGE_VIEWS_FILE, events.slice(-8000));
}

export async function getAdminTasks(): Promise<AdminTask[]> {
  return readStoreJson<AdminTask[]>(TASKS_FILE, []);
}

export async function createAdminTask(
  input: Omit<AdminTask, "id" | "createdAt" | "updatedAt" | "status"> & {
    status?: AdminTask["status"];
  },
): Promise<AdminTask> {
  const tasks = await getAdminTasks();
  const now = new Date().toISOString();
  const task: AdminTask = {
    id: nanoid(10),
    status: input.status ?? "open",
    createdAt: now,
    updatedAt: now,
    assigneeStaffId: input.assigneeStaffId,
    title: input.title,
    body: input.body,
    dueDate: input.dueDate,
    createdByUserId: input.createdByUserId,
  };
  tasks.unshift(task);
  await writeStoreJson(TASKS_FILE, tasks);
  return task;
}

export async function updateAdminTaskStatus(
  taskId: string,
  status: AdminTask["status"],
): Promise<AdminTask | null> {
  const tasks = await getAdminTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;
  tasks[idx] = { ...tasks[idx]!, status, updatedAt: new Date().toISOString() };
  await writeStoreJson(TASKS_FILE, tasks);
  return tasks[idx]!;
}

export async function getAdminComments(subject?: AdminCommentSubject): Promise<AdminComment[]> {
  const all = await readStoreJson<AdminComment[]>(COMMENTS_FILE, []);
  if (!subject) return all;
  return all.filter((c) => c.subject.type === subject.type && c.subject.id === subject.id);
}

export async function createAdminComment(input: {
  subject: AdminCommentSubject;
  body: string;
  authorUserId: string;
  authorName: string;
}): Promise<AdminComment> {
  const all = await readStoreJson<AdminComment[]>(COMMENTS_FILE, []);
  const comment: AdminComment = {
    id: nanoid(10),
    subject: input.subject,
    body: input.body.trim(),
    authorUserId: input.authorUserId,
    authorName: input.authorName,
    createdAt: new Date().toISOString(),
  };
  all.unshift(comment);
  await writeStoreJson(COMMENTS_FILE, all.slice(0, 2000));
  return comment;
}

export async function getLegalDocs(): Promise<LegalDocRecord[]> {
  const stored = await readStoreJson<LegalDocRecord[]>(LEGAL_FILE, []);
  if (stored.length > 0) return stored;
  await writeStoreJson(LEGAL_FILE, LEGAL_DOCS_SEED);
  return LEGAL_DOCS_SEED;
}
