import { nanoid } from "nanoid";
import { z } from "zod";
import {
  type AgentDocumentKind,
  type AgentDocumentRef,
  type AgentProfileRecord,
  getProfilePhotoDocument,
} from "@/lib/agent-profile-shared";
import {
  deleteAgentDocumentBytes,
  readAgentDocumentBytes,
  writeAgentDocumentBytes,
} from "@/lib/agent-profile-files";
import { readStoreJson, writeStoreJson } from "@/lib/store-persistence";

export {
  AGENT_DOCUMENT_KINDS,
  agentDocumentKindLabel,
  agentHasRequiredProfilePhoto,
  getProfilePhotoDocument,
  MAX_AGENT_DOC_BYTES,
  validateAgentDocumentFile,
  type AgentDocumentKind,
  type AgentDocumentRef,
  type AgentProfileRecord,
} from "@/lib/agent-profile-shared";

const PROFILES_FILE = "agent-profiles.json";

export const agentProfileFieldsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 15 && /^[\d\s+().-]+$/.test(value);
    }, "Enter a valid phone (8–15 digits)"),
  residence: z
    .string()
    .trim()
    .min(2, "Enter where you live (city or full address)")
    .max(200, "Residence is too long"),
});

async function readAllProfiles(): Promise<Record<string, AgentProfileRecord>> {
  return readStoreJson<Record<string, AgentProfileRecord>>(PROFILES_FILE, {});
}

function defaultProfile(
  userId: string,
  seed: { name: string; email: string },
): AgentProfileRecord {
  return {
    userId,
    fullName: seed.name,
    email: seed.email,
    phone: "",
    residence: "",
    documents: [],
    updatedAt: new Date().toISOString(),
  };
}

const LEGACY_AGENT_DISPLAY_NAMES = new Set(["Agent1", "agent1"]);

export async function getAgentProfile(
  userId: string,
  seed: { name: string; email: string },
): Promise<AgentProfileRecord> {
  const all = await readAllProfiles();
  const stored = all[userId];
  if (!stored) return defaultProfile(userId, seed);
  if (
    seed.name.trim().length >= 2 &&
    LEGACY_AGENT_DISPLAY_NAMES.has(stored.fullName.trim()) &&
    stored.fullName.trim() !== seed.name.trim()
  ) {
    return { ...stored, fullName: seed.name, updatedAt: new Date().toISOString() };
  }
  return stored;
}

export async function saveAgentProfileFields(
  userId: string,
  seed: { name: string; email: string },
  fields: z.infer<typeof agentProfileFieldsSchema>,
): Promise<AgentProfileRecord> {
  const all = await readAllProfiles();
  const current = all[userId] ?? defaultProfile(userId, seed);
  const next: AgentProfileRecord = {
    ...current,
    ...fields,
    updatedAt: new Date().toISOString(),
  };
  all[userId] = next;
  await writeStoreJson(PROFILES_FILE, all);
  return next;
}

const SINGLE_SLOT_KINDS: AgentDocumentKind[] = [
  "profile_photo",
  "id_front",
  "id_back",
  "employment_contract",
];

export async function addAgentDocument(
  userId: string,
  seed: { name: string; email: string },
  kind: AgentDocumentKind,
  file: { name: string; mimeType: string; bytes: Buffer },
): Promise<AgentProfileRecord> {
  const all = await readAllProfiles();
  const current = all[userId] ?? defaultProfile(userId, seed);
  const docId = nanoid();
  const storageKey = `${userId}/${docId}`;

  await writeAgentDocumentBytes(storageKey, file.bytes, file.mimeType);

  let documents = [...current.documents];
  if (SINGLE_SLOT_KINDS.includes(kind)) {
    const existing = documents.filter((d) => d.kind === kind);
    for (const old of existing) {
      await deleteAgentDocumentBytes(old.storageKey);
    }
    documents = documents.filter((d) => d.kind !== kind);
  }

  const ref: AgentDocumentRef = {
    id: docId,
    kind,
    fileName: file.name,
    mimeType: file.mimeType,
    sizeBytes: file.bytes.length,
    uploadedAt: new Date().toISOString(),
    storageKey,
  };
  documents.push(ref);

  const next: AgentProfileRecord = {
    ...current,
    documents,
    updatedAt: new Date().toISOString(),
  };
  all[userId] = next;
  await writeStoreJson(PROFILES_FILE, all);
  return next;
}

export async function removeAgentDocument(
  userId: string,
  documentId: string,
): Promise<AgentProfileRecord | null> {
  const all = await readAllProfiles();
  const current = all[userId];
  if (!current) return null;
  const target = current.documents.find((d) => d.id === documentId);
  if (!target) return null;
  await deleteAgentDocumentBytes(target.storageKey);
  const next: AgentProfileRecord = {
    ...current,
    documents: current.documents.filter((d) => d.id !== documentId),
    updatedAt: new Date().toISOString(),
  };
  all[userId] = next;
  await writeStoreJson(PROFILES_FILE, all);
  return next;
}

export async function getAgentDocumentForUser(
  userId: string,
  documentId: string,
): Promise<{ ref: AgentDocumentRef; bytes: Buffer } | null> {
  const all = await readAllProfiles();
  const profile = all[userId];
  if (!profile) return null;
  const ref = profile.documents.find((d) => d.id === documentId);
  if (!ref) return null;
  const bytes = await readAgentDocumentBytes(ref.storageKey);
  if (!bytes) return null;
  return { ref, bytes };
}

export async function getProfilePhotoForAgentId(
  agentId: string,
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const { getAgentById } = await import("@/data/agencies");
  const agent = getAgentById(agentId);
  if (!agent?.platformUserId) return null;
  const all = await readAllProfiles();
  const profile = all[agent.platformUserId];
  if (!profile) return null;
  const ref = getProfilePhotoDocument(profile);
  if (!ref) return null;
  const bytes = await readAgentDocumentBytes(ref.storageKey);
  if (!bytes) return null;
  return { bytes, mimeType: ref.mimeType };
}
