export const AGENT_DOCUMENT_KINDS = [
  "profile_photo",
  "id_front",
  "id_back",
  "employment_contract",
  "other",
] as const;

export type AgentDocumentKind = (typeof AGENT_DOCUMENT_KINDS)[number];

export type AgentDocumentRef = {
  id: string;
  kind: AgentDocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  storageKey: string;
};

export type AgentProfileRecord = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  residence: string;
  documents: AgentDocumentRef[];
  updatedAt: string;
};

export const MAX_AGENT_DOC_BYTES = 8 * 1024 * 1024;

const ID_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const CONTRACT_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);
const PORTRAIT_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateAgentDocumentFile(
  kind: AgentDocumentKind,
  file: File,
): string | null {
  if (!file.size) return "Choose a file to upload";
  if (file.size > MAX_AGENT_DOC_BYTES) {
    return `File is too large (max ${MAX_AGENT_DOC_BYTES / (1024 * 1024)} MB)`;
  }
  const lower = file.name.toLowerCase();
  if (kind === "profile_photo") {
    const extOk =
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp");
    if (!extOk) return "Portrait must be JPG, PNG, or WebP";
    if (
      file.type &&
      !PORTRAIT_MIME.has(file.type) &&
      file.type !== "application/octet-stream"
    ) {
      return "Portrait must be JPG, PNG, or WebP";
    }
    return null;
  }
  if (kind === "id_front" || kind === "id_back") {
    const extOk =
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".pdf");
    if (!extOk) return "ID must be JPG, PNG, WebP, or PDF";
    if (file.type && !ID_MIME.has(file.type) && file.type !== "application/octet-stream") {
      return "ID must be JPG, PNG, WebP, or PDF";
    }
    return null;
  }
  if (kind === "employment_contract") {
    const extOk =
      lower.endsWith(".pdf") ||
      lower.endsWith(".doc") ||
      lower.endsWith(".docx") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png");
    if (!extOk) return "Contract must be PDF, Word, or a clear scan (JPG/PNG)";
    if (
      file.type &&
      !CONTRACT_MIME.has(file.type) &&
      file.type !== "application/octet-stream"
    ) {
      return "Unsupported contract file type";
    }
    return null;
  }
  const extOk =
    lower.endsWith(".pdf") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp");
  if (!extOk) return "Use PDF, Word, or image files";
  return null;
}

export function getProfilePhotoDocument(
  profile: AgentProfileRecord,
): AgentDocumentRef | undefined {
  return profile.documents.find((d) => d.kind === "profile_photo");
}

export function agentHasRequiredProfilePhoto(profile: AgentProfileRecord): boolean {
  return Boolean(getProfilePhotoDocument(profile));
}

export function agentDocumentKindLabel(kind: AgentDocumentKind): string {
  switch (kind) {
    case "profile_photo":
      return "Professional portrait (required)";
    case "id_front":
      return "National ID — front";
    case "id_back":
      return "National ID — back";
    case "employment_contract":
      return "Signed employment contract";
    case "other":
      return "Other document";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
