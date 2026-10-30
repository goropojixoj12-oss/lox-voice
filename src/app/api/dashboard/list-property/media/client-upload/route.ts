import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { resolveActingAgentUser } from "@/lib/agent-desk-acting-user";
import { getSession } from "@/lib/auth";
import { BLOB_PREFIX } from "@/lib/listing-media-constants";

function blobToken(): string | undefined {
  return (
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN?.trim() ||
    undefined
  );
}

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!["owner", "agent", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let storageUserId = session.id;
  if (session.role === "agent" || session.role === "admin") {
    const resolved = await resolveActingAgentUser(session, request);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    storageUserId = resolved.user.id;
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prefix = `${BLOB_PREFIX}/${storageUserId}/`;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken(),
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(prefix)) {
          throw new Error("Invalid upload path");
        }
        return {
          maximumSizeInBytes: 80 * 1024 * 1024,
          allowedContentTypes: ALLOWED,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload token failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
