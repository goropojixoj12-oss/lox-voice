import { NextResponse } from "next/server";
import { getAgentById } from "@/data/agencies";
import { getProfilePhotoForAgentId } from "@/lib/agent-profile";

type RouteContext = { params: Promise<{ agentId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { agentId } = await context.params;
  const agent = getAgentById(agentId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const uploaded = await getProfilePhotoForAgentId(agentId);
  if (uploaded) {
    return new NextResponse(new Uint8Array(uploaded.bytes), {
      status: 200,
      headers: {
        "Content-Type": uploaded.mimeType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const upstream = await fetch(agent.photo, { next: { revalidate: 3600 } });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Photo unavailable" }, { status: 502 });
    }
    const bytes = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Photo unavailable" }, { status: 502 });
  }
}
