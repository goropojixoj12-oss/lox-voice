import { NextResponse } from "next/server";
import { resolveActingAgentUser } from "@/lib/agent-desk-acting-user";
import { getSession } from "@/lib/auth";

/**
 * Upload endpoints (direct and chunked) share one rule: the file belongs to the
 * signed-in user, or to the agent the desk is acting for. Returns either the
 * storage user id or a ready-made error response.
 */
export async function resolveUploadTarget(
  request: Request,
): Promise<{ ok: true; userId: string } | { ok: false; response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  if (!["owner", "agent", "admin"].includes(session.role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (session.role === "agent" || session.role === "admin") {
    const resolved = await resolveActingAgentUser(session, request);
    if (!resolved.ok) {
      return {
        ok: false,
        response: NextResponse.json({ error: resolved.error }, { status: resolved.status }),
      };
    }
    return { ok: true, userId: resolved.user.id };
  }
  return { ok: true, userId: session.id };
}