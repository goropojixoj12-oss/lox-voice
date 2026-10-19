import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getAgentById } from "@/data/agencies";
import { getProfilePhotoForAgentId } from "@/lib/agent-profile";

type RouteContext = { params: Promise<{ agentId: string }> };

async function readCatalogPhoto(
  photoPath: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (!photoPath.startsWith("/")) return null;
  const filePath = path.join(process.cwd(), "public", photoPath.replace(/^\//, ""));
  try {
    const bytes = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: RouteContext) {
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

  const catalog = await readCatalogPhoto(agent.photo);
  if (catalog) {
    return new NextResponse(new Uint8Array(catalog.bytes), {
      status: 200,
      headers: {
        "Content-Type": catalog.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  try {
    const upstream = await fetch(new URL(agent.photo, request.url), {
      next: { revalidate: 3600 },
    });
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
