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

const ANALYTICS_SEED_PATHS = [
  "/",
  "/search",
  "/buy/residential",
  "/rent/residential",
  "/property/luxury-3-bedroom-2-full-bathroom-sFDuO",
  "/projects",
  "/guides",
  "/list-property",
  "/dashboard/agent/overview",
];

function seedPageViewsIfEmpty(events: PageViewEvent[]): PageViewEvent[] {
  if (events.length > 0) return events;
  const now = Date.now();
  const out: PageViewEvent[] = [];
  for (let day = 0; day < 14; day++) {
    const sessions = 8 + (day % 5);
    for (let s = 0; s < sessions; s++) {
      const sessionKey = `seed-${day}-${s}`;
      const depth = 2 + ((day + s) % 4);
      for (let p = 0; p < depth; p++) {
        const path = ANALYTICS_SEED_PATHS[(day + s + p) % ANALYTICS_SEED_PATHS.length]!;
        out.push({
          id: nanoid(8),
          path,
          at: new Date(now - day * 86400000 - s * 3600000 - p * 120000).toISOString(),
          sessionKey,
        });
      }
    }
  }
  return out;
}

export async function getPageViewEvents(): Promise<PageViewEvent[]> {
  const raw = await readStoreJson<PageViewEvent[]>(PAGE_VIEWS_FILE, []);
  const events = seedPageViewsIfEmpty(raw);
  if (raw.length === 0 && events.length > 0) {
    await writeStoreJson(PAGE_VIEWS_FILE, events);
  }
  return events;
}

export async function appendPageView(input: {
  path: string;
  sessionKey: string;
  referrer?: string;
}): Promise<void> {
  const events = await readStoreJson<PageViewEvent[]>(PAGE_VIEWS_FILE, []);
  events.push({
    id: nanoid(10),
    path: input.path.slice(0, 512),
    sessionKey: input.sessionKey.slice(0, 64),
    referrer: input.referrer?.slice(0, 512),
    at: new Date().toISOString(),
  });
  const trimmed = events.slice(-8000);
  await writeStoreJson(PAGE_VIEWS_FILE, trimmed);
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
