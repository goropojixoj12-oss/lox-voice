import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeSiteAgent } from "@/lib/site-agent-auth";
import { getSiteChangeRequest, updateSiteChangeRequest } from "@/lib/site-agent-store";

const patchSchema = z.object({
  status: z.enum(["done", "failed", "in_progress", "queued"]),
  agentNote: z.string().max(4000).optional(),
  commitUrl: z.string().url().max(512).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

/** Agent marks a request complete or failed after deploy. */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authorizeSiteAgent(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await getSiteChangeRequest(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = await updateSiteChangeRequest(id, {
    status: parsed.data.status,
    agentNote: parsed.data.agentNote?.trim(),
    commitUrl: parsed.data.commitUrl,
  });
  return NextResponse.json({ request: updated });
}
