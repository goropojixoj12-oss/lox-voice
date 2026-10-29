import { NextResponse } from "next/server";
import { getAgentDocumentForUser } from "@/lib/agent-profile";
import { resolveActingAgentUser } from "@/lib/agent-desk-acting-user";
import { getSession } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
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

  const { id } = await context.params;
  const doc = await getAgentDocumentForUser(resolved.user.id, id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(doc.bytes), {
    status: 200,
    headers: {
      "Content-Type": doc.ref.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.ref.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
