import { readStoreJson, writeStoreJson } from "@/lib/store-persistence";

const AUDIT_FILE = "admin-audit-log.json";
const MAX_ENTRIES = 2000;

export type AuditAction =
  | "login_success"
  | "login_failed"
  | "site_change_submit"
  | "site_change_dispatch"
  | "admin_dashboard_access";

export type AuditEntry = {
  id: string;
  action: AuditAction;
  userId: string | null;
  userName: string | null;
  email: string | null;
  ip: string;
  userAgent: string;
  timestamp: string;
  meta?: Record<string, string>;
};

function generateId(): string {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${now}-${rand}`;
}

export function extractClientInfo(request: Request): {
  ip: string;
  userAgent: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ip, userAgent };
}

export async function writeAuditEntry(
  entry: Omit<AuditEntry, "id" | "timestamp">,
): Promise<AuditEntry> {
  const full: AuditEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  const entries = await readStoreJson<AuditEntry[]>(AUDIT_FILE, []);
  entries.unshift(full);

  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  await writeStoreJson(AUDIT_FILE, entries);
  return full;
}

export async function readAuditLog(
  limit = 200,
  filter?: {
    actions?: AuditAction[];
    sinceIso?: string;
    userId?: string;
  },
): Promise<AuditEntry[]> {
  let entries = await readStoreJson<AuditEntry[]>(AUDIT_FILE, []);

  if (filter?.actions?.length) {
    const allowed = new Set(filter.actions);
    entries = entries.filter((e) => allowed.has(e.action));
  }
  if (filter?.sinceIso) {
    entries = entries.filter((e) => e.timestamp >= filter.sinceIso!);
  }
  if (filter?.userId) {
    entries = entries.filter((e) => e.userId === filter.userId);
  }

  return entries.slice(0, limit);
}
