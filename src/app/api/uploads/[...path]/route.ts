import { NextResponse } from "next/server";
import { readGitFile } from "@/lib/github-repo";
import { UPLOAD_ROOT } from "@/lib/listing-upload-git";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/**
 * Serves draft uploads that live in the repository (content/uploads/...).
 * Names are content-addressed, so the response is safe to cache forever.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const parts = (path ?? []).filter(Boolean);
  if (parts.length === 0 || parts.some((part) => part.includes(".."))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gitPath = `${UPLOAD_ROOT}/${parts.join("/")}`;
  const file = await readGitFile(gitPath).catch(() => null);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ext = (parts[parts.length - 1].split(".").pop() ?? "").toLowerCase();
  const bytes = Buffer.from(file.base64, "base64");

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}