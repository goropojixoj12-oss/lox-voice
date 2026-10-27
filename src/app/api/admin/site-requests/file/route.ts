import { NextResponse } from "next/server";
import { authorizeSiteAgent } from "@/lib/site-agent-auth";
import { readSiteRequestAttachment } from "@/lib/site-agent-attachments";

export async function GET(request: Request) {
  const auth = await authorizeSiteAgent(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = new URL(request.url).searchParams.get("key")?.trim();
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const file = await readSiteRequestAttachment(key);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
