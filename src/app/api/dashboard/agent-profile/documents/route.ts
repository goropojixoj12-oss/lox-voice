import { NextResponse } from "next/server";
import {
  AGENT_DOCUMENT_KINDS,
  addAgentDocument,
  removeAgentDocument,
  validateAgentDocumentFile,
  type AgentDocumentKind,
} from "@/lib/agent-profile";
import { resolveActingAgentUser } from "@/lib/agent-desk-acting-user";
import { getSession } from "@/lib/auth";

function parseKind(raw: FormDataEntryValue | null): AgentDocumentKind | null {
  if (typeof raw !== "string") return null;
  return AGENT_DOCUMENT_KINDS.includes(raw as AgentDocumentKind)
    ? (raw as AgentDocumentKind)
    : null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (session.role !== "agent" && session.role !== "admin") {
    return NextResponse.json({ error: "Agent profile only" }, { status: 403 });
  }

  const resolved = await resolveActingAgentUser(session, request);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const form = await request.formData();
  const kind = parseKind(form.get("kind"));
  const file = form.get("file");
  if (!kind) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const validationError = validateAgentDocumentFile(kind, file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const profile = await addAgentDocument(
    resolved.user.id,
    { name: resolved.user.name, email: resolved.user.email },
    kind,
    {
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      bytes,
    },
  );
  return NextResponse.json({ profile });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (session.role !== "agent" && session.role !== "admin") {
    return NextResponse.json({ error: "Agent profile only" }, { status: 403 });
  }

  const resolved = await resolveActingAgentUser(session, request);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("id")?.trim();
  if (!documentId) {
    return NextResponse.json({ error: "Document id required" }, { status: 400 });
  }
  const profile = await removeAgentDocument(resolved.user.id, documentId);
  if (!profile) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ profile });
}
