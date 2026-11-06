import { NextResponse } from "next/server";
import {
  LISTING_MEDIA_MAX_IMAGE_BYTES,
  LISTING_MEDIA_MAX_VIDEO_BYTES,
} from "@/lib/listing-media-constants";
import { mediaKindFromMime } from "@/lib/listing-media-mime";
import { createUploadSession } from "@/lib/listing-upload-chunks";
import { resolveUploadTarget } from "@/lib/listing-upload-auth";

export const runtime = "nodejs";

/**
 * Opens a chunked upload. The browser needs this because a single request to a
 * serverless function tops out around 4.5 MB, and photos go up to 12 MB.
 */
export async function POST(request: Request) {
  const target = await resolveUploadTarget(request);
  if (!target.ok) return target.response;

  let body: { name?: string; size?: number; type?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const size = Number(body.size);
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "File size is required" }, { status: 400 });
  }

  const contentType = (body.type || "application/octet-stream").toLowerCase();
  const kind = mediaKindFromMime(contentType);
  if (!kind) {
    return NextResponse.json(
      { error: "Use JPG, PNG, WebP, GIF, MP4, MOV, or WebM files." },
      { status: 400 },
    );
  }

  const maxBytes =
    kind === "video" ? LISTING_MEDIA_MAX_VIDEO_BYTES : LISTING_MEDIA_MAX_IMAGE_BYTES;
  if (size > maxBytes) {
    return NextResponse.json(
      {
        error:
          kind === "video"
            ? "Video must be 80MB or smaller."
            : "Each photo must be 12MB or smaller.",
      },
      { status: 400 },
    );
  }

  const session = await createUploadSession({
    userId: target.userId,
    fileName: (body.name || "upload").slice(0, 200),
    contentType,
    size,
  });

  return NextResponse.json({
    uploadId: session.uploadId,
    chunkSize: session.chunkSize,
    totalChunks: session.totalChunks,
  });
}