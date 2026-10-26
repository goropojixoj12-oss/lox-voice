import { NextResponse } from "next/server";
import { getAgentDocumentForUser } from "@/lib/agent-profile";
import { getAgentDeskActor } from "@/lib/agent-desk-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const actor = await getAgentDeskActor();
  if (!actor) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (actor.role !== "agent") {
    return NextResponse.json({ error: "Agent profile only" }, { status: 403 });
  }

  const { id } = await context.params;
  const doc = await getAgentDocumentForUser(actor.id, id);
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
